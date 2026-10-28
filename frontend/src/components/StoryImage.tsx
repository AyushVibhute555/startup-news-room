import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/utils";

export type ImageRatio = "16/9" | "16/10" | "3/2" | "4/3" | "1/1";

interface Props {
  src: string;
  alt: string;
  ratio?: ImageRatio;
  eager?: boolean;
  priority?: boolean;
  badge?: "Breaking" | "Live" | "Exclusive";
  className?: string;
  /** Adds hover zoom 1.03 when inside a .group */
  zoom?: boolean;
}

export function StoryImage({
  src,
  alt,
  ratio = "16/10",
  eager,
  priority,
  badge,
  className,
  zoom = true,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const h =
    ratio === "16/9"
      ? 675
      : ratio === "3/2"
        ? 800
        : ratio === "4/3"
          ? 900
          : ratio === "1/1"
            ? 1200
            : 750;

  const isPriority = priority ?? eager ?? false;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[6px] bg-logo-grey ring-1 ring-black/5 dark:ring-white/10",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      {badge && (
        <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center rounded-[3px] bg-signal px-2 py-1 text-[12px] font-semibold leading-none text-signal-foreground">
          {badge}
        </span>
      )}

      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center bg-logo-grey">
          <LogoMark size={56} />
        </div>
      ) : (
        <>
          {/* Skeleton shimmer placeholder before image is loaded */}
          {!loaded && <div className="skeleton absolute inset-0" aria-hidden />}
          <img
            src={src}
            alt={alt}
            width={1200}
            height={h}
            loading={isPriority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
              zoom && "transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]",
            )}
          />
        </>
      )}
    </div>
  );
}
