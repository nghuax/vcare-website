import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-tight",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/12 text-primary",
        neutral: "border-border bg-muted text-foreground/70",
        success: "border-[#b8ebd4] bg-[#eaf8f1] text-[#1c7a4d]",
        warning: "border-[#f6d8ad] bg-[#fff3e4] text-[#9b6500]",
        danger: "border-[#f6c2cb] bg-[#ffedf1] text-[#b1224e]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
