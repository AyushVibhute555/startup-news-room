export interface HighlightToken {
  text: string;
  isHighlighted: boolean;
}

export const HIGHLIGHT_KEYWORDS = [
  "Breaking",
  "Exclusive",
  "Live",
  "Raises",
  "Acquires",
  "Layoffs",
  "Shuts down",
];

interface Span {
  start: number;
  end: number;
  priority: number; // lower is higher priority: 1=money, 2=percent/multiple, 3=stage, 4=keywords, 5=numbers
  isNumeric: boolean;
}

// 1. Money: [$€£₹] followed by number and optional unit
const MONEY_REGEX =
  /(?:[$€£₹]\s*\d+(?:[.,]\d+)?(?:\s*(?:crore|cr|lakh|trillion|billion|bn|b|million|mn|m|k))\b|[$€£₹]\s*\d+(?:[.,]\d+)?)/gi;

// 2. Percentages & multiples: 37%, 3x, 10x, 99.4%
const PERCENT_MULTIPLE_REGEX = /\b\d+(?:[.,]\d+)?%(?!\w)|\b\d+(?:[.,]\d+)?x\b/gi;

// 3. Stage terms: Series A-F, Seed, Pre-seed, IPO, unicorn(s)
const STAGE_REGEX = /\b(?:Series\s+[A-F]|Seed|Pre-seed|IPO|unicorns?)\b/gi;

// 4. Configurable keywords
const KEYWORDS_REGEX = new RegExp(
  `\\b(?:${HIGHLIGHT_KEYWORDS.map((k) => k.replace(/\s+/g, "\\s+")).join("|")})\\b`,
  "gi",
);

// 5. Other numbers with 2+ digits or a unit suffix (skip calendar years 1990-2099 unless currency)
const NUMBER_REGEX = /\b\d+(?:[.,]\d+)?(?:k|m|b|bn|mn|cr|lakh|ms|ghz)?\b/gi;

function isCalendarYear(val: string): boolean {
  const n = parseInt(val, 10);
  return !isNaN(n) && n >= 1990 && n <= 2099;
}

export function tokenizeHighlights(text: string): HighlightToken[] {
  if (!text || text.trim().length === 0) {
    return [{ text, isHighlighted: false }];
  }

  const candidates: Span[] = [];

  // Helper to test if a candidate overlaps an already matched span
  const overlapsAny = (start: number, end: number, list: Span[]) =>
    list.some((s) => Math.max(start, s.start) < Math.min(end, s.end));

  // Tier 1: Money
  let match: RegExpExecArray | null;
  MONEY_REGEX.lastIndex = 0;
  while ((match = MONEY_REGEX.exec(text)) !== null) {
    candidates.push({
      start: match.index,
      end: match.index + match[0].length,
      priority: 1,
      isNumeric: true,
    });
  }

  // Tier 2: Percentages & Multiples
  PERCENT_MULTIPLE_REGEX.lastIndex = 0;
  while ((match = PERCENT_MULTIPLE_REGEX.exec(text)) !== null) {
    if (!overlapsAny(match.index, match.index + match[0].length, candidates)) {
      candidates.push({
        start: match.index,
        end: match.index + match[0].length,
        priority: 2,
        isNumeric: true,
      });
    }
  }

  // Tier 3: Stages
  STAGE_REGEX.lastIndex = 0;
  while ((match = STAGE_REGEX.exec(text)) !== null) {
    if (!overlapsAny(match.index, match.index + match[0].length, candidates)) {
      candidates.push({
        start: match.index,
        end: match.index + match[0].length,
        priority: 3,
        isNumeric: false,
      });
    }
  }

  // Tier 4: Keywords
  KEYWORDS_REGEX.lastIndex = 0;
  while ((match = KEYWORDS_REGEX.exec(text)) !== null) {
    if (!overlapsAny(match.index, match.index + match[0].length, candidates)) {
      candidates.push({
        start: match.index,
        end: match.index + match[0].length,
        priority: 4,
        isNumeric: false,
      });
    }
  }

  // Tier 5: Other 2+ digit numbers or unit suffix
  NUMBER_REGEX.lastIndex = 0;
  while ((match = NUMBER_REGEX.exec(text)) !== null) {
    const rawMatch = match[0];
    const matchStart = match.index;
    const matchEnd = matchStart + rawMatch.length;

    // Check if it's a calendar year 1990-2099 without currency
    const digitsOnly = rawMatch.replace(/\D/g, "");
    if (digitsOnly.length === 4 && isCalendarYear(digitsOnly)) {
      continue;
    }

    // Must have 2+ digits or a unit suffix
    const hasUnitSuffix = /[a-zA-Z]/.test(rawMatch);
    if (digitsOnly.length < 2 && !hasUnitSuffix) {
      continue;
    }

    if (!overlapsAny(matchStart, matchEnd, candidates)) {
      candidates.push({
        start: matchStart,
        end: matchEnd,
        priority: 5,
        isNumeric: true,
      });
    }
  }

  if (candidates.length === 0) {
    return [{ text, isHighlighted: false }];
  }

  // Sort candidates by numeric priority first, then tier priority, then index
  // "at most 2 highlighted segments per headline (numbers first)"
  const sortedByImportance = [...candidates].sort((a, b) => {
    if (a.isNumeric !== b.isNumeric) {
      return a.isNumeric ? -1 : 1;
    }
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.start - b.start;
  });

  // Pick at most 2 non-overlapping segments
  const selected: Span[] = [];
  for (const c of sortedByImportance) {
    if (selected.length >= 2) break;
    if (!overlapsAny(c.start, c.end, selected)) {
      selected.push(c);
    }
  }

  // Enforce restraint:
  // - Never more than 45% of total characters
  // - Never a whole headline
  const maxAllowedChars = Math.floor(text.length * 0.45);

  // Filter while total chars exceed 45%
  let validSpans = [...selected];
  let totalChars = validSpans.reduce((sum, s) => sum + (s.end - s.start), 0);

  if (totalChars > maxAllowedChars || totalChars >= text.length) {
    // If 2 spans, try keeping just the top 1
    if (validSpans.length === 2) {
      validSpans = [validSpans[0]!];
      totalChars = validSpans[0]!.end - validSpans[0]!.start;
    }
    if (totalChars > maxAllowedChars || totalChars >= text.length) {
      validSpans = [];
    }
  }

  if (validSpans.length === 0) {
    return [{ text, isHighlighted: false }];
  }

  // Order final spans in chronological text order
  validSpans.sort((a, b) => a.start - b.start);

  const tokens: HighlightToken[] = [];
  let cursor = 0;

  for (const span of validSpans) {
    if (span.start > cursor) {
      tokens.push({
        text: text.slice(cursor, span.start),
        isHighlighted: false,
      });
    }
    tokens.push({
      text: text.slice(span.start, span.end),
      isHighlighted: true,
    });
    cursor = span.end;
  }

  if (cursor < text.length) {
    tokens.push({
      text: text.slice(cursor),
      isHighlighted: false,
    });
  }

  return tokens;
}
