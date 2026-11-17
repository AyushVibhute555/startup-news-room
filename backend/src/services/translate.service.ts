import { Translation } from '../models/Translation.js';

const MAX_TRANSLATION_CHUNK_LENGTH = 1500;
const inFlightTranslations = new Map<string, Promise<string>>();

// 1. The Startup Glossary
const GLOSSARY: Record<string, string> = {
    'Series A': '[SERIES_A]',
    'Series B': '[SERIES_B]',
    'Series C': '[SERIES_C]',
    'Seed round': '[SEED_ROUND]',
    'Pre-seed': '[PRE_SEED]',
    'IPO': '[IPO]',
    'SaaS': '[SAAS]',
    'AI': '[AI]',
    'Unicorn': '[UNICORN]',
    'Fintech': '[FINTECH]',
    'Bootstrap': '[BOOTSTRAP]',
    'Venture Capital': '[VC]',
    'Angel investor': '[ANGEL]',
};

function protectJargon(text: string): string {
    let protectedText = text;
    for (const [term, token] of Object.entries(GLOSSARY)) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        protectedText = protectedText.replace(regex, token);
    }
    return protectedText;
}

function restoreJargon(text: string, lang: string): string {
    let restoredText = text;

    const nativeTerms: Record<string, Record<string, string>> = {
        hi: {
            '[SERIES_A]': 'सीरीज़ A', '[SERIES_B]': 'सीरीज़ B', '[SERIES_C]': 'सीरीज़ C',
            '[SEED_ROUND]': 'सीड राउंड', '[PRE_SEED]': 'प्री-सीड', '[IPO]': 'आईपीओ',
            '[SAAS]': 'सास', '[AI]': 'एआई', '[UNICORN]': 'यूनिकॉर्न',
            '[FINTECH]': 'फिनटेक', '[BOOTSTRAP]': 'बूटस्ट्रैप', '[VC]': 'वीसी', '[ANGEL]': 'एंजल',
        },
        kn: {
            '[SERIES_A]': 'ಸರಣಿ A', '[SERIES_B]': 'ಸರಣಿ B', '[SERIES_C]': 'ಸರಣಿ C',
            '[SEED_ROUND]': 'ಸೀಡ್ ರೌಂಡ್', '[PRE_SEED]': 'ಪ್ರೀ-ಸೀಡ್', '[IPO]': 'ಐಪಿಒ',
            '[SAAS]': 'ಸಾಸ್', '[AI]': 'ಎಐ', '[UNICORN]': 'ಯುನಿಕಾರ್ನ್',
            '[FINTECH]': 'ಫಿನ್‌ಟೆಕ್', '[BOOTSTRAP]': 'ಬೂಟ್‌ಸ್ಟ್ರಾಪ್', '[VC]': 'ವಿಸಿ', '[ANGEL]': 'ಏಂಜೆಲ್',
        },
        te: {
            '[SERIES_A]': 'సిరీస్ A', '[SERIES_B]': 'సిరీస్ B', '[SERIES_C]': 'సిరీస్ C',
            '[SEED_ROUND]': 'సీడ్ రౌండ్', '[PRE_SEED]': 'ప్రీ-సీడ్', '[IPO]': 'ఐపీఓ',
            '[SAAS]': 'సాస్', '[AI]': 'ఏఐ', '[UNICORN]': 'యూనికార్న్',
            '[FINTECH]': 'ఫిన్‌టెక్', '[BOOTSTRAP]': 'బూట్‌స్ట్రాప్', '[VC]': 'వీసీ', '[ANGEL]': 'ఏంజెల్',
        },
    };

    // 👇 FIX 1: Explicitly tell TypeScript this will always be a Record
    const langMap = (nativeTerms[lang] || nativeTerms['hi']) as Record<string, string>;

    for (const [token, nativeWord] of Object.entries(langMap)) {
        restoredText = restoredText.split(token).join(nativeWord);
    }
    return restoredText;
}

function splitText(text: string, maxLength = MAX_TRANSLATION_CHUNK_LENGTH): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > maxLength) {
        let boundary = remaining.lastIndexOf(' ', maxLength);
        if (boundary <= 0) boundary = maxLength;
        chunks.push(remaining.slice(0, boundary));
        remaining = remaining.slice(boundary);
    }

    if (remaining) chunks.push(remaining);
    return chunks;
}

function isUsableTranslation(source: string, translated: string): boolean {
    const sourceLength = source.replace(/\s/g, '').length;
    const translatedLength = translated.replace(/\s/g, '').length;
    const minimumLength = Math.min(3, Math.ceil(sourceLength * 0.1));
    const introducedBrackets = !source.includes('[') && /\[[^\]]+\]/.test(translated);
    return translatedLength >= minimumLength && !introducedBrackets;
}

