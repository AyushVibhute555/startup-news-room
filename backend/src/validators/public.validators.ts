import { z } from 'zod';
import { emailField, isoDate, limitQuery, pageQuery } from './common.js';

export const listStoriesQuerySchema = z
    .object({
        category: z.string().trim().toLowerCase().max(80).optional(),
        region: z.string().trim().max(80).optional(), // 👈 ADDED THIS LINE
        q: z.string().trim().min(1).max(120).optional(),
        page: pageQuery,
        limit: limitQuery(50, 9),
        date: isoDate.optional(),
    })
    .strict();

export const slugParamSchema = z.object({ slug: z.string().trim().min(1).max(200) }).strict();

export const subscribeSchema = z.object({ email: emailField }).strict();

export const unsubscribeQuerySchema = z
    .object({ token: z.string().trim().min(8).max(128) })
    .strict();

const keyFactsSchema = z.array(z.object({
    label: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(300),
}).strict()).max(8);

const multipartKeyFactsSchema = z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value) as unknown;
    } catch {
        return value;
    }
}, keyFactsSchema.optional());

export const contactSchema = z
    .object({
        name: z.string().trim().min(2).max(120),
        email: emailField,
        subject: z.string().trim().max(200).optional(),
        message: z.string().trim().min(10).max(5000),
        type: z.enum(['contact', 'tip']).default('contact'),
        website: z.string().max(500).optional(),
    })
    .strict();

export const newsSubmissionSchema = z.object({
    submitterName: z.string().trim().min(2).max(120),
    submitterEmail: emailField,
    title: z.string().trim().min(10).max(180),
    summary: z.string().trim().min(40).max(500),
    content: z.string().trim().min(1).max(50000),
    keyFacts: multipartKeyFactsSchema,
    author: z.string().trim().max(120).optional(),
    imageCredit: z.string().trim().max(200).optional(),
    category: z.string().trim().toLowerCase().min(1).max(80),
    publishedAt: z.coerce.date().optional(),
    website: z.string().max(500).optional(),
}).strict();

export type ListStoriesQuery = z.infer<typeof listStoriesQuerySchema>;
export type ContactBody = z.infer<typeof contactSchema>;
export type NewsSubmissionBody = z.infer<typeof newsSubmissionSchema>;