"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  title: string;
  description: string;
  items: NavItem[];
  className?: string;
};

export function Sidebar({ title, description, items, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <nav className="mb-3 flex gap-2 overflow-x-auto pb-2 md:hidden">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "border-transparent bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground/75",
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      <aside
        className={cn(
          "hidden w-80 shrink-0 rounded-[30px] border border-border bg-card p-5 shadow-[0_24px_45px_-36px_rgba(24,24,24,0.45)] md:block",
          className,
        )}
      >
        <Badge variant="neutral" className="mb-4 w-fit">
          Workspace
        </Badge>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <nav className="mt-5 space-y-2">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-foreground/75 hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
