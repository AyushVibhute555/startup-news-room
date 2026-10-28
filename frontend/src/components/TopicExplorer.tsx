import { useCallback, useRef, useState } from "react";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { StoryImage } from "@/components/StoryImage";
import { StoryLink, StoryMeta, CategoryTag } from "@/components/StoryBits";
import { CardSkeleton } from "@/components/States";
import { getStories } from "@/lib/api";
import { categories } from "@/data/categories";
import type { Story } from "@/types/story";
import type { CategorySlug } from "@/types/story";

interface CachedTopic {
  stories: Story[];
  total: number;
}

export function TopicExplorer() {
  const [active, setActive] = useState<CategorySlug>(categories[0]!.slug);
  const [cache, setCache] = useState<Record<string, CachedTopic>>({});
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<Set<string>>(new Set());

  const fetchTopic = useCallback(async (slug: CategorySlug) => {
    if (fetchedRef.current.has(slug)) return;
    fetchedRef.current.add(slug);
    setLoading(true);
    try {
      const data = await getStories({ category: slug, limit: 3 });
      setCache((prev) => ({ ...prev, [slug]: { stories: data.items, total: data.total } }));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = useCallback(
    (slug: CategorySlug) => {
      setActive(slug);
      fetchTopic(slug);
    },
    [fetchTopic],
  );

  // Fetch initial topic
  if (!fetchedRef.current.has(active)) {
    fetchTopic(active);
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = categories.findIndex((c) => c.slug === active);
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = categories[(idx + 1) % categories.length]!;
        handleSelect(next.slug);
        // Focus the next button
        const btn = document.getElementById(`topic-tab-${next.slug}`);
        btn?.focus();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = categories[(idx - 1 + categories.length) % categories.length]!;
        handleSelect(prev.slug);
        const btn = document.getElementById(`topic-tab-${prev.slug}`);
        btn?.focus();
      }
    },
    [active, handleSelect],
  );

  const current = cache[active];
  const isLoading = loading && !current;

  return (
    <div className="topic-explorer">
      <div
        className="topic-explorer__tabs"
        role="tablist"
        aria-label="Topics"
        onKeyDown={handleKeyDown}
      >
        {categories.map((c) => {
          const topicData = cache[c.slug];
          return (
            <button
              key={c.slug}
              id={`topic-tab-${c.slug}`}
              role="tab"
              aria-selected={active === c.slug}
              aria-controls="topic-panel"
              tabIndex={active === c.slug ? 0 : -1}
              className="topic-explorer__chip"
              onClick={() => handleSelect(c.slug)}
              onFocus={() => fetchTopic(c.slug)}
              onMouseEnter={() => fetchTopic(c.slug)}
            >
              {c.name}
              {topicData && <span className="topic-explorer__chip-count">{topicData.total}</span>}
            </button>
          );
        })}
      </div>

      <div
        id="topic-panel"
        role="tabpanel"
        aria-labelledby={`topic-tab-${active}`}
        className="topic-explorer__content"
      >
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : current ? (
          <TopicStories stories={current.stories} />
        ) : null}
      </div>
    </div>
  );
}

function TopicStories({ stories }: { stories: Story[] }) {
  const [lead, ...rest] = stories;
  if (!lead) return null;

  return (
    <Reveal>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <article className="group relative sm:col-span-2">
          <StoryImage src={lead.imageUrl} alt={lead.title} ratio="16/9" />
          <div className="mt-4">
            <CategoryTag
              slug={lead.category}
              breaking={lead.isBreaking}
              className="text-muted-foreground"
            />
            <h3 className="headline mt-2 text-[1.375rem] lg:text-[1.75rem]">
              <StoryLink story={lead}>
                <span className="link-underline">{lead.title}</span>
              </StoryLink>
            </h3>
            <p className="mt-2 line-clamp-2 text-[0.9375rem] text-muted-foreground">
              {lead.summary}
            </p>
            <StoryMeta story={lead} className="mt-2" />
          </div>
        </article>
        {rest.map((s) => (
          <article key={s._id} className="group relative">
            <StoryImage src={s.imageUrl} alt={s.title} ratio="3/2" />
            <div className="mt-3">
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
          </article>
        ))}
      </div>
    </Reveal>
  );
}
