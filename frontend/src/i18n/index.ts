// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";
import te from "./locales/te.json";

export const SUPPORTED_LANGUAGES = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            hi: { translation: hi },
            kn: { translation: kn },
            te: { translation: te },
        },
        fallbackLng: "en",
        supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
        interpolation: { escapeValue: false },
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
            lookupLocalStorage: "snr_language",
        },
    });

// Keep <html lang="…"> in sync for accessibility and SEO.
function applyHtmlLang(lng: string) {
    if (typeof document !== "undefined") {
        document.documentElement.lang = lng;
    }
}
applyHtmlLang(i18n.language);
i18n.on("languageChanged", applyHtmlLang);

export default i18n;