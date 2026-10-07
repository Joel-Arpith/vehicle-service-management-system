import { useState } from "react";
import JobCardList from "@/components/ui/job-card-list";
import { useFetch, toJobCard, toPart, type ApiJobCard, type ApiPart } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function Jobs() {
  const cards = useFetch<ApiJobCard[]>("/job_cards");
  const stock = useFetch<ApiPart[]>("/spare_parts");
  const [activeId, setActiveId] = useState<string | null>(null);

  const jobs = (cards.data ?? []).map(toJobCard);
  const parts = (stock.data ?? []).map(toPart);
  const active = jobs.find((j) => j.id === activeId) ?? jobs[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Job cards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hover a task awaiting parts to issue one. An out-of-stock part is refused by the server and raises the failure toast.
        </p>
      </header>

      {cards.loading && <p className="text-sm text-muted-foreground">Loading job cards…</p>}
      {cards.error && <p role="alert" className="text-sm text-destructive">{cards.error}</p>}
      {!cards.loading && !cards.error && jobs.length === 0 && (
        <p className="text-sm text-muted-foreground">No job cards yet.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {jobs.map((j) => (
          <button
            key={j.id}
            onClick={() => setActiveId(j.id)}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all neo-press",
              active?.id === j.id ? "bg-accent text-accent-foreground neo" : "bg-card neo-flat hover:neo",
            )}
          >
            <span className="font-mono text-xs">{j.label}</span>
            <span className="ml-2 opacity-75">{j.regNo}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="max-w-2xl">
          <JobCardList
            key={active.id}
            title={active.regNo}
            jobId={active.id}
            jobLabel={active.label}
            tasks={active.tasks}
            parts={parts}
            onChanged={stock.reload}
          />
        </div>
      )}
    </div>
  );
}
