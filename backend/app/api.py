import asyncio
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, verify_password
from app.config import get_settings
from app.db import SessionLocal, get_db
from app.models import DownloadJob, DownloadStatus
from app.schemas import (
    DownloadCreateRequest,
    DownloadResponse,
    FolderBrowseResponse,
    FolderEntry,
    FolderPresetsResponse,
    LoginRequest,
    TokenResponse,
)
from app.security import enforce_rate_limit, require_admin
from app.services.downloader import FileDownloader, OneFichierClient
from app.services.plex import PlexClient

settings = get_settings()
router = APIRouter()
worker_lock = asyncio.Semaphore(1)


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


@router.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    if payload.username != settings.admin_username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(payload.password, settings.admin_password_hash):
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
    result = await db.execute(select(DownloadJob).order_by(DownloadJob.created_at.desc()).limit(100))
    jobs = result.scalars().all()
    return [DownloadResponse.model_validate(job) for job in jobs]


async def process_download_job(job_id: str) -> None:
    async with worker_lock:
        async with SessionLocal() as db:
            result = await db.execute(select(DownloadJob).where(DownloadJob.id == job_id))
            job = result.scalar_one_or_none()
            if not job:
                return

            job.status = DownloadStatus.running
            await db.commit()

            downloader = FileDownloader()
            onefichier = OneFichierClient(settings.onefichier_api_key, settings.onefichier_api_base)
            plex = PlexClient(settings.plex_base_url, settings.plex_token, settings.plex_library_section_id)

            try:
                target_dir = _resolve_target_dir(job.target_dir)
                resolved_url = await onefichier.resolve_download_url(job.source_url)
                saved = await downloader.download(resolved_url, target_dir=target_dir, name_hint=job.source_url)
                await plex.refresh_library()

                job.status = DownloadStatus.success
                job.saved_path = str(saved)
                job.error_message = None
            except Exception as exc:
                job.status = DownloadStatus.failed
                job.error_message = str(exc)

            await db.commit()
