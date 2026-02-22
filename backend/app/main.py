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
        if "target_dir" not in column_names:
            default_target_dir = str(settings.download_dir).replace("'", "''")
            await conn.execute(
                text(
                    f"ALTER TABLE download_jobs ADD COLUMN target_dir TEXT NOT NULL DEFAULT '{default_target_dir}'"
                )
            )


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
