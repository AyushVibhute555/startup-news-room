import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { btnPrimary, btnSecondary } from "@/components/Buttons";
import { Container } from "@/components/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { TranslatedText } from "@/components/TranslatedText";
import { StoryLink, StoryMeta } from "@/components/StoryBits";
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
  const { t } = useTranslation();
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
      <PageTitle eyebrow={t("category.eyebrow")} title={t(`categories.${category.slug}`)}>
        {category.description}
      </PageTitle>
      <div className="mt-12">
        {error ? (
          <ErrorState onRetry={() => setTick((t2) => t2 + 1)} />
        ) : items.length === 0 && loading ? (
          <GridSkeleton count={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("category.noStories")}
            body={t("category.noStoriesBody")}
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
                  {t("common.loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
}

export function CategoryPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return (
      <Container className="section-y !pt-12">
        <PageTitle eyebrow={t("category.eyebrow")} title={t("errors.notFound")}>
          {t("category.notFound")}
        </PageTitle>
      </Container>
    );
  }

  return <CategoryPageInner category={category} />;
}

export function ArchivePage() {
  const { t } = useTranslation();
  const { data, loading, error, retry } = useApi(() => getStories({ limit: 100 }), []);
  const groups = new Map<string, Story[]>();
  data?.items.forEach((s) => {
    const k = dayLabel(s.publishedAt);
    groups.set(k, [...(groups.get(k) ?? []), s]);
  });

  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow={t("archive.eyebrow")} title={t("archive.title")}>
        {t("archive.subtitle")}
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
                          <span className="link-underline">
                            <TranslatedText text={s.title} />
                          </span>
                        </StoryLink>
                      </h3>
                      <StoryMeta story={s} className="mt-1" />
                    </div>
                    <span className="hidden pt-1.5 text-xs font-label uppercase tracking-wide text-muted-foreground sm:inline-flex">
                      {t(`categories.${s.category}`)}
                    </span>
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
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const { data, loading, error, retry } = useApi(() => getStories({ q, limit: 100 }), [q]);

  const resultLabel = data && q
    ? t("search.results", { count: data.total })
    : null;

  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow={t("search.eyebrow")} title={q ? `"${q}"` : t("search.eyebrow")}>
        {resultLabel}
      </PageTitle>
      <div className="mt-12">
        {!q ? (
          <EmptyState
            title={t("search.placeholder")}
            body={t("search.noResultsBody", { query: "" })}
          />
        ) : error ? (
          <ErrorState onRetry={retry} />
        ) : loading ? (
          <GridSkeleton count={6} />
        ) : data && data.items.length > 0 ? (
          <StoryGrid stories={data.items} />
        ) : (
          <EmptyState
            title={t("search.noResults")}
            body={t("search.noResultsBody", { query: q })}
          >
            <Link to="/" className={btnPrimary()}>
              {t("errors.backHome")}
            </Link>
          </EmptyState>
        )}
      </div>
    </Container>
  );
}