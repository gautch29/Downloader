import httpx


class PlexClient:
    def __init__(self, base_url: str, token: str, section_id: str | None = None) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.section_id = section_id

    async def refresh_library(self) -> None:
        endpoint = "/library/sections/all/refresh"
        if self.section_id:
            endpoint = f"/library/sections/{self.section_id}/refresh"

        url = f"{self.base_url}{endpoint}"
        params = {"X-Plex-Token": self.token}

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
