"""Domain errors → HTTP status codes.

Mongo has no FKs and no CHECK constraints, so every rule the relational
design would have delegated to the DB is raised from the service layer here
and mapped to a status code the evaluator can probe from Swagger.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class DomainError(Exception):
    status_code = 400
    code = "domain_error"

    def __init__(self, message: str, **detail):
        super().__init__(message)
        self.message = message
        self.detail = detail


class NotFoundError(DomainError):
    status_code = 404
    code = "not_found"


class SchedulingConflictError(DomainError):
    """Mechanic already booked in an overlapping window."""

    status_code = 409
    code = "scheduling_conflict"


class InsufficientStockError(DomainError):
    """Requested quantity exceeds stock on hand."""

    status_code = 409
    code = "insufficient_stock"


class DuplicateError(DomainError):
    """Violates a unique index (e.g. registration number, SKU)."""

    status_code = 409
    code = "duplicate"


class InvalidStateError(DomainError):
    """Operation not legal for the record's current state."""

    status_code = 422
    code = "invalid_state"


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _handle(_: Request, exc: DomainError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.code, "message": exc.message, **exc.detail},
        )
