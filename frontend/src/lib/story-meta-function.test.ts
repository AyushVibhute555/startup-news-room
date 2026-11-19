import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../api/story-meta";

describe("story metadata function", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns the built SPA shell with server-rendered story metadata", async () => {
    vi.stubEnv("VERCEL_URL", "");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).endsWith("/index.html")) {
        return new Response(
          '<!doctype html><html><head><title>Startup News Room</title><meta name="description" content="Default" /></head><body><div id="root"></div></body></html>',
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          data: {
            slug: "company-raises-10m",
            title: "Company raises $10M",
            summary: "A funding round closes.",
            imageUrl: "https://images.example.com/story.jpg",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const response = await GET(
      new Request("https://startupnewsroom.in/api/story-meta?slug=company-raises-10m"),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("<title>Company raises $10M | Startup News Room</title>");
    expect(html).toContain('<meta property="og:description" content="A funding round closes." />');
    expect(html).toContain('<meta property="og:image" content="https://images.example.com/story.jpg" />');
    expect(html).toContain('<div id="root"></div>');
  });
});
