import { useEffect, useState } from "react";
import { api } from "@/lib/auth";

/** Response shapes from app/routers/reports.py. */

export interface RevenueRow { month: string; revenue: number; invoices: number }
export interface WorkloadRow { mechanic_id: string; name: string; specialisation: string; total_hours: number; jobs_count: number }
export interface TurnaroundRow { avg_days: number | null; min_days: number | null; max_days: number | null; sample: number }
export interface PartUsageRow { sku: string; name: string; total_qty: number; total_value: number; stock_qty: number; below_reorder: boolean }
export interface PendingJobRow { job_card_id: string; registration_number: string; service_type: string; status: string; booking_date: string; open_tasks: number }
export interface HealthRow { label: string; value: number }
export interface SummaryRow { services_completed: number; vehicles_served: number; mechanics: number; open_jobs: number }

export interface ReportsData {
  summary: SummaryRow;
  revenue: RevenueRow[];
  workload: WorkloadRow[];
  turnaround: TurnaroundRow;
  partUsage: PartUsageRow[];
  pending: PendingJobRow[];
  health: HealthRow[];
}

/**
 * Loads every report in one pass.
 *
 * The seven requests are independent, so they go out together — sequential
 * awaits would make the dashboard as slow as the sum of them. Promise.all
 * rejects on the first failure, which is what we want: a dashboard missing
 * one panel is more confusing than an explicit error.
 */
export function useReports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api<SummaryRow>("/reports/summary"),
      api<RevenueRow[]>("/reports/revenue"),
      api<WorkloadRow[]>("/reports/mechanic-workload"),
      api<TurnaroundRow>("/reports/turnaround-time"),
      api<PartUsageRow[]>("/reports/spare-part-usage"),
      api<PendingJobRow[]>("/reports/pending-jobs"),
      api<HealthRow[]>("/reports/centre-health"),
    ])
      .then(([summary, revenue, workload, turnaround, partUsage, pending, health]) => {
        // Ignore a resolved fetch if the component already unmounted, or
        // React logs a state-update-after-unmount warning.
        if (cancelled) return;
        setData({ summary, revenue, workload, turnaround, partUsage, pending, health });
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Could not load reports"))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, []);

  return { data, error, loading };
}
