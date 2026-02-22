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
    def __init__(self) -> None:
        pass

    async def download(self, url: str, destination_dir: Path, name_hint: str | None = None) -> Path:
        async with httpx.AsyncClient(timeout=None, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()

                file_name = self._filename_from_headers(response.headers.get("content-disposition"))
                if not file_name or self._is_generic_filename(file_name):
                    file_name = self._filename_from_url(str(response.url))
                if (not file_name or self._is_generic_filename(file_name)) and name_hint:
                    file_name = self._filename_from_url(name_hint)

                safe_name = self._sanitize_filename(file_name or "download.bin")
                target_path = self._deduplicate_target(destination_dir / safe_name)

                with open(target_path, "wb") as output:
                    async for chunk in response.aiter_bytes(chunk_size=1024 * 256):
                        output.write(chunk)

                return target_path

    def _filename_from_headers(self, content_disposition: str | None) -> str | None:
        if not content_disposition:
            return None

        if "filename*=" in content_disposition:
            encoded = content_disposition.split("filename*=", maxsplit=1)[1].split(";", maxsplit=1)[0].strip()
            encoded = encoded.strip('"')
            if "''" in encoded:
                encoded = encoded.split("''", maxsplit=1)[1]
            decoded = unquote(encoded)
            if decoded:
                return decoded

        marker = "filename="
        if marker in content_disposition:
            return content_disposition.split(marker, maxsplit=1)[1].split(";", maxsplit=1)[0].strip().strip('"')
        return None

    def _filename_from_url(self, url: str) -> str:
        parsed = urlparse(url)
        return unquote(os.path.basename(parsed.path))

    def _is_generic_filename(self, name: str) -> bool:
        base = Path(name).stem.lower()
        return base in {"", "download", "file", "index"}

    def _sanitize_filename(self, name: str) -> str:
        safe = "".join(c for c in name if c.isalnum() or c in ("-", "_", ".", " ")).strip()
        return safe or "download.bin"

    def _deduplicate_target(self, target_path: Path) -> Path:
        if not target_path.exists():
            return target_path

        stem = target_path.stem
        suffix = target_path.suffix
        parent = target_path.parent
        index = 1
        while True:
            candidate = parent / f"{stem} ({index}){suffix}"
            if not candidate.exists():
                return candidate
            index += 1
