import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

function isValidAutomationKey(candidate: string | undefined): boolean {
    if (!env.AUTOMATION_API_KEY) {
        throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Automation API is not configured');
    }
    if (!candidate) return false;

    const expectedHash = createHash('sha256').update(env.AUTOMATION_API_KEY).digest();
    const candidateHash = createHash('sha256').update(candidate).digest();
    return timingSafeEqual(expectedHash, candidateHash);
}

export const requireAutomationKey: RequestHandler = (req, _res, next) => {
    try {
        if (!isValidAutomationKey(req.get('X-API-Key'))) {
            return next(ApiError.unauthorized('A valid X-API-Key is required'));
        }
        return next();
    } catch (error) {
        return next(error);
    }
};

export const requireAutomationKeyForSince: RequestHandler = (req, _res, next) => {
    if (req.query.since === undefined) return next();
    return requireAutomationKey(req, _res, next);
};
