import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { isProd } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface ErrorBody {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export const notFoundHandler: RequestHandler = (req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.originalUrl} not found`,
        },
    } satisfies ErrorBody);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    void _next;

    let status = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Something went wrong';
    let details: unknown;

    if (err instanceof ApiError) {
        status = err.status;
        code = err.code;
        message = err.message;
        details = err.details;
    } else if (err instanceof ZodError) {
        status = 400;
        code = 'VALIDATION_ERROR';
        message = 'Request validation failed';
        details = err.issues.map((i) => ({
            path: i.path,
            message: i.message,
            code: i.code,
        }));
    } else if (err instanceof mongoose.Error.ValidationError) {
        status = 400;
        code = 'VALIDATION_ERROR';
        message = 'Validation failed';
        details = Object.values(err.errors).map((e) => ({
            path: [e.path],
            message: e.message,
        }));
    } else if (err instanceof mongoose.Error.CastError) {
        status = 400;
        code = 'VALIDATION_ERROR';
        message = `Invalid value for ${err.path}`;
        details = [{ path: [err.path], message: `Invalid ${err.kind}` }];
    } else if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: unknown }).code === 11000
    ) {
        status = 409;
        code = 'DUPLICATE_KEY';
        const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
        message = `Duplicate value for ${Object.keys(keyValue).join(', ') || 'a unique field'}`;
        details = [{ keyValue }];
    } else if (err instanceof jwt.TokenExpiredError) {
        status = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Token has expired';
    } else if (err instanceof jwt.JsonWebTokenError) {
        status = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid token';
    } else if (err instanceof multer.MulterError) {
        status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        code = err.code === 'LIMIT_FILE_SIZE' ? 'PAYLOAD_TOO_LARGE' : 'UPLOAD_ERROR';
        message = err.code === 'LIMIT_FILE_SIZE' ? 'Image exceeds the 5MB limit' : err.message;
    } else if (
        typeof err === 'object' &&
        err !== null &&
        'type' in err &&
        (err as { type: unknown }).type === 'entity.too.large'
    ) {
        status = 413;
        code = 'PAYLOAD_TOO_LARGE';
        message = 'Request body is too large';
    }

    if (status >= 500) {
        logger.error({ err, reqId: req.id }, 'Unhandled error');
        if (isProd) message = 'Something went wrong';
    } else {
        logger.warn({ err: (err as Error)?.message, reqId: req.id, code }, 'Request error');
    }

    const payload: ErrorBody = { error: { code, message } };
    if (details !== undefined) payload.error.details = details;

    res.status(status).json(payload);
};