"""Pydantic request/response models.

ponytail: IDs cross the API boundary as plain strings and are converted to
ObjectId once, in `oid()`. A custom Pydantic ObjectId type would be more
machinery for the same result.
"""

from datetime import datetime
from typing import Annotated, Literal

from bson import ObjectId
from bson.errors import InvalidId
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.errors import NotFoundError

Str = Annotated[str, Field(min_length=1, max_length=200)]

BookingStatus = Literal["pending", "in_progress", "completed", "cancelled"]
JobCardStatus = Literal["open", "in_progress", "awaiting_parts", "completed", "cancelled"]
TaskStatus = Literal["pending", "in_progress", "awaiting_parts", "completed"]
AssignmentStatus = Literal["scheduled", "in_progress", "completed", "cancelled"]


def oid(value: str, what: str = "record") -> ObjectId:
    """Parse a string id, or raise the 404 the router would raise anyway."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise NotFoundError(f"{what} id is not a valid ObjectId", id=str(value))


def doc_out(doc: dict) -> dict:
    """Mongo doc → JSON-safe dict (_id → id, nested ObjectIds → str)."""
    if doc is None:
        return None
    out = {}
    for k, v in doc.items():
        key = "id" if k == "_id" else k
        if isinstance(v, ObjectId):
            out[key] = str(v)
        elif isinstance(v, list):
            out[key] = [doc_out(i) if isinstance(i, dict) else (str(i) if isinstance(i, ObjectId) else i) for i in v]
        elif isinstance(v, dict):
            out[key] = doc_out(v)
        else:
            out[key] = v
    return out


class Base(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


# ── customers & vehicles ──

class CustomerIn(Base):
    name: Str
    phone: Annotated[str, Field(pattern=r"^\+?[0-9 \-]{7,20}$")]
    email: EmailStr


class VehicleIn(Base):
    customer_id: Str
    registration_number: Annotated[str, Field(min_length=4, max_length=20)]
    make: Str
    model: Str
    year: Annotated[int, Field(ge=1980, le=2100)] | None = None
    odometer: Annotated[int, Field(ge=0)] | None = None

    @field_validator("registration_number")
    @classmethod
    def normalise(cls, v: str) -> str:
        # Uniqueness is a unique index; normalise first or "KA01 MJ 4471" and
        # "ka01mj4471" would both be accepted as distinct vehicles.
        return " ".join(v.upper().split())


# ── mechanics & parts ──

class MechanicIn(Base):
    name: Str
    specialisation: Str
    shift_start: Annotated[int, Field(ge=0, le=23)] = 7
    shift_end: Annotated[int, Field(ge=1, le=24)] = 15

    @model_validator(mode="after")
    def check_shift(self):
        if self.shift_end <= self.shift_start:
            raise ValueError("shift_end must be after shift_start")
        return self


class SparePartIn(Base):
    sku: Annotated[str, Field(min_length=2, max_length=40)]
    name: Str
    stock_qty: Annotated[int, Field(ge=0)]
    reorder_level: Annotated[int, Field(ge=0)] = 0
    unit_price: Annotated[float, Field(ge=0)]


# ── bookings ──

class BookingIn(Base):
    vehicle_id: Str
    service_type: Str
    booking_date: datetime
    expected_completion_date: datetime | None = None

    @model_validator(mode="after")
    def check_dates(self):
        # "Valid booking/completion dates" rule — rejected here first, with a
        # $expr validator in Mongo as the second line of defence.
        if self.expected_completion_date and self.expected_completion_date < self.booking_date:
            raise ValueError("expected_completion_date must not precede booking_date")
        return self


# ── job cards & tasks ──

class TaskIn(Base):
    label: Str
    estimated_hours: Annotated[float, Field(gt=0, le=100)] = 1.0


class JobCardIn(Base):
    booking_id: Str
    tasks: Annotated[list[TaskIn], Field(min_length=1, max_length=50)]


class TaskStatusIn(Base):
    status: TaskStatus


class JobCardStatusIn(Base):
    status: JobCardStatus


# ── assignments ──

class AssignmentIn(Base):
    job_card_id: Str
    task_id: Str
    mechanic_id: Str
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def check_window(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


# ── part usage ──

class PartUsageIn(Base):
    job_card_id: Str
    spare_part_id: Str
    qty: Annotated[int, Field(gt=0, le=1000)]


# ── billing ──

class LineItemIn(Base):
    description: Str
    amount: Annotated[float, Field(ge=0)]


class InvoiceIn(Base):
    """No `total` field by design — the client cannot supply one.

    The server sums line items and applies tax itself; see plan Section 5,
    "accurate invoice totals".
    """

    job_card_id: Str
    labour_items: list[LineItemIn] = []
    tax_rate: Annotated[float, Field(ge=0, le=1)] = 0.18


class PaymentIn(Base):
    invoice_id: Str
    amount: Annotated[float, Field(gt=0)]
    method: Literal["card", "upi", "netbanking", "cash"]


# ── auth ──

# bcrypt ignores anything past 72 bytes, so two long passwords differing only
# after byte 72 would be interchangeable. Capped rather than silently truncated.
Password = Annotated[str, Field(min_length=8, max_length=72)]

RoleName = Literal["customer", "receptionist", "mechanic", "manager"]


class RegisterIn(Base):
    name: Str
    email: EmailStr
    password: Password
    phone: Annotated[str, Field(pattern=r"^\+?[0-9 \-]{7,20}$")] | None = None

    @field_validator("password")
    @classmethod
    def not_all_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("password must not be blank")
        return v


class LoginIn(Base):
    email: EmailStr
    password: Password


class RoleUpdateIn(Base):
    role: RoleName
