import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, verify_password
from app.config import get_settings
from app.db import SessionLocal, get_db
from app.models import DownloadJob, DownloadStatus
from app.schemas import DownloadCreateRequest, DownloadResponse, LoginRequest, TokenResponse
from app.security import enforce_rate_limit, require_admin
from app.services.downloader import FileDownloader, OneFichierClient
from app.services.plex import PlexClient

settings = get_settings()
router = APIRouter()
worker_lock = asyncio.Semaphore(1)


@router.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    if payload.username != settings.admin_username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(payload.password, settings.admin_password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return TokenResponse(access_token=create_access_token(payload.username))


@router.post("/downloads", response_model=DownloadResponse)
async def create_download(
    payload: DownloadCreateRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> DownloadResponse:
    enforce_rate_limit(request)

    job = DownloadJob(source_url=payload.url, status=DownloadStatus.queued)
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

            downloader = FileDownloader(settings.download_dir)
            onefichier = OneFichierClient(settings.onefichier_api_key, settings.onefichier_api_base)
            plex = PlexClient(settings.plex_base_url, settings.plex_token, settings.plex_library_section_id)

            try:
                resolved_url = await onefichier.resolve_download_url(job.source_url)
                saved = await downloader.download(resolved_url)
                await plex.refresh_library()

                job.status = DownloadStatus.success
                job.saved_path = str(saved)
                job.error_message = None
            except Exception as exc:
                job.status = DownloadStatus.failed
                job.error_message = str(exc)

            await db.commit()
