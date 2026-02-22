import asyncio
import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import unquote, urlparse

import httpx


@dataclass
class ResolvedDownload:
    url: str
    filename: str | None = None


@dataclass
class DownloadResult:
    path: Path
    file_name: str
    bytes_downloaded: int
    total_bytes: int | None


class OneFichierClient:
    def __init__(self, api_key: str | None, api_base: str) -> None:
        self.api_key = api_key
        self.api_base = api_base.rstrip("/")

    async def resolve_download(self, source_url: str) -> ResolvedDownload:
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
                    filename = data.get("filename") or data.get("name")
                    if resolved:
                        return ResolvedDownload(url=resolved, filename=filename)

        # Fallback: direct URL flow (works if provided URL is already downloadable).
        return ResolvedDownload(url=source_url)


class FileDownloader:
    def __init__(self) -> None:
        pass

    async def download(
        self,
        url: str,
        destination_dir: Path,
        name_hint: str | None = None,
        progress_callback=None,
    ) -> DownloadResult:
        async with httpx.AsyncClient(timeout=None, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()
                self._validate_stream_headers(response)

                total_bytes = self._parse_int_header(response.headers.get("content-length"))

                file_name = self._filename_from_headers(response.headers.get("content-disposition"))
                if not file_name or self._is_generic_filename(file_name):
                    file_name = self._filename_from_url(str(response.url))
                if (not file_name or self._is_generic_filename(file_name)) and name_hint:
                    file_name = self._filename_from_url(name_hint)

                safe_name = self._sanitize_filename(file_name or "download.bin")
                target_path = self._deduplicate_target(destination_dir / safe_name)

                bytes_downloaded = 0
                last_callback_at = asyncio.get_event_loop().time()
                with open(target_path, "wb") as output:
                    async for chunk in response.aiter_bytes(chunk_size=1024 * 256):
                        output.write(chunk)
                        bytes_downloaded += len(chunk)
                        now = asyncio.get_event_loop().time()
                        if progress_callback and (now - last_callback_at >= 0.6):
                            await progress_callback(bytes_downloaded, total_bytes)
                            last_callback_at = now

                if progress_callback:
                    await progress_callback(bytes_downloaded, total_bytes)

                # Fail hard on suspicious tiny/binaryless files that are usually HTML error pages.
                if bytes_downloaded < 1024 and target_path.suffix.lower() in {"", ".bin", ".html"}:
                    with open(target_path, "rb") as handle:
                        prefix = handle.read(256).lower()
                    if b"<html" in prefix or b"1fichier" in prefix:
                        target_path.unlink(missing_ok=True)
                        raise RuntimeError("1fichier returned an HTML page instead of a file")

                return DownloadResult(
                    path=target_path,
                    file_name=target_path.name,
                    bytes_downloaded=bytes_downloaded,
                    total_bytes=total_bytes,
                )

    def _validate_stream_headers(self, response: httpx.Response) -> None:
        content_type = (response.headers.get("content-type") or "").lower()
        if content_type.startswith("text/html"):
            raise RuntimeError("Download URL resolved to HTML, not a media file")

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

    def _parse_int_header(self, value: str | None) -> int | None:
        if not value:
            return None
        try:
            parsed = int(value)
            return parsed if parsed >= 0 else None
        except ValueError:
            return None
