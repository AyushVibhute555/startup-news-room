import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Story } from "@/types/story";

export function CategoryTag({
  slug,
  breaking,
  className,
}: {
  slug: string;
  breaking?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "font-label inline-flex items-center gap-2 text-[0.8125rem] leading-none font-semibold",
        className,
      )}
    >
      {breaking && <span className="text-signal">{t("breaking")}</span>}
      {breaking && <span aria-hidden className="h-3 w-px bg-border" />}
      <span>{t(`categories.${slug}`)}</span>
    </span>
  );
}

function useTimeAgo(iso: string): string {
  const { t, i18n } = useTranslation();
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("time.justNow");
  if (m < 60) return t("time.minutesAgo", { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("time.hoursAgo", { count: h });
  const d = Math.floor(h / 24);
  if (d === 1) return t("time.yesterday");
  if (d < 7) return t("time.daysAgo", { count: d });
  return new Date(iso).toLocaleDateString(i18n.language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function StoryMeta({
  story,
  readTime,
  className,
}: {
  story: Story;
  readTime?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const timeLabel = useTimeAgo(story.publishedAt);
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 text-[0.8125rem] leading-5 text-muted-foreground",
        className,
      )}
    >
      <span className="font-medium text-foreground">{story.sourceName}</span>
      <time dateTime={story.publishedAt} suppressHydrationWarning>
        {timeLabel}
      </time>
      {readTime && <span>{t("story.minRead", { count: story.readTime })}</span>}
    </p>
  );
}

export function SourceLink({ story, className }: { story: Story; className?: string }) {
  const { t } = useTranslation();
  return (
    <a
      href={story.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "relative z-10 inline-flex min-h-[44px] items-center gap-1 text-[0.8125rem] font-medium text-muted-foreground transition-colors duration-200 hover:text-signal",
        className,
      )}
    >
      {t("story.source")} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">
        : {story.sourceName} {t("story.opensInNewTab")}
      </span>
    </a>
  );
}

export function StoryLink({
  story,
  children,
  className,
}: {
  story: Story;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={`/news/${story.slug}`}
      className={cn(
        "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 border-t border-foreground pt-3">
      <h2 className="font-label text-xl leading-none sm:text-2xl">{children}</h2>
      {action}
    </div>
  );
}