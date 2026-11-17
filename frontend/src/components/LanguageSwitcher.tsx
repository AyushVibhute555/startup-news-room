import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
    const { i18n } = useTranslation();

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Globe className="h-4 w-4 shrink-0 opacity-70" />
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                    const selected = i18n.language === lang.code;
                    return (
                        <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                                // 1. Change the language
                                void i18n.changeLanguage(lang.code);

                                // 2. Update the URL so it can be copied and shared
                                const url = new URL(window.location.href);
                                if (lang.code === "en") {
                                    // Keep English URLs clean by removing the ?lang= param
                                    url.searchParams.delete("lang");
                                } else {
                                    // Add ?lang=kn, ?lang=hi, etc.
                                    url.searchParams.set("lang", lang.code);
                                }
                                // replaceState updates the URL without reloading the page
                                window.history.replaceState({}, "", url.toString());
                            }}
                            className={cn(
                                "rounded px-1.5 py-1 text-sm transition-all duration-200",
                                selected
                                    ? "font-bold opacity-100"
                                    : "font-medium opacity-60 hover:opacity-100 hover:text-signal"
                            )}
                        >
                            {lang.nativeName}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}