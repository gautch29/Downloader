# Downloader (1fichier -> Plex)

Self-hosted app to remotely submit 1fichier movie links, download files into a Plex-visible folder, and trigger Plex library refresh.

## Architecture

- `frontend/`: React + Vite admin UI
- `backend/`: FastAPI API, auth, download worker, SQLite job history
- `docker-compose.yml`: deployment stack

## Security model

- Access-key login mode (recommended) with Argon2 hash
- JWT-protected API endpoints
- Login brute-force throttling per IP (`MAX_LOGIN_ATTEMPTS_PER_15M`)
- 1fichier-only URL validation
- HTTPS-only source URLs
- Per-IP rate limit for queueing jobs
- Safe filename sanitization and duplicate-safe output names
- Destination folder browse/create restricted to configured roots
- CORS allow-list from env (`CORS_ORIGINS`)

## Quick start

1. Copy env template:

```bash
cp backend/.env.example backend/.env
```

2. Generate an Argon2 access-key hash:

```bash
python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['argon2']).hash('CHANGE_ME_ACCESS_KEY'))"
```

3. Set these values in `backend/.env`:

- `JWT_SECRET`
- `AUTH_MODE=access_key`
- `ADMIN_ACCESS_KEY_HASH`
- `PLEX_BASE_URL`
- `PLEX_TOKEN`
- optional: `PLEX_LIBRARY_SECTION_ID`
- optional: `ONEFICHIER_API_KEY`
- optional: `DOWNLOAD_PRESETS`
- optional: `BROWSE_ROOTS`

4. Point compose movie mount to your real Plex movie directory:

- `docker-compose.yml` -> `/mnt/plex/movies:/downloads/movies`

5. Start the stack:

```bash
docker compose up -d --build
```

6. Open UI at `http://YOUR_CT_IP:8080`

## Notes on 1fichier API

The backend attempts API link resolution when `ONEFICHIER_API_KEY` is set using:

- `POST {ONEFICHIER_API_BASE}/v1/download/get_token.cgi`

If your account/API requires a different endpoint or payload, update `backend/app/services/downloader.py` accordingly.

## Recommended hardening for internet exposure

- Put behind a reverse proxy with HTTPS and IP allow-list or VPN-only access.
- Avoid exposing backend port `8000` publicly.
- Add external access gate (Authelia/Authentik or similar) for defense in depth.
- Store secrets in Docker secrets or a vault.
