import { useMemo } from "react";
import { BreakingTicker } from "@/components/BreakingTicker";
import { Container } from "@/components/Container";
import { CoverStory } from "@/components/CoverStory";
import { TopStoriesStrip } from "@/components/TopStoriesStrip";
import { BentoMosaic } from "@/components/BentoMosaic";
import { BriefingTimeline } from "@/components/BriefingTimeline";
import { TopicExplorer } from "@/components/TopicExplorer";
import { RailSection } from "@/components/RailSection";
import { Newsletter } from "@/components/Newsletter";
import { Reveal } from "@/components/Reveal";
import { Skeleton } from "@/components/States";
import { ErrorState, GridSkeleton, ListSkeleton } from "@/components/States";
import { getBreakingStories, getFeaturedStory, getStories, getTopStories } from "@/lib/api";
import { useApi } from "@/lib/use-api";

/* ── Daily edition strip ──────────────────────────────────── */

function DailyEditionStrip({
  storyCount,
  sourceCount,
}: {
  storyCount: number;
  sourceCount: number;
}) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = now.getFullYear();
  const weekday = now.toLocaleString("en-US", { weekday: "long" }).toUpperCase();

  return (
    <Reveal>
      <div className="edition-strip">
        <span className="edition-strip__numeral" suppressHydrationWarning>
          {day}
        </span>
        <div className="edition-strip__meta">
          <span className="edition-strip__date-label" suppressHydrationWarning>
            {month} {year}
          </span>
          <span className="edition-strip__date-label" suppressHydrationWarning>
            {weekday}
          </span>
        </div>
        <div className="edition-strip__counters" suppressHydrationWarning>
          <span>
            <strong>{storyCount}</strong> stories today
          </span>
          <span>
            <strong>{sourceCount}</strong> sources
          </span>
        </div>
      </div>
      <hr className="section-divider" />
    </Reveal>
  );
}

/* ── Home page ────────────────────────────────────────────── */

export function HomePage() {
  const breaking = useApi(getBreakingStories, []);
  const featured = useApi(getFeaturedStory, []);
  const top = useApi(getTopStories, []);
  const latest = useApi(() => getStories({ limit: 18 }), []);

  const featuredId = featured.data?._id;
  const latestItems = useMemo(
    () => (latest.data?.items ?? []).filter((s) => s._id !== featuredId),
    [latest.data, featuredId],
  );

  // Compute counters from data
  const storyCount = latest.data?.total ?? 0;
  const sourceCount = useMemo(() => {
    const sources = new Set((latest.data?.items ?? []).map((s) => s.sourceName));
    return sources.size;
  }, [latest.data]);

  return (
    <>
      {/* 1. Breaking ticker (unchanged) */}
      <BreakingTicker stories={breaking.data} />

      <Container>
        {/* 2. Daily edition strip */}
        <DailyEditionStrip storyCount={storyCount} sourceCount={sourceCount} />

        {/* 3. CoverStory */}
        <section aria-label="Cover story">
          {featured.data ? (
            <CoverStory story={featured.data} />
          ) : (
            <div aria-hidden className="py-8">
              <Skeleton className="aspect-[16/10] w-full" />
              <Skeleton className="mt-6 h-3 w-24" />
              <Skeleton className="mt-4 h-10 w-full" />
              <Skeleton className="mt-3 h-10 w-3/4" />
            </div>
          )}
        </section>

        <hr className="section-divider" />

        {/* 4. Top Stories strip */}
        <section
          aria-label="Top stories"
          style={{ paddingTop: "var(--section-gap)", paddingBottom: "var(--section-gap)" }}
        >
          {top.data ? <TopStoriesStrip stories={top.data} /> : <ListSkeleton count={5} />}
        </section>

        <hr className="section-divider" />

        {/* 5. RailSection "01 Latest Headlines" */}
        <div style={{ paddingTop: "var(--section-gap)", paddingBottom: "var(--section-gap)" }}>
          <RailSection
            number="01"
            name="Latest Headlines"
            description="The newest stories from across the startup ecosystem."
            linkLabel="View all headlines"
            linkTo="/archive"
            id="sec-latest"
          >
            {latest.error ? (
              <ErrorState onRetry={latest.retry} />
            ) : latest.loading ? (
              <GridSkeleton count={6} />
            ) : (
              <BentoMosaic stories={latestItems.slice(0, 9)} />
            )}
          </RailSection>
        </div>

        <hr className="section-divider" />

        {/* 6. RailSection "02 Today's Briefing" */}
        <div style={{ paddingTop: "var(--section-gap)", paddingBottom: "var(--section-gap)" }}>
          <RailSection
            number="02"
            name="Today's Briefing"
            description="A chronological timeline of everything we've published."
            id="sec-briefing"
          >
            {latest.data ? (
              <BriefingTimeline stories={latest.data.items.slice(0, 12)} />
            ) : (
              <ListSkeleton count={8} />
            )}
          </RailSection>
        </div>

        <hr className="section-divider" />

        {/* 7. RailSection "03 Topics" */}
        <div style={{ paddingTop: "var(--section-gap)", paddingBottom: "var(--section-gap)" }}>
          <RailSection
            number="03"
            name="Topics"
            description="Browse stories by category."
            id="sec-topics"
          >
            <TopicExplorer />
          </RailSection>
        </div>
      </Container>

      {/* 8. Newsletter (full-bleed inverse, content at columns 4-12) */}
      <Newsletter />
    </>
  );
}
