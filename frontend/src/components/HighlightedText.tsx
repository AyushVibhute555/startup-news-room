import { useMemo } from "react";

interface HighlightedTextProps {
  text: string;
  className?: string;
  highlightClassName?: string;
}

// Matches: $100M, $100 million, ₹100 Cr, 100 million, Series A, IPO, etc.
const HIGHLIGHT_REGEX = /((?:\$|€|£|₹|¥)\s?\d+(?:\.\d+)?(?:\s?(?:million|billion|thousand|crore|lakh|m|b|k))?\b|\b\d+(?:\.\d+)?\s?(?:million|billion|thousand|crore|lakh|m|b|k)\b|\b(?:Series\s[A-Z]|Seed|IPO|Unicorn)\b)/gi;

export function HighlightedText({
  text,
  className,
  highlightClassName = "text-signal",
}: HighlightedTextProps) {
  const parts = useMemo(() => {
    if (!text) return [];
    const split = text.split(HIGHLIGHT_REGEX);
    return split.map((part, index) => {
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