import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  action?: ReactNode;
  id?: string;
  className?: string;
}

export function SectionHeader({
  title,
  actionLabel,
  actionHref,
  action,
  id,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-6 flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-2.5">
        <span className="h-[18px] w-1 shrink-0 rounded-[1px] bg-signal" aria-hidden />
        <h2
          id={id}
          className="headline text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-foreground"
        >
          {title}
        </h2>
      </div>
      {action ? (
        action
      ) : actionHref && actionLabel ? (
        <Link
          to={actionHref}
          className="text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-signal"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
