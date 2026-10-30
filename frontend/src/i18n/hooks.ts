// src/i18n/hooks.ts
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateBatch, translateText } from "./translate";
import type { Story } from "@/types/story";

/** Translate a single string whenever the language changes. */
export function useTranslatedText(text: string | undefined): string {
    const { i18n } = useTranslation();
    const lang = i18n.language;
    const [out, setOut] = useState(text ?? "");

    useEffect(() => {
        if (!text) {
            setOut("");
            return;
        }
        if (lang === "en") {
            setOut(text);
            return;
        }
        let alive = true;
        // Show original immediately; swap in translation when ready
        setOut(text);
        translateText(text, lang).then((t) => {
            if (alive) setOut(t);
        });
        return () => {
            alive = false;
        };
    }, [text, lang]);

    return out;
}

/** Translate titles + summaries of a story list. Returns English while translating. */
export function useTranslatedStories(stories: Story[]): Story[] {
    const { i18n } = useTranslation();
    const lang = i18n.language;
    const [out, setOut] = useState<Story[]>(stories);

    useEffect(() => {
        if (lang === "en" || stories.length === 0) {
            setOut(stories);
            return;
        }
        let alive = true;
        setOut(stories); // show English immediately

        (async () => {
            const titles = await translateBatch(stories.map((s) => s.title), lang);
            const summaries = await translateBatch(stories.map((s) => s.summary), lang);
            if (!alive) return;
            setOut(
                stories.map((s, i) => ({
                    ...s,
                    title: titles[i] ?? s.title,
                    summary: summaries[i] ?? s.summary,
                })),
            );
        })();

        return () => {
            alive = false;
        };
    }, [stories, lang]);

    return out;
}