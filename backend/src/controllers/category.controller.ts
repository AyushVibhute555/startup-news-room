import type { RequestHandler } from 'express';
import { listPublicCategories } from '../services/category.service.js';

export const listCategories: RequestHandler = async (_req, res) => {
    const categories = await listPublicCategories();
    res.json({ data: categories });
};