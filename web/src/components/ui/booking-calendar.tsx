import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Columns3, Grid, Car, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOKINGS, type Booking } from "@/lib/mock-data";

export type DayType = {
  day: string;
  bookings?: Booking[];
};

/** August 2026: the 1st is a Saturday, so the grid opens with 6 lead-in cells. */
const buildMonth = (): DayType[] => {
  const lead = Array.from({ length: 6 }, (_, i) => ({ day: `-${6 - i}` }));
  const days = Array.from({ length: 31 }, (_, i) => {
    const dd = String(i + 1).padStart(2, "0");
    const date = `2026-08-${dd}`;
    const onDay = BOOKINGS.filter((b) => b.date === date);
    return { day: dd, bookings: onDay.length ? onDay : undefined };
  });
  return [...lead, ...days];
};

const DAYS = buildMonth();
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
};

export const BookingCalendar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const [listView, setListView] = useState(true);
    const [hoveredDay, setHoveredDay] = useState<string | null>(null);
    const [selected, setSelected] = useState<string>("23");

    const sortedDays = React.useMemo(() => {
      const withBookings = DAYS.filter((d) => d.bookings);
      if (!hoveredDay) return withBookings;
      return [...withBookings].sort((a, b) =>
        a.day === hoveredDay ? -1 : b.day === hoveredDay ? 1 : 0,
      );
    }, [hoveredDay]);

    return (
      <div ref={ref} className={cn("grid gap-6 lg:grid-cols-[1.15fr_1fr]", className)} {...props}>
        {/* ── Calendar ── */}
        <div className="rounded-3xl bg-card p-6 neo">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                August <span className="text-muted-foreground">2026</span>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">Pick a date to see open bays</p>
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
                onSelect={setSelected}
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
                Upcoming and past visits across all bays.
              </p>

              <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto rounded-2xl bg-background p-3 neo-inset">
                <AnimatePresence>
                  {sortedDays.flatMap((day) =>
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
                          <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {b.date} · {b.slot}</span>
                          <span className="flex items-center gap-1.5"><User className="size-3.5" /> Advisor: {b.advisor}</span>
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
