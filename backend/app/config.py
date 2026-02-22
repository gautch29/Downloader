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
    all_paths = [settings.download_dir, *settings.download_presets, *settings.browse_roots]
    checked: set[str] = set()
    for path in all_paths:
        key = str(path)
        if key in checked:
            continue
        checked.add(key)
        resolved = path.resolve()
        if not resolved.exists() or not resolved.is_dir():
            raise ValueError(f"Configured download path does not exist or is not a directory: {resolved}")
        if not os.access(resolved, os.W_OK | os.X_OK):
            raise ValueError(f"Configured download path is not writable: {resolved}")
    return settings
