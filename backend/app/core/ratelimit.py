"""A small per-IP rate limiter for the sign-in endpoints (in memory, per server process).

The main protection against password guessing is the per-account lockout in the database
(see app/routers/auth.py); this limiter only slows down one address hammering the server. The
limit is generous because a whole college may share one public IP address.
"""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.config import settings


class RateLimiter:
    def __init__(self, limit: int, window_seconds: int = 60):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if len(hits) >= self.limit:
            return False
        hits.append(now)
        return True

    def reset(self) -> None:
        self._hits.clear()


auth_limiter = RateLimiter(settings.AUTH_RATE_LIMIT_PER_MINUTE, 60)


def limit_auth_requests(request: Request) -> None:
    """FastAPI dependency for login, forgot-password and reset-password."""
    ip = request.client.host if request.client else "unknown"
    if not auth_limiter.allow(ip):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many requests. Please wait a minute and try again.",
            headers={"Retry-After": "60"},
        )
