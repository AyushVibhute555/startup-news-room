import { describe, expect, it } from "vitest";
import { injectStorySeoHtml } from "./story-seo-html";

describe("injectStorySeoHtml", () => {
  it("adds story title, description, canonical and social preview metadata", () => {
    const html = injectStorySeoHtml(
      '<html><head><title>Startup News Room</title><meta name="description" content="Default" /></head><body><div id="root"></div></body></html>',
      {
        slug: "company-raises-10m",
        title: "Company raises $10M",
        summary: "A funding round closes.",
        imageUrl: "https://images.example.com/story.jpg",
      },
      "https://startupnewsroom.in",
    );

    expect(html).toContain("<title>Company raises $10M | Startup News Room</title>");
    expect(html).toContain('<meta name="description" content="A funding round closes." />');
    expect(html).toContain('<link rel="canonical" href="https://startupnewsroom.in/news/company-raises-10m" />');
    expect(html).toContain('<meta property="og:type" content="article" />');
    expect(html).toContain('<meta property="og:image" content="https://images.example.com/story.jpg" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<div id="root"></div>');
  });

  it("escapes untrusted story metadata before inserting it into HTML", () => {
    const html = injectStorySeoHtml(
      "<html><head></head><body></body></html>",
      {
        slug: "safe-slug",
        title: '<script>alert("x")</script>',
        summary: 'A "quoted" & detailed summary.',
        imageUrl: "https://images.example.com/image.jpg?a=1&b=2",
      },
      "https://startupnewsroom.in",
    );

    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain('A &quot;quoted&quot; &amp; detailed summary.');
    expect(html).not.toContain("<script>alert");
  });
});
