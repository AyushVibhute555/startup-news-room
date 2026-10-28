import { Reveal } from "@/components/Reveal";
import { StoryLink, StoryMeta } from "@/components/StoryBits";
import type { Story } from "@/types/story";

export function TopStoriesStrip({ stories }: { stories: Story[] }) {
  return (
    <Reveal>
      <ol className="top-strip" aria-label="Top stories">
        {stories.slice(0, 5).map((s, i) => (
          <li key={s._id} className="top-strip__item group relative">
            <span className="top-strip__numeral" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="top-strip__headline">
              <StoryLink story={s}>
                <span className="link-underline">{s.title}</span>
              </StoryLink>
            </h3>
            <StoryMeta story={s} className="mt-2" />
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
