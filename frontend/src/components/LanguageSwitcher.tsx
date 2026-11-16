import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    const handleLanguageChange = (code: string) => {
        void i18n.changeLanguage(code);
        const url = new URL(window.location.href);
        if (code === "en") {
            url.searchParams.delete("lang");
        } else {
            url.searchParams.set("lang", code);
        }
        window.history.replaceState({}, "", url.toString());
    };

    return (
        <div className={cn("flex items-center gap-2.5 text-[13px]", className)}>
            {SUPPORTED_LANGUAGES.map((lang, index) => (
                <div key={lang.code} className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => handleLanguageChange(lang.code)}
                        className={cn(
                            "transition-colors duration-200",
                            currentLang === lang.code
                                ? "font-bold text-signal"
                                : "text-[#565C5A] hover:text-[#101312]"
                        )}
                    >
                        {lang.nativeName}
                    </button>

                    {/* Subtle dot separator */}
                    {index < SUPPORTED_LANGUAGES.length - 1 && (
                        <span className="text-[#101312]/20 text-[10px]" aria-hidden>
                            •
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}