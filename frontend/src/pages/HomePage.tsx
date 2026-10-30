import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BreakingBar } from "@/components/BreakingBar";
import { CategoryBlock } from "@/components/CategoryBlock";
import { Container } from "@/components/Container";
import { Newsletter } from "@/components/Newsletter";
import { SectionHeader } from "@/components/SectionHeader";
import { TranslatedText } from "@/components/TranslatedText";
import { TranslatedHighlightedText } from "@/components/TranslatedHighlightedText";
import {
  ErrorState,
  GridSkeleton,
  LeadSkeleton,
  RowSkeleton,
} from "@/components/States";
import { SourceLink, StoryLink, StoryMeta } from "@/components/StoryBits";
import { StoryCard } from "@/components/StoryCard";
import { StoryImage } from "@/components/StoryImage";
import { StoryRow } from "@/components/StoryRow";
import { TopNewsCarousel } from "@/components/TopNewsCarousel";
import { categories } from "@/data/categories";
import { getBreakingStories, getFeaturedStory, getStories, getTopStories } from "@/lib/api";
import { formatTimeShort } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { Story } from "@/types/story";

function LeadStory({ story }: { story: Story }) {
  const { t } = useTranslation();
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
          badge={story.isBreaking ? t("breaking") : undefined}
        />
      </motion.div>

      <motion.div {...step(1)} className="mt-4">
        <span className="font-label text-xs uppercase tracking-wide text-muted-foreground">
          {t(`categories.${story.category}`)}
        </span>
      </motion.div>

      <motion.div {...step(2)} className="mt-2.5">
        <h2 className="headline text-[clamp(1.75rem,3.2vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.02em] text-foreground">
          <StoryLink story={story}>
            <span className="link-underline">
              <TranslatedHighlightedText text={story.title} />
            </span>
          </StoryLink>
        </h2>
      </motion.div>

      <motion.div {...step(3)} className="mt-3">
        <p className="line-clamp-2 max-w-[60ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
          <TranslatedText text={story.summary} />
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

function TrendingList({ stories }: { stories: Story[] }) {
  const { t } = useTranslation();
  return (
    <section aria-label={t("home.trending")}>
      <SectionHeader title={t("home.trending")} />
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
                    <TranslatedHighlightedText text={story.title} />
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

function LatestUpdatesFeed({ stories }: { stories: Story[] }) {
  const { t } = useTranslation();
  return (
    <section aria-label={t("home.latestUpdates")}>
      <SectionHeader
        title={t("home.latestUpdates")}
        actionLabel={t("home.viewAll")}
        actionHref="/archive"
      />
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
                    <TranslatedHighlightedText text={story.title} />
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

export function HomePage() {
  const { t } = useTranslation();
  const breaking = useApi(getBreakingStories, []);
  const featured = useApi(getFeaturedStory, []);
  const top = useApi(getTopStories, []);
  const latest = useApi(() => getStories({ limit: 40 }), []);

  const { pool, updates } = useMemo(() => {
    const allLatest = latest.data?.items ?? [];
    const map = new Map<string, Story>();
    if (featured.data) map.set(featured.data._id, featured.data);
    top.data?.forEach((s) => {
      if (!map.has(s._id)) map.set(s._id, s);
    });
    allLatest.forEach((s) => {
      if (!map.has(s._id)) map.set(s._id, s);
    });
    const fullPool = Array.from(map.values());
    const sortedUpdates = [...allLatest]
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
      .slice(0, 6);
    return { pool: fullPool, updates: sortedUpdates };
  }, [featured.data, top.data, latest.data]);

  const leadStory = pool[0];
  const topStoriesRows = pool.slice(1, 5);
  const carouselStories = pool.slice(5, 17);
  const latestGridStories = pool.slice(17, 29);
  const trendingStories = pool.slice(29, 34);
  const topicCategories = categories.slice(0, 4);

  return (
    <>
      <h1 className="sr-only">{t("nav.home")}: {t("home.latestNews")}</h1>

      <BreakingBar stories={breaking.data} />

      <TopNewsCarousel stories={carouselStories.length > 0 ? carouselStories : undefined} />

      <Container>
        {latest.error ? (
          <div className="py-16">
            <ErrorState onRetry={latest.retry} />
          </div>
        ) : latest.loading && pool.length === 0 ? (
          <div className="py-8 space-y-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <LeadSkeleton />
              </div>
              <div className="space-y-4 lg:col-span-4">
                <SectionHeader title={t("home.topStories")} />
                {Array.from({ length: 4 }).map((_, i) => (
                  <RowSkeleton key={i} />
                ))}
              </div>
            </div>
            <GridSkeleton count={8} columns={4} />
          </div>
        ) : (
          <>
            <section
              aria-label={t("home.topStories")}
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
                  <SectionHeader title={t("home.topStories")} />
                  <div className="flex flex-col">
                    {topStoriesRows.map((s) => (
                      <StoryRow key={s._id} story={s} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section
              aria-label={t("home.latestNews")}
              style={{ paddingTop: "var(--section-gap)" }}
              className="border-b border-border pb-12"
            >
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex items-center gap-3">
                  <SectionHeader title={t("home.latestNews")} className="mb-0" />
                </div>
                <Link
                  to="/archive"
                  className="text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-signal"
                >
                  {t("home.viewAll")}
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {latestGridStories.map((s) => (
                  <StoryCard key={s._id} story={s} />
                ))}
              </div>
            </section>

            <section
              aria-label={`${t("home.trending")} & ${t("home.latestUpdates")}`}
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

            <div className="space-y-6">
              {topicCategories.map((cat, idx) => (
                <CategoryBlock key={cat.slug} category={cat} layout={idx % 2 === 0 ? "A" : "B"} />
              ))}
            </div>
          </>
        )}
      </Container>

      <Newsletter />
    </>
  );
}