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
});