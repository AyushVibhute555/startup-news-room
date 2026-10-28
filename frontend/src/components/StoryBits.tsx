import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { categoryName, timeAgo } from "@/lib/format";
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
  return (
    <span
      className={cn(
        "font-label inline-flex items-center gap-2 text-[0.8125rem] leading-none font-semibold",
        className,
      )}
    >
      {breaking && <span className="text-signal">Breaking</span>}
      {breaking && <span aria-hidden className="h-3 w-px bg-border" />}
      <span>{categoryName(slug)}</span>
    </span>
  );
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
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 text-[0.8125rem] leading-5 text-muted-foreground",
        className,
      )}
    >
      <span className="font-medium text-foreground">{story.sourceName}</span>
      <time dateTime={story.publishedAt} suppressHydrationWarning>
        {timeAgo(story.publishedAt)}
      </time>
      {readTime && <span>{story.readTime} min read</span>}
    </p>
  );
}

export function SourceLink({ story, className }: { story: Story; className?: string }) {
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
      Source <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">: {story.sourceName} (opens in new tab)</span>
    </a>
  );
}

/** Stretched link: the whole card becomes clickable without nesting anchors. */
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
