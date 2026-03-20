import { cn } from "@/lib/utils";

type LoadingStateProps = {
  title?: string;
  className?: string;
};

export function LoadingState({ title = "Loading VCare workspace...", className }: LoadingStateProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <div className="mt-4 space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
