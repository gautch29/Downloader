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
    expected_size: int | None = None


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
        if not self.api_key:
            raise RuntimeError("ONEFICHIER_API_KEY is required to resolve download links")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "PlexDownloader/1.0",
        }

        async with httpx.AsyncClient(timeout=30) as client:
            token_data = await self._call_json(
                client,
                f"{self.api_base}/v1/download/get_token.cgi",
                {"url": source_url},
                headers,
            )
            self._raise_if_ko(token_data, "download/get_token.cgi")
            resolved_url = token_data.get("url") or token_data.get("link")
            if not resolved_url:
                raise RuntimeError("1fichier API did not return a direct download URL")

            # Filename usually comes from file/info.cgi.
            file_info = await self._call_json(
                client,
                f"{self.api_base}/v1/file/info.cgi",
                {"url": source_url},
                headers,
                tolerate_ko=True,
            )

        return ResolvedDownload(
            url=str(resolved_url),
            filename=self._extract_filename(file_info),
            expected_size=self._extract_size(file_info),
        )

    async def _call_json(
        self,
        client: httpx.AsyncClient,
        endpoint: str,
        payload: dict[str, object],
        headers: dict[str, str],
        tolerate_ko: bool = False,
    ) -> dict[str, object]:
        response = await client.post(endpoint, json=payload, headers=headers)
        if response.status_code >= 400:
            raise RuntimeError(f"1fichier API HTTP {response.status_code}: {response.text[:200]}")
        try:
            data = response.json()
        except ValueError as exc:
            raise RuntimeError("1fichier API returned non-JSON response") from exc

        if not isinstance(data, dict):
            raise RuntimeError("1fichier API returned unexpected payload")

        if not tolerate_ko:
            self._raise_if_ko(data, endpoint)
        return data

    def _raise_if_ko(self, data: dict[str, object], endpoint_name: str) -> None:
        status = str(data.get("status", "")).upper()
        if status in {"KO", "NOK", "ERROR"}:
            message = str(data.get("message") or data.get("error") or "Unknown API error")
            raise RuntimeError(f"1fichier API error ({endpoint_name}): {message}")

    def _extract_filename(self, file_info: dict[str, object]) -> str | None:
        if not file_info:
            return None
        if str(file_info.get("status", "")).upper() in {"KO", "NOK", "ERROR"}:
            return None
        value = file_info.get("filename") or file_info.get("name")
        return str(value) if isinstance(value, str) and value.strip() else None

    def _extract_size(self, file_info: dict[str, object]) -> int | None:
        if not file_info:
            return None
        raw = file_info.get("size")
        try:
            value = int(raw)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            return None
        return value if value >= 0 else None


class FileDownloader:
    def __init__(self) -> None:
        pass

    async def download(
        self,
        url: str,
        destination_dir: Path,
        name_hint: str | None = None,
        expected_total_bytes: int | None = None,
        progress_callback=None,
    ) -> DownloadResult:
        async with httpx.AsyncClient(timeout=None, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()
                self._validate_stream_headers(response)

                total_bytes = self._parse_int_header(response.headers.get("content-length")) or expected_total_bytes

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

                if total_bytes is not None and bytes_downloaded != total_bytes:
                    target_path.unlink(missing_ok=True)
                    raise RuntimeError(
                        f"Incomplete download: expected {total_bytes} bytes, got {bytes_downloaded} bytes"
                    )

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
