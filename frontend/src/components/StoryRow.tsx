import { StoryImage } from "@/components/StoryImage";
import { CategoryTag, StoryLink, StoryMeta } from "@/components/StoryBits";
import { HighlightedText } from "@/components/HighlightedText";
import { cn } from "@/lib/utils";
import type { Story } from "@/types/story";

interface StoryRowProps {
  story: Story;
  className?: string;
  hasBorder?: boolean;
}

export function StoryRow({ story, className, hasBorder = true }: StoryRowProps) {
  return (
    <article
      className={cn(
        "group relative flex items-start gap-4 py-3.5",
        hasBorder && "border-b border-border last:border-b-0",
        className,
      )}
    >
      <div className="w-[132px] sm:w-[148px] shrink-0">
        <StoryImage
          src={story.imageUrl}
          alt={story.title}
          ratio="4/3"
          badge={story.isBreaking ? "Breaking" : undefined}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <CategoryTag
          slug={story.category}
          breaking={story.isBreaking}
          className="text-muted-foreground"
        />
        <h3 className="headline mt-1.5 text-[0.9375rem] sm:text-[1rem] leading-[1.3] font-[650] line-clamp-3">
          <StoryLink story={story}>
            <span className="link-underline">
              <HighlightedText text={story.title} />
            </span>
          </StoryLink>
        </h3>
        <div className="mt-2">
          <StoryMeta story={story} className="min-w-0" />
        </div>
      </div>
    </article>
  );
}
