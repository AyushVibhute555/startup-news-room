import { Translation } from '../models/Translation.js';

// 1. The Startup Glossary: Protect words that Google Translate ruins
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

    const langMap = nativeTerms[lang] || nativeTerms['hi'];

    for (const [token, nativeWord] of Object.entries(langMap)) {
        restoredText = restoredText.replace(new RegExp(token, 'g'), nativeWord);
    }
    return restoredText;
}

export async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text || targetLang === 'en') return text;

    // 1. Check Database Cache First (Zero API calls if already translated)
    const cached = await Translation.findOne({ originalText: text, targetLang });
    if (cached) return cached.translatedText;

    // 2. Protect Jargon
    const protectedText = protectJargon(text);

    try {
        // 3. Free Google Translate Scraper Endpoint
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(protectedText)}`;

        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!res.ok) return text;

        const data = await res.json();
        const translatedRaw = data[0].map((item: any) => item[0]).join('');

        // 4. Restore Jargon
        const finalTranslation = restoreJargon(translatedRaw, targetLang);

        // 5. Save to Database for next time
        await Translation.create({
            originalText: text,
            targetLang,
            translatedText: finalTranslation,
        });

        return finalTranslation;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
}