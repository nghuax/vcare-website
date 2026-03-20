import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border bg-muted px-4 py-2 text-sm text-foreground shadow-[0_1px_1px_rgba(24,24,24,0.03)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
