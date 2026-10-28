import { z } from 'zod';
import { objectId, limitQuery, pageQuery } from './common.js';

const httpsUrl = z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), 'Must be an https URL');

const httpUrl = z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), 'Must be an http(s) URL');

const tagsField = z
    .array(z.string().trim().min(1).max(40))
    .max(8, 'At most 8 tags')
    .optional();

export const createStorySchema = z
    .object({
        title: z.string().trim().min(10).max(180),
        summary: z.string().trim().min(40).max(500),
        content: z.string().trim().max(5000).optional(),
        imageUrl: httpsUrl,
        imageCredit: z.string().trim().max(200).optional(),
        sourceName: z.string().trim().min(1).max(120),
        sourceUrl: httpUrl,
        category: z.string().trim().toLowerCase().min(1).max(80),
        tags: tagsField,
        status: z.enum(['draft', 'published']).default('draft'),
        publishedAt: z.coerce.date().optional(),
        isFeatured: z.boolean().optional(),
        isBreaking: z.boolean().optional(),
    })
    .strict();

export const updateStorySchema = z
    .object({
        title: z.string().trim().min(10).max(180).optional(),
        summary: z.string().trim().min(40).max(500).optional(),
        content: z.string().trim().max(5000).optional(),
        imageUrl: httpsUrl.optional(),
        imageCredit: z.string().trim().max(200).optional(),
        sourceName: z.string().trim().min(1).max(120).optional(),
        sourceUrl: httpUrl.optional(),
        category: z.string().trim().toLowerCase().min(1).max(80).optional(),
        tags: tagsField,
        status: z.enum(['draft', 'published']).optional(),
        publishedAt: z.coerce.date().optional(),
        isFeatured: z.boolean().optional(),
        isBreaking: z.boolean().optional(),
    })
    .strict();

export const adminListStoriesQuerySchema = z
    .object({
        status: z.enum(['draft', 'published']).optional(),
        category: z.string().trim().toLowerCase().max(80).optional(),
        q: z.string().trim().min(1).max(120).optional(),
        page: pageQuery,
        limit: limitQuery(100, 20),
    })
    .strict();

export const idParamSchema = z.object({ id: objectId }).strict();

export const linkPreviewSchema = z.object({ url: z.string().url().max(2048) }).strict();

export const createCategorySchema = z
    .object({
        name: z.string().trim().min(2).max(80),
        slug: z
            .string()
            .trim()
            .toLowerCase()
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers and dashes')
            .max(80),
        description: z.string().trim().max(300).optional(),
        order: z.coerce.number().int().min(0).max(999).optional(),
    })
    .strict();

export const updateCategorySchema = createCategorySchema.partial().strict();

export const messagesQuerySchema = z
    .object({
        status: z.enum(['new', 'read']).optional(),
        page: pageQuery,
        limit: limitQuery(100, 20),
    })
    .strict();

export const markMessageSchema = z
    .object({ status: z.enum(['new', 'read']).default('read') })
    .strict();

export const subscribersQuerySchema = z
    .object({
        status: z.enum(['active', 'unsubscribed']).optional(),
        page: pageQuery,
        limit: limitQuery(100, 20),
        format: z.enum(['json', 'csv']).optional(),
    })
    .strict();

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;