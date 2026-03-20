import type { ReactNode } from "react";

type SectionIntroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function SectionIntro({ eyebrow, title, description, actions }: SectionIntroProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base text-muted-foreground">{description}</p>
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
