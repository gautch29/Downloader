from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import router
from app.config import get_settings
from app.db import engine
from app.models import Base

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.api_prefix)


@app.on_event("startup")
async def startup() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        columns = await conn.execute(text("PRAGMA table_info(download_jobs)"))
        column_names = {row[1] for row in columns.fetchall()}
        statements: list[str] = []

        if "target_dir" not in column_names:
            default_target_dir = str(settings.download_dir).replace("'", "''")
            statements.append(
                f"ALTER TABLE download_jobs ADD COLUMN target_dir TEXT NOT NULL DEFAULT '{default_target_dir}'"
            )
        if "file_name" not in column_names:
            statements.append("ALTER TABLE download_jobs ADD COLUMN file_name TEXT")
        if "bytes_downloaded" not in column_names:
            statements.append("ALTER TABLE download_jobs ADD COLUMN bytes_downloaded INTEGER NOT NULL DEFAULT 0")
        if "total_bytes" not in column_names:
            statements.append("ALTER TABLE download_jobs ADD COLUMN total_bytes INTEGER")
        if "progress_percent" not in column_names:
            statements.append("ALTER TABLE download_jobs ADD COLUMN progress_percent FLOAT NOT NULL DEFAULT 0")
        if "pause_requested" not in column_names:
            statements.append("ALTER TABLE download_jobs ADD COLUMN pause_requested BOOLEAN NOT NULL DEFAULT 0")
        if "stop_requested" not in column_names:
            statements.append("ALTER TABLE download_jobs ADD COLUMN stop_requested BOOLEAN NOT NULL DEFAULT 0")
        if "is_hidden" not in column_names:
            statements.append("ALTER TABLE download_jobs ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT 0")
        if "plex_scan_status" not in column_names:
            statements.append(
                "ALTER TABLE download_jobs ADD COLUMN plex_scan_status TEXT NOT NULL DEFAULT 'not_requested'"
            )
        if "plex_scan_message" not in column_names:
            statements.append("ALTER TABLE download_jobs ADD COLUMN plex_scan_message TEXT")
        if "plex_scan_requested_at" not in column_names:
            statements.append("ALTER TABLE download_jobs ADD COLUMN plex_scan_requested_at DATETIME")
        if "plex_scan_completed_at" not in column_names:
            statements.append("ALTER TABLE download_jobs ADD COLUMN plex_scan_completed_at DATETIME")

        for stmt in statements:
            await conn.execute(text(stmt))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
