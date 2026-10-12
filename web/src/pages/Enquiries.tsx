import { useMemo, useState } from "react";
import { useFetch } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Enquiry = {
  id: string; name: string; phone: string; email: string;
  registration_number: string; service: string; message: string; status: string; created_at: string;
};

const when = (iso: string) => new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z")
  .toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** CSV of the rows currently shown, for the front desk's call list. */
function downloadCsv(rows: Enquiry[]) {
  const cols = ["created_at", "name", "phone", "email", "registration_number", "service", "message", "status"] as const;
  const cell = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "autocare-enquiries.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Enquiries() {
  const { data, loading, error, reload } = useFetch<Enquiry[]>("/enquiries");
  const [q, setQ] = useState("");
  const all = data ?? [];

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? all.filter((e) => [e.name, e.phone, e.email, e.registration_number, e.service, e.message].join(" ").toLowerCase().includes(s)) : all;
  }, [all, q]);

  const byService = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of all) m.set(e.service || "Not sure yet", (m.get(e.service || "Not sure yet") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const domains = useMemo(() => new Set(all.map((e) => e.email.split("@")[1])).size, [all]);
  const withVehicle = all.filter((e) => e.registration_number).length;
  const week = all.filter((e) => Date.now() - new Date(e.created_at + (e.created_at.endsWith("Z") ? "" : "Z")).getTime() < 7 * 864e5).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer details left on the landing-page form, newest first. Call them back to confirm a slot.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={reload}>Refresh</Button>
          <Button variant="accent" size="sm" disabled={!rows.length} onClick={() => downloadCsv(rows)}>Export CSV</Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total enquiries", all.length],
          ["In the last 7 days", week],
          ["Gave a vehicle number", withVehicle],
          ["Email domains", domains],
        ].map(([label, n]) => (
          <div key={label} className="rounded-2xl bg-card p-5 neo">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{n}</p>
          </div>
        ))}
      </div>

      {byService.length > 0 && (
        <div className="rounded-2xl bg-card p-5 neo">
          <p className="text-sm font-semibold">Service asked for</p>
          <div className="mt-3 space-y-2">
            {byService.map(([s, n]) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <span className="w-44 shrink-0 truncate">{s}</span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${(n / all.length) * 100}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums text-muted-foreground">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email, vehicle, service…" className="max-w-md" aria-label="Search enquiries" />

      {loading && <p className="text-sm text-muted-foreground">Loading enquiries…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!loading && !error && all.length === 0 && (
        <p className="text-sm text-muted-foreground">No enquiries yet. They appear here when someone fills the form on the landing page.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-card neo">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                {["Received", "Name", "Phone", "Email", "Vehicle", "Service", "Message", "Status"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">{when(e.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{e.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums"><a href={`tel:${e.phone.replace(/\s/g, "")}`} className="hover:underline">{e.phone}</a></td>
                  <td className="whitespace-nowrap px-4 py-3"><a href={`mailto:${e.email}`} className="hover:underline">{e.email}</a></td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{e.registration_number || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{e.service || "Not sure yet"}</td>
                  <td className="min-w-56 px-4 py-3 text-muted-foreground">{e.message || "—"}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize">{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
