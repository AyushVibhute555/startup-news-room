import { RevealGroup, RevealItem } from "@/components/Reveal";
import { StoryLink } from "@/components/StoryBits";
import { formatClock, categoryName } from "@/lib/format";
import type { Story } from "@/types/story";

interface GroupedStories {
  label: string;
  stories: Story[];
}

function groupByTime(stories: Story[]): GroupedStories[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  const justNow: Story[] = [];
  const earlier: Story[] = [];
  const yesterday: Story[] = [];

  for (const s of stories) {
    const t = new Date(s.publishedAt).getTime();
    const diffMin = (now.getTime() - t) / 60000;
    if (diffMin < 60) {
      justNow.push(s);
    } else if (t >= todayStart) {
      earlier.push(s);
    } else if (t >= yesterdayStart) {
      yesterday.push(s);
    } else {
      yesterday.push(s); // Older stories go to yesterday bucket
    }
  }

  const groups: GroupedStories[] = [];
  if (justNow.length) groups.push({ label: "Just now", stories: justNow });
  if (earlier.length) groups.push({ label: "Earlier today", stories: earlier });
  if (yesterday.length) groups.push({ label: "Yesterday", stories: yesterday });
  return groups;
}

export function BriefingTimeline({ stories }: { stories: Story[] }) {
  const groups = groupByTime(stories);

  return (
    <RevealGroup className="briefing-timeline" as="div">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="briefing-timeline__group-label">{g.label}</div>
          {g.stories.map((s) => (
            <RevealItem key={s._id} as="div">
              <div className="briefing-row group relative">
                <time
                  dateTime={s.publishedAt}
                  className="briefing-row__time"
                  suppressHydrationWarning
                >
                  {formatClock(s.publishedAt)}
                </time>
                <span className="briefing-row__headline">
                  <StoryLink story={s} className="text-[0.9375rem] font-medium leading-snug">
                    <span className="link-underline">{s.title}</span>
                  </StoryLink>
                </span>
                <div className="briefing-row__meta-mobile">
                  <span className="briefing-row__category">{categoryName(s.category)}</span>
                  <span className="briefing-row__source">{s.sourceName}</span>
                </div>
                <img
                  src={s.imageUrl}
                  alt=""
                  className="briefing-row__thumb"
                  loading="lazy"
                  aria-hidden
                />
              </div>
            </RevealItem>
          ))}
        </div>
      ))}
    </RevealGroup>
  );
}
