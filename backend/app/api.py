import asyncio
from dataclasses import dataclass
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, verify_password
from app.config import get_settings
from app.db import SessionLocal, get_db
from app.models import DownloadJob, DownloadStatus
from app.schemas import (
    DownloadCreateRequest,
    DownloadResponse,
    FolderCreateRequest,
    FolderBrowseResponse,
    FolderEntry,
    FolderPresetsResponse,
    JobsCleanResponse,
    LoginRequest,
    TokenResponse,
)
from app.security import enforce_login_rate_limit, enforce_rate_limit, require_admin
from app.services.downloader import DownloadInterrupted, FileDownloader, OneFichierClient
from app.services.joblog import append_job_event
from app.services.plex import PlexClient

settings = get_settings()
router = APIRouter()
worker_lock = asyncio.Semaphore(1)

TERMINAL_STATUSES = {
    DownloadStatus.success,
    DownloadStatus.failed,
    DownloadStatus.paused,
    DownloadStatus.canceled,
}


@dataclass
class JobControl:
    pause_event: asyncio.Event
    stop_event: asyncio.Event


job_controls: dict[str, JobControl] = {}


def _get_job_control(job_id: str) -> JobControl:
    control = job_controls.get(job_id)
    if control is None:
        control = JobControl(pause_event=asyncio.Event(), stop_event=asyncio.Event())
        job_controls[job_id] = control
    return control


def _pop_job_control(job_id: str) -> None:
    job_controls.pop(job_id, None)


def _resolve_within_roots(path_value: str | Path, roots: list[Path]) -> Path:
    candidate = Path(path_value).resolve()
    for root in roots:
        resolved_root = root.resolve()
        if candidate == resolved_root or resolved_root in candidate.parents:
            return candidate
    raise HTTPException(status_code=400, detail="Directory is outside allowed roots")


def _get_allowed_roots() -> list[Path]:
    roots = [*settings.browse_roots]
    if settings.download_dir not in roots:
        roots.append(settings.download_dir)
    return roots


def _resolve_target_dir(target_dir: str | None) -> Path:
    if not target_dir:
        return settings.download_dir.resolve()

    resolved = _resolve_within_roots(target_dir, _get_allowed_roots())
    if not resolved.exists() or not resolved.is_dir():
        raise HTTPException(status_code=400, detail="Selected directory does not exist")
    return resolved


def _log_job_event(job: DownloadJob, event: str, extra: dict[str, object] | None = None) -> None:
    payload: dict[str, object] = {
        "status": job.status.value,
        "source_url": job.source_url,
        "target_dir": job.target_dir,
        "file_name": job.file_name or "",
        "saved_path": job.saved_path or "",
        "bytes_downloaded": job.bytes_downloaded,
        "total_bytes": job.total_bytes if job.total_bytes is not None else 0,
        "progress_percent": job.progress_percent,
        "error_message": job.error_message or "",
    }
    if extra:
        payload.update(extra)
    append_job_event(settings.job_log_path, event, job.id, payload)


