import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { Subscriber } from '../src/models/Subscriber.js';
import { Message } from '../src/models/Message.js';

beforeAll(async () => {
    await Subscriber.deleteMany({});
    await Message.deleteMany({});
});

describe('newsletter', () => {
    it('is idempotent and never reveals whether the email existed', async () => {
        const first = await request(app)
            .post('/api/v1/newsletter/subscribe')
            .send({ email: 'reader@example.com' });
        expect(first.status).toBe(200);

        const second = await request(app)
            .post('/api/v1/newsletter/subscribe')
            .send({ email: 'reader@example.com' });
        expect(second.status).toBe(200);
        expect(second.body).toEqual(first.body);

        expect(await Subscriber.countDocuments({ email: 'reader@example.com' })).toBe(1);
    });

    it('unsubscribes by token', async () => {
        const sub = await Subscriber.findOne({ email: 'reader@example.com' });
        expect(sub).not.toBeNull();

        const res = await request(app)
            .get(`/api/v1/newsletter/unsubscribe?token=${sub!.unsubscribeToken}`);
        expect(res.status).toBe(200);

        const after = await Subscriber.findById(sub!._id);
        expect(after!.status).toBe('unsubscribed');
    });
});

describe('contact honeypot', () => {
    it('silently succeeds and stores nothing when the honeypot is filled', async () => {
        const res = await request(app).post('/api/v1/contact').send({
            name: 'Bot',
            email: 'bot@example.com',
            message: 'This is a spam message from a bot, please ignore it.',
            type: 'contact',
            website: 'http://spam.example.com',
        });

        expect(res.status).toBe(200);
        expect(await Message.countDocuments({ email: 'bot@example.com' })).toBe(0);
    });

    it('stores a real message', async () => {
        const res = await request(app).post('/api/v1/contact').send({
            name: 'Real Human',
            email: 'human@example.com',
            subject: 'Hello',
            message: 'This is a genuine message that should be stored by the API.',
            type: 'contact',
            website: '',
        });

        expect(res.status).toBe(201);
        expect(await Message.countDocuments({ email: 'human@example.com' })).toBe(1);
    });
});