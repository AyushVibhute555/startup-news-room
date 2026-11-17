import type { TFunction } from "i18next";

const ACRONYMS: Record<string, string> = {
  ai: "AI",
  api: "API",
  b2b: "B2B",
  b2c: "B2C",
  esg: "ESG",
  ev: "EV",
  hr: "HR",
  ipo: "IPO",
  saas: "SaaS",
  uk: "UK",
  usa: "USA",
  vc: "VC",
};

export function formatCategorySlug(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      return ACRONYMS[lower] ?? `${lower[0]?.toUpperCase() ?? ""}${lower.slice(1)}`;
    })
    .join(" ");
}

export function getCategoryLabel(slug: string, t: TFunction, name?: string): string {
  const normalizedName = name?.trim();
  const fallbackName =
    normalizedName && normalizedName.toLowerCase().replace(/\s+/g, "-") !== slug.toLowerCase()
      ? normalizedName
      : formatCategorySlug(slug);

  return t(`categories.${slug}`, {
    defaultValue: fallbackName,
  });
}
