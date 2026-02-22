from datetime import datetime
from enum import Enum
import uuid

from sqlalchemy import BigInteger, Boolean, DateTime, Enum as SqlEnum, Float, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class DownloadStatus(str, Enum):
    queued = "queued"
    running = "running"
    success = "success"
    failed = "failed"
    paused = "paused"
    canceled = "canceled"


class DownloadJob(Base):
    __tablename__ = "download_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    target_dir: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    saved_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    bytes_downloaded: Mapped[int] = mapped_column(BigInteger, default=0)
    total_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    progress_percent: Mapped[float] = mapped_column(Float, default=0.0)
    pause_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    stop_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[DownloadStatus] = mapped_column(SqlEnum(DownloadStatus), default=DownloadStatus.queued)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
