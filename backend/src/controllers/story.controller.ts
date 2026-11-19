import type { RequestHandler } from 'express';
import { params, query } from '../middleware/validate.js';
import {
    getBreakingStories,
    getFeaturedStory,
    getRelatedStories,
    getStoryBySlug,
    getTopStories,
    listPublicStories,
} from '../services/story.service.js';
import type { ListStoriesQuery } from '../validators/public.validators.js';

export const listStories: RequestHandler = async (req, res) => {
    const parsed = query<ListStoriesQuery>(req);
    const q = parsed.since && req.query.limit === undefined
        ? { ...parsed, limit: 50 }
        : parsed;
    const result = await listPublicStories(q);
    if (q.since) {
        res.json({
            data: result.data.map((story) => ({
                headline: story.title,
                slug: story.slug,
                companies: story.companies ?? [],
                date: story.publishedAt,
            })),
            pagination: result.pagination,
        });
        return;
    }
    res.json(result);
};

export const listFeatured: RequestHandler = async (_req, res) => {
    const story = await getFeaturedStory();
    res.json({ data: story });
};

export const listTop: RequestHandler = async (_req, res) => {
    const stories = await getTopStories();
    res.json({ data: stories });
};

export const listBreaking: RequestHandler = async (_req, res) => {
    const stories = await getBreakingStories();
    res.json({ data: stories });
};

export const getStory: RequestHandler = async (req, res) => {
    const { slug } = params<{ slug: string }>(req);
    const story = await getStoryBySlug(slug);
    res.json({ data: story });
};

export const getRelated: RequestHandler = async (req, res) => {
    const { slug } = params<{ slug: string }>(req);
    const stories = await getRelatedStories(slug);
    res.json({ data: stories });
};