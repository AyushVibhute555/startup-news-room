import type { RequestHandler } from 'express';
import { body } from '../middleware/validate.js';
import { fetchLinkPreview } from '../services/linkPreview.service.js';

export const linkPreview: RequestHandler = async (req, res) => {
    const { url } = body<{ url: string }>(req);
    const preview = await fetchLinkPreview(url);
    res.json({ data: preview });
};