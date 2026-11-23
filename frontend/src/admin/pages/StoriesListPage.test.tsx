import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  categories as categoriesApi,
  stories as storiesApi,
  type AdminStory,
} from "../lib/api";
import { StoriesListPage } from "./StoriesListPage";

vi.mock("../lib/api", () => ({
  adminErrorMessage: (_error: unknown, fallback: string) => fallback,
  stories: { list: vi.fn(), remove: vi.fn() },
  categories: { list: vi.fn() },
}));

function makeStory(overrides: Partial<AdminStory>): AdminStory {
  return {
    _id: "story-1",
    title: "Story with a category",
    seoTitle: "",
    slug: "story-with-a-category",
    summary: "A sufficiently long summary for an admin story list test.",
    content: "Story content",
    author: "SNR Desk",
    imageUrl: "https://images.example.com/story.jpg",
    imageCredit: "",
    category: "",
    categories: [],
    region: "India",
    city: "",
    companies: [],
    isSponsored: false,
    sponsorName: "",
    homepageSlot: "none",
    breakingExpiresAt: null,
    tags: [],
    status: "published",
    publishedAt: "2026-11-22T00:00:00.000Z",
    readTime: 1,
    isFeatured: false,
    isBreaking: false,
    createdBy: null,
    createdAt: "2026-11-22T00:00:00.000Z",
    updatedAt: "2026-11-22T00:00:00.000Z",
    ...overrides,
  };
}

describe("StoriesListPage categories", () => {
  beforeEach(() => {
    vi.mocked(categoriesApi.list).mockResolvedValue([
      { _id: "fintech-id", name: "Fintech", slug: "fintech", description: "", order: 1 },
      {
        _id: "ipo-markets-id",
        name: "IPOs & Markets",
        slug: "ipo-markets",
        description: "",
        order: 2,
      },
    ]);
    vi.mocked(storiesApi.list).mockResolvedValue({
      data: [
        makeStory({ _id: "array-story", categories: ["fintech"] }),
        makeStory({
          _id: "legacy-story",
          title: "Story with legacy category",
          category: "ipo-markets",
        }),
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1, hasMore: false },
    });
  });

  it("shows categories arrays and falls back to the legacy category field", async () => {
    render(
      <MemoryRouter>
        <StoriesListPage />
      </MemoryRouter>,
    );

    const rows = within(await screen.findByRole("table")).getAllByRole("row");
    expect(within(rows[1]).getByText("Fintech")).toBeInTheDocument();
    expect(within(rows[2]).getByText("IPOs & Markets")).toBeInTheDocument();
  });
});
