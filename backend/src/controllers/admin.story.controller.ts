import type { RequestHandler } from 'express';
import { body, params, query } from '../middleware/validate.js';
import {
    adminCreateStory,
    adminDeleteStory,
    adminListStories,
    adminUpdateStory,
} from '../services/story.service.js';
import { ApiError } from '../utils/ApiError.js';
import type { CreateStoryInput, UpdateStoryInput } from '../validators/admin.validators.js';

export const listStories: RequestHandler = async (req, res) => {
    const q = query<{
        status?: 'draft' | 'published';
        category?: string;
        q?: string;
        page: number;
        limit: number;
    }>(req);
    const result = await adminListStories(q);
    res.json(result);
};

export const createStory: RequestHandler = async (req, res) => {
    if (!req.auth) throw ApiError.unauthorized();
    const input = body<CreateStoryInput>(req);
    const story = await adminCreateStory(input, req.auth.id);
    res.status(201).json({ data: story });
};

export const updateStory: RequestHandler = async (req, res) => {
    const { id } = params<{ id: string }>(req);
    const input = body<UpdateStoryInput>(req);
    const story = await adminUpdateStory(id, input);
    res.json({ data: story });
};

export const deleteStory: RequestHandler = async (req, res) => {
    const { id } = params<{ id: string }>(req);
    await adminDeleteStory(id);
    res.status(200).json({ data: { deleted: true } });
};