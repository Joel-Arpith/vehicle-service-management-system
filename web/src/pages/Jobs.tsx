import { useState } from "react";
import JobCardList from "@/components/ui/job-card-list";
import { JOB_CARDS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function Jobs() {
  const [activeId, setActiveId] = useState(JOB_CARDS[0].id);
  const active = JOB_CARDS.find((j) => j.id === activeId)!;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Job cards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hover a task awaiting parts to issue one — an out-of-stock part raises the failure toast.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {JOB_CARDS.map((j) => (
          <button
            key={j.id}
            onClick={() => setActiveId(j.id)}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all neo-press",
              activeId === j.id ? "bg-accent text-accent-foreground neo" : "bg-card neo-flat hover:neo",
            )}
          >
            <span className="font-mono text-xs">{j.id}</span>
            <span className="ml-2 opacity-75">{j.regNo}</span>
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        <JobCardList
          key={active.id}
          title={active.regNo}
          jobId={active.id}
          tasks={active.tasks}
        />
      </div>
    </div>
  );
}