async function translateWithGoogle(text: string, targetLang: string): Promise<string> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!res.ok) {
        throw new Error(`Translation provider returned ${res.status}`);
    }

    const data: unknown = await res.json();
    if (
        !Array.isArray(data) ||
        !Array.isArray(data[0]) ||
        !data[0].every((item: unknown) => Array.isArray(item) && typeof item[0] === 'string')
    ) {
        throw new Error('Translation provider returned an invalid response');
    }

    const translatedRaw = data[0].map((item: [string]) => item[0]).join('');
    return translatedRaw;
}

async function translateWithGoogleClient(text: string, targetLang: string): Promise<string> {
    const url = new URL('https://clients5.google.com/translate_a/t');
    url.searchParams.set('client', 'dict-chrome-ex');
    url.searchParams.set('sl', 'en');
    url.searchParams.set('tl', targetLang);
    url.searchParams.set('q', text);

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`Google translation fallback returned ${res.status}`);
    }

    const data: unknown = await res.json();
    if (!Array.isArray(data) || !data.every((item: unknown) => typeof item === 'string')) {
        throw new Error('Google translation fallback returned an invalid response');
    }

    return data.join('');
}

async function translateWithMyMemory(text: string, targetLang: string): Promise<string> {
    const chunks = splitText(text, 450);
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
        if (translatedChunks.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const leadingWhitespace = chunk.match(/^\s*/)?.[0] ?? '';
        const trailingWhitespace = chunk.match(/\s*$/)?.[0] ?? '';
        const end = chunk.length - trailingWhitespace.length;
        const translatableText = chunk.slice(leadingWhitespace.length, end);

        if (!translatableText) {
            translatedChunks.push(`${leadingWhitespace}${trailingWhitespace}`);
            continue;
        }

        const url = new URL('https://api.mymemory.translated.net/get');
        url.searchParams.set('q', translatableText);
        url.searchParams.set('langpair', `en|${targetLang}`);

        const res = await fetch(url, {
            headers: { 'User-Agent': 'StartupNewsRoom/1.0' },
        });
        if (!res.ok) {
            throw new Error(`MyMemory returned ${res.status}`);
        }

        const data = (await res.json()) as {
            responseStatus?: number;
            responseDetails?: string;
            responseData?: { translatedText?: string };
        };
        if (data.responseStatus !== 200 || typeof data.responseData?.translatedText !== 'string') {
            throw new Error(data.responseDetails || 'MyMemory returned an invalid response');
        }

        translatedChunks.push(
            `${leadingWhitespace}${data.responseData.translatedText}${trailingWhitespace}`,
        );
    }

    return translatedChunks.join('');
}

async function translateChunk(text: string, targetLang: string): Promise<string> {
    const protectedText = protectJargon(text);
    const providers = [
        {
            translate: () => translateWithGoogle(protectedText, targetLang),
            restoreJargon: true,
        },
        {
            translate: () => translateWithGoogleClient(text, targetLang),
            restoreJargon: false,
        },
        {
            translate: () => translateWithMyMemory(text, targetLang),
            restoreJargon: false,
        },
    ];
    const errors: unknown[] = [];

    for (const provider of providers) {
        try {
            const translatedRaw = await provider.translate();
            const translated = provider.restoreJargon
                ? restoreJargon(translatedRaw, targetLang)
                : translatedRaw;
            if (!isUsableTranslation(text, translated)) {
                throw new Error('Translation provider returned an incomplete translation');
            }
            return translated;
        } catch (error) {
            errors.push(error);
        }
    }

    const reasons = errors
        .map((error) => (error instanceof Error ? error.message : String(error)))
        .join('; ');
    throw new Error(`All translation providers failed: ${reasons}`, { cause: errors[0] });
}

export async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text || targetLang === 'en') return text;

    const cached = await Translation.findOne({ originalText: text, targetLang });
    if (cached && isUsableTranslation(text, cached.translatedText)) {
        return cached.translatedText;
    }

    const cacheKey = `${targetLang}::${text}`;
    const pending = inFlightTranslations.get(cacheKey);
    if (pending) return pending;

    const translationPromise = (async () => {
        const chunks = splitText(text);
        const translatedChunks: string[] = [];
        for (const chunk of chunks) {
            if (translatedChunks.length > 0) {
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
            const leadingWhitespace = chunk.match(/^\s*/)?.[0] ?? '';
            const trailingWhitespace = chunk.match(/\s*$/)?.[0] ?? '';
            const end = chunk.length - trailingWhitespace.length;
            const translatableText = chunk.slice(leadingWhitespace.length, end);
            const translated = translatableText
                ? await translateChunk(translatableText, targetLang)
                : '';
            translatedChunks.push(`${leadingWhitespace}${translated}${trailingWhitespace}`);
        }

        const finalTranslation = translatedChunks.join('');
        if (cached) {
            await Translation.updateOne(
                { _id: cached._id },
                { $set: { translatedText: finalTranslation } },
            );
        } else {
            await Translation.create({
                originalText: text,
                targetLang,
                translatedText: finalTranslation,
            });
        }

        return finalTranslation;
    })();

    inFlightTranslations.set(cacheKey, translationPromise);
    try {
        return await translationPromise;
    } finally {
        inFlightTranslations.delete(cacheKey);
    }
}