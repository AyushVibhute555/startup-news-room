import { cn } from "@/lib/utils";

const base =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[4px] px-5 text-sm font-semibold transition-colors duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const btnPrimary = (className?: string) =>
  cn(base, "bg-foreground text-background hover:bg-signal hover:text-signal-foreground", className);

export const btnSecondary = (className?: string) =>
  cn(
    base,
    "border border-foreground text-foreground hover:bg-foreground hover:text-background",
    className,
  );
