import { describe, expect, it } from "vitest";
import i18n from "./index";
import { formatCategorySlug, getCategoryLabel } from "./categoryLabel";

describe("formatCategorySlug", () => {
  it("formats hyphenated slugs and preserves common acronyms", () => {
    expect(formatCategorySlug("ipo-markets")).toBe("IPO Markets");
  });

  it("uses localized labels when present and readable fallbacks for new categories", () => {
    expect(getCategoryLabel("funding", i18n.t)).toBe("Funding");
    expect(getCategoryLabel("ipo-markets", i18n.t)).toBe("IPOs & Markets");
    expect(getCategoryLabel("ipo-markets", i18n.t, "ipo-markets")).toBe("IPOs & Markets");
  });

  it("translates every built-in category in Hindi, Kannada, and Telugu", () => {
    const categorySlugs = [
      "funding",
      "launches",
      "ai",
      "fintech",
      "founders",
      "ipo-markets",
      "policy",
    ];

    for (const language of ["hi", "kn", "te"]) {
      const translate = i18n.getFixedT(language);
      for (const slug of categorySlugs) {
        const label = getCategoryLabel(slug, translate);
        expect(label, `${language} translation for ${slug}`).not.toBe(
          getCategoryLabel(slug, i18n.getFixedT("en")),
        );
      }
      expect(getCategoryLabel("saas", translate)).toBe("SaaS");
    }
  });
});
