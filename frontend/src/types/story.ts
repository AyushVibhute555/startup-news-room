export type CategorySlug =
  "funding" | "launches" | "ai" | "fintech" | "saas" | "founders" | "markets" | "policy";

export type Region = "Karnataka" | "India" | "Global";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
}

export interface KeyFact {
  label: string;
  value: string;
}

export interface Story {
  _id: string;
  title: string;
  seoTitle?: string;
  slug: string;
  summary: string;
  content?: string;
  author?: string;
  imageUrl: string;
  imageCredit: string;
  sourceName?: string;
  sourceUrl?: string;
  categories: string[];
  category?: string;
  region?: Region;
  city?: string;
  companies?: string[];
  keyFacts?: KeyFact[];
  fundingDetails?: {
    amountINR?: string;
    amountUSD?: string;
    round?: string;
    investors?: string[];
  };
  isSponsored?: boolean;
  sponsorName?: string;
  homepageSlot?: "lead" | "top" | "none";
  breakingExpiresAt?: string | null;
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