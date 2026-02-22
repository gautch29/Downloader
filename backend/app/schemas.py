from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models import DownloadStatus


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DownloadCreateRequest(BaseModel):
    url: str = Field(min_length=10, max_length=2048)

    @field_validator("url")
    @classmethod
    def validate_1fichier_url(cls, value: str) -> str:
        allowed_hosts = ("1fichier.com", "www.1fichier.com")
        if not any(host in value for host in allowed_hosts):
            raise ValueError("Only 1fichier links are allowed")
        if not value.startswith("https://"):
            raise ValueError("Only HTTPS links are allowed")
        return value


class DownloadResponse(BaseModel):
    id: str
    source_url: str
    saved_path: str | None
    status: DownloadStatus
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
