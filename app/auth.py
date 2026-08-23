"""Password hashing, JWTs, and the role guard.

ponytail: `bcrypt` is used directly rather than through passlib. passlib
1.7.4 is unmaintained and crashes reading `bcrypt.__about__`, which bcrypt 5
removed — a wrapper that needs pinning an old backend earns its removal.
"""

from datetime import datetime, timedelta, timezone
from typing import Literal

import bcrypt
from fastapi import Depends, Request
from jose import JWTError, jwt

from app.config import JWT_SECRET
from app.db import get_db
from app.errors import DomainError
from app.models.schemas import oid

ALGORITHM = "HS256"
TOKEN_TTL = timedelta(hours=12)

Role = Literal["customer", "receptionist", "mechanic", "manager"]
ROLES: tuple[Role, ...] = ("customer", "receptionist", "mechanic", "manager")

# bcrypt truncates silently past 72 bytes: "abc"*30 and "abc"*40 would hash
# identically. Rejected explicitly instead — see PASSWORD_MAX in schemas.
BCRYPT_MAX_BYTES = 72


class AuthError(DomainError):
    status_code = 401
    code = "unauthenticated"


class ForbiddenError(DomainError):
    status_code = 403
    code = "forbidden"


def hash_password(plain: str) -> str:
    if len(plain.encode()) > BCRYPT_MAX_BYTES:
        raise DomainError("password must be at most 72 bytes")
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    if len(plain.encode()) > BCRYPT_MAX_BYTES:
        return False
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ValueError:
        return False


def create_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": user_id, "role": role, "iat": now, "exp": now + TOKEN_TTL},
        JWT_SECRET,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise AuthError(f"invalid or expired token: {exc}")


def _bearer(request: Request) -> str:
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AuthError("missing bearer token")
    return token


async def current_user(request: Request) -> dict:
    """Resolve the caller from the Authorization header.

    The user is re-read from the database on every request rather than trusted
    from the token body, so a role change or a deleted account takes effect
    immediately instead of when the token happens to expire.
    """
    payload = decode_token(_bearer(request))
    db = get_db()
    user = await db.users.find_one({"_id": oid(payload.get("sub", ""), "user")})
    if user is None:
        raise AuthError("account no longer exists")
    return user


def require_roles(*allowed: str):
    """Dependency factory: allow only these roles through."""

    async def guard(user: dict = Depends(current_user)) -> dict:
        if user["role"] not in allowed:
            raise ForbiddenError(
                "your role may not perform this action",
                your_role=user["role"],
                allowed_roles=list(allowed),
            )
        return user

    return guard


# Named guards, so the intent reads off the route rather than a role tuple.
staff_only = require_roles("receptionist", "mechanic", "manager")
front_desk = require_roles("receptionist", "manager")
workshop = require_roles("mechanic", "manager")
manager_only = require_roles("manager")
any_user = current_user
