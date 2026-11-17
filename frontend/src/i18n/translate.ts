import { translateTextApi } from "@/lib/api";

const cache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();

function cacheKey(text: string, lang: string): string {
  return `${lang}::${text}`;
}

/** Translate a single string via our secure backend proxy. */
export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === "en") return text;

  const key = cacheKey(text, targetLang);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = translateTextApi(text, targetLang)
    .then((translated) => {
      if (inFlight.get(key) === request) cache.set(key, translated);
      return translated;
    })
    .catch((error: unknown) => {
      console.error("Translation failed, falling back to English:", error);
      return text;
    })
    .finally(() => {
      if (inFlight.get(key) === request) inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

/** Translate an array of strings in parallel. */
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
    const hit = cache.get(key);
    if (hit !== undefined) results[i] = hit;
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
  inFlight.clear();
}
