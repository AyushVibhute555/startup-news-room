import { Link } from "react-router-dom";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { StoryImage } from "@/components/StoryImage";
import { StoryLink, StoryMeta, CategoryTag } from "@/components/StoryBits";
import { StoryCard } from "@/components/StoryCard";
import { btnSecondary } from "@/components/Buttons";
import type { Story } from "@/types/story";

/**
 * Bento mosaic layout for the Latest Headlines section.
 *
 * Desktop repeating 6-column pattern for 9 stories:
 * 1. Large image tile (4 cols x 2 rows)
 * 2-3. Two small stacked tiles (2 cols each)
 * 4. Solid INK text-only tile (2 cols)
 * 5. Wide horizontal tile (4 cols, image left 40%)
 * 6. Solid SURFACE-ALT text-only tile (2 cols)
 *
 * Uses the red block once for the newest breaking story.
 * Mobile: single column with StoryCard, solid-color text tile every 4th.
 */
export function BentoMosaic({ stories }: { stories: Story[] }) {
  const items = stories.slice(0, 9);
  const breakingIdx = items.findIndex((s) => s.isBreaking);

  return (
    <>
      {/* Desktop: bento grid */}
      <RevealGroup className="bento-mosaic hidden lg:grid">
        {items.map((s, i) => {
          const tileType = getTileType(i);
          const isRedTile = breakingIdx === i && tileType === "ink-text";

          if (tileType === "large") {
            return (
              <RevealItem key={s._id} className="bento-tile bento-tile--large group relative">
                <div className="bento-tile__image-wrap" style={{ flex: 1 }}>
                  <StoryImage src={s.imageUrl} alt={s.title} ratio="16/10" />
                </div>
                <div className="bento-tile__body">
                  <CategoryTag
                    slug={s.category}
                    breaking={s.isBreaking}
                    className="text-muted-foreground"
                  />
                  <h3 className="headline mt-2 text-[1.5rem] lg:text-[1.875rem]">
                    <StoryLink story={s}>
                      <span className="link-underline">{s.title}</span>
                    </StoryLink>
                  </h3>
                  <StoryMeta story={s} className="mt-2" />
                </div>
              </RevealItem>
            );
          }

          if (tileType === "small") {
            return (
              <RevealItem key={s._id} className="bento-tile bento-tile--small group relative">
                <div className="bento-tile__image-wrap">
                  <StoryImage src={s.imageUrl} alt={s.title} ratio="3/2" />
                </div>
                <div className="bento-tile__body">
                  <CategoryTag
                    slug={s.category}
                    breaking={s.isBreaking}
                    className="text-muted-foreground"
                  />
                  <h3 className="headline mt-1.5 text-[1.0625rem]">
                    <StoryLink story={s}>
                      <span className="link-underline">{s.title}</span>
                    </StoryLink>
                  </h3>
                  <StoryMeta story={s} className="mt-1.5" />
                </div>
              </RevealItem>
            );
          }

          if (tileType === "ink-text") {
            const cls = isRedTile
              ? "bento-tile bento-tile--solid-signal bento-tile--ink-text"
              : "bento-tile bento-tile--solid-ink bento-tile--ink-text";
            return (
              <RevealItem key={s._id} className={`${cls} group relative`}>
                <CategoryTag slug={s.category} breaking={s.isBreaking} className="opacity-70" />
                <h3 className="headline mt-auto text-[1.25rem]">
                  <StoryLink story={s}>
                    <span className="link-underline">{s.title}</span>
                  </StoryLink>
                </h3>
                <StoryMeta story={s} className="mt-2 opacity-70" />
              </RevealItem>
            );
          }

          if (tileType === "wide") {
            return (
              <RevealItem
                key={s._id}
                className="bento-tile bento-tile--wide bento-tile--horizontal group relative"
              >
                <div className="bento-tile__image-wrap">
                  <StoryImage src={s.imageUrl} alt={s.title} ratio="16/10" />
                </div>
                <div className="bento-tile__body">
                  <CategoryTag
                    slug={s.category}
                    breaking={s.isBreaking}
                    className="text-muted-foreground"
                  />
                  <h3 className="headline mt-1.5 text-[1.125rem]">
                    <StoryLink story={s}>
                      <span className="link-underline">{s.title}</span>
                    </StoryLink>
                  </h3>
                  <StoryMeta story={s} className="mt-1.5" />
                </div>
              </RevealItem>
            );
          }

          // alt-text
          return (
            <RevealItem
              key={s._id}
              className="bento-tile bento-tile--solid-alt bento-tile--alt-text group relative"
            >
              <CategoryTag
                slug={s.category}
                breaking={s.isBreaking}
                className="text-muted-foreground"
              />
              <h3 className="headline mt-auto text-[1.25rem]">
                <StoryLink story={s}>
                  <span className="link-underline">{s.title}</span>
                </StoryLink>
              </h3>
              <StoryMeta story={s} className="mt-2" />
            </RevealItem>
          );
        })}
      </RevealGroup>

      {/* Mobile: single column with solid-color text tile every 4th */}
      <RevealGroup className="flex flex-col gap-10 lg:hidden">
        {items.map((s, i) => {
          if ((i + 1) % 4 === 0) {
            // Solid-color text tile
            const isBreakingTile = s.isBreaking;
            return (
              <RevealItem
                key={s._id}
                className={`group relative p-6 ${isBreakingTile ? "bg-signal text-signal-foreground" : i % 8 === 3 ? "bg-foreground text-background" : "bg-surface-alt"}`}
              >
                <CategoryTag slug={s.category} breaking={s.isBreaking} className="opacity-70" />
                <h3 className="headline mt-3 text-[1.25rem]">
                  <StoryLink story={s}>
                    <span className="link-underline">{s.title}</span>
                  </StoryLink>
                </h3>
                <StoryMeta story={s} className="mt-2 opacity-70" />
              </RevealItem>
            );
          }
          return (
            <RevealItem key={s._id} className="h-full">
              <StoryCard story={s} />
            </RevealItem>
          );
        })}
      </RevealGroup>

      <div className="mt-10 text-center">
        <Link to="/archive" className={btnSecondary()}>
          View all headlines <span aria-hidden>→</span>
        </Link>
      </div>
    </>
  );
}

function getTileType(index: number): "large" | "small" | "ink-text" | "wide" | "alt-text" {
  // Repeating pattern for 6-item cycles
  const pos = index % 6;
  switch (pos) {
    case 0:
      return "large";
    case 1:
    case 2:
      return "small";
    case 3:
      return "ink-text";
    case 4:
      return "wide";
    case 5:
      return "alt-text";
    default:
      return "small";
  }
}
