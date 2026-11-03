import type { RequestHandler } from 'express';
import { body } from '../middleware/validate.js';
import { translateText } from '../services/translate.service.js';

export const translateHandler: RequestHandler = async (req, res) => {
    const { text, targetLang } = body<{ text: string; targetLang: string }>(req);
    const translated = await translateText(text, targetLang);
    res.json({ data: { translated } });
};