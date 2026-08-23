import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, inr } from "@/lib/utils";
import {
  REVENUE_BY_MONTH, MECHANIC_WORKLOAD, TURNAROUND_HOURS,
  PART_USAGE_SPLIT, CENTRE_HEALTH, JOB_CARDS, SPARE_PARTS,
} from "@/lib/mock-data";

/**
 * The six required reports (plan Section 8) as one bento grid.
 * Neomorphic, warm-neutral — no brutalist borders, no hard drop shadows.
 */

function Panel({ title, subtitle, children, className }: {
  title: string; subtitle: string; children: React.ReactNode; className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col rounded-3xl bg-card p-6 neo", className)}
    >
      <header className="mb-5">
        <h3 className="font-bold tracking-tight">{title}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </motion.section>
  );
}

/* ── 1. Revenue ── */
function RevenueChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...REVENUE_BY_MONTH.map((d) => d.value));

  return (
    <div className="flex h-full min-h-[180px] flex-col">
      <p className="mb-4 font-mono text-2xl font-bold tracking-tight">
        {inr(REVENUE_BY_MONTH.reduce((s, d) => s + d.value, 0))}
        <span className="ml-2 text-xs font-medium text-muted-foreground">6 months</span>
      </p>
      <div className="flex flex-1 items-end gap-2.5">
        {REVENUE_BY_MONTH.map((d, i) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end gap-2">
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${(d.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 160, damping: 22, delay: i * 0.07 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "w-full cursor-pointer rounded-xl transition-colors",
                hovered === i ? "bg-accent" : "bg-secondary",
              )}
            />
            <span className="text-center font-mono text-[9px] font-bold tracking-widest text-muted-foreground">
              {d.label}
            </span>
            <AnimatePresence>
              {hovered === i && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground neo-sm"
                >
                  {inr(d.value)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 2. Centre health (radar) ── */
const SIZE = 200, C = SIZE / 2, R = 74;
const coords = (v: number, i: number, n: number) => {
  const a = ((360 / n) * i - 90) * (Math.PI / 180);
  const r = (v / 100) * R;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};

function HealthRadar() {
  const [hovered, setHovered] = useState<string | null>(null);
  const n = CENTRE_HEALTH.length;
  const path = CENTRE_HEALTH.map((d, i) => {
    const c = coords(d.value, i, n);
    return `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`;
  }).join(" ") + " Z";

  return (
    <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center justify-center">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[210px] overflow-visible">
          {[100, 75, 50, 25].map((lvl, li) => (
            <path key={li}
              d={CENTRE_HEALTH.map((_, i) => { const c = coords(lvl, i, n); return `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`; }).join(" ") + " Z"}
              fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" className="text-muted-foreground/20" />
          ))}
          {CENTRE_HEALTH.map((_, i) => {
            const o = coords(100, i, n);
            return <line key={i} x1={C} y1={C} x2={o.x} y2={o.y} stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />;
          })}
          <motion.path
            d={path}
            className="fill-accent/25 stroke-accent"
            strokeWidth="2.5" strokeLinejoin="round"
            initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.15 }}
            style={{ originX: "50%", originY: "50%" }}
          />
          {CENTRE_HEALTH.map((d, i) => {
            const c = coords(d.value, i, n);
            const on = hovered === d.label;
            return (
              <g key={i} onMouseEnter={() => setHovered(d.label)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
                <circle cx={c.x} cy={c.y} r="18" fill="transparent" />
                <motion.circle cx={c.x} cy={c.y} r="5" className="fill-card stroke-accent" strokeWidth="2.5"
                  animate={{ scale: on ? 1.7 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-36">
        {CENTRE_HEALTH.map((item) => (
          <motion.div
            key={item.label}
            onMouseEnter={() => setHovered(item.label)}
            onMouseLeave={() => setHovered(null)}
            animate={{ x: hovered === item.label ? 5 : 0 }}
            className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-background"
          >
            <span className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground">{item.label}</span>
            <span className="text-sm font-bold">{item.value}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── 3. Part usage (donut) ── */
const arc = (p: number) => [Math.cos(2 * Math.PI * p), Math.sin(2 * Math.PI * p)];

function PartUsageDonut() {
  const [hovered, setHovered] = useState<string | null>(null);
  let cum = 0;
  const tones = ["var(--accent)", "var(--info)", "var(--success)", "var(--warning)"];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div className="relative size-44">
        <svg viewBox="-1.15 -1.15 2.3 2.3" className="size-full -rotate-90 overflow-visible">
          {PART_USAGE_SPLIT.map((s, i) => {
            const start = cum, end = cum + s.value / 100;
            cum = end;
            const [sx, sy] = arc(start), [ex, ey] = arc(end);
            const large = s.value / 100 > 0.5 ? 1 : 0;
            const on = hovered === s.label;
            const dim = hovered !== null && !on;
            return (
              <motion.path
                key={s.label}
                d={`M ${sx} ${sy} A 1 1 0 ${large} 1 ${ex} ${ey} L 0 0`}
                fill={tones[i]}
                animate={{
                  translateX: on ? (sx + ex) * 0.06 : 0,
                  translateY: on ? (sy + ey) * 0.06 : 0,
                  opacity: dim ? 0.3 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onMouseEnter={() => setHovered(s.label)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              />
            );
          })}
          <circle cx="0" cy="0" r="0.58" className="fill-card" />
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={hovered ?? "total"}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="text-center"
            >
              <div className="text-2xl font-bold leading-none">
                {hovered ? `${PART_USAGE_SPLIT.find((d) => d.label === hovered)?.value}%` : "1,284"}
              </div>
              <div className="mt-1 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {hovered ?? "parts issued"}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-1.5">
        {PART_USAGE_SPLIT.map((item, i) => (
          <motion.div
            key={item.label}
            onMouseEnter={() => setHovered(item.label)}
            onMouseLeave={() => setHovered(null)}
            animate={{ opacity: hovered && hovered !== item.label ? 0.4 : 1 }}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-background"
          >
            <span className="size-2.5 rounded-full" style={{ backgroundColor: tones[i] }} />
            <span className="text-xs font-medium">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── 4. Mechanic workload ── */
function WorkloadBars() {
  return (
    <div className="flex h-full flex-col justify-center gap-3.5">
      {MECHANIC_WORKLOAD.map((m, i) => (
        <div key={m.label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 truncate font-mono text-[10px] font-bold tracking-wider text-muted-foreground">
            {m.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-background neo-inset">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${m.value}%` }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 130, damping: 22, delay: i * 0.09 }}
              className={cn("h-full rounded-full", m.value >= 100 ? "bg-destructive" : m.value >= 75 ? "bg-warning" : "bg-success")}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums">{m.value}%</span>
        </div>
      ))}
      <p className="mt-2 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Imran is at capacity — the overlap check will reject any further assignment in his shift window.
      </p>
    </div>
  );
}

/* ── 5. Turnaround ── */
function TurnaroundChart() {
  const max = Math.max(...TURNAROUND_HOURS.map((d) => d.value));
  return (
    <div className="flex h-full min-h-[130px] flex-col">
      <p className="mb-3 font-mono text-2xl font-bold">
        41<span className="ml-1.5 text-xs font-medium text-muted-foreground">hrs avg</span>
      </p>
      <div className="flex flex-1 items-end gap-2">
        {TURNAROUND_HOURS.map((d, i) => (
          <div key={d.label} className="flex h-full flex-1 flex-col justify-end gap-1.5">
            <motion.div
              initial={{ height: 0 }} whileInView={{ height: `${(d.value / max) * 100}%` }} viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 160, damping: 22, delay: i * 0.06 }}
              className="w-full rounded-lg bg-secondary"
            />
            <span className="text-center font-mono text-[9px] tracking-wider text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 6. Pending jobs + low stock ── */
function PendingJobs() {
  const pending = JOB_CARDS.flatMap((j) => j.tasks.filter((t) => t.status !== "completed").map((t) => ({ ...t, job: j.id, reg: j.regNo })));
  const low = SPARE_PARTS.filter((p) => p.inStock <= p.reorderLevel);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-2">
        {pending.slice(0, 4).map((t) => (
          <div key={`${t.job}-${t.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2.5 neo-inset">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{t.label}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{t.job} · {t.reg}</p>
            </div>
            <span className={cn(
              "shrink-0 rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
              t.status === "awaiting-parts" ? "bg-warning/15 text-warning" : t.status === "in-progress" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground",
            )}>
              {t.status.replace("-", " ")}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto border-t border-border pt-3">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Below reorder level</p>
        <div className="flex flex-wrap gap-1.5">
          {low.map((p) => (
            <span key={p.id} className={cn(
              "rounded-lg px-2 py-1 font-mono text-[10px] font-semibold",
              p.inStock === 0 ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning",
            )}>
              {p.sku} · {p.inStock}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportsBento() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      <Panel title="Revenue" subtitle="Invoiced totals per month, computed server-side from job cards." className="lg:col-span-2">
        <RevenueChart />
      </Panel>
      <Panel title="Part usage" subtitle="Share of parts issued by category this quarter." className="md:row-span-2">
        <PartUsageDonut />
      </Panel>
      <Panel title="Mechanic workload" subtitle="Active jobs against shift capacity.">
        <WorkloadBars />
      </Panel>
      <Panel title="Turnaround time" subtitle="Hours from job card open to collection.">
        <TurnaroundChart />
      </Panel>
      <Panel title="Centre health" subtitle="Composite operating indicators, live." className="md:col-span-2">
        <HealthRadar />
      </Panel>
      <Panel title="Pending jobs" subtitle="Open tasks and parts below reorder level.">
        <PendingJobs />
      </Panel>
    </div>
  );
}
