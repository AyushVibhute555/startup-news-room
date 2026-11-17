import { describe, expect, it } from 'vitest';
import { Story } from '../src/models/Story.js';
import { createStorySchema, updateStorySchema } from '../src/validators/admin.validators.js';

const storyInput = {
    title: 'A new startup story',
    summary: 'A detailed subheading with enough characters to meet validation requirements.',
    content: '<p>The required article text.</p>',
    imageUrl: 'https://example.com/image.jpg',
    categories: ['funding'],
};

describe('admin story validation', () => {
    it('allows stories without source metadata and requires article content', () => {
        expect(createStorySchema.safeParse(storyInput).success).toBe(true);
        expect(createStorySchema.safeParse({ ...storyInput, content: '   ' }).success).toBe(false);
    });

    it('can persist a new story without source metadata', () => {
        const story = new Story({ ...storyInput, slug: 'new-story' });

        expect(story.validateSync()).toBeUndefined();
        expect(story.sourceName).toBe('');
        expect(story.sourceUrl).toBe('');
    });

    it('continues accepting legacy source metadata and preserves backdated news dates', () => {
        const newsDate = new Date('2020-06-15T10:30:00.000Z');
        const result = createStorySchema.parse({
            ...storyInput,
            sourceName: 'Legacy source',
            sourceUrl: 'https://example.com/article',
            publishedAt: newsDate,
        });

        expect(result.sourceName).toBe('Legacy source');
        expect(result.sourceUrl).toBe('https://example.com/article');
        expect(result.publishedAt).toEqual(newsDate);
    });

    it('allows partial updates that omit article content', () => {
        expect(updateStorySchema.safeParse({ title: 'Updated headline' }).success).toBe(true);
    });
});
