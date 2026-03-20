import * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground shadow-[0_1px_1px_rgba(24,24,24,0.03)] transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
