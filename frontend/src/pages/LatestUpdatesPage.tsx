import { useTranslation } from "react-i18next";
import { useApi } from "@/lib/use-api";
import { getStories } from "@/lib/api";
import { Container } from "@/components/Container";
import { PageTitle } from "./ListingPages";
import { StoryLink } from "@/components/StoryBits";
import { GridSkeleton, ErrorState, EmptyState } from "@/components/States";
import { dayLabel, formatClock } from "@/lib/format";
import { TranslatedText } from "@/components/TranslatedText";
import { TranslatedHighlightedText } from "@/components/TranslatedHighlightedText";
import { getCategoryLabel } from "@/i18n/categoryLabel";

export function LatestUpdatesPage() {
    const { t } = useTranslation();
    const { data, loading, error, retry } = useApi(() => getStories({ limit: 50 }), []);

    // Group stories by Date (Today, Yesterday, etc.)
    const groups = new Map<string, any[]>();
    data?.items.forEach((s) => {
        const k = dayLabel(s.publishedAt);
        groups.set(k, [...(groups.get(k) ?? []), s]);
    });

    return (
        <Container className="section-y !pt-12 max-w-4xl">
            <PageTitle eyebrow="Live Feed" title="Latest Updates">
                Every headline from the newsroom, updated in real-time.
            </PageTitle>

            <div className="mt-12">
                {error ? (
                    <ErrorState onRetry={retry} />
                ) : loading ? (
                    <GridSkeleton count={6} />
                ) : data && data.items.length > 0 ? (
                    [...groups.entries()].map(([day, list]) => (
                        <section key={day} className="mb-12">
                            {/* Sticky Date Header */}
                            <h2 className="font-label sticky top-[120px] z-10 mb-6 rounded-r-full bg-background/90 py-2 pl-4 pr-6 text-sm font-bold uppercase tracking-widest text-signal backdrop-blur-md border-l-4 border-signal">
                                {day}
                            </h2>
                            <ul className="space-y-6">
                                {list.map((story) => (
                                    <li key={story._id} className="group relative flex gap-4 sm:gap-6">
                                        {/* Time column */}
                                        <div className="w-12 shrink-0 pt-1 text-right sm:w-16">
                                            <time className="text-xs font-semibold tabular-nums text-muted-foreground">
                                                {formatClock(story.publishedAt)}
                                            </time>
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 flex-1 border-b border-border pb-6">
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                {story.categories?.map((cat: string) => (
                                                    <span key={cat} className="font-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        {getCategoryLabel(cat, t)}
                                                    </span>
                                                ))}
                                            </div>
                                            <h3 className="headline text-lg font-bold leading-tight sm:text-xl">
                                                <StoryLink story={story}>
                                                    <span className="link-underline">
                                                        <TranslatedHighlightedText text={story.title} />
                                                    </span>
                                                </StoryLink>
                                            </h3>
                                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                                <TranslatedText text={story.summary} />
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))
                ) : (
                    <EmptyState title="No updates yet" body="Check back soon." />
                )}
            </div>
        </Container>
    );
}