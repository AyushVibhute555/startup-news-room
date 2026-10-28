import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BreakingBar } from "@/components/BreakingBar";
import { CategoryBlock } from "@/components/CategoryBlock";
import { Container } from "@/components/Container";
import { HighlightedText } from "@/components/HighlightedText";
import { Newsletter } from "@/components/Newsletter";
import { SectionHeader } from "@/components/SectionHeader";
import {
  CardSkeleton,
  CarouselSkeleton,
  ErrorState,
  GridSkeleton,
  LeadSkeleton,
  RowSkeleton,
} from "@/components/States";
import { CategoryTag, SourceLink, StoryLink, StoryMeta } from "@/components/StoryBits";
import { StoryCard } from "@/components/StoryCard";
import { StoryImage } from "@/components/StoryImage";
import { StoryRow } from "@/components/StoryRow";
import { TopNewsCarousel } from "@/components/TopNewsCarousel";
import { categories } from "@/data/categories";
import { getBreakingStories, getFeaturedStory, getStories, getTopStories } from "@/lib/api";
import { formatTimeShort } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { Story } from "@/types/story";

/* ── Lead Story (staggered entrance animation on first load) ──────── */

function LeadStory({ story }: { story: Story }) {
  const step = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <article className="group relative flex flex-col">
      <motion.div {...step(0)}>
        <StoryImage
          src={story.imageUrl}
          alt={story.title}
          ratio="16/9"
          priority
          badge={story.isBreaking ? "Breaking" : undefined}
        />
      </motion.div>

      <motion.div {...step(1)} className="mt-4">
        <CategoryTag
          slug={story.category}
          breaking={story.isBreaking}
          className="text-muted-foreground"
        />
      </motion.div>

      <motion.div {...step(2)} className="mt-2.5">
        <h2 className="headline text-[clamp(1.75rem,3.2vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.02em] text-foreground">
          <StoryLink story={story}>
            <span className="link-underline">
              <HighlightedText text={story.title} />
            </span>
          </StoryLink>
        </h2>
      </motion.div>

      <motion.div {...step(3)} className="mt-3">
        <p className="line-clamp-2 max-w-[60ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
          <HighlightedText text={story.summary} />
        </p>
      </motion.div>

      <motion.div
        {...step(4)}
        className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
      >
        <StoryMeta story={story} readTime />
        <SourceLink story={story} />
      </motion.div>
    </article>
  );
}

/* ── Trending List (5 rows with large red numerals) ──────────────── */

