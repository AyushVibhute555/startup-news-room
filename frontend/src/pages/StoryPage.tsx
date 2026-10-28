import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, Check, Link2, Linkedin, MessageCircle, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { btnPrimary } from "@/components/Buttons";
import { Container } from "@/components/Container";
import { ScrollProgress } from "@/components/Motion";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { CategoryTag, SectionLabel } from "@/components/StoryBits";
import { StoryCard } from "@/components/StoryCard";
import { StoryImage } from "@/components/StoryImage";
import { GridSkeleton } from "@/components/States";
import { getRelatedStories, getStoryBySlug } from "@/lib/api";
import { categoryName, formatDate } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { Story } from "@/types/story";

const shareBtn =
  "inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-border transition-colors duration-200 hover:border-foreground hover:text-signal";

function ShareRow({ story }: { story: Story }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(window.location.href), []);
  const enc = encodeURIComponent;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-label mr-2 text-sm text-muted-foreground">Share</span>
      <button
        type="button"
        aria-label="Copy link"
        className={shareBtn}
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          toast.success("Link copied");
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
      <a
        className={shareBtn}
        aria-label="Share on X"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://x.com/intent/post?url=${enc(url)}&text=${enc(story.title)}`}
      >
        <Twitter className="h-4 w-4" />
      </a>
      <a
        className={shareBtn}
        aria-label="Share on LinkedIn"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
      >
        <Linkedin className="h-4 w-4" />
      </a>
      <a
        className={shareBtn}
        aria-label="Share on WhatsApp"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://wa.me/?text=${enc(`${story.title} ${url}`)}`}
      >
        <MessageCircle className="h-4 w-4" />
      </a>
    </div>
  );
}

export function StoryPage({ story }: { story: Story }) {
  const related = useApi(() => getRelatedStories(story.slug), [story.slug]);

  return (
    <>
      <ScrollProgress />
      <article>
        <Container className="pt-8 lg:pt-12">
          <div className="mx-auto max-w-[880px]">
            <nav aria-label="Breadcrumb" className="text-[0.8125rem] text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-signal">
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link to={`/category/${story.category}`} className="hover:text-signal">
                    {categoryName(story.category)}
                  </Link>
                </li>
              </ol>
            </nav>
            <Reveal>
              <CategoryTag
                slug={story.category}
                breaking={story.isBreaking}
                className="mt-8 text-muted-foreground"
              />
              <h1 className="headline hero-headline mt-4">{story.title}</h1>
              <p className="mt-5 text-[1.1875rem] leading-relaxed text-muted-foreground">
                {story.summary}
              </p>
            </Reveal>
            <div className="mt-8 flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{story.sourceName}</span>
                <span aria-hidden>·</span>
                <time dateTime={story.publishedAt} suppressHydrationWarning>
                  {formatDate(story.publishedAt)}
                </time>
                <span aria-hidden>·</span>
                <span>{story.readTime} min read</span>
              </p>
              <ShareRow story={story} />
            </div>
          </div>

          <figure className="mx-auto mt-10 max-w-[1100px]">
            <StoryImage src={story.imageUrl} alt={story.title} ratio="16/9" eager zoom={false} />
            <figcaption className="mt-3 text-[0.8125rem] text-muted-foreground">
              Illustrative image for this story. {story.imageCredit}
            </figcaption>
          </figure>

          <div className="mx-auto mt-10 max-w-[680px] text-[1.0625rem] leading-[1.75]">
            <p>{story.summary}</p>
            {story.content && <p className="mt-6">{story.content}</p>}
            {story.tags.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2">
                {story.tags.map((t) => (
                  <li
                    key={t}
                    className="font-label rounded-[2px] border border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}
            <a
              href={story.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={btnPrimary("mt-10 w-full text-base sm:w-auto")}
            >
              Read full story at {story.sourceName} <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </Container>
      </article>

      <Container>
        <section className="section-y" aria-labelledby="related">
          <SectionLabel>
            <span id="related">Related stories</span>
          </SectionLabel>
          {related.data ? (
            <RevealGroup className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.data.map((s) => (
                <RevealItem key={s._id} className="h-full">
                  <StoryCard story={s} />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <GridSkeleton count={3} />
          )}
        </section>
      </Container>
    </>
  );
}

/** Wrapper that reads :slug from URL params and fetches the story. */
export function StoryPageWrapper() {
  const { slug } = useParams<{ slug: string }>();
  const { data: story, loading, error, retry } = useApi(() => getStoryBySlug(slug!), [slug]);

  if (loading) {
    return (
      <Container className="section-y !pt-12">
        <GridSkeleton count={1} />
      </Container>
    );
  }

  if (error || !story) {
    return (
      <Container className="section-y !pt-12 text-center">
        <h1 className="headline text-3xl">Story not found</h1>
        <p className="mt-2 text-muted-foreground">This story doesn't exist or has been removed.</p>
        <Link to="/" className={btnPrimary("mt-6")}>
          Back to headlines
        </Link>
      </Container>
    );
  }

  return <StoryPage story={story} />;
}
