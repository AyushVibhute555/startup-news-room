import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { NewsSubmission } from '../src/models/NewsSubmission.js';
import { Story } from '../src/models/Story.js';
import { storageService } from '../src/services/storage.service.js';
import { createUser, ensureCategory } from './helpers.js';

const ADMIN = { email: 'news-review-admin@example.com', password: 'NewsReviewPassword123', role: 'admin' as const };
const EDITOR = { email: 'news-review-editor@example.com', password: 'NewsReviewPassword123', role: 'editor' as const };
const imageBuffer = Buffer.from('89504e470d0a1a0a0000000d494844520000000100000001', 'hex');

async function accessToken(email: string, password: string): Promise<string> {
    const response = await request(app).post('/api/v1/auth/login').send({ email, password });
    return response.body.data.accessToken as string;
}

async function submitStory(email = 'reader@example.com') {
    return request(app)
        .post('/api/v1/news-submissions')
        .field('submitterName', 'Community Reader')
        .field('submitterEmail', email)
        .field('title', 'Community Report: New Startup Launches In Bengaluru')
        .field('summary', 'A community-submitted story with a long enough subheading for validation.')
        .field('content', 'The complete story text supplied by a community reader.')
        .field('category', 'ai')
        .attach('image', imageBuffer, { filename: 'story.png', contentType: 'image/png' });
}

