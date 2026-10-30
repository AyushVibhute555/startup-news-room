// src/components/TranslatedText.tsx
import { useTranslatedText } from "@/i18n/hooks";

interface Props {
    text: string;
    className?: string;
    as?: keyof React.JSX.IntrinsicElements;
}

export function TranslatedText({ text, className, as: Tag = "span" }: Props) {
    const translated = useTranslatedText(text);
    const Component = Tag as React.ElementType;
    return <Component className={className}>{translated}</Component>;
}