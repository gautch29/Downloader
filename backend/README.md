# Backend

## Local run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Folder selection config

- `DOWNLOAD_DIR`: default folder when no custom target is selected
- `DOWNLOAD_PRESETS`: JSON array shown in UI presets
- `BROWSE_ROOTS`: JSON array of allowed roots for browsing

## Password hash helper

```bash
python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('CHANGE_ME'))"
```
