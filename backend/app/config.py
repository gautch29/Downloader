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
    admin_username: str = "admin"
    admin_password_hash: str
    max_login_attempts_per_15m: int = 20

    max_downloads_per_hour: int = 20

    sqlite_path: Path = Path("./data/app.db")
    download_dir: Path = Path("/downloads/movies")
    download_presets: list[Path] = Field(default_factory=lambda: [Path("/downloads/movies")])
    browse_roots: list[Path] = Field(default_factory=lambda: [Path("/downloads")])

    onefichier_api_key: str | None = None
    onefichier_api_base: str = "https://api.1fichier.com"

    plex_base_url: str
    plex_token: str
    plex_library_section_id: str | None = None


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    settings.download_dir.mkdir(parents=True, exist_ok=True)
    for preset in settings.download_presets:
        preset.mkdir(parents=True, exist_ok=True)
    return settings
