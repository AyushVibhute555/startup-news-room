import { z } from 'zod';
import { emailField, isoDate, limitQuery, pageQuery } from './common.js';

export const listStoriesQuerySchema = z
    .object({
        category: z.string().trim().toLowerCase().max(80).optional(),
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

export const contactSchema = z
    .object({
        name: z.string().trim().min(2).max(120),
        email: emailField,
        subject: z.string().trim().max(200).optional(),
        message: z.string().trim().min(10).max(5000),
        type: z.enum(['contact', 'tip']).default('contact'),
        website: z.string().max(0, 'Honeypot must be empty').optional().or(z.literal('')),
    })
    .strict();

export type ListStoriesQuery = z.infer<typeof listStoriesQuerySchema>;
export type ContactBody = z.infer<typeof contactSchema>;