@router.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request) -> TokenResponse:
    enforce_login_rate_limit(request)
    if settings.auth_mode == "access_key":
        if not settings.admin_access_key_hash:
            raise HTTPException(status_code=500, detail="ADMIN_ACCESS_KEY_HASH is not configured")
        if not payload.access_key:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="access_key is required")
        if not verify_password(payload.access_key, settings.admin_access_key_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        return TokenResponse(access_token=create_access_token(settings.admin_username))

    if payload.username != settings.admin_username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not payload.password or not verify_password(payload.password, settings.admin_password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return TokenResponse(access_token=create_access_token(payload.username))


@router.get("/folders/presets", response_model=FolderPresetsResponse)
async def list_preset_folders(_: str = Depends(require_admin)) -> FolderPresetsResponse:
    presets = [str(_resolve_within_roots(path, _get_allowed_roots())) for path in settings.download_presets]
    return FolderPresetsResponse(presets=presets)


@router.get("/folders/browse", response_model=FolderBrowseResponse)
async def browse_folders(
    path: str | None = Query(default=None, min_length=1, max_length=4096),
    _: str = Depends(require_admin),
) -> FolderBrowseResponse:
    roots = _get_allowed_roots()
    current = _resolve_within_roots(path or roots[0], roots)

    if not current.exists() or not current.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    parent = current.parent if current.parent != current else None
    parent_path = None
    if parent is not None:
        try:
            parent_path = str(_resolve_within_roots(parent, roots))
        except HTTPException:
            parent_path = None

    dirs = []
    for child in sorted(current.iterdir(), key=lambda entry: entry.name.lower()):
        if not child.is_dir():
            continue
        try:
            safe_path = _resolve_within_roots(child, roots)
            dirs.append(FolderEntry(name=child.name, path=str(safe_path)))
        except HTTPException:
            continue

    return FolderBrowseResponse(current_path=str(current), parent_path=parent_path, directories=dirs)


@router.post("/folders/create", response_model=FolderEntry)
async def create_folder(payload: FolderCreateRequest, _: str = Depends(require_admin)) -> FolderEntry:
    if "/" in payload.name or "\\" in payload.name or payload.name in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid folder name")

    parent = _resolve_within_roots(payload.parent_path, _get_allowed_roots())
    if not parent.exists() or not parent.is_dir():
        raise HTTPException(status_code=400, detail="Parent path is not a directory")

    target = (parent / payload.name).resolve()
    _resolve_within_roots(target, _get_allowed_roots())
    try:
        target.mkdir(parents=False, exist_ok=False)
    except FileExistsError as exc:
        raise HTTPException(status_code=409, detail="Folder already exists") from exc
    return FolderEntry(name=target.name, path=str(target))


@router.post("/downloads", response_model=DownloadResponse)
async def create_download(
    payload: DownloadCreateRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> DownloadResponse:
    enforce_rate_limit(request)
    target_dir = _resolve_target_dir(payload.target_dir)

    job = DownloadJob(source_url=payload.url, target_dir=str(target_dir), status=DownloadStatus.queued)
    db.add(job)
    await db.commit()
    await db.refresh(job)

    background_tasks.add_task(process_download_job, job.id)
    return DownloadResponse.model_validate(job)


@router.get("/downloads", response_model=list[DownloadResponse])
async def list_downloads(
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[DownloadResponse]:
    result = await db.execute(
        select(DownloadJob)
        .where(DownloadJob.is_hidden.is_(False))
        .order_by(DownloadJob.created_at.desc())
        .limit(200)
    )
    jobs = result.scalars().all()
    return [DownloadResponse.model_validate(job) for job in jobs]


@router.post("/downloads/{job_id}/pause", response_model=DownloadResponse)
async def pause_download(
    job_id: str,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> DownloadResponse:
    result = await db.execute(select(DownloadJob).where(DownloadJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Download job not found")

    if job.status == DownloadStatus.running:
        control = _get_job_control(job_id)
        control.pause_event.set()
        job.pause_requested = True
        job.stop_requested = False
        _log_job_event(job, "pause_requested")
    elif job.status == DownloadStatus.queued:
        job.status = DownloadStatus.paused
        job.pause_requested = False
        job.stop_requested = False
        job.error_message = "Paused by user"
        _log_job_event(job, "paused")

    await db.commit()
    await db.refresh(job)
    return DownloadResponse.model_validate(job)


@router.post("/downloads/{job_id}/stop", response_model=DownloadResponse)
async def stop_download(
    job_id: str,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> DownloadResponse:
    result = await db.execute(select(DownloadJob).where(DownloadJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Download job not found")

    if job.status == DownloadStatus.running:
        control = _get_job_control(job_id)
        control.stop_event.set()
        job.stop_requested = True
        job.pause_requested = False
        _log_job_event(job, "stop_requested")
    elif job.status in {DownloadStatus.queued, DownloadStatus.paused}:
        job.status = DownloadStatus.canceled
        job.error_message = "Stopped by user"
        job.pause_requested = False
        job.stop_requested = False
        _log_job_event(job, "canceled")

    await db.commit()
    await db.refresh(job)
    return DownloadResponse.model_validate(job)


@router.delete("/downloads/{job_id}", status_code=204)
async def remove_download(
    job_id: str,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    result = await db.execute(select(DownloadJob).where(DownloadJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Download job not found")

    job.is_hidden = True
    _log_job_event(job, "removed_from_list")
    await db.commit()
    return Response(status_code=204)


@router.post("/downloads/clean", response_model=JobsCleanResponse)
async def clean_recent_jobs(
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> JobsCleanResponse:
    result = await db.execute(
        select(DownloadJob).where(
            DownloadJob.is_hidden.is_(False),
            DownloadJob.status.in_(list(TERMINAL_STATUSES)),
        )
    )
    jobs = result.scalars().all()
    for job in jobs:
        job.is_hidden = True
        _log_job_event(job, "removed_from_list", {"reason": "clean_recent_jobs"})
    await db.commit()
    return JobsCleanResponse(removed_count=len(jobs))


async def process_download_job(job_id: str) -> None:
    async with worker_lock:
        async with SessionLocal() as db:
            result = await db.execute(select(DownloadJob).where(DownloadJob.id == job_id))
            job = result.scalar_one_or_none()
            if not job:
                _pop_job_control(job_id)
                return

            control = _get_job_control(job_id)

            if job.is_hidden:
                _pop_job_control(job_id)
                return

            if job.status in TERMINAL_STATUSES:
                _pop_job_control(job_id)
                return

            if control.stop_event.is_set() or job.stop_requested:
                job.status = DownloadStatus.canceled
                job.error_message = "Stopped by user"
                job.pause_requested = False
                job.stop_requested = False
                _log_job_event(job, "canceled")
                await db.commit()
                _pop_job_control(job_id)
                return

            if control.pause_event.is_set() or job.pause_requested or job.status == DownloadStatus.paused:
                job.status = DownloadStatus.paused
                job.error_message = "Paused by user"
                job.pause_requested = False
                job.stop_requested = False
                _log_job_event(job, "paused")
                await db.commit()
                _pop_job_control(job_id)
                return

            job.status = DownloadStatus.running
            job.bytes_downloaded = 0
            job.total_bytes = None
            job.progress_percent = 0.0
            job.pause_requested = False
            job.stop_requested = False
            await db.commit()

            downloader = FileDownloader()
            onefichier = OneFichierClient(settings.onefichier_api_key, settings.onefichier_api_base)
            plex = PlexClient(settings.plex_base_url, settings.plex_token, settings.plex_library_section_id)

            try:
                target_dir = _resolve_target_dir(job.target_dir)
                resolved = await onefichier.resolve_download(job.source_url)
                job.file_name = resolved.filename
                job.total_bytes = resolved.expected_size
                await db.commit()

                async def on_progress(downloaded: int, total: int | None) -> None:
                    job.bytes_downloaded = downloaded
                    job.total_bytes = total or job.total_bytes
                    if total and total > 0:
                        job.progress_percent = min(100.0, (downloaded * 100.0) / total)
                    elif job.total_bytes and job.total_bytes > 0:
                        job.progress_percent = min(100.0, (downloaded * 100.0) / job.total_bytes)
                    else:
                        job.progress_percent = 0.0
                    await db.commit()

                def get_control_signal() -> str | None:
                    if control.stop_event.is_set():
                        return "stop"
                    if control.pause_event.is_set():
                        return "pause"
                    return None

                result = await downloader.download(
                    resolved.url,
                    destination_dir=target_dir,
                    name_hint=resolved.filename or job.source_url,
                    expected_total_bytes=resolved.expected_size,
                    progress_callback=on_progress,
                    control_signal_callback=get_control_signal,
                )
                await plex.refresh_library()

                job.status = DownloadStatus.success
                job.saved_path = str(result.path)
                job.file_name = result.file_name
                job.bytes_downloaded = result.bytes_downloaded
                job.total_bytes = result.total_bytes
                job.progress_percent = 100.0
                job.error_message = None
                _log_job_event(job, "completed")
            except DownloadInterrupted as interrupted:
                job.bytes_downloaded = interrupted.bytes_downloaded
                job.total_bytes = interrupted.total_bytes
                job.progress_percent = (
                    min(100.0, (interrupted.bytes_downloaded * 100.0) / interrupted.total_bytes)
                    if interrupted.total_bytes
                    else 0.0
                )
                if interrupted.reason == "paused":
                    job.status = DownloadStatus.paused
                    job.saved_path = str(interrupted.path)
                    job.file_name = interrupted.path.name
                    job.error_message = "Paused by user"
                    _log_job_event(job, "paused")
                else:
                    interrupted.path.unlink(missing_ok=True)
                    job.status = DownloadStatus.canceled
                    job.saved_path = None
                    job.error_message = "Stopped by user"
                    _log_job_event(job, "canceled")
            except Exception as exc:
                job.status = DownloadStatus.failed
                job.error_message = str(exc)
                _log_job_event(job, "failed", {"exception": str(exc)})
            finally:
                job.pause_requested = False
                job.stop_requested = False
                await db.commit()
                _pop_job_control(job_id)
