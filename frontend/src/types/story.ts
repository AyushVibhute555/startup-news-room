export type CategorySlug =
  "funding" | "launches" | "ai" | "fintech" | "saas" | "founders" | "markets" | "policy";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
}

/** Mirrors the future MongoDB Story document. */
export interface Story {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  imageUrl: string;
  imageCredit: string;
  sourceName: string;
  sourceUrl: string;
  category: CategorySlug;
  tags: string[];
  publishedAt: string;
  readTime: number;
  isFeatured: boolean;
  isBreaking: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
