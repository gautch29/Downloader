from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import decode_access_token
from app.config import get_settings

settings = get_settings()
security = HTTPBearer(auto_error=True)

rate_limiter = defaultdict(deque)


def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    token = credentials.credentials
    subject = decode_access_token(token)
    if subject != settings.admin_username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return subject


def enforce_rate_limit(request: Request) -> None:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=1)
    key = request.client.host if request.client else "unknown"
    bucket = rate_limiter[key]

    while bucket and bucket[0] < window_start:
        bucket.popleft()

    if len(bucket) >= settings.max_downloads_per_hour:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    bucket.append(now)
