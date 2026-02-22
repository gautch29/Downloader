from datetime import datetime
from enum import Enum
import uuid

from sqlalchemy import DateTime, Enum as SqlEnum, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class DownloadStatus(str, Enum):
    queued = "queued"
    running = "running"
    success = "success"
    failed = "failed"


class DownloadJob(Base):
    __tablename__ = "download_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    saved_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[DownloadStatus] = mapped_column(SqlEnum(DownloadStatus), default=DownloadStatus.queued)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
