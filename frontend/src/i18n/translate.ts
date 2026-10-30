// src/i18n/translate.ts
// Client-side story content translation via Google Translate's public endpoint.
// Free, no API key. Cached in memory so each unique string is only translated once per session.

const ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const cache = new Map<string, string>();

type GTResponse = Array<Array<[string, string, ...unknown[]]>>;

function cacheKey(text: string, lang: string): string {
    return `${lang}::${text}`;
}

async function translateChunk(text: string, targetLang: string): Promise<string> {
    const url =
        `${ENDPOINT}?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as GTResponse;
    const segments = data[0];
    if (!Array.isArray(segments)) throw new Error("Unexpected translation response");
    return segments.map((seg) => seg[0]).join("");
}

/** Translate a single string. Falls back to the original on any error. */
export async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text || targetLang === "en") return text;

    const key = cacheKey(text, targetLang);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;

    // Google's URL endpoint chokes on very long strings — chunk at sentence boundaries.
    const MAX = 3500;
    const chunks: string[] = [];
    if (text.length <= MAX) {
        chunks.push(text);
    } else {
        const sentences = text.split(/(?<=[.!?])\s+/);
        let current = "";
        for (const s of sentences) {
            if (current.length + s.length + 1 > MAX && current) {
                chunks.push(current);
                current = s;
            } else {
                current = current ? `${current} ${s}` : s;
            }
        }
        if (current) chunks.push(current);
    }

    try {
        const parts: string[] = [];
        for (const chunk of chunks) {
            parts.push(await translateChunk(chunk, targetLang));
        }
        const result = parts.join(" ");
        cache.set(key, result);
        return result;
    } catch {
        // Any failure → fall back to original English
        return text;
    }
}

/** Translate an array of strings in parallel with a concurrency cap. */
export async function translateBatch(
    texts: string[],
    targetLang: string,
    concurrency = 5,
): Promise<string[]> {
    if (targetLang === "en" || texts.length === 0) return texts;

    const results = [...texts];
    const pending: number[] = [];

    texts.forEach((t, i) => {
        const key = cacheKey(t, targetLang);
        const hit = cache.get(key);
        if (hit !== undefined) results[i] = hit;
        else pending.push(i);
    });

    // Process pending in batches of `concurrency`
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