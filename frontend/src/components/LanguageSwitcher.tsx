// src/components/LanguageSwitcher.tsx
import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SUPPORTED_LANGUAGES } from "@/i18n";

export function LanguageSwitcher() {
    const { i18n, t } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const current =
        SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={t("header.changeLanguage")}
                aria-expanded={open}
                aria-haspopup="listbox"
                className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{current.nativeName}</span>
            </button>

            {open && (
                <ul
                    role="listbox"
                    className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded border border-border bg-background shadow-lg"
                >
                    {SUPPORTED_LANGUAGES.map((lang) => {
                        const selected = i18n.language === lang.code;
                        return (
                            <li key={lang.code} role="option" aria-selected={selected}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        void i18n.changeLanguage(lang.code);
                                        setOpen(false);
                                    }}
                                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                                >
                                    <span>{lang.nativeName}</span>
                                    {selected && <Check className="h-4 w-4 text-signal" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}