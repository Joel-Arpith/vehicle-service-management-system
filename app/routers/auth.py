"""Registration, login, and role administration."""

from bson import ObjectId
from fastapi import APIRouter, Depends
from pymongo.errors import DuplicateKeyError

from app.auth import (
    AuthError, create_access_token, current_user, hash_password,
    manager_only, verify_password,
)
from app.db import get_db
from app.errors import DuplicateError, NotFoundError
from app.models.schemas import LoginIn, RegisterIn, RoleUpdateIn, doc_out, oid
from app.services.rules import utcnow

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _public(user: dict) -> dict:
    """Never let the hash leave the process."""
    return doc_out({k: v for k, v in user.items() if k != "password_hash"})


@router.post("/register", status_code=201)
async def register(body: RegisterIn):
    """Public sign-up always creates a `customer`.

    Staff roles are assigned by a manager via PATCH /api/auth/users/{id}/role —
    accepting a role here would let anyone register as a manager.
    """
    db = get_db()
    now = utcnow()

    customer = {
        "_id": ObjectId(), "name": body.name, "email": body.email,
        "phone": body.phone or "+91 00000 00000", "created_at": now,
    }
    user = {
        "name": body.name, "email": body.email,
        "password_hash": hash_password(body.password),
        "role": "customer", "customer_id": customer["_id"], "created_at": now,
    }
    try:
        # Unique index on users.email; a find-then-insert would race.
        user["_id"] = (await db.users.insert_one(user)).inserted_id
    except DuplicateKeyError:
        raise DuplicateError("an account with this email already exists", email=body.email)

    try:
        await db.customers.insert_one(customer)
    except DuplicateKeyError:
        # customers.email is also unique — link to the existing record rather
        # than leaving a user row pointing at a customer that was never created.
        existing = await db.customers.find_one({"email": body.email})
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"customer_id": existing["_id"]}})
        user["customer_id"] = existing["_id"]

    return {"user": _public(user), "access_token": create_access_token(str(user["_id"]), "customer")}


@router.post("/login")
async def login(body: LoginIn):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    # Same message and same work either way — a distinct "no such user" reply
    # would let anyone enumerate registered email addresses.
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise AuthError("incorrect email or password")
    return {"user": _public(user), "access_token": create_access_token(str(user["_id"]), user["role"])}


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    return _public(user)


@router.get("/users", dependencies=[Depends(manager_only)])
async def list_users():
    db = get_db()
    return [_public(u) for u in await db.users.find().to_list(length=200)]


@router.patch("/users/{user_id}/role", dependencies=[Depends(manager_only)])
async def set_role(user_id: str, body: RoleUpdateIn):
    db = get_db()
    _id = oid(user_id, "user")
    result = await db.users.update_one({"_id": _id}, {"$set": {"role": body.role}})
    if result.matched_count == 0:
        raise NotFoundError("user not found", id=user_id)
    return _public(await db.users.find_one({"_id": _id}))
