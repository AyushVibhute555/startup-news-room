export interface StorySeoData {
  slug: string;
  title: string;
  summary: string;
  imageUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function injectStorySeoHtml(html: string, story: StorySeoData, siteUrl: string): string {
  const title = `${story.title} | Startup News Room`;
  const pageUrl = `${siteUrl.replace(/\/+$/, "")}/news/${encodeURIComponent(story.slug)}`;
  const safeTitle = escapeHtml(title);
  const safeSummary = escapeHtml(story.summary);
  const safeImageUrl = escapeHtml(story.imageUrl);
  const safePageUrl = escapeHtml(pageUrl);

  const titleTag = /<title\b[^>]*>[\s\S]*?<\/title>/i;
  let result = html.replace(titleTag, `<title>${safeTitle}</title>`);
  if (!titleTag.test(html)) {
    result = result.replace(/<\/head>/i, `<title>${safeTitle}</title>\n</head>`);
  }

  const descriptionTag = `<meta name="description" content="${safeSummary}" />`;
  const descriptionPattern = /<meta\s+name=["']description["'][^>]*>/i;
  if (descriptionPattern.test(result)) {
    result = result.replace(descriptionPattern, descriptionTag);
  } else {
    result = result.replace(/<\/head>/i, `${descriptionTag}\n</head>`);
  }

  const socialTags = [
    `<link rel="canonical" href="${safePageUrl}" />`,
    '<meta property="og:type" content="article" />',
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeSummary}" />`,
    `<meta property="og:image" content="${safeImageUrl}" />`,
    `<meta property="og:url" content="${safePageUrl}" />`,
    '<meta property="og:site_name" content="Startup News Room" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeSummary}" />`,
    `<meta name="twitter:image" content="${safeImageUrl}" />`,
  ].join("\n");

  return result.replace(/<\/head>/i, `${socialTags}\n</head>`);
}