function TrendingList({ stories }: { stories: Story[] }) {
  // TODO: swap in a real views metric when backend is connected
  return (
    <section aria-label="Trending stories">
      <SectionHeader title="Trending" />
      <ol className="divide-y divide-border">
        {stories.map((story, idx) => (
          <li key={story._id} className="group relative flex items-center gap-4 py-3.5">
            <span
              className="w-8 shrink-0 text-[2rem] font-bold leading-none tabular-nums text-signal"
              aria-hidden
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="headline line-clamp-2 text-[0.9375rem] font-[650] leading-[1.3] text-foreground">
                <StoryLink story={story}>
                  <span className="link-underline">
                    <HighlightedText text={story.title} />
                  </span>
                </StoryLink>
              </h3>
              <div className="mt-1.5">
                <StoryMeta story={story} />
              </div>
            </div>
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[6px]">
              <StoryImage src={story.imageUrl} alt={story.title} ratio="1/1" />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ── Latest Updates Feed (6 rows with red time labels) ───────────── */

function LatestUpdatesFeed({ stories }: { stories: Story[] }) {
  return (
    <section aria-label="Latest updates">
      <SectionHeader title="Latest updates" actionLabel="View all" actionHref="/archive" />
      <ul className="divide-y divide-border">
        {stories.map((story) => (
          <li key={story._id} className="group relative flex items-baseline gap-3 py-3.5">
            <span className="w-16 shrink-0 text-[0.8125rem] font-semibold tabular-nums text-signal">
              {formatTimeShort(story.publishedAt)}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="headline line-clamp-2 text-[0.9375rem] font-normal leading-[1.35] text-foreground">
                <StoryLink story={story}>
                  <span className="link-underline">
                    <HighlightedText text={story.title} />
                  </span>
                </StoryLink>
              </h3>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Main Home Page Component ────────────────────────────────────── */

export function HomePage() {
  const breaking = useApi(getBreakingStories, []);
  const featured = useApi(getFeaturedStory, []);
  const top = useApi(getTopStories, []);
  const latest = useApi(() => getStories({ limit: 40 }), []);

  // Build ONE ordered, deduplicated pool [featured, ...top, ...latest]
  const { pool, updates } = useMemo(() => {
    const allLatest = latest.data?.items ?? [];
    const map = new Map<string, Story>();

    if (featured.data) {
      map.set(featured.data._id, featured.data);
    }
    if (top.data) {
      top.data.forEach((s) => {
        if (!map.has(s._id)) map.set(s._id, s);
      });
    }
    allLatest.forEach((s) => {
      if (!map.has(s._id)) map.set(s._id, s);
    });

    const fullPool = Array.from(map.values());
    const sortedUpdates = [...allLatest]
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
      .slice(0, 6);

    return {
      pool: fullPool,
      updates: sortedUpdates,
    };
  }, [featured.data, top.data, latest.data]);

  // Pool allocations: lead 1, top-stories rows 4, carousel 12, latest grid 12, trending 5
  const leadStory = pool[0];
  const topStoriesRows = pool.slice(1, 5);
  const carouselStories = pool.slice(5, 17);
  const latestGridStories = pool.slice(17, 29);
  const trendingStories = pool.slice(29, 34);

  // First 4 categories for topic blocks
  const topicCategories = categories.slice(0, 4);

  return (
    <>
      <h1 className="sr-only">Startup News Room: today's startup news</h1>

      {/* 1. Breaking Bar (renders only when breaking stories exist) */}
      <BreakingBar stories={breaking.data} />

      {/* 2. Top News Carousel (directly under header / breaking bar) */}
      <TopNewsCarousel stories={carouselStories.length > 0 ? carouselStories : undefined} />

      <Container>
        {latest.error ? (
          <div className="py-16">
            <ErrorState onRetry={latest.retry} />
          </div>
        ) : latest.loading && pool.length === 0 ? (
          /* Skeletons on initial data load */
          <div className="py-8 space-y-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <LeadSkeleton />
              </div>
              <div className="space-y-4 lg:col-span-4">
                <SectionHeader title="Top stories" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <RowSkeleton key={i} />
                ))}
              </div>
            </div>
            <GridSkeleton count={8} columns={4} />
          </div>
        ) : (
          <>
            {/* 3. Front Page: Lead story (cols 1-8) + Top stories stack (cols 9-12) */}
            <section
              aria-label="Front page"
              style={{ paddingTop: "clamp(24px, 3vw, 40px)" }}
              className="border-b border-border pb-12"
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8">
                {leadStory && (
                  <div className="lg:col-span-8">
                    <LeadStory story={leadStory} />
                  </div>
                )}
                <div className="flex flex-col lg:col-span-4">
                  <SectionHeader title="Top stories" />
                  <div className="flex flex-col">
                    {topStoriesRows.map((s) => (
                      <StoryRow key={s._id} story={s} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Latest News Grid (12 uniform StoryCards) */}
            <section
              aria-label="Latest news"
              style={{ paddingTop: "var(--section-gap)" }}
              className="border-b border-border pb-12"
            >
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex items-center gap-3">
                  <SectionHeader title="Latest news" className="mb-0" />
                  <span className="text-xs text-muted-foreground">Updated 4 min ago</span>
                </div>
                <Link
                  to="/archive"
                  className="text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-signal"
                >
                  View all headlines
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {latestGridStories.map((s) => (
                  <StoryCard key={s._id} story={s} />
                ))}
              </div>
            </section>

            {/* 5. Trending + Latest Updates (two columns on lg, hairline between) */}
            <section
              aria-label="Trending and updates"
              style={{ paddingTop: "var(--section-gap)" }}
              className="border-b border-border pb-12"
            >
              <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-2 lg:gap-x-16">
                <div>
                  <TrendingList stories={trendingStories} />
                </div>
                <div className="lg:border-l lg:border-border lg:pl-16">
                  <LatestUpdatesFeed stories={updates} />
                </div>
              </div>
            </section>

            {/* 6. Topic Blocks (first 4 categories, alternating Layout A and Layout B) */}
            <div className="space-y-6">
              {topicCategories.map((cat, idx) => (
                <CategoryBlock key={cat.slug} category={cat} layout={idx % 2 === 0 ? "A" : "B"} />
              ))}
            </div>
          </>
        )}
      </Container>

      {/* 7. Newsletter (full-bleed inverse band) */}
      <Newsletter />
    </>
  );
}
