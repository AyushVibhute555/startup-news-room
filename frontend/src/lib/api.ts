import { categories } from "@/data/categories";
import { stories as fallbackStories } from "@/data/stories";
import { mockStories } from "@/lib/mock/stories";
import type { Category, Paginated, Story } from "@/types/story";

// Dev-only mock layer behind DEV and VITE_USE_MOCKS
const useMocks = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== "false";
const stories: Story[] = useMocks ? mockStories : fallbackStories;

// The only place the app reads data. Swap each body for a fetch() later.
const LATENCY = 200;
const delay = <T>(value: T): Promise<T> => new Promise((r) => setTimeout(() => r(value), LATENCY));

const sorted = () =>
  [...stories].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));

export interface GetStoriesParams {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function getStories({
  category,
  q,
  page = 1,
  limit = 9,
}: GetStoriesParams = {}): Promise<Paginated<Story>> {
  // TODO: replace with fetch() to Express API
  let list = sorted();
  if (category) list = list.filter((s) => s.category === category);
  if (q) {
    const needle = q.trim().toLowerCase();
    list = list.filter((s) =>
      [s.title, s.summary, s.sourceName, s.category, ...s.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }
  const start = (page - 1) * limit;
  const items = list.slice(start, start + limit);
  return delay({ items, total: list.length, page, limit, hasMore: start + limit < list.length });
}

export async function getFeaturedStory(): Promise<Story> {
  // TODO: replace with fetch() to Express API
  return delay((sorted().find((s) => s.isFeatured) ?? sorted()[0])!);
}

export async function getTopStories(): Promise<Story[]> {
  // TODO: replace with fetch() to Express API
  return delay(
    sorted()
      .filter((s) => !s.isFeatured)
      .slice(0, 5),
  );
}

export async function getBreakingStories(): Promise<Story[]> {
  // TODO: replace with fetch() to Express API
  return delay(sorted().filter((s) => s.isBreaking));
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  // TODO: replace with fetch() to Express API
  return delay(stories.find((s) => s.slug === slug) ?? null);
}

export async function getRelatedStories(slug: string): Promise<Story[]> {
  // TODO: replace with fetch() to Express API
  const story = stories.find((s) => s.slug === slug);
  if (!story) return delay([]);
  const list = sorted().filter((s) => s.slug !== slug);
  const same = list.filter((s) => s.category === story.category);
  const rest = list.filter((s) => s.category !== story.category);
  return delay([...same, ...rest].slice(0, 3));
}

export async function getCategories(): Promise<Category[]> {
  // TODO: replace with fetch() to Express API
  return delay(categories);
}
