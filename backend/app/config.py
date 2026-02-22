import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Plex Downloader"
    environment: str = "dev"
    api_prefix: str = "/api"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    jwt_secret: str
    jwt_exp_minutes: int = 720
    auth_mode: str = "access_key"
    admin_access_key_hash: str | None = None
    admin_username: str = "admin"
    admin_password_hash: str = ""
    max_login_attempts_per_15m: int = 20

    max_downloads_per_hour: int = 20
    download_connect_timeout_seconds: int = 20
    download_read_timeout_seconds: int = 90
    download_retry_count: int = 2

    sqlite_path: Path = Path("./data/app.db")
    job_log_path: Path = Path("./data/download_jobs.log")
    download_dir: Path = Path("/mnt")
    download_presets: list[Path] = Field(default_factory=lambda: [Path("/mnt")])
    browse_roots: list[Path] = Field(default_factory=lambda: [Path("/mnt")])

    onefichier_api_key: str | None = None
    onefichier_api_base: str = "https://api.1fichier.com"

    plex_base_url: str
    plex_token: str
    plex_library_section_id: str | None = None


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    settings.job_log_path.parent.mkdir(parents=True, exist_ok=True)

    # Never auto-create download paths: this can hide bad mounts and fill container FS.
    resolved_download_dir = settings.download_dir.resolve()
    if not resolved_download_dir.exists() or not resolved_download_dir.is_dir():
        raise ValueError(f"DOWNLOAD_DIR does not exist or is not a directory: {resolved_download_dir}")
    if not os.access(resolved_download_dir, os.W_OK | os.X_OK):
        raise ValueError(f"DOWNLOAD_DIR is not writable: {resolved_download_dir}")

    valid_roots: list[Path] = []
    seen_roots: set[str] = set()
    for root in settings.browse_roots:
        resolved = root.resolve()
        key = str(resolved)
        if key in seen_roots:
            continue
        seen_roots.add(key)
        if resolved.exists() and resolved.is_dir() and os.access(resolved, os.R_OK | os.X_OK):
            valid_roots.append(resolved)
    settings.browse_roots = valid_roots or [resolved_download_dir]

    valid_presets: list[Path] = []
    seen_presets: set[str] = set()
    for preset in settings.download_presets:
        resolved = preset.resolve()
        key = str(resolved)
        if key in seen_presets:
            continue
        seen_presets.add(key)
        if resolved.exists() and resolved.is_dir() and os.access(resolved, os.W_OK | os.X_OK):
            valid_presets.append(resolved)
    settings.download_presets = valid_presets or [resolved_download_dir]

    settings.download_dir = resolved_download_dir
    return settings
