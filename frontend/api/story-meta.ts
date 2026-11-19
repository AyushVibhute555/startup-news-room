import { env } from "node:process";
import { SITE_URL } from "../src/lib/site";
import { injectStorySeoHtml, type StorySeoData } from "../src/lib/story-seo-html";

const STORY_API_URL = "https://startup-news-room-api.onrender.com/api/v1";

function getDeploymentOrigin(): string {
  const deploymentHost = env.VERCEL_URL;
  return deploymentHost && /^[a-zA-Z0-9.-]+$/.test(deploymentHost)
    ? `https://${deploymentHost}`
    : SITE_URL;
}

function htmlResponse(body: string, status = 200, cacheControl = "public, s-maxage=60, stale-while-revalidate=300"): Response {
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
  if (!slug || slug.length > 200 || /[\/\\\u0000-\u001f]/.test(slug)) {
    return new Response("A valid story slug is required.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const timeout = AbortSignal.timeout(7000);
    const [indexResponse, storyResponse] = await Promise.all([
      fetch(`${getDeploymentOrigin()}/index.html`, { signal: timeout }),
      fetch(`${STORY_API_URL}/stories/${encodeURIComponent(slug)}`, {
        headers: { Accept: "application/json" },
        signal: timeout,
      }),
    ]);

    if (!indexResponse.ok) {
      throw new Error(`Could not load built app HTML (${indexResponse.status})`);
    }

    const indexHtml = await indexResponse.text();
    if (!storyResponse.ok) {
      console.error("Story metadata request failed", { slug, status: storyResponse.status });
      return htmlResponse(indexHtml, storyResponse.status === 404 ? 404 : 503, "no-store");
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

    return htmlResponse(injectStorySeoHtml(indexHtml, story, SITE_URL));
  } catch (error) {
    console.error("Story page rendering failed", { slug, error });
    return new Response("Unable to load this story right now.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
