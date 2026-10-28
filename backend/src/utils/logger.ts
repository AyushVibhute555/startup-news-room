import pino from 'pino';
import { env, isProd } from '../config/env.js';

const level = env.NODE_ENV === 'test' ? 'silent' : isProd ? 'info' : 'debug';

export const logger = pino({
    level,
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'req.body.password',
            'req.body.token',
            '*.password',
            '*.passwordHash',
            '*.token',
            '*.accessToken',
            '*.refreshToken',
            'passwordHash',
        ],
        censor: '[redacted]',
    },
    base: { service: 'startup-news-room-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
});