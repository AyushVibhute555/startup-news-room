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
                    <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
                        <table className="w-full text-left text-sm">
                            {/* 👇 Red Header matching the screenshot 👇 */}
                            <thead className="bg-signal text-signal-foreground text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-4 font-bold">Startup</th>
                                    <th className="px-5 py-4 font-bold">Sector</th>
                                    <th className="px-5 py-4 font-bold">Funding</th>
                                    <th className="px-5 py-4 font-bold">Round</th>
                                    <th className="px-5 py-4 font-bold">Lead Investors</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {fundedStories.map((story) => (
                                    <tr key={story._id} className="transition-colors hover:bg-muted/30">

                                        {/* Startup Name (Pulls from Companies array, falls back to first word of Title) */}
                                        <td className="px-5 py-4 font-bold text-foreground">
                                            <StoryLink story={story}>
                                                <span className="link-underline">
                                                    {story.companies && story.companies.length > 0
                                                        ? story.companies[0]
                                                        : story.title.split(" ")[0]}
                                                </span>
                                            </StoryLink>
                                        </td>

                                        {/* Sector (Uses the Category) */}
                                        <td className="px-5 py-4 text-muted-foreground capitalize">
                                            {story.category}
                                        </td>

                                        {/* Funding Amount (Prefers INR, falls back to USD, then Undisclosed) */}
                                        <td className="px-5 py-4 font-medium text-foreground">
                                            {story.fundingDetails?.amountINR
                                                ? story.fundingDetails.amountINR
                                                : story.fundingDetails?.amountUSD
                                                    ? story.fundingDetails.amountUSD
                                                    : "Undisclosed"}
                                        </td>

                                        {/* Round */}
                                        <td className="px-5 py-4 text-muted-foreground">
                                            {story.fundingDetails?.round}
                                        </td>

                                        {/* Lead Investors */}
                                        <td className="px-5 py-4 text-muted-foreground">
                                            {story.fundingDetails?.investors && story.fundingDetails.investors.length > 0
                                                ? story.fundingDetails.investors.join(", ")
                                                : "Undisclosed"}
                                        </td>

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