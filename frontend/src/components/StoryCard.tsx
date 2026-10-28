import { StoryImage } from "@/components/StoryImage";
import { CategoryTag, StoryLink, StoryMeta } from "@/components/StoryBits";
import { HighlightedText } from "@/components/HighlightedText";
import { cn } from "@/lib/utils";
import type { Story } from "@/types/story";

export function StoryCard({
  story,
  size = "md",
  className,
}: {
  story: Story;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <article className={cn("group relative flex h-full min-w-0 flex-col", className)}>
      <StoryImage
        src={story.imageUrl}
        alt={story.title}
        ratio={size === "lg" ? "16/9" : "16/10"}
        badge={story.isBreaking ? "Breaking" : undefined}
      />
      <div className="mt-3.5 flex flex-1 flex-col">
        <CategoryTag
          slug={story.category}
          breaking={story.isBreaking}
          className="text-muted-foreground"
        />
        <h3
          className={cn(
            "headline mt-2 line-clamp-3",
            size === "lg"
              ? "text-[1.375rem] sm:text-[1.625rem]"
              : size === "sm"
                ? "text-[1.0625rem] leading-[1.25]"
                : "text-[1.0625rem] lg:text-[1.1875rem] leading-[1.22]",
          )}
        >
          <StoryLink story={story}>
            <span className="link-underline">
              <HighlightedText text={story.title} />
            </span>
          </StoryLink>
        </h3>
        {size === "lg" && (
          <p className="mt-2 line-clamp-2 text-[0.9375rem] text-muted-foreground">
            {story.summary}
          </p>
        )}
        <div className="mt-auto pt-2.5">
          <StoryMeta story={story} className="min-w-0" />
        </div>
      </div>
    </article>
  );
}
