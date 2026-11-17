import { describe, expect, it } from "vitest";
import i18n from "./index";
import { formatCategorySlug, getCategoryLabel } from "./categoryLabel";

describe("formatCategorySlug", () => {
  it("formats hyphenated slugs and preserves common acronyms", () => {
    expect(formatCategorySlug("ipo-markets")).toBe("IPO Markets");
  });

  it("uses localized labels when present and readable fallbacks for new categories", () => {
    expect(getCategoryLabel("funding", i18n.t)).toBe("Funding");
    expect(getCategoryLabel("ipo-markets", i18n.t)).toBe("IPO Markets");
    expect(getCategoryLabel("ipo-markets", i18n.t, "ipo-markets")).toBe("IPO Markets");
  });
});
