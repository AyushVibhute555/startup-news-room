// src/components/TranslatedHighlightedText.tsx
import { useTranslatedText } from "@/i18n/hooks";
import { HighlightedText } from "./HighlightedText";

export function TranslatedHighlightedText({
    text,
    className,
    highlightClassName,
}: {
    text: string;
    className?: string;
    highlightClassName?: string;
}) {
    const translated = useTranslatedText(text);
    return (
        <HighlightedText
            text={translated}
            className={className}
            highlightClassName={highlightClassName}
        />
    );
}