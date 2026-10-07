import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, LayoutDashboard, Receipt } from "lucide-react";
import { useAuth, can, STAFF, WORKSHOP } from "@/lib/auth";
import { toVehicle, useFetch, type ApiVehicle } from "@/lib/data";
import { cn } from "@/lib/utils";

/** Landing screen inside the app — what you see depends on your role. */
export default function MyGarage() {
  const { user } = useAuth();
  const mine = useFetch<ApiVehicle[]>("/my/vehicles");
  if (!user) return null;

  const staff = can(user, STAFF);

  const tiles = [
    { to: "/app/dashboard", label: "Reports dashboard", icon: LayoutDashboard, show: staff },
    { to: "/app/bookings", label: "Bookings diary", icon: CalendarDays, show: staff },
    { to: "/app/jobs", label: "Job cards", icon: ClipboardList, show: can(user, WORKSHOP) },
    { to: "/app/invoice", label: "Invoice & payment", icon: Receipt, show: true },
  ].filter((t) => t.show);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {staff ? `Welcome back, ${user.name.split(" ")[0]}` : "My garage"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as <strong>{user.email}</strong> ·{" "}
          <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-accent">
            {user.role}
          </span>
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group rounded-2xl bg-card p-5 neo neo-press transition-transform hover:-translate-y-0.5"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-background neo-inset">
              <t.icon className="size-5 text-accent" />
            </span>
            <p className="mt-4 font-semibold tracking-tight">{t.label}</p>
          </Link>
        ))}
      </div>

      {!staff && (
        <section className="space-y-4">
          <h2 className="font-bold tracking-tight">Your vehicles</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(mine.data ?? []).map(toVehicle).map((v) => (
              <div key={v.id} className="rounded-2xl bg-card p-5 neo">
                <p className="font-mono text-sm font-bold tracking-wider">{v.regNo}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {v.make} {v.model}{v.year ? ` · ${v.year}` : ""}
                </p>
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  {v.lastVisit ? (
                    <>
                      Last visit: {v.lastVisit.serviceType}
                      <span
                        className={cn(
                          "ml-2 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase",
                          v.lastVisit.status === "collected" ? "bg-muted text-muted-foreground" : "bg-warning/15 text-warning",
                        )}
                      >
                        {v.lastVisit.status}
                      </span>
                    </>
                  ) : (
                    "No visits yet"
                  )}
                </p>
              </div>
            ))}
            {mine.loading && <p className="text-sm text-muted-foreground">Loading your vehicles…</p>}
            {mine.error && <p role="alert" className="text-sm text-destructive">{mine.error}</p>}
            {!mine.loading && !mine.error && mine.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No vehicles on this account yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
