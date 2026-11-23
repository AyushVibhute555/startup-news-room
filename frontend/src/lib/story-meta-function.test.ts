import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import handler, { GET } from "../../api/story-meta";

async function withStoryMetaServer(test: (url: string) => Promise<void>) {
  const server = createServer((request, response) => {
    void handler(request, response);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not start test server");

  try {
    await test(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe("story metadata function", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns the built SPA shell with server-rendered story metadata", async () => {
    vi.stubEnv("VERCEL_URL", "protected-deployment.vercel.app");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
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
    expect(html).toContain(
      '<meta property="og:image" content="https://images.example.com/story.jpg" />',
    );
    expect(html).toContain('<div id="root"></div>');
    expect(fetchMock).toHaveBeenCalledWith(
      "https://startupnewsroom.in/index.html",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("uses the default Node handler expected by Vercel functions", async () => {
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).endsWith("/index.html")) {
        return new Response(
          "<html><head><title>Startup News Room</title></head><body></body></html>",
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
        { headers: { "Content-Type": "application/json" } },
      );
    });

    await withStoryMetaServer(async (baseUrl) => {
      const response = await realFetch(`${baseUrl}/api/story-meta?slug=company-raises-10m`);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain("<title>Company raises $10M | Startup News Room</title>");
    });
  });

  it("falls back to the SPA shell when story metadata cannot be fetched", async () => {
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response('<html><head></head><body><div id="root"></div></body></html>'),
      )
      .mockRejectedValueOnce(new Error("Story API unavailable"));

    await withStoryMetaServer(async (baseUrl) => {
      const response = await realFetch(`${baseUrl}/api/story-meta?slug=company-raises-10m`);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain('<div id="root"></div>');
    });
  });
});
