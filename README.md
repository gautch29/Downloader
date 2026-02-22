# Downloader (1fichier -> Plex)

Full-stack self-hosted app to remotely submit 1fichier movie links, download files into your Plex movies folder, and trigger a Plex library refresh.

## Architecture

- `frontend/`: React + Vite admin UI
- `backend/`: FastAPI API, auth, download worker, SQLite job history
- `docker-compose.yml`: production-oriented local stack

## Security model (current MVP)

- Single-admin login (`ADMIN_USERNAME` + bcrypt hash in env)
- JWT-protected API endpoints
- 1fichier-only URL validation
- HTTPS-only source URLs
- Basic per-IP rate limit for queueing jobs
- Safe filename sanitization to prevent path traversal
- CORS allow-list from env (`CORS_ORIGINS`)

## Quick start

1. Copy env template:

```bash
cp backend/.env.example backend/.env
```

2. Generate a bcrypt password hash:

```bash
python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('CHANGE_ME'))"
```

3. Set these values in `backend/.env`:

- `JWT_SECRET`
- `ADMIN_PASSWORD_HASH`
- `PLEX_BASE_URL`
- `PLEX_TOKEN`
- optional: `PLEX_LIBRARY_SECTION_ID`
- optional: `ONEFICHIER_API_KEY`

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

## Recommended hardening before internet exposure

- Put this behind a reverse proxy with HTTPS and IP allow-list or VPN-only access.
- Disable direct port exposure (`8000`, `8080`) to WAN.
- Run behind fail2ban/authelia or another external access gate.
- Store secrets in Docker secrets or a vault.
