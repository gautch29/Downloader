# Backend

## Local run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Auth modes

- `AUTH_MODE=access_key` (recommended): UI login takes a single admin access key
- `AUTH_MODE=password`: legacy username/password login

## Folder selection config

- `DOWNLOAD_DIR`: default folder when no custom target is selected
- `DOWNLOAD_PRESETS`: JSON array shown in UI presets
- `BROWSE_ROOTS`: JSON array of allowed roots for browsing/creating folders

## Access key hash helper (Argon2)

```bash
python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['argon2']).hash('CHANGE_ME_ACCESS_KEY'))"
```
