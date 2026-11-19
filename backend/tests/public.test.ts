import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { Story } from '../src/models/Story.js';
import { ensureCategory, storyPayload } from './helpers.js';

beforeAll(async () => {
    await ensureCategory('ai', 'AI', 1);
    await ensureCategory('fintech', 'Fintech', 2);
});

describe('public story visibility', () => {
    it('preserves ampersands in new headlines and removes symbols from generated slugs', async () => {
        const headline = await Story.create(
            storyPayload({ title: 'Test & check', author: 'SNR Desk' }),
        );
        const financialHeadline = await Story.create(
            storyPayload({ title: 'Test raises $5 million, up 20%' }),
        );

        expect(headline.title).toBe('Test & check');
        expect(headline.slug).toBe('test-check');
        expect(financialHeadline.slug).toBe('test-raises-5-million-up-20');

        const response = await request(app).get(`/api/v1/stories/${headline.slug}`);
        expect(response.body.data.title).toBe('Test & check');
        expect(response.body.data.author).toBe('SNR Desk');
    });

    it('serves complete sitemap and RSS XML for published stories', async () => {
        const publishedAt = new Date('2025-02-01T10:00:00.000Z');
        const story = await Story.create(
            storyPayload({
                title: 'Startup Raises $5M & Expands Into Europe',
                summary: 'A sufficiently long summary with & symbols for XML feed checks.',
                publishedAt,
            }),
        );

        const sitemap = await request(app).get('/api/v1/sitemap.xml');
        expect(sitemap.headers['content-type']).toContain('application/xml');
        expect(sitemap.text).toContain(`https://startupnewsroom.in/news/${story.slug}`);
        expect(sitemap.text).toContain('<lastmod>');

        const rss = await request(app).get('/api/v1/rss.xml');
        expect(rss.headers['content-type']).toContain('application/rss+xml');
        expect(rss.text).toContain('<title>Startup Raises $5M &amp; Expands Into Europe</title>');
        expect(rss.text).toContain('<pubDate>Sat, 01 Feb 2025 10:00:00 GMT</pubDate>');
        expect(rss.text).toContain(`https://startupnewsroom.in/news/${story.slug}`);
    });

    it('formats legacy plain-text article content when serving it without changing stored data', async () => {
        const story = await Story.create(
            storyPayload({ title: 'Legacy Plain Text Story Formatting Check' }),
        );
        const legacyContent = 'First paragraph.\n\nSecond paragraph.';
        await Story.collection.updateOne({ _id: story._id }, { $set: { content: legacyContent } });

        const response = await request(app).get(`/api/v1/stories/${story.slug}`);
        expect(response.status).toBe(200);
        expect(response.body.data.content).toContain('<p>First paragraph.</p>');
        expect(response.body.data.content).toContain('<p>Second paragraph.</p>');
        expect((await Story.findById(story._id))?.content).toBe(legacyContent);
    });

    it('hides drafts and future-dated stories', async () => {
        await Story.create(storyPayload({ title: 'Published Story Alpha For Visibility Test' }));

        await Story.create(
            storyPayload({
                title: 'Draft Story Beta For Visibility Test',
                status: 'draft',
            }),
        );

        const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await Story.create(
            storyPayload({
                title: 'Future Story Gamma For Visibility Test',
                status: 'published',
                publishedAt: future,
            }),
        );

        const res = await request(app).get('/api/v1/stories?limit=50');
        expect(res.status).toBe(200);
        const titles = res.body.data.map((s: { title: string }) => s.title);
        expect(titles).toContain('Published Story Alpha For Visibility Test');
        expect(titles).not.toContain('Draft Story Beta For Visibility Test');
        expect(titles).not.toContain('Future Story Gamma For Visibility Test');
    });

    it('does not expose internal fields', async () => {
        const res = await request(app).get('/api/v1/stories?limit=50');
        const first = res.body.data[0];
        expect(first).not.toHaveProperty('status');
        expect(first).not.toHaveProperty('createdBy');
        expect(first).not.toHaveProperty('__v');
    });

    it('paginates results', async () => {
        for (let i = 0; i < 12; i += 1) {
            await Story.create(
                storyPayload({
                    title: `Pagination Story Number ${i} With Long Enough Title`,
                }),
            );
        }

        const res = await request(app).get('/api/v1/stories?page=1&limit=5');
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(5);
        expect(res.body.pagination).toMatchObject({ page: 1, limit: 5, hasMore: true });
    });

    it('requires an automation key for date-based listings but keeps ordinary public listings public', async () => {
        const publicList = await request(app).get('/api/v1/stories');
        expect(publicList.status).toBe(200);

        const unauthorized = await request(app).get('/api/v1/stories?since=2026-11-17');
        expect(unauthorized.status).toBe(401);

        const invalidDate = await request(app)
            .get('/api/v1/stories?since=2026-02-30')
            .set('X-API-Key', process.env.AUTOMATION_API_KEY!);
        expect(invalidDate.status).toBe(400);
    });

    it('lists only public stories since the requested date with automation fields', async () => {
        const today = new Date();
        const todayString = today.toISOString().slice(0, 10);
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        await Story.create(storyPayload({
            title: 'Recent Automation API Story Listing Test',
            publishedAt: today,
            companies: ['Acme'],
            category: 'automation-date-test',
            categories: ['automation-date-test'],
        }));
        await Story.create(storyPayload({
            title: 'Old Automation API Story Listing Test',
            publishedAt: yesterday,
            category: 'automation-date-test',
            categories: ['automation-date-test'],
        }));
        await Story.create(storyPayload({
            title: 'Draft Automation API Story Listing Test',
            publishedAt: today,
            status: 'draft',
            category: 'automation-date-test',
            categories: ['automation-date-test'],
        }));

        const response = await request(app)
            .get(`/api/v1/stories?category=automation-date-test&since=${todayString}`)
            .set('X-API-Key', process.env.AUTOMATION_API_KEY!);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([
            expect.objectContaining({
                headline: 'Recent Automation API Story Listing Test',
                companies: ['Acme'],
                date: today.toISOString(),
            }),
        ]);
        expect(response.body.data[0]).toHaveProperty('slug');
    });

    it('filters by category', async () => {
        await ensureCategory('fintech', 'Fintech', 2);
        await Story.create(
            storyPayload({
                title: 'A Fintech Category Filter Test Story Here',
                category: 'fintech',
            }),
        );

        const res = await request(app).get('/api/v1/stories?category=fintech&limit=50');
        expect(res.status).toBe(200);
        expect(
            res.body.data.every(
                (s: { category?: string; categories?: string[] }) =>
                    s.category === 'fintech' || s.categories?.includes('fintech'),
            ),
        ).toBe(true);
    });

    it('includes both legacy and multi-category stories in category pages and counts', async () => {
        const categorySlug = 'ipo-markets-multi-test';
        await ensureCategory(categorySlug, 'IPO Markets test', 10);
        await Story.create(
            storyPayload({
                title: 'Legacy Single Category Story For Multi Category Test',
                category: categorySlug,
            }),
        );
        await Story.create(
            storyPayload({
                title: 'Multi Category Story For Category Compatibility Test',
                categories: [categorySlug, 'ai'],
            }),
        );

        const stories = await request(app).get(
            `/api/v1/stories?category=${categorySlug}&limit=50`,
        );
        expect(stories.status).toBe(200);
        expect(stories.body.pagination.total).toBe(2);
        expect(stories.body.data.map((story: { title: string }) => story.title)).toEqual(
            expect.arrayContaining([
                'Legacy Single Category Story For Multi Category Test',
                'Multi Category Story For Category Compatibility Test',
            ]),
        );

        const categories = await request(app).get('/api/v1/categories');
        const result = categories.body.data.find(
            (category: { slug: string }) => category.slug === categorySlug,
        );
        expect(result.storyCount).toBe(2);
    });

    it('searches using the text index', async () => {
        await Story.create(
            storyPayload({
                title: 'Quantum Zebra Analytics Platform Launch Story',
                summary:
                    'A summary about quantum zebra analytics that is long enough to pass validation rules easily.',
            }),
        );

        const res = await request(app).get('/api/v1/stories?q=zebra');
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('404s on unknown slugs', async () => {
        const res = await request(app).get('/api/v1/stories/does-not-exist');
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('NOT_FOUND');
    });
});

describe('slug behaviour', () => {
    it('generates a stable slug and only changes it on conflict', async () => {
        const a = await Story.create(
            storyPayload({ title: 'Unique Slug Story About Rocket Ships' }),
        );
        const slugA = a.slug;
        expect(slugA).toBe('unique-slug-story-about-rocket-ships');

        // Update should not change the slug.
        a.summary =
            'An updated summary that is long enough to pass the minimum character requirement.';
        await a.save();
        expect(a.slug).toBe(slugA);

        // A conflicting title should get a suffixed slug.
        const b = await Story.create(
            storyPayload({ title: 'Unique Slug Story About Rocket Ships' }),
        );
        expect(b.slug).not.toBe(slugA);
        expect(b.slug.startsWith(slugA)).toBe(true);
    });

    it('drops currency and percent symbols instead of transliterating them into slugs', async () => {
        const story = await Story.create(
            storyPayload({
                title: 'Olyv Raises ₹58 Crore As $100 Million Round Grows 39%',
            }),
        );

        expect(story.slug).toBe('olyv-raises-58-crore-as-100-million-round-grows-39');
    });

    it('enforces a single featured story', async () => {
        const a = await Story.create(storyPayload({ title: 'Featured Story Alpha One Test' }));
        const b = await Story.create(storyPayload({ title: 'Featured Story Beta Two Test' }));

        a.isFeatured = true;
        await a.save();

        b.isFeatured = true;
        await b.save();

        const featured = await Story.find({ isFeatured: true });
        expect(featured).toHaveLength(1);
        expect(String(featured[0]!._id)).toBe(String(b._id));
    });

    it('moves the hero slot from the previous story to the newly selected story', async () => {
        const previous = await Story.create(
            storyPayload({
                title: 'Previous Homepage Hero Story Test',
                homepageSlot: 'lead',
            }),
        );
        const next = await Story.create(
            storyPayload({
                title: 'New Homepage Hero Story Test',
                homepageSlot: 'lead',
            }),
        );

        expect((await Story.findById(previous._id))?.homepageSlot).toBe('none');
        expect((await Story.find({ homepageSlot: 'lead' }))).toHaveLength(1);
        expect(String((await Story.findOne({ homepageSlot: 'lead' }))?._id)).toBe(String(next._id));
    });

    it('expires breaking status after 24 hours and honors an earlier explicit expiry', async () => {
        const fresh = await Story.create(
            storyPayload({
                title: 'New Breaking Story Automatically Expires Test',
                isBreaking: true,
            }),
        );
        expect(fresh.breakingStartedAt).toBeInstanceOf(Date);
        expect(fresh.breakingExpiresAt!.getTime() - fresh.breakingStartedAt!.getTime())
            .toBe(24 * 60 * 60 * 1000);

        const capped = await Story.create(
            storyPayload({
                title: 'Breaking Story With A Longer Custom Expiry Test',
                isBreaking: true,
                breakingExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            }),
        );
        expect(capped.breakingExpiresAt!.getTime() - capped.breakingStartedAt!.getTime())
            .toBe(24 * 60 * 60 * 1000);

        const expired = await Story.create(
            storyPayload({
                title: 'Expired Breaking Story Visibility Test',
                isBreaking: true,
                breakingExpiresAt: new Date(Date.now() - 60 * 1000),
            }),
        );

        const detail = await request(app).get(`/api/v1/stories/${expired.slug}`);
        expect(detail.status).toBe(200);
        expect(detail.body.data.isBreaking).toBe(false);

        const breaking = await request(app).get('/api/v1/stories/breaking');
        expect(breaking.body.data.map((story: { slug: string }) => story.slug)).not.toContain(expired.slug);
        expect(breaking.body.data.map((story: { slug: string }) => story.slug)).toContain(fresh.slug);

        const oldLegacy = await Story.create(
            storyPayload({
                title: 'Legacy Breaking Story Expiration Test',
                isBreaking: true,
            }),
        );
        const legacyDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
        await Story.collection.updateOne(
            { _id: oldLegacy._id },
            {
                $set: {
                    breakingExpiresAt: null,
                    breakingStartedAt: null,
                    createdAt: legacyDate,
                    updatedAt: legacyDate,
                },
            },
        );
        const legacyResponse = await request(app).get(`/api/v1/stories/${oldLegacy.slug}`);
        expect(legacyResponse.body.data.isBreaking).toBe(false);
    });
});