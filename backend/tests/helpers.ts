// tests/helpers.ts
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';

export async function createUser(opts: {
    email: string;
    password: string;
    role: 'admin' | 'editor';
}) {
    const passwordHash = await bcrypt.hash(opts.password, 12);
    return User.create({
        name: opts.email,
        email: opts.email,
        passwordHash,
        role: opts.role,
        tokenVersion: 0,
    });
}

export async function ensureCategory(slug = 'ai', name = 'AI', order = 1) {
    return Category.updateOne(
        { slug },
        { $setOnInsert: { name, slug, order, description: '' } },
        { upsert: true },
    );
}

export function storyPayload(overrides: Record<string, unknown> = {}) {
    return {
        title: 'A Realistic Test Story Headline For Validation',
        summary:
            'This is a sufficiently long summary that satisfies the forty character minimum requirement for stories.',
        content: 'Some body copy for the story.',
        imageUrl: 'https://images.example.com/image.jpg',
        imageCredit: 'Test',
        sourceName: 'Example',
        sourceUrl: 'https://example.com/article',
        category: 'ai',
        tags: ['test'],
        status: 'published',
        ...overrides,
    };
}