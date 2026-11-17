import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Translation } from '../src/models/Translation.js';
import { translateText } from '../src/services/translate.service.js';

const originalFetch = globalThis.fetch;

describe('translateText', () => {
    beforeEach(async () => {
        await Translation.deleteMany({});
        globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
            const url = new URL(String(input));
            const text = url.searchParams.get('q') ?? '';
            return new Response(JSON.stringify([[[text]]]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }) as typeof fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('translates long text in bounded chunks without losing whitespace', async () => {
        const source = 'A news headline and article paragraph. '.repeat(100);

        const translated = await translateText(source, 'hi');
        const requests = vi.mocked(globalThis.fetch).mock.calls;

        expect(translated).toBe(source);
        expect(requests.length).toBeGreaterThan(1);
        for (const [input] of requests) {
            const url = new URL(String(input));
            expect(url.searchParams.get('q')!.length).toBeLessThanOrEqual(1500);
        }
    });

    it('uses the Google client endpoint when Google is rate-limited', async () => {
        globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
            const url = new URL(String(input));
            if (url.hostname === 'translate.googleapis.com') {
                return new Response('Rate limited', { status: 429 });
            }

            if (url.hostname === 'clients5.google.com') {
                return new Response(JSON.stringify(['नमस्ते दुनिया']), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            throw new Error('Unexpected translation provider');
        }) as typeof fetch;

        await expect(translateText('Hello world', 'hi')).resolves.toBe('नमस्ते दुनिया');
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('replaces cached one-character translations with a complete headline', async () => {
        const source = "MakeMyTrip's India arm gets SEBI nod for an IPO that could raise over $1 billion";
        const completeTranslation =
            'मेकमायट्रिप की भारतीय शाखा को आईपीओ के लिए सेबी की मंजूरी मिल गई है';
        await Translation.create({
            originalText: source,
            targetLang: 'hi',
            translatedText: 'म',
        });

        globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
            const url = new URL(String(input));
            if (url.hostname === 'translate.googleapis.com') {
                return new Response(JSON.stringify([[['म']]]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            if (url.hostname === 'clients5.google.com') {
                return new Response(JSON.stringify([completeTranslation]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            throw new Error('Unexpected translation provider');
        }) as typeof fetch;

        await expect(translateText(source, 'hi')).resolves.toBe(completeTranslation);
        const refreshed = await Translation.findOne({ originalText: source, targetLang: 'hi' });
        expect(refreshed?.translatedText).toBe(completeTranslation);
    });
});
