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
import { ApiError } from '../utils/ApiError.js';

export const listStories: RequestHandler = async (req, res) => {
    const q = query<ListStoriesQuery>(req);
    const result = await listPublicStories(q);
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

export const _unused = ApiError; // keep import tree-shakeable