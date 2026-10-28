import type { RequestHandler } from 'express';
import { body, params } from '../middleware/validate.js';
import {
    createCategory,
    deleteCategory,
    listAdminCategories,
    updateCategory,
} from '../services/category.service.js';

export const list: RequestHandler = async (_req, res) => {
    const categories = await listAdminCategories();
    res.json({ data: categories });
};

export const create: RequestHandler = async (req, res) => {
    const input = body<{
        name: string;
        slug: string;
        description?: string;
        order?: number;
    }>(req);
    const created = await createCategory(input);
    res.status(201).json({ data: created });
};

export const update: RequestHandler = async (req, res) => {
    const { id } = params<{ id: string }>(req);
    const input = body<{
        name?: string;
        slug?: string;
        description?: string;
        order?: number;
    }>(req);
    const updated = await updateCategory(id, input);
    res.json({ data: updated });
};

export const remove: RequestHandler = async (req, res) => {
    const { id } = params<{ id: string }>(req);
    await deleteCategory(id);
    res.json({ data: { deleted: true } });
};