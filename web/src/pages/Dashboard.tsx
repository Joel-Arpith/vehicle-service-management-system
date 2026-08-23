import { useEffect, useState } from "react";
import ReportsBento from "@/components/ui/reports-bento";
import { SkeletonCard } from "@/components/ui/skeleton";
import { STATS } from "@/lib/mock-data";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  // Stands in for the initial /api/reports fetch so the skeleton is real.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Service centre overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live figures across bays, mechanics, parts and billing.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-5 neo">
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <ReportsBento />
      )}
    </div>
  );
}
