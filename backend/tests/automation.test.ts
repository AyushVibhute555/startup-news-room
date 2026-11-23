import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { Story } from '../src/models/Story.js';
import { ensureCategory } from './helpers.js';

const apiKey = process.env.AUTOMATION_API_KEY!;

const automationStory = {
    headline: 'Automation API Creates A Fully Valid Story',
    summary: 'A sufficiently long subheading for the automation API test story body.',
    content: 'The full news article content is required and supplied by the automation.',
    imageUrl: 'https://images.example.com/automation.jpg',
    imageCredit: 'Company press kit',
    author: 'SNR Desk',
    category: 'ai',
    tags: ['automation'],
    companies: ['Acme'],
    region: 'India',
    city: 'Bengaluru',
    fundingDetails: { amountINR: '₹10 crore', round: 'Seed', investors: ['Example Fund'] },
    homepageSlot: 'none',
    isFeatured: false,
    isBreaking: false,
    status: 'draft',
};

describe('automation publishing API', () => {
    it('requires a valid key for story creation and media upload', async () => {
        const missingKey = await request(app).post('/api/v1/stories').send(automationStory);
        expect(missingKey.status).toBe(401);

        const wrongKey = await request(app)
            .post('/api/v1/stories')
            .set('X-API-Key', 'incorrect-automation-api-key')
            .send(automationStory);
        expect(wrongKey.status).toBe(401);

        const unauthorizedMedia = await request(app)
            .post('/api/v1/media')
            .attach('image', Buffer.from('not an image'), 'image.png');
        expect(unauthorizedMedia.status).toBe(401);
    });

    it('creates a draft and safely replays an idempotent request', async () => {
        await ensureCategory('ai', 'AI', 1);
        const key = 'daily-automation-story-2026-11-19';

        const created = await request(app)
            .post('/api/v1/stories')
            .set('X-API-Key', apiKey)
            .set('Idempotency-Key', key)
            .send(automationStory);
        expect(created.status).toBe(201);
        expect(created.body.data).toMatchObject({
            slug: 'automation-api-creates-a-fully-valid-story',
            url: 'https://startupnewsroom.in/news/automation-api-creates-a-fully-valid-story',
        });
        expect(created.body.data.id).toBeTruthy();

        const story = await Story.findById(created.body.data.id);
        expect(story?.status).toBe('draft');
        expect(story?.createdBy).toBeNull();

        const replay = await request(app)
            .post('/api/v1/stories')
            .set('X-API-Key', apiKey)
            .set('Idempotency-Key', key)
            .send(automationStory);
        expect(replay.status).toBe(200);
        expect(replay.headers['idempotency-replayed']).toBe('true');
        expect(replay.body.data.id).toBe(created.body.data.id);
        expect(await Story.countDocuments({ title: automationStory.headline })).toBe(1);
    });

    it('rejects invalid story fields and idempotency key reuse with a different payload', async () => {
        const invalid = await request(app)
            .post('/api/v1/stories')
            .set('X-API-Key', apiKey)
            .send({ ...automationStory, content: '  ' });
        expect(invalid.status).toBe(400);

        await ensureCategory('ai', 'AI', 1);
        const idempotencyKey = 'same-key-different-payload';
        await request(app)
            .post('/api/v1/stories')
            .set('X-API-Key', apiKey)
            .set('Idempotency-Key', idempotencyKey)
            .send(automationStory)
            .expect(201);

        const conflict = await request(app)
            .post('/api/v1/stories')
            .set('X-API-Key', apiKey)
            .set('Idempotency-Key', idempotencyKey)
            .send({ ...automationStory, summary: 'A different sufficiently long subheading for the idempotency check.' });
        expect(conflict.status).toBe(409);
    });

    it('validates uploaded image content before sending it to Cloudinary', async () => {
        const response = await request(app)
            .post('/api/v1/media')
            .set('X-API-Key', apiKey)
            .attach('image', Buffer.from('not an image'), 'image.png');
        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    it('changes only the submitted field in a story update', async () => {
        await ensureCategory('ai', 'AI', 1);
        const story = await Story.create({
            title: 'Automation Headline Before Single Field Update',
            summary: 'A sufficiently long subheading for the single-field automation update test.',
            content: 'The unchanged article content for the single-field automation update test.',
            imageUrl: 'https://images.example.com/single-field-update.jpg',
            author: 'Original Author',
            categories: ['ai'],
            tags: ['original-tag'],
            companies: ['Original Company'],
            region: 'India',
            city: 'Bengaluru',
            status: 'draft',
            homepageSlot: 'top',
        });
        const unchangedFields =
            'slug summary content author imageUrl imageCredit sourceName sourceUrl category categories region city companies keyFacts fundingDetails isSponsored sponsorName homepageSlot breakingExpiresAt breakingStartedAt tags status publishedAt isFeatured isBreaking createdBy';
        const before = await Story.findById(story.id).select(unchangedFields).lean();

        const response = await request(app)
            .patch(`/api/v1/stories/${story.id}`)
            .set('X-API-Key', apiKey)
            .send({ headline: 'Automation Headline After Single Field Update' });

        expect(response.status).toBe(200);
        expect(response.body.data.headline).toBe('Automation Headline After Single Field Update');
        expect(response.body.data.slug).toBe(story.slug);

        const updated = await Story.findById(story.id);
        const after = await Story.findById(story.id).select(unchangedFields).lean();
        expect(updated?.title).toBe('Automation Headline After Single Field Update');
        expect(after).toEqual(before);
    });

    it('updates stories using the automation key and supports headline, hero, and breaking changes', async () => {
        await ensureCategory('ai', 'AI', 1);
        const previousHero = await Story.create({
            title: 'Previous Hero Before Automation Update Test',
            summary: 'A sufficiently long subheading for the previous hero story test.',
            content: 'Previous hero article content used for the automation test.',
            imageUrl: 'https://images.example.com/previous-hero.jpg',
            categories: ['ai'],
            homepageSlot: 'lead',
        });
        const story = await Story.create({
            title: 'Automation Story Update Route Test',
            summary: 'A sufficiently long subheading for the automation story update test.',
            content: 'The full article content used for the automation update route.',
            imageUrl: 'https://images.example.com/update.jpg',
            categories: ['ai'],
            isBreaking: true,
        });

        const unauthorized = await request(app)
            .patch(`/api/v1/stories/${story.id}`)
            .send({ isBreaking: false });
        expect(unauthorized.status).toBe(401);

        const update = await request(app)
            .patch(`/api/v1/stories/${story.id}`)
            .set('X-API-Key', apiKey)
            .send({
                headline: 'Automation Story Updated With A Corrected Headline',
                homepageSlot: 'lead',
                isBreaking: false,
            });
        expect(update.status).toBe(200);
        expect(update.body.data).toMatchObject({
            id: story.id,
            headline: 'Automation Story Updated With A Corrected Headline',
            homepageSlot: 'lead',
            isBreaking: false,
        });
        expect(update.body.data.slug).toBe(story.slug);

        const stored = await Story.findById(story.id);
        expect(stored?.title).toBe('Automation Story Updated With A Corrected Headline');
        expect(stored?.breakingExpiresAt).toBeNull();
        const demotedHero = await Story.findById(previousHero.id);
        expect(demotedHero?.homepageSlot).toBe('none');
        expect(demotedHero?.content).toContain('Previous hero article content');
    });

    it('rejects empty updates and unknown story IDs', async () => {
        const empty = await request(app)
            .patch('/api/v1/stories/507f1f77bcf86cd799439011')
            .set('X-API-Key', apiKey)
            .send({});
        expect(empty.status).toBe(400);

        const missing = await request(app)
            .patch('/api/v1/stories/507f1f77bcf86cd799439011')
            .set('X-API-Key', apiKey)
            .send({ isBreaking: false });
        expect(missing.status).toBe(404);
    });
});
