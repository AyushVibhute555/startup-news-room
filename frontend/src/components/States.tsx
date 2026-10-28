import { cn } from "@/lib/utils";
import { btnSecondary } from "@/components/Buttons";
import { LogoMark } from "@/components/Logo";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function CardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col">
      <Skeleton className="aspect-[16/10] w-full rounded-[6px]" />
      <Skeleton className="mt-3.5 h-3 w-16" />
      <Skeleton className="mt-2.5 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-5/6" />
      <Skeleton className="mt-1.5 h-4 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/3" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div
      aria-hidden
      className="flex items-start gap-4 py-3.5 border-b border-border last:border-b-0"
    >
      <Skeleton className="aspect-[4/3] w-[132px] sm:w-[148px] shrink-0 rounded-[6px]" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-3.5 w-full" />
        <Skeleton className="mt-1.5 h-3.5 w-4/5" />
        <Skeleton className="mt-3 h-3 w-1/3" />
      </div>
    </div>
  );
}

export function LeadSkeleton() {
  return (
    <div aria-hidden className="flex flex-col">
      <Skeleton className="aspect-[16/9] w-full rounded-[6px]" />
      <Skeleton className="mt-4 h-3.5 w-20" />
      <Skeleton className="mt-3 h-8 w-full sm:h-10" />
      <Skeleton className="mt-2 h-8 w-4/5 sm:h-10" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-4 h-3.5 w-40" />
    </div>
  );
}

export function CarouselSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading top news" className="flex gap-6 overflow-hidden py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[232px] shrink-0 sm:w-[264px] xl:w-[286px]" aria-hidden>
          <Skeleton className="aspect-[16/10] w-full rounded-[6px]" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-1.5 h-4 w-4/5" />
          <Skeleton className="mt-1.5 h-4 w-2/3" />
          <Skeleton className="mt-3 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 3 | 4 }) {
  return (
    <div
      role="status"
      aria-label="Loading stories"
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2",
        columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="py-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-3 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center border border-border px-6 py-16 text-center">
      <LogoMark size={48} />
      <h2 className="headline mt-6 text-2xl">{title}</h2>
      {body && <p className="mt-2 max-w-md text-muted-foreground">{body}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      title="We couldn't load these stories"
      body="Something went wrong on our side. Please try again."
    >
      {onRetry && (
        <button onClick={onRetry} className={btnSecondary()}>
          Try again
        </button>
      )}
    </EmptyState>
  );
}
