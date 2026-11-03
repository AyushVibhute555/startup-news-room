import { useApi } from "@/lib/use-api";
import { getStories } from "@/lib/api";
import { Container } from "@/components/Container";
import { PageTitle } from "./ListingPages";
import { ErrorState, EmptyState, GridSkeleton } from "@/components/States";
import { StoryLink } from "@/components/StoryBits";

export function FundingTrackerPage() {
    // Fetch recent stories and filter for those with funding details
    const { data, loading, error, retry } = useApi(() => getStories({ limit: 50 }), []);

    const fundedStories = data?.items.filter((s) => s.fundingDetails?.round) ?? [];

    return (
        <Container className="section-y !pt-12">
            <PageTitle eyebrow="Weekly Data" title="Funding Tracker">
                A running log of startup funding rounds across Karnataka, India, and Global markets.
            </PageTitle>

            <div className="mt-12">
                {error ? (
                    <ErrorState onRetry={retry} />
                ) : loading ? (
                    <GridSkeleton count={4} />
                ) : fundedStories.length === 0 ? (
                    <EmptyState title="No funding rounds yet" body="Check back soon for the latest raises." />
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Startup</th>
                                    <th className="px-4 py-3 font-medium">Round</th>
                                    <th className="px-4 py-3 font-medium">Amount (₹)</th>
                                    <th className="px-4 py-3 font-medium">Amount ($)</th>
                                    <th className="px-4 py-3 font-medium">Lead Investors</th>
                                    <th className="px-4 py-3 font-medium">City</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {fundedStories.map((story) => (
                                    <tr key={story._id} className="transition-colors hover:bg-muted/20">
                                        <td className="px-4 py-4 font-semibold text-foreground">
                                            <StoryLink story={story}>
                                                <span className="link-underline">
                                                    {story.companies && story.companies.length > 0 ? story.companies[0] : story.title.slice(0, 30) + "..."}
                                                </span>
                                            </StoryLink>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center rounded bg-signal/10 px-2 py-0.5 text-xs font-medium text-signal">
                                                {story.fundingDetails?.round}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 font-medium">{story.fundingDetails?.amountINR || "-"}</td>
                                        <td className="px-4 py-4 text-muted-foreground">{story.fundingDetails?.amountUSD || "-"}</td>
                                        <td className="px-4 py-4 text-muted-foreground">
                                            {story.fundingDetails?.investors?.join(", ") || "-"}
                                        </td>
                                        <td className="px-4 py-4 text-muted-foreground">{story.city || story.region || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Container>
    );
}