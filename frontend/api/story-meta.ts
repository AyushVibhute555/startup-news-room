import type { IncomingMessage, ServerResponse } from "node:http";

const STORY_API_URL = "https://startup-news-room-api.onrender.com/api/v1";
const SITE_URL = "https://startupnewsroom.in";

interface StorySeoData {
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

function injectStorySeoHtml(html: string, story: StorySeoData): string {
  const title = `${story.title} | Startup News Room`;
  const pageUrl = `${SITE_URL}/news/${encodeURIComponent(story.slug)}`;
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

function htmlResponse(
  body: string,
  status = 200,
  cacheControl = "public, s-maxage=60, stale-while-revalidate=300",
): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const slug = requestUrl.searchParams.get("slug");
  const containsControlCharacter = slug
    ? [...slug].some((character) => character.charCodeAt(0) <= 0x1f)
    : false;
  if (
    !slug ||
    slug.length > 200 ||
    slug.includes("/") ||
    slug.includes("\\") ||
    containsControlCharacter
  ) {
    return new Response("A valid story slug is required.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  let indexHtml: string | undefined;
  try {
    const indexResponse = await fetch(`${SITE_URL}/index.html`, {
      signal: AbortSignal.timeout(7000),
    });
    if (!indexResponse.ok) {
      throw new Error(`Could not load built app HTML (${indexResponse.status})`);
    }
    indexHtml = await indexResponse.text();

    const storyResponse = await fetch(`${STORY_API_URL}/stories/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(7000),
    });
    if (!storyResponse.ok) {
      console.error("Story metadata request failed", { slug, status: storyResponse.status });
      return htmlResponse(indexHtml, 200, "no-store");
    }

    const payload = (await storyResponse.json()) as { data?: StorySeoData };
    const story = payload.data;
    if (
      !story ||
      typeof story.slug !== "string" ||
      typeof story.title !== "string" ||
      typeof story.summary !== "string" ||
      typeof story.imageUrl !== "string"
    ) {
      throw new Error("Story API returned incomplete metadata");
    }

    return htmlResponse(injectStorySeoHtml(indexHtml, story));
  } catch (error) {
    console.error("Story page rendering failed", { slug, error });
    if (indexHtml) return htmlResponse(indexHtml, 200, "no-store");
    return new Response("Unable to load this story right now.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  if (request.method !== "GET") {
    response.statusCode = 405;
    response.setHeader("Allow", "GET");
    response.end("Method not allowed");
    return;
  }

  const host = request.headers.host ?? "startupnewsroom.in";
  const requestUrl = new URL(request.url ?? "/", `https://${host}`);
  const result = await GET(new Request(requestUrl));
  response.statusCode = result.status;
  result.headers.forEach((value, name) => response.setHeader(name, value));
  response.end(await result.text());
}
