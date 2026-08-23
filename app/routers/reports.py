"""The six required reports, one endpoint each (plan Section 8)."""

from fastapi import APIRouter

from app.db import get_db
from app.models.schemas import oid
from app.services import reports

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/pending-jobs")
async def pending_jobs():
    return await reports.pending_jobs(get_db())


@router.get("/service-history/{vehicle_id}")
async def service_history(vehicle_id: str):
    return await reports.service_history(get_db(), oid(vehicle_id, "vehicle"))


@router.get("/mechanic-workload")
async def mechanic_workload():
    return await reports.mechanic_workload(get_db())


@router.get("/spare-part-usage")
async def spare_part_usage(limit: int = 10):
    return await reports.spare_part_usage(get_db(), limit)


@router.get("/turnaround-time")
async def turnaround_time():
    return await reports.turnaround_time(get_db())


@router.get("/revenue")
async def revenue():
    return await reports.revenue_by_month(get_db())
