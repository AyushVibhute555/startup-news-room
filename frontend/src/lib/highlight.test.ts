import { describe, expect, it } from "vitest";
import { tokenizeHighlights } from "./highlight";

describe("tokenizeHighlights", () => {
  it("highlights money amounts correctly ($42M)", () => {
    const text = "Fintech startup raises $42M Series B to open 12 new markets";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    // Should prioritize numeric tokens: $42M and 12 (or Series B)
    expect(highlighted).toContain("$42M");
    expect(tokens.map((t) => t.text).join("")).toBe(text);
    expect(highlighted.length).toBeLessThanOrEqual(2);
  });

  it("handles Indian rupee currency with crore units (₹120 crore)", () => {
    const text = "Bangalore robotics studio secures ₹120 crore Series A from domestic funds";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted).toContain("₹120 crore");
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("handles Euro amounts (€85M)", () => {
    const text = "Moneta raises €85M Series C as embedded lending surpasses €1.2B volume";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted.length).toBeLessThanOrEqual(2);
    expect(highlighted).toContain("€85M");
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("handles British pounds (£30M)", () => {
    const text = "DefendX raises £30M Series A to safeguard power grids against zero-day exploits";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted).toContain("£30M");
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("highlights percentages (40%)", () => {
    const text = "Orbitly cuts enterprise prices by 40% as customers reject seat tiers";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted).toContain("40%");
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("highlights multiplier expressions (3x)", () => {
    const text = "Paystream reports 3x surge in cross-border volume";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted).toContain("3x");
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("highlights decimal percentages (99.4%)", () => {
    const text = "DeepSight achieves 99.4% accuracy on multi-modal radiological screening tests";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted).toContain("99.4%");
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("highlights stage terms like Seed and Pre-seed", () => {
    const text = "From Pre-seed to exit: why honest co-founder feedback loops matter";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted).toContain("Pre-seed");
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("highlights unicorn stage term", () => {
    const text = "European tech IPO market rebounds as three unicorns file confidentially";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted.some((h) => h.toLowerCase().includes("unicorn") || h.includes("IPO"))).toBe(
      true,
    );
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("highlights keyword terms like Layoffs and Shuts down", () => {
    const text = "GlobalPay announces layoffs across customer operations teams";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted.map((h) => h.toLowerCase())).toContain("layoffs");
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("skips calendar years between 1990 and 2099 when not currency", () => {
    const text = "Venture capital investment forecast for 2026 shows moderate acceleration";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted).not.toContain("2026");
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("enforces restraint: at most 2 segments and never more than 45% of headline", () => {
    const text = "Fintech raises $100M Series B at 10x multiple with 45% revenue growth in 2026";
    const tokens = tokenizeHighlights(text);
    const highlighted = tokens.filter((t) => t.isHighlighted).map((t) => t.text);
    expect(highlighted.length).toBeLessThanOrEqual(2);
    const totalChars = highlighted.reduce((sum, h) => sum + h.length, 0);
    expect(totalChars).toBeLessThanOrEqual(text.length * 0.45);
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("preserves exact text identity for plain headlines without matches", () => {
    const text = "Founders discuss the challenges of remote team collaboration";
    const tokens = tokenizeHighlights(text);
    expect(tokens.map((t) => t.text).join("")).toBe(text);
  });

  it("handles empty or whitespace strings safely", () => {
    expect(tokenizeHighlights("")).toEqual([{ text: "", isHighlighted: false }]);
    expect(tokenizeHighlights("   ")).toEqual([{ text: "   ", isHighlighted: false }]);
  });
});
