import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Columns3, Grid, Car, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Booking } from "@/lib/mock-data";
import { useFetch, toBooking, type ApiBooking } from "@/lib/data";

export type DayType = {
  day: string;
  bookings?: Booking[];
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/** One month of cells: lead-in blanks for the weekday the 1st falls on, then each day with its bookings. */
const buildMonth = (year: number, month: number, bookings: Booking[]): DayType[] => {
  const lead = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const filler = Array.from({ length: lead }, (_, i) => ({ day: `-${lead - i}` }));
  const days = Array.from({ length: count }, (_, i) => {
    const dd = String(i + 1).padStart(2, "0");
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${dd}`;
    const onDay = bookings.filter((b) => b.date === date);
    return { day: dd, bookings: onDay.length ? onDay : undefined };
  });
  return [...filler, ...days];
};

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const Day: React.FC<{ day: DayType; onHover: (d: string | null) => void; selected: boolean; onSelect: (d: string) => void }> = ({
  day, onHover, selected, onSelect,
}) => {
  const isFiller = day.day.startsWith("-");
  return (
    <motion.button
      type="button"
      disabled={isFiller}
      onClick={() => !isFiller && onSelect(day.day)}
      className={cn(
        "relative flex h-14 items-center justify-center rounded-2xl transition-all",
        isFiller
          ? "cursor-default bg-background/40 opacity-40"
          : selected
            ? "bg-accent text-accent-foreground neo"
            : "bg-card neo-flat neo-press hover:neo",
      )}
      onMouseEnter={() => !isFiller && onHover(day.day)}
      onMouseLeave={() => onHover(null)}
    >
      {!isFiller && <span className="text-sm font-semibold">{day.day}</span>}
      {day.bookings && (
        <span
          className={cn(
            "absolute bottom-1.5 right-1.5 grid size-4 place-items-center rounded-full text-[9px] font-bold",
            selected ? "bg-accent-foreground text-accent" : "bg-accent text-accent-foreground",
          )}
        >
          {day.bookings.length}
        </span>
      )}
    </motion.button>
  );
};

const statusTone: Record<Booking["status"], string> = {
  confirmed: "bg-info/15 text-info",
  "in-service": "bg-warning/15 text-warning",
  ready: "bg-success/15 text-success",
  collected: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export const BookingCalendar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const [listView, setListView] = useState(true);
    const [hoveredDay, setHoveredDay] = useState<string | null>(null);
    const { data, error, loading } = useFetch<ApiBooking[]>("/bookings");
    const bookings = React.useMemo(() => (data ?? []).map(toBooking), [data]);
    // Open on the month of the newest booking; fall back to today when there are none.
    const [view, setView] = useState<{ y: number; m: number } | null>(null);
    const latest = bookings[0]?.date ?? new Date().toISOString().slice(0, 10);
    const { y, m } = view ?? { y: Number(latest.slice(0, 4)), m: Number(latest.slice(5, 7)) - 1 };
    const [selected, setSelected] = useState<string | null>(null);
    const step = (d: number) => { const t = new Date(y, m + d, 1); setView({ y: t.getFullYear(), m: t.getMonth() }); setSelected(null); };
    const DAYS = React.useMemo(() => buildMonth(y, m, bookings), [y, m, bookings]);

    const sortedDays = React.useMemo(() => {
      const withBookings = DAYS.filter((d) => d.bookings);
      if (!hoveredDay) return withBookings;
      return [...withBookings].sort((a, b) =>
        a.day === hoveredDay ? -1 : b.day === hoveredDay ? 1 : 0,
      );
    }, [hoveredDay, DAYS]);

    return (
      <div ref={ref} className={cn("grid gap-6 lg:grid-cols-[1.15fr_1fr]", className)} {...props}>
        {/* ── Calendar ── */}
        <div className="rounded-3xl bg-card p-6 neo">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => step(-1)} aria-label="Previous month" className="grid size-8 place-items-center rounded-lg bg-card neo-sm neo-press"><ChevronLeft className="size-4" /></button>
                <h2 className="min-w-44 text-center text-2xl font-bold tracking-tight">
                  {MONTHS[m]} <span className="text-muted-foreground">{y}</span>
                </h2>
                <button type="button" onClick={() => step(1)} aria-label="Next month" className="grid size-8 place-items-center rounded-lg bg-card neo-sm neo-press"><ChevronRight className="size-4" /></button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {loading ? "Loading bookings…" : error ? error : "Pick a date to filter the list"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setListView(!listView)}
              className="relative flex items-center gap-3 rounded-xl bg-background px-2 py-1.5 neo-inset"
              aria-label="Toggle booking list"
            >
              <span
                className="absolute top-1/2 left-0 h-[78%] w-8 rounded-lg bg-card neo-sm transition-transform duration-300"
                style={{ transform: listView ? "translateY(-50%) translateX(38px)" : "translateY(-50%) translateX(4px)" }}
              />
              <Columns3 className="relative z-10 size-4" />
              <Grid className="relative z-10 size-4" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2">
            {daysOfWeek.map((d) => (
              <div key={d} className="rounded-lg py-1.5 text-center font-mono text-[10px] font-bold tracking-widest text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, i) => (
              <Day
                key={`${day.day}-${i}`}
                day={day}
                onHover={setHoveredDay}
                selected={selected === day.day}
                onSelect={(d) => setSelected(selected === d ? null : d)}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" /> Has bookings</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted-foreground/40" /> Bay free</span>
          </div>
        </div>

        {/* ── Booking list ── */}
        <AnimatePresence>
          {listView && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.28 }}
              className="rounded-3xl bg-card p-6 neo"
            >
              <h2 className="text-2xl font-bold tracking-tight">Bookings</h2>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                {selected ? "Visits on the selected day." : "Visits in this month."}
              </p>
              {!loading && sortedDays.length === 0 && (
                <p className="mb-3 rounded-xl bg-background p-4 text-sm text-muted-foreground neo-inset">No bookings this month.</p>
              )}

              <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto rounded-2xl bg-background p-3 neo-inset">
                <AnimatePresence>
                  {sortedDays.filter((d) => !selected || d.day === selected).flatMap((day) =>
                    (day.bookings ?? []).map((b) => (
                      <motion.div
                        key={b.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.22 }}
                        className="rounded-2xl bg-card p-4 neo-flat"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{b.id}</span>
                          <span className={cn("rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider", statusTone[b.status])}>
                            {b.status}
                          </span>
                        </div>
                        <h3 className="font-semibold tracking-tight">{b.serviceType}</h3>
                        <div className="mt-2 grid gap-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Car className="size-3.5" /> {b.regNo} · {b.customer}</span>
                          <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {b.date} · {b.time}</span>
                        </div>
                      </motion.div>
                    )),
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
BookingCalendar.displayName = "BookingCalendar";

export default BookingCalendar;
