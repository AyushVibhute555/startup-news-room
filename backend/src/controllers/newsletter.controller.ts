import type { RequestHandler } from 'express';
import { body, query } from '../middleware/validate.js';
import { subscribe, unsubscribe } from '../services/newsletter.service.js';

export const subscribeHandler: RequestHandler = async (req, res) => {
    const { email } = body<{ email: string }>(req);
    await subscribe(email);
    res.status(200).json({ data: { subscribed: true } });
};

export const unsubscribeHandler: RequestHandler = async (req, res) => {
    const { token } = query<{ token: string }>(req);
    await unsubscribe(token);
    res.status(200).json({ data: { unsubscribed: true } });
};