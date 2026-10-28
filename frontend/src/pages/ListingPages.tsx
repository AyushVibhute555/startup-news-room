import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary } from "@/components/Buttons";
import { Container } from "@/components/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { CategoryTag, StoryLink, StoryMeta } from "@/components/StoryBits";
import { StoryCard } from "@/components/StoryCard";
import { EmptyState, ErrorState, GridSkeleton, ListSkeleton } from "@/components/States";
import { getStories } from "@/lib/api";
import { dayLabel, formatClock } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { categories } from "@/data/categories";
import type { Category, Story } from "@/types/story";

function StoryGrid({ stories }: { stories: Story[] }) {
  return (
    <RevealGroup className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {stories.map((s) => (
        <RevealItem key={s._id} className="h-full">
          <StoryCard story={s} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

export function PageTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal className="border-b border-border pb-10">
      {eyebrow && <p className="font-label text-sm text-muted-foreground">{eyebrow}</p>}
      <h1 className="headline mt-2 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05]">{title}</h1>
      {children && (
        <div className="mt-4 max-w-2xl text-[1.0625rem] text-muted-foreground">{children}</div>
      )}
    </Reveal>
  );
}

function CategoryPageInner({ category }: { category: Category }) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Story[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [category.slug]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    getStories({ category: category.slug, page, limit: 9 })
      .then((r) => {
        if (!alive) return;
        setItems((prev) => (page === 1 ? r.items : [...prev, ...r.items]));
        setHasMore(r.hasMore);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [category.slug, page, tick]);

  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow="Category" title={category.name}>
        {category.description}
      </PageTitle>
      <div className="mt-12">
        {error ? (
          <ErrorState onRetry={() => setTick((t) => t + 1)} />
        ) : items.length === 0 && loading ? (
          <GridSkeleton count={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No stories yet"
            body="Check back soon for the latest in this category."
          />
        ) : (
          <>
            <StoryGrid stories={items} />
            {loading && (
              <div className="mt-12">
                <GridSkeleton count={3} />
              </div>
            )}
            {hasMore && !loading && (
              <div className="mt-16 flex justify-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className={btnSecondary("min-w-[200px]")}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
}

/** Wrapper that reads :slug from URL params and finds the category. */
export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return (
      <Container className="section-y !pt-12">
        <PageTitle eyebrow="Category" title="Not found">
          This category doesn't exist.
        </PageTitle>
      </Container>
    );
  }

  return <CategoryPageInner category={category} />;
}

export function ArchivePage() {
  const { data, loading, error, retry } = useApi(() => getStories({ limit: 100 }), []);
  const groups = new Map<string, Story[]>();
  data?.items.forEach((s) => {
    const k = dayLabel(s.publishedAt);
    groups.set(k, [...(groups.get(k) ?? []), s]);
  });

  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow="Daily history" title="Archive">
        Every headline we have published, day by day.
      </PageTitle>
      <div className="mt-8">
        {error ? (
          <ErrorState onRetry={retry} />
        ) : loading ? (
          <ListSkeleton count={8} />
        ) : (
          [...groups.entries()].map(([day, list]) => (
            <section key={day} aria-label={day} className="pt-6">
              <h2 className="font-label sticky top-0 z-10 border-b border-foreground bg-background py-3 text-xl">
                {day}
              </h2>
              <ul>
                {list.map((s) => (
                  <li
                    key={s._id}
                    className="group relative grid grid-cols-[3.5rem_1fr] gap-4 border-b border-border py-4 sm:grid-cols-[5rem_1fr_auto]"
                  >
                    <time
                      dateTime={s.publishedAt}
                      className="pt-1 text-[0.8125rem] tabular-nums text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {formatClock(s.publishedAt)}
                    </time>
                    <div className="min-w-0">
                      <h3 className="headline text-[1.125rem]">
                        <StoryLink story={s}>
                          <span className="link-underline">{s.title}</span>
                        </StoryLink>
                      </h3>
                      <StoryMeta story={s} className="mt-1" />
                    </div>
                    <CategoryTag
                      slug={s.category}
                      className="hidden pt-1.5 text-muted-foreground sm:inline-flex"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </Container>
  );
}

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const { data, loading, error, retry } = useApi(() => getStories({ q, limit: 100 }), [q]);
  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow="Search" title={q ? `"${q}"` : "Search"}>
        {data && q ? `${data.total} ${data.total === 1 ? "result" : "results"}` : null}
      </PageTitle>
      <div className="mt-12">
        {!q ? (
          <EmptyState
            title="Search the newsroom"
            body="Use the search icon in the header to look for a company, topic or source."
          />
        ) : error ? (
          <ErrorState onRetry={retry} />
        ) : loading ? (
          <GridSkeleton count={6} />
        ) : data && data.items.length > 0 ? (
          <StoryGrid stories={data.items} />
        ) : (
          <EmptyState
            title="No stories found"
            body={`Nothing matched "${q}". Try a broader term or browse the latest headlines.`}
          >
            <Link to="/" className={btnPrimary()}>
              Back to headlines
            </Link>
          </EmptyState>
        )}
      </div>
    </Container>
  );
}
