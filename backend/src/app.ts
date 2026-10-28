import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import { env, isTest } from './config/env.js';
import { logger } from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimits.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { ApiError } from './utils/ApiError.js';
import routes from './routes/index.js';

export function buildApp(): Express {
    const app = express();
    app.disable('x-powered-by');

    if (env.TRUST_PROXY) {
        if (env.TRUST_PROXY === 'true') app.set('trust proxy', true);
        else if (/^\d+$/.test(env.TRUST_PROXY)) app.set('trust proxy', Number(env.TRUST_PROXY));
        else app.set('trust proxy', env.TRUST_PROXY);
    }

    // Request ID
    app.use((req, res, next) => {
        const raw = req.headers['x-request-id'];
        const id = (Array.isArray(raw) ? raw[0] : raw) ?? randomUUID();
        req.id = id;
        res.setHeader('x-request-id', id);
        next();
    });

    app.use(
        pinoHttp({
            logger,
            genReqId: (req) => req.id,
            autoLogging: !isTest,
            customLogLevel: (_req, res, err) => {
                if (err || res.statusCode >= 500) return 'error';
                if (res.statusCode >= 400) return 'warn';
                return 'info';
            },
        }),
    );

    app.use(helmet());
    app.use(
        cors({
            origin(origin, callback) {
                if (!origin) return callback(null, true);
                if (env.clientOrigins.includes(origin)) return callback(null, true);
                return callback(null, false);
            },
            credentials: true,
        }),
    );
    app.use(compression());
    app.use(cookieParser());
    app.use(globalLimiter);

    // Strict content-type handling: only JSON and multipart bodies are accepted.
    app.use((req, _res, next) => {
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            const ct = (req.headers['content-type'] ?? '').toLowerCase();
            if (!ct) return next();
            if (ct.startsWith('application/json')) return next();
            if (ct.startsWith('multipart/form-data')) return next();
            return next(
                new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json'),
            );
        }
        return next();
    });

    app.use(express.json({ limit: '100kb' }));
    app.use(express.urlencoded({ extended: false, limit: '100kb' }));

    app.use('/api/v1', routes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

export const app = buildApp();
export default app;