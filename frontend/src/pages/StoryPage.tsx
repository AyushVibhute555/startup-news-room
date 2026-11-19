import { Link, useParams } from "react-router-dom";
import { Check, Link2, Linkedin, MessageCircle, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { btnPrimary } from "@/components/Buttons";
import { Container } from "@/components/Container";
import { ScrollProgress } from "@/components/Motion";
import { TranslatedText } from "@/components/TranslatedText";
import { TranslatedHtml } from "@/components/TranslatedHtml";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { CategoryTag, SectionLabel } from "@/components/StoryBits";
import { StoryCard } from "@/components/StoryCard";
import { StoryImage } from "@/components/StoryImage";
import { GridSkeleton } from "@/components/States";
import { getRelatedStories, getStoryBySlug } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { trackEvent } from "@/lib/analytics";
import type { Story } from "@/types/story";
import { TranslatedHighlightedText } from "@/components/TranslatedHighlightedText";
import { getCategoryLabel } from "@/i18n/categoryLabel";
import { SITE_URL } from "@/lib/site";

const shareBtn =
  "inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-border transition-colors duration-200 hover:border-foreground hover:text-signal";

function ShareRow({ story }: { story: Story }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(window.location.href), []);
  const enc = encodeURIComponent;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-label mr-2 text-sm text-muted-foreground">{t("story.share")}</span>
      <button
        type="button"
        aria-label={t("story.copyLink")}
        className={shareBtn}
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          toast.success(t("story.linkCopied"));
          trackEvent("share", "copy_link", story.title);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
      <a
        className={shareBtn}
        aria-label={t("story.shareOn", { network: "X" })}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("share", "x_twitter", story.title)}
        href={`https://x.com/intent/post?url=${enc(url)}&text=${enc(story.title)}`}
      >
        <Twitter className="h-4 w-4" />
      </a>
      <a
        className={shareBtn}
        aria-label={t("story.shareOn", { network: "LinkedIn" })}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("share", "linkedin", story.title)}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
      >
        <Linkedin className="h-4 w-4" />
      </a>
      <a
        className={shareBtn}
        aria-label={t("story.shareOn", { network: "WhatsApp" })}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("share", "whatsapp", story.title)}
        href={`https://wa.me/?text=${enc(`${story.title} ${url}`)}`}
      >
        <MessageCircle className="h-4 w-4" />
      </a>
    </div>
  );
}

export function StoryPage({ story }: { story: Story }) {
  const { t } = useTranslation();
  const related = useApi(() => getRelatedStories(story.slug), [story.slug]);

  useEffect(() => {
    document.title = `${story.title} | Startup News Room`;
  }, [story.title]);

  // 👇 SAFE CATEGORY FALLBACK 👇
  const primaryCategory = (story as any).categories?.[0] || (story as any).category || "news";

  const pageUrl = `${SITE_URL}/news/${story.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.title,
    image: [story.imageUrl],
    datePublished: story.publishedAt,
    dateModified: story.publishedAt,
    author: [{ "@type": "Organization", name: story.author || "SNR Desk" }],
    publisher: {
      "@type": "Organization",
      name: "Startup News Room",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.jpg` },
    },
    description: story.summary,
  };

  return (
    <>
      <Helmet>
        <title>{story.title} | Startup News Room</title>
        <meta name="description" content={story.summary} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={story.title} />
        <meta property="og:description" content={story.summary} />
        <meta property="og:image" content={story.imageUrl} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content="Startup News Room" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={story.title} />
        <meta name="twitter:description" content={story.summary} />
        <meta name="twitter:image" content={story.imageUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <ScrollProgress />
      <article>
        <Container className="pt-8 lg:pt-12">
          <div className="mx-auto max-w-[880px]">
            <nav aria-label="Breadcrumb" className="text-[0.8125rem] text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-signal">
                    {t("story.breadcrumbHome")}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  {/* 👇 Using safe primaryCategory */}
                  <Link to={`/category/${primaryCategory}`} className="hover:text-signal">
                    {getCategoryLabel(primaryCategory, t)}
                  </Link>
                </li>
              </ol>
            </nav>
            <Reveal>
              <CategoryTag
                slug={primaryCategory}
                breaking={story.isBreaking}
                className="mt-8 text-muted-foreground"
              />
              <h1 className="headline hero-headline mt-4">
                <TranslatedHighlightedText text={story.title} />
              </h1>
              <p className="mt-5 text-[1.1875rem] leading-relaxed text-muted-foreground">
                <TranslatedText text={story.summary} />
              </p>
            </Reveal>
            <div className="mt-8 flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{story.author || "SNR Desk"}</span>
                <span aria-hidden>·</span>
                <time dateTime={story.publishedAt} suppressHydrationWarning>
                  {formatDate(story.publishedAt)}
                </time>
                <span aria-hidden>·</span>
                <span>{t("story.minRead", { count: story.readTime })}</span>
              </p>
              <ShareRow story={story} />
            </div>
          </div>

          {story.keyFacts && story.keyFacts.length > 0 && (
            <section aria-labelledby="key-facts-heading" className="mx-auto mt-8 max-w-[880px] rounded-r-lg border border-border border-l-4 border-l-signal bg-surface-alt p-5 sm:p-7">
              <h2 id="key-facts-heading" className="font-label text-xl">{t("story.atAGlance")}</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {story.keyFacts.map((fact, index) => (
                  <div key={`${fact.label}-${index}`} className="border-t border-border pt-3">
                    <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                    <dd className="mt-1 font-semibold">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <figure className="mx-auto mt-10 max-w-[1100px]">
            <StoryImage src={story.imageUrl} alt={story.title} ratio="16/9" eager zoom={false} />
            <figcaption className="mt-3 text-[0.8125rem] text-muted-foreground">
              {t("story.imageCredit")} {story.imageCredit}
            </figcaption>
          </figure>

          <div className="mx-auto mt-10 max-w-[680px] text-[1.0625rem] leading-[1.75]">
            <p>
              <TranslatedText text={story.summary} />
            </p>

            {story.content && (
              story.content.includes("<") ? (
                <TranslatedHtml html={story.content} className="mt-6" />
              ) : (
                <p className="mt-6">
                  <TranslatedText text={story.content} />
                </p>
              )
            )}

            {story.tags && story.tags.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2">
                {story.tags.map((tag) => (
                  <li
                    key={tag}
                    className="font-label rounded-[2px] border border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </article>

      <Container>
        <section className="section-y" aria-labelledby="related">
          <SectionLabel>
            <span id="related">{t("story.relatedStories")}</span>
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

export function StoryPageWrapper() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { data: story, loading, error } = useApi(() => getStoryBySlug(slug!), [slug]);

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
        <h1 className="headline text-3xl">{t("errors.storyNotFound")}</h1>
        <p className="mt-2 text-muted-foreground">{t("errors.storyNotFoundBody")}</p>
        <Link to="/" className={btnPrimary("mt-6")}>
          {t("errors.backHome")}
        </Link>
      </Container>
    );
  }

  return <StoryPage story={story} />;
}