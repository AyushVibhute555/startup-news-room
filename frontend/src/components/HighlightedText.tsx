import { useMemo } from "react";
import { tokenizeHighlights } from "@/lib/highlight";
import { cn } from "@/lib/utils";

interface HighlightedTextProps {
  text: string;
  className?: string;
  onLogoGrey?: boolean;
}

export function HighlightedText({ text, className, onLogoGrey = false }: HighlightedTextProps) {
  const tokens = useMemo(() => tokenizeHighlights(text), [text]);

  return (
    <span className={className}>
      {tokens.map((token, index) =>
        token.isHighlighted ? (
          <span
            key={index}
            className={cn(onLogoGrey ? "text-signal-strong font-semibold" : "text-signal")}
          >
            {token.text}
          </span>
        ) : (
          token.text
        ),
      )}
    </span>
  );
}
