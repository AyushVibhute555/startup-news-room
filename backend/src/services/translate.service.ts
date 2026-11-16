// backend/src/services/translate.service.ts
import { Translation } from '../models/Translation.js';

const GLOSSARY: Record<string, string> = {
    'Series A': '[SERIES_A]', 'Series B': '[SERIES_B]', 'Series C': '[SERIES_C]',
    'Seed round': '[SEED_ROUND]', 'Pre-seed': '[PRE_SEED]', 'IPO': '[IPO]',
    'SaaS': '[SAAS]', 'AI': '[AI]', 'Unicorn': '[UNICORN]', 'Fintech': '[FINTECH]',
    'Bootstrap': '[BOOTSTRAP]', 'Venture Capital': '[VC]', 'Angel investor': '[ANGEL]',
};

// In-memory lock to prevent duplicate concurrent requests
const inFlightTranslations = new Map<string, Promise<string>>();

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

    const langMap = (nativeTerms[lang] || nativeTerms['hi']) as Record<string, string>;
    for (const [token, nativeWord] of Object.entries(langMap)) {
        restoredText = restoredText.replace(new RegExp(token, 'g'), nativeWord);
    }
    return restoredText;
}

function chunkText(text: string, maxLen: number = 1500): string[] {
    if (text.length <= maxLen) return [text];
    const chunks: string[] = [];
    let current = '';
    const blocks = text.split(/(?<=<\/p>|<\/li>|<\/tr>)/i);

    for (const block of blocks) {
        if (current.length + block.length > maxLen) {
            if (current) chunks.push(current);
            current = block;
        } else {
            current += block;
        }
    }
    if (current) chunks.push(current);
    return chunks.length > 0 ? chunks : [text];
}

export async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text || targetLang === 'en') return text;

    const cacheKey = `${targetLang}::${text}`;

    // 1. Check Database Cache
    const cached = await Translation.findOne({ originalText: text, targetLang });
    if (cached) return cached.translatedText;

    // 2. Check In-Memory Lock (Prevents simultaneous identical requests)
    if (inFlightTranslations.has(cacheKey)) {
        return inFlightTranslations.get(cacheKey)!;
    }

    // 3. Create the Translation Promise
    const translationPromise = (async () => {
        try {
            const protectedText = protectJargon(text);
            const chunks = chunkText(protectedText, 1500);
            const translatedChunks: string[] = [];

            for (const chunk of chunks) {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(chunk)}`;

                // Add a small delay between chunk requests to avoid Google blocking
                await new Promise(r => setTimeout(r, 200));

                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                    }
                });

                if (!res.ok) throw new Error(`Google Translate API failed with ${res.status}`);

                const data = (await res.json()) as any;
                const translatedRaw = data[0].map((item: any) => item[0]).join('');
                translatedChunks.push(translatedRaw);
            }

            const finalTranslation = restoreJargon(translatedChunks.join(' '), targetLang);

            // Save to DB
            await Translation.create({
                originalText: text,
                targetLang,
                translatedText: finalTranslation,
            });

            return finalTranslation;
        } catch (error) {
            console.error('Translation error:', error);
            throw new Error('Translation failed');
        } finally {
            // Remove the lock regardless of success/failure
            inFlightTranslations.delete(cacheKey);
        }
    })();

    // Store the lock
    inFlightTranslations.set(cacheKey, translationPromise);
    return translationPromise;
}