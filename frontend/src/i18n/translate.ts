// frontend/src/i18n/translate.ts
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const cache = new Map<string, string>();

function cacheKey(text: string, lang: string): string {
    return `${lang}::${text}`;
}

export async function translateText(text: string, targetLang: string, retries = 2): Promise<string> {
    if (!text || targetLang === "en") return text;

    const key = cacheKey(text, targetLang);
    if (cache.has(key)) return cache.get(key)!;

    try {
        const res = await fetch(`${API_URL}/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, targetLang }),
        });

        if (!res.ok) {
            if (res.status === 429 && retries > 0) {
                await new Promise(r => setTimeout(r, 2000));
                return translateText(text, targetLang, retries - 1);
            }
            throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        const result = json.data.translated;

        // 👈 ONLY CACHE IF IT ACTUALLY TRANSLATED (Prevents caching English fallback)
        if (result !== text) {
            cache.set(key, result);
        }

        return result;
    } catch (err) {
        console.warn("Translation failed, using English fallback", err);
        return text;
    }
}

export async function translateBatch(
    texts: string[],
    targetLang: string,
    concurrency = 3,
): Promise<string[]> {
    if (targetLang === "en" || texts.length === 0) return texts;

    const results = [...texts];
    const pending: number[] = [];

    texts.forEach((t, i) => {
        const key = cacheKey(t, targetLang);
        if (cache.has(key)) results[i] = cache.get(key)!;
        else pending.push(i);
    });

    for (let i = 0; i < pending.length; i += concurrency) {
        const batch = pending.slice(i, i + concurrency);
        await Promise.all(
            batch.map(async (idx) => {
                results[idx] = await translateText(texts[idx]!, targetLang);
            }),
        );
    }

    return results;
}

export function clearTranslationCache(): void {
    cache.clear();
}