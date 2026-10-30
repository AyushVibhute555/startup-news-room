// src/components/HighlightedText.tsx
import { useMemo } from "react";

interface HighlightedTextProps {
  text: string;
  className?: string;
  highlightClassName?: string; // Defaults to your secondary color (text-signal)
}

// Regex to match:
// 1. Money + magnitude ($10M, €50 million, ₹100Cr, £1.5B, etc.)
// 2. Numbers with magnitude (10 million, 5B, 100k, etc.)
// 3. Important keywords (Series A, Series B, Seed, IPO, Unicorn)
const HIGHLIGHT_REGEX = /((?:\$|€|£|₹|¥)\s?\d+(?:\.\d+)?(?:\s?(?:[mMbBkK]|million|billion|thousand|crore|lakh))?|\b\d+(?:\.\d+)?\s?(?:[mMbBkK]|million|billion|thousand|crore|lakh)\b|\b(?:Series\s[A-Z]|Seed|IPO|Unicorn)\b)/gi;

export function HighlightedText({
  text,
  className,
  highlightClassName = "text-signal", // your secondary color
}: HighlightedTextProps) {
  const parts = useMemo(() => {
    if (!text) return [];

    // Split by the regex. The capturing group means the matches are preserved in the array.
    const split = text.split(HIGHLIGHT_REGEX);

    return split.map((part, index) => {
      // Odd indices are matches
      if (index % 2 !== 0 && part) {
        return (
          <span key={index} className={highlightClassName}>
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }, [text, highlightClassName]);

  return <span className={className}>{parts}</span>;
}