import type { ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { RandomLogo } from "@/components/brand/random-logo";
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/lib/navigation";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type HeaderAction = {
  label: string;
  href: string;
};

type HeaderProps = {
  items?: NavItem[];
  action?: HeaderAction;
  className?: string;
  rightSlot?: ReactNode;
};

export function Header({ items = [], action, className, rightSlot }: HeaderProps) {
  return (
    <header className={cn("sticky top-0 z-40 p-4 sm:p-5", className)}>
      <div className="mx-auto w-full max-w-[1380px] rounded-[28px] border border-border/90 bg-card/95 p-3 shadow-[0_22px_40px_-28px_rgba(24,24,24,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="mr-2 flex min-w-fit items-center gap-3 rounded-2xl px-3 py-2">
            <RandomLogo size={40} className="h-10 w-10 rounded-2xl shadow-[0_10px_24px_-16px_rgba(0,104,255,0.9)]" />
            <div>
              <p className="text-base font-semibold tracking-tight text-foreground">{siteConfig.name}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">{siteConfig.tagline}</p>
            </div>
          </Link>

          <div className="hidden flex-1 items-center gap-2 rounded-full border border-border bg-muted px-4 py-2.5 lg:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              readOnly
              value=""
              placeholder="Search"
              aria-label="Search"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {items.length ? (
            <nav className="hidden items-center gap-2 xl:flex">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            {rightSlot}
            {action ? (
              <Link href={action.href}>
                <Button size="lg">{action.label}</Button>
              </Link>
            ) : null}
          </div>
        </div>

        {items.length ? (
          <nav className="mt-2 flex w-full gap-2 overflow-x-auto pb-1 xl:hidden">
            {items.map((item) => (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className="whitespace-nowrap rounded-full border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground/80"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