beforeAll(async () => {
    await ensureCategory('ai', 'AI', 1);
    await createUser(ADMIN);
    await createUser(EDITOR);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('community news submissions', () => {
    it('stores a size-limited, validated submission for review without publishing it', async () => {
        vi.spyOn(storageService, 'uploadImage').mockResolvedValue({
            url: 'https://res.cloudinary.com/test/image/upload/community.png',
            width: 640,
            height: 480,
            publicId: 'community/news-image',
        });

        const response = await submitStory('pending-reader@example.com');
        expect(response.status).toBe(202);
        expect(response.body.data.received).toBe(true);

        const submission = await NewsSubmission.findOne({ submitterEmail: 'pending-reader@example.com' });
        expect(submission).not.toBeNull();
        expect(submission?.status).toBe('pending');
        expect(await Story.exists({ newsSubmissionId: submission!._id })).toBeNull();

        expect((await request(app).get('/api/v1/admin/news-submissions')).status).toBe(401);
        const editorToken = await accessToken(EDITOR.email, EDITOR.password);
        expect(
            (await request(app)
                .get('/api/v1/admin/news-submissions')
                .set('Authorization', `Bearer ${editorToken}`)).status,
        ).toBe(403);
    });

    it('lets an admin edit and publish a submission exactly once', async () => {
        vi.spyOn(storageService, 'uploadImage').mockResolvedValue({
            url: 'https://res.cloudinary.com/test/image/upload/reviewed.png',
            width: 640,
            height: 480,
            publicId: 'community/reviewed-image',
        });
        const submitted = await submitStory('publish-reader@example.com');
        expect(submitted.status).toBe(202);
        const submissionId = (await NewsSubmission.findOne({ submitterEmail: 'publish-reader@example.com' }))?._id;
        const adminToken = await accessToken(ADMIN.email, ADMIN.password);

        const queue = await request(app)
            .get('/api/v1/admin/news-submissions?status=pending')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(queue.status).toBe(200);
        expect(queue.body.data.some((item: { _id: string }) => item._id === String(submissionId))).toBe(true);

        const payload = {
            title: 'Edited: Community Report on a New Bengaluru Startup',
            summary: 'Editors reviewed and updated this complete subheading before publication.',
            content: 'The edited and verified news article is published only after admin approval.',
            author: 'News Desk',
            imageUrl: 'https://res.cloudinary.com/test/image/upload/reviewed.png',
            imageCredit: 'Community contributor',
            category: 'ai',
            publishedAt: '2022-03-04T10:00:00.000Z',
        };
        const published = await request(app)
            .post(`/api/v1/admin/news-submissions/${submissionId}/publish`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(payload);

        expect(published.status).toBe(201);
        expect(published.body.data.title).toBe(payload.title);
        expect(published.body.data.status).toBe('published');
        expect(new Date(published.body.data.publishedAt).toISOString()).toBe(payload.publishedAt);

        const duplicatePublish = await request(app)
            .post(`/api/v1/admin/news-submissions/${submissionId}/publish`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ ...payload, title: 'A different title ignored after publication' });
        expect(duplicatePublish.status).toBe(201);
        expect(duplicatePublish.body.data._id).toBe(published.body.data._id);
        expect(duplicatePublish.body.data.title).toBe(payload.title);

        const publicStory = await request(app).get(`/api/v1/stories/${published.body.data.slug}`);
        expect(publicStory.status).toBe(200);
        expect(publicStory.body.data.title).toBe(payload.title);
        expect(publicStory.headers['cache-control']).toBe('no-store');

        const publicFeed = await request(app).get('/api/v1/stories?limit=50');
        expect(publicFeed.status).toBe(200);
        expect(publicFeed.body.data.some((story: { _id: string }) => story._id === published.body.data._id)).toBe(true);

        const categoryFeed = await request(app).get('/api/v1/stories?category=ai&limit=50');
        expect(categoryFeed.status).toBe(200);
        expect(categoryFeed.body.data.some((story: { _id: string }) => story._id === published.body.data._id)).toBe(true);
        expect(await Story.countDocuments({ newsSubmissionId: submissionId })).toBe(1);
        expect((await NewsSubmission.findById(submissionId))?.status).toBe('published');
    });

    it('lets an admin reject a submission without publishing it', async () => {
        vi.spyOn(storageService, 'uploadImage').mockResolvedValue({
            url: 'https://res.cloudinary.com/test/image/upload/rejected.png',
            width: 640,
            height: 480,
            publicId: 'community/rejected-image',
        });
        expect((await submitStory('reject-reader@example.com')).status).toBe(202);
        const submission = await NewsSubmission.findOne({ submitterEmail: 'reject-reader@example.com' });
        expect(submission).not.toBeNull();
        const adminToken = await accessToken(ADMIN.email, ADMIN.password);

        const rejected = await request(app)
            .post(`/api/v1/admin/news-submissions/${submission!._id}/reject`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ reason: 'Please provide a verifiable source.' });
        expect(rejected.status).toBe(200);
        expect(rejected.body.data.status).toBe('rejected');
        expect(rejected.body.data.rejectionReason).toBe('Please provide a verifiable source.');
        expect(await Story.exists({ newsSubmissionId: submission!._id })).toBeNull();
    });

    it('rejects spoofed fields and invalid images without uploading them', async () => {
        const upload = vi.spyOn(storageService, 'uploadImage');
        const invalidPayload = await request(app)
            .post('/api/v1/news-submissions')
            .field('submitterName', 'Community Reader')
            .field('submitterEmail', 'spoof-reader@example.com')
            .field('title', 'Community Report: New Startup Launches In Bengaluru')
            .field('summary', 'A community-submitted story with a long enough subheading for validation.')
            .field('content', 'Article content')
            .field('category', 'ai')
            .field('status', 'published')
            .attach('image', imageBuffer, { filename: 'story.png', contentType: 'image/png' });
        expect(invalidPayload.status).toBe(400);

        const invalidImage = await request(app)
            .post('/api/v1/news-submissions')
            .field('submitterName', 'Community Reader')
            .field('submitterEmail', 'invalid-image-reader@example.com')
            .field('title', 'Community Report: New Startup Launches In Bengaluru')
            .field('summary', 'A community-submitted story with a long enough subheading for validation.')
            .field('content', 'Article content')
            .field('category', 'ai')
            .attach('image', Buffer.from('not an image'), { filename: 'story.png', contentType: 'image/png' });
        expect(invalidImage.status).toBe(400);
        expect(upload).not.toHaveBeenCalled();
    });

    it('rejects images larger than the Cloudinary upload limit', async () => {
        const upload = vi.spyOn(storageService, 'uploadImage');
        const response = await request(app)
            .post('/api/v1/news-submissions')
            .field('submitterName', 'Community Reader')
            .field('submitterEmail', 'large-image-reader@example.com')
            .field('title', 'Community Report: New Startup Launches In Bengaluru')
            .field('summary', 'A community-submitted story with a long enough subheading for validation.')
            .field('content', 'Article content')
            .field('category', 'ai')
            .attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'large.png', contentType: 'image/png' });
        expect(response.status).toBe(413);
        expect(upload).not.toHaveBeenCalled();
    });
});
