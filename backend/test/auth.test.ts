import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { createUser } from './helpers.js';
import { ensureCategory } from './helpers.js';
import { User } from '../src/models/User.js';

const ADMIN = { email: 'auth-admin@example.com', password: 'SuperSecret123', role: 'admin' as const };
const EDITOR = { email: 'auth-editor@example.com', password: 'SuperSecret123', role: 'editor' as const };

beforeAll(async () => {
    await ensureCategory('ai', 'AI', 1);
    await createUser(ADMIN);
    await createUser(EDITOR);
});

describe('auth', () => {
    it('rejects wrong password with a generic message', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: ADMIN.email, password: 'wrong-password-123' });
        expect(res.status).toBe(401);
        expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('rejects unknown email with the same generic message', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'nobody@example.com', password: 'wrong-password-123' });
        expect(res.status).toBe(401);
        expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('logs in, returns an access token and sets a refresh cookie', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: ADMIN.email, password: ADMIN.password });

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeTypeOf('string');
        expect(res.body.data.user.email).toBe(ADMIN.email);

        const cookies = res.headers['set-cookie'] as unknown as string[];
        expect(cookies.some((c) => c.startsWith('snr_refresh='))).toBe(true);
        expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
    });

    it('refreshes the access token from the cookie', async () => {
        const login = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: ADMIN.email, password: ADMIN.password });

        const cookies = login.headers['set-cookie'] as unknown as string[];

        const res = await request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', cookies)
            .send();

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeTypeOf('string');
    });

    it('invalidates the refresh token on logout', async () => {
        const login = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: ADMIN.email, password: ADMIN.password });

        const cookies = login.headers['set-cookie'] as unknown as string[];
        const accessToken = login.body.data.accessToken as string;

        const logout = await request(app)
            .post('/api/v1/auth/logout')
            .set('Cookie', cookies)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(logout.status).toBe(200);

        const refreshed = await request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', cookies)
            .send();

        expect(refreshed.status).toBe(401);
    });

    it('enforces role guards on admin-only routes', async () => {
        const login = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: EDITOR.email, password: EDITOR.password });

        const token = login.body.data.accessToken as string;

        const res = await request(app)
            .delete('/api/v1/admin/stories/000000000000000000000000')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(403);
    });

    it('returns validation details for bad payloads', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'not-an-email', password: 'short' });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it('rejects unknown fields (strict validation)', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: ADMIN.email, password: ADMIN.password, admin: true });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects NoSQL operator injection attempts', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: { $gt: '' }, password: ADMIN.password });
        expect(res.status).toBe(400);
    });
});

describe('admin story creation', () => {
    it('creates a story through the API', async () => {
        const login = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: ADMIN.email, password: ADMIN.password });

        const token = login.body.data.accessToken as string;

        const res = await request(app)
            .post('/api/v1/admin/stories')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'An Admin Created Story That Passes Validation',
                summary:
                    'A summary created through the admin API that is definitely longer than forty characters.',
                imageUrl: 'https://images.example.com/a.jpg',
                sourceName: 'Example',
                sourceUrl: 'https://example.com/a',
                category: 'ai',
                tags: ['Admin', 'admin', 'API'],
                status: 'published',
            });

        expect(res.status).toBe(201);
        expect(res.body.data.slug).toBe('an-admin-created-story-that-passes-validation');
        expect(res.body.data.tags).toEqual(['admin', 'api']);
        expect(res.body.data.readTime).toBeGreaterThanOrEqual(1);

        await User.findByIdAndUpdate(res.body.data.createdBy, {}).catch(() => undefined);
    });
});