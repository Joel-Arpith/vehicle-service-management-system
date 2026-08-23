"""Password hashing, token handling, and the role guard."""

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.auth import (
    AuthError, create_access_token, decode_token, hash_password,
    require_roles, verify_password,
)
from app.errors import DomainError, register_error_handlers


# ── passwords ──

def test_hash_is_salted_and_verifies():
    a, b = hash_password("correct horse"), hash_password("correct horse")
    assert a != b, "same password must not produce the same hash (salting)"
    assert verify_password("correct horse", a)
    assert verify_password("correct horse", b)


def test_wrong_password_rejected():
    assert not verify_password("wrong", hash_password("right"))


def test_hash_is_not_reversible_to_plaintext():
    assert "hunter2" not in hash_password("hunter2")


def test_password_over_bcrypt_limit_is_rejected_not_truncated():
    """bcrypt ignores bytes past 72; silently truncating would make two
    different long passwords interchangeable."""
    with pytest.raises(DomainError):
        hash_password("x" * 73)


def test_verify_rejects_garbage_hash_instead_of_raising():
    assert verify_password("anything", "not-a-bcrypt-hash") is False


# ── tokens ──

def test_token_roundtrip_carries_subject_and_role():
    payload = decode_token(create_access_token("507f1f77bcf86cd799439011", "manager"))
    assert payload["sub"] == "507f1f77bcf86cd799439011"
    assert payload["role"] == "manager"


def test_tampered_token_is_rejected():
    with pytest.raises(AuthError):
        decode_token(create_access_token("abc", "customer") + "tampered")


def test_token_signed_with_another_secret_is_rejected():
    from jose import jwt
    forged = jwt.encode({"sub": "abc", "role": "manager"}, "not-our-secret", algorithm="HS256")
    with pytest.raises(AuthError):
        decode_token(forged)


# ── role guard ──

def _app_with(role: str) -> TestClient:
    """Minimal app whose only user has `role`, to test the guard in isolation."""
    app = FastAPI()
    register_error_handlers(app)

    async def fake_user():
        return {"_id": "1", "email": "u@example.com", "role": role}

    guard = require_roles("manager")

    @app.get("/managers-only")
    async def route(user=Depends(lambda u=Depends(fake_user): u)):
        return await guard(user)

    return TestClient(app, raise_server_exceptions=False)


@pytest.mark.parametrize(
    "role,expected", [("manager", 200), ("receptionist", 403), ("mechanic", 403), ("customer", 403)]
)
def test_only_allowed_role_passes_the_guard(role, expected):
    assert _app_with(role).get("/managers-only").status_code == expected
