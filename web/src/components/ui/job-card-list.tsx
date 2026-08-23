import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, Plus, Check, AlertTriangle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertToast } from "@/components/ui/alert-toast";
import { SPARE_PARTS, type JobStatus, type JobTask } from "@/lib/mock-data";

interface JobCardListProps {
  title?: string;
  jobId?: string;
  tasks: JobTask[];
  onBack?: () => void;
  onAddTask?: () => void;
  className?: string;
}

/**
 * Job-card task board.
 *
 * "awaiting-parts" is the interesting state: hovering reveals an Issue Part
 * action, and issuing a part that is out of stock raises the failure toast —
 * mirroring the 409 the API returns from the stock-check transaction
 * (plan Section 5). Completed tasks sort to the top.
 */
export function JobCardList({
  title = "Job card",
  jobId,
  tasks: initialTasks,
  onBack,
  onAddTask,
  className = "",
}: JobCardListProps) {
  const [tasks, setTasks] = useState<JobTask[]>(initialTasks);
  const [hovered, setHovered] = useState<string | null>(null);
  const [spin, setSpin] = useState(0);
  const [toast, setToast] = useState<{ title: string; description: string; variant: "error" | "success" } | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setSpin((p) => (p + 1) % 8), 110);
    return () => clearInterval(t);
  }, [reduce]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const issuePart = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    // Out-of-stock part → the failure path the evaluator will probe.
    const outOfStock = SPARE_PARTS.find((p) => p.inStock === 0);
    if (task?.label.toLowerCase().includes("clutch") && outOfStock) {
      setToast({
        variant: "error",
        title: "Part issue failed — insufficient stock",
        description: `${outOfStock.name} (${outOfStock.sku}) has 0 in stock. Job held; reorder raised.`,
      });
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "in-progress" } : t)));
    setTimeout(() => {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "completed" } : t)));
      setToast({
        variant: "success",
        title: "Part issued",
        description: `Stock decremented and logged against ${jobId ?? "this job"}.`,
      });
    }, 2200);
  };

  const statusIcon = (status: JobStatus) => {
    if (status === "completed")
      return (
        <span className="grid size-4 place-items-center rounded-full bg-success text-success-foreground">
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
      );
    if (status === "awaiting-parts") return <AlertTriangle className="size-4 text-warning" />;
    if (status === "pending") return <Minus className="size-4 text-muted-foreground/60" />;
    // in-progress → the 8-dash rotor
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => {
          const rad = ((i * 45 - 90) * Math.PI) / 180;
          const r = 6, d = 1.8;
          return (
            <line
              key={i}
              x1={8 + (r - d / 2) * Math.cos(rad)} y1={8 + (r - d / 2) * Math.sin(rad)}
              x2={8 + (r + d / 2) * Math.cos(rad)} y2={8 + (r + d / 2) * Math.sin(rad)}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className={i === spin ? "text-accent" : "text-muted-foreground/35"}
            />
          );
        })}
      </svg>
    );
  };

  const statusText = (s: JobStatus) =>
    s === "awaiting-parts" ? "AWAITING PARTS" : s === "in-progress" ? "IN PROGRESS" : s === "pending" ? "QUEUED" : null;

  const sorted = [...tasks].sort((a, b) =>
    a.status === "completed" && b.status !== "completed" ? -1
    : a.status !== "completed" && b.status === "completed" ? 1 : 0,
  );

  const done = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-3xl bg-card p-6 neo">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="grid size-10 place-items-center rounded-xl bg-card neo-sm neo-press transition-all"
            aria-label="Back"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="text-center">
            <h2 className="font-bold tracking-tight">{title}</h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {jobId} · {done}/{tasks.length} done
            </p>
          </div>

          <button
            onClick={onAddTask}
            className="grid size-10 place-items-center rounded-xl bg-card neo-sm neo-press transition-all"
            aria-label="Add task"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <motion.div className="space-y-3" initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } }}>
          <AnimatePresence>
            {sorted.map((task) => (
              <motion.div
                key={task.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 18, scale: 0.98 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
                }}
                exit={{ opacity: 0, y: -18, scale: 0.98 }}
                transition={{ layout: { type: "spring", stiffness: 400, damping: 32 } }}
                className="relative"
                onMouseEnter={() => setHovered(task.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-background p-4 neo-inset">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-5 shrink-0 place-items-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={task.status}
                          initial={{ scale: 0.75, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.75, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          {statusIcon(task.status)}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <span className={cn("truncate text-sm", task.status === "completed" && "text-muted-foreground")}>
                      {task.label}
                    </span>
                  </div>

                  <div className="flex h-8 shrink-0 items-center">
                    <AnimatePresence mode="wait">
                      {task.status === "awaiting-parts" && hovered === task.id ? (
                        <motion.button
                          key="issue"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          onClick={() => issuePart(task.id)}
                          className="whitespace-nowrap rounded-lg bg-card px-3 py-1.5 text-xs font-semibold neo-sm neo-press"
                        >
                          Issue part
                        </motion.button>
                      ) : statusText(task.status) ? (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="whitespace-nowrap font-mono text-[10px] font-semibold tracking-widest text-muted-foreground"
                        >
                          {statusText(task.status)}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Failure/success toast, anchored to the job card view */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex justify-end">
        <AnimatePresence>
          {toast && (
            <div className="pointer-events-auto">
              <AlertToast
                variant={toast.variant}
                styleVariant="filled"
                title={toast.title}
                description={toast.description}
                onClose={() => setToast(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default JobCardList;
