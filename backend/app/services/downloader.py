import os
from pathlib import Path
from urllib.parse import unquote, urlparse

import httpx


class OneFichierClient:
    def __init__(self, api_key: str | None, api_base: str) -> None:
        self.api_key = api_key
        self.api_base = api_base.rstrip("/")

    async def resolve_download_url(self, source_url: str) -> str:
        # If API key is configured, attempt API-based link resolution first.
        if self.api_key:
            endpoint = f"{self.api_base}/v1/download/get_token.cgi"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            payload = {"url": source_url}

            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(endpoint, json=payload, headers=headers)
                if response.status_code < 400:
                    data = response.json()
                    resolved = data.get("url") or data.get("link")
                    if resolved:
                        return resolved

        # Fallback: direct URL flow (works if provided URL is already downloadable).
        return source_url


class FileDownloader:
    def __init__(self, destination_dir: Path) -> None:
        self.destination_dir = destination_dir

    async def download(self, url: str) -> Path:
        async with httpx.AsyncClient(timeout=None, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()

                file_name = self._filename_from_headers(response.headers.get("content-disposition"))
                if not file_name:
                    file_name = self._filename_from_url(str(response.url))

                safe_name = self._sanitize_filename(file_name or "download.bin")
                target_path = self.destination_dir / safe_name

                with open(target_path, "wb") as output:
                    async for chunk in response.aiter_bytes(chunk_size=1024 * 256):
                        output.write(chunk)

                return target_path

    def _filename_from_headers(self, content_disposition: str | None) -> str | None:
        if not content_disposition:
            return None

        marker = "filename="
        if marker not in content_disposition:
            return None

        return content_disposition.split(marker, maxsplit=1)[1].strip().strip('"')

    def _filename_from_url(self, url: str) -> str:
        parsed = urlparse(url)
        return unquote(os.path.basename(parsed.path))

    def _sanitize_filename(self, name: str) -> str:
        safe = "".join(c for c in name if c.isalnum() or c in ("-", "_", ".", " ")).strip()
        return safe or "download.bin"
