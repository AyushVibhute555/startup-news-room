import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { StoryMeta, SourceLink } from "./StoryBits";
import i18n from "@/i18n";
import type { Story } from "@/types/story";

const story: Story = {
  _id: "story-1",
  title: "Test headline",
  slug: "test-headline",
  summary: "A story summary long enough for this component test.",
  imageUrl: "https://images.example.com/story.jpg",
  imageCredit: "",
  author: "SNR Desk",
  sourceName: "Startup News Room",
  sourceUrl: "https://www.startupnewsroom.in/news/another-story",
  categories: ["funding"],
  tags: [],
  publishedAt: new Date().toISOString(),
  readTime: 2,
  isFeatured: false,
  isBreaking: false,
};

describe("story byline and source link", () => {
  it("uses the author byline and hides links back to the site", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <StoryMeta story={story} />
        <SourceLink story={story} />
      </I18nextProvider>,
    );

    expect(screen.getByText("SNR Desk")).toBeInTheDocument();
    expect(screen.queryByText("Startup News Room")).not.toBeInTheDocument();
    expect(screen.queryByText("Source")).not.toBeInTheDocument();
  });

  it("keeps source links to external publishers", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SourceLink story={{ ...story, sourceUrl: "https://example.com/story" }} />
      </I18nextProvider>,
    );

    expect(screen.getByRole("link", { name: /Source/ })).toHaveAttribute(
      "href",
      "https://example.com/story",
    );
  });
});
