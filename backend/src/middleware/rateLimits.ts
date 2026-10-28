import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env.js';

const skip = () => isTest;

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down.' } },
});

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    keyGenerator: (req) => {
        const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : 'unknown';
        return `${req.ip}:${email}`;
    },
    message: {
        error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' },
    },
});

export const newsletterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' } },
});

export const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many messages. Try again later.' } },
});

export const linkPreviewLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    keyGenerator: (req) => req.auth?.id ?? req.ip ?? 'anonymous',
    message: { error: { code: 'RATE_LIMITED', message: 'Too many preview requests.' } },
});