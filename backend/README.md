# Backend

## Local run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Password hash helper

```bash
python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('CHANGE_ME'))"
```
