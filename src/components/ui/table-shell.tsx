import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type TableRow = {
  id: string;
  cells: ReactNode[];
};

type TableShellProps = {
  title: string;
  description?: string;
  columns: string[];
  rows: TableRow[];
  caption?: string;
  className?: string;
};

export function TableShell({
  title,
  description,
  columns,
  rows,
  caption,
  className,
}: TableShellProps) {
  if (!rows.length) {
    return (
      <EmptyState
        className={className}
        title={`${title} is empty`}
        description="No records are available yet. Data table integration will be connected in a later phase."
      />
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-[28px] border border-border bg-card", className)}>
      <div className="border-b border-border/90 px-6 py-4">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/80">
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${index}`} className="px-6 py-4 text-foreground/85">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <p className="border-t border-border/90 px-6 py-3 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
