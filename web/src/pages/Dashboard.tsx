import ReportsBento from "@/components/ui/reports-bento";
import { SkeletonCard, Skeleton } from "@/components/ui/skeleton";
import { useReports } from "@/lib/reports";

export default function Dashboard() {
  const { data, error, loading } = useReports();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Service centre overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live figures from the database — mechanics, parts, turnaround and billing.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl bg-card p-6 neo">
          <p className="font-semibold text-destructive">Couldn't load reports</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Check the API is running on port 8000 (<code className="font-mono">uvicorn app.main:app</code>).
          </p>
        </div>
      ) : loading || !data ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[92px]" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { value: data.summary.services_completed, label: "Services completed" },
              { value: data.summary.vehicles_served, label: "Vehicles on file" },
              { value: data.summary.mechanics, label: "Certified mechanics" },
              { value: data.summary.open_jobs, label: "Open job cards" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card p-5 neo">
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {s.value.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <ReportsBento data={data} />
        </>
      )}
    </div>
  );
}
