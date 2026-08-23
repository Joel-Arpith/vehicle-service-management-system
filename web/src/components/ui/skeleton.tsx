import { cn } from "@/lib/utils";

/** Left-to-right sweeping skeleton — the loading state for every async panel. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("relative overflow-hidden rounded-xl bg-background neo-inset", className)}>
    <div className="absolute inset-0 shimmer" />
  </div>;
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-card p-6 neo">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="mt-3 h-3 w-2/3" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
