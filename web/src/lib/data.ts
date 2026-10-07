import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/auth";
import type { Booking, BookingStatus, JobCard, JobStatus, SparePart, Vehicle } from "@/lib/mock-data";

/** GET a path once on mount; `reload` refetches (e.g. after a write). */
export function useFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<T>(path)
      .then((d) => !cancelled && (setData(d), setError(null)))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Request failed"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

/** API → the shapes the screens already render. */

const bookingStatus: Record<string, BookingStatus> = {
  pending: "confirmed", in_progress: "in-service", completed: "collected", cancelled: "cancelled",
};

export interface ApiBooking {
  id: string; registration_number: string | null; customer_name: string | null;
  service_type: string; booking_date: string; status: string;
}
export const toBooking = (b: ApiBooking): Booking => ({
  id: `BK-${b.id.slice(-4).toUpperCase()}`,
  regNo: b.registration_number ?? "—",
  customer: b.customer_name ?? "—",
  serviceType: b.service_type,
  date: b.booking_date.slice(0, 10),
  time: b.booking_date.slice(11, 16),
  status: bookingStatus[b.status] ?? "confirmed",
});

export interface ApiJobCard {
  id: string; registration_number: string; status: string; created_at: string;
  tasks: { id: string; label: string; status: string }[];
}
const jobStatus = (s: string): JobStatus => s.replace("_", "-") as JobStatus;
export const toJobCard = (j: ApiJobCard): JobCard => ({
  id: j.id,
  label: `JC-${j.id.slice(-4).toUpperCase()}`,
  regNo: j.registration_number,
  opened: j.created_at.slice(0, 16).replace("T", " "),
  status: jobStatus(j.status),
  tasks: j.tasks.map((t) => ({ id: t.id, label: t.label, status: jobStatus(t.status) })),
});

export interface ApiPart { id: string; sku: string; name: string; stock_qty: number; unit_price: number }
export const toPart = (p: ApiPart): SparePart => ({
  id: p.id, sku: p.sku, name: p.name, inStock: p.stock_qty, unitPrice: p.unit_price,
});

export interface ApiVehicle {
  id: string; registration_number: string; make: string; model: string; year?: number;
  latest_booking: { service_type: string; status: string } | null;
}
export const toVehicle = (v: ApiVehicle): Vehicle & { lastVisit?: { serviceType: string; status: BookingStatus } } => ({
  id: v.id, regNo: v.registration_number, make: v.make, model: v.model, year: v.year ?? 0,
  lastVisit: v.latest_booking
    ? { serviceType: v.latest_booking.service_type, status: bookingStatus[v.latest_booking.status] ?? "confirmed" }
    : undefined,
});

export interface ApiInvoice {
  id: string; registration_number: string | null; line_items: { description: string; amount: number }[];
  subtotal: number; tax: number; total: number; tax_rate: number; paid: number; outstanding: number; created_at: string;
}
/** Parts vs labour split for the payment card; the server already computed the totals. */
export const invoiceParts = (i: ApiInvoice) =>
  i.line_items.filter((l) => l.description.startsWith("Part")).reduce((s, l) => s + l.amount, 0);
