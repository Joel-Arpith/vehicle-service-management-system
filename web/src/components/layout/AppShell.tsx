import { NavLink, Outlet, Link } from "react-router-dom";
import { LayoutDashboard, CalendarDays, ClipboardList, Receipt, Wrench, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/app/jobs", label: "Job cards", icon: ClipboardList },
  { to: "/app/invoice", label: "Invoice", icon: Receipt },
];

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <button
      onClick={() => setDark(!dark)}
      className="grid size-10 place-items-center rounded-xl bg-card neo-sm neo-press"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export default function AppShell() {
  return (
    // ponytail: the app uses native scrolling. Lenis smooth-scroll is on the
    // landing page only — hijacking scroll inside a data tool is a nuisance.
    <div className="relative z-10 min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Wrench className="size-4" />
            </span>
            <span className="hidden sm:inline">AutoCare</span>
          </Link>

          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                    isActive ? "bg-card text-foreground neo-sm" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <n.icon className="size-4" />
                <span className="hidden md:inline">{n.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-foreground neo-sm">
              VS
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
