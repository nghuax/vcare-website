import Link from "next/link";
import { FileSearch } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-dashed border-border bg-card p-10 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <FileSearch className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      {action ? (
        <Link href={action.href} className="mt-5 inline-flex">
          <Button size="lg">{action.label}</Button>
        </Link>
      ) : null}
    </div>
  );
}
