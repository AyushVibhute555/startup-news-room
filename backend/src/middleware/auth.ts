import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../services/auth.service.js';
import { User, type Role } from '../models/User.js';

export const requireAuth: RequestHandler = async (req, _res, next) => {
    try {
        const header = req.headers.authorization ?? '';
        const [scheme, token] = header.split(' ');
        if (scheme !== 'Bearer' || !token) {
            throw ApiError.unauthorized('Missing or malformed Authorization header');
        }

        let payload;
        try {
            payload = verifyAccessToken(token);
        } catch {
            throw ApiError.unauthorized('Invalid or expired access token');
        }

        const user = await User.findById(payload.sub).select('+tokenVersion');
        if (!user) throw ApiError.unauthorized('Invalid or expired access token');
        if (user.tokenVersion !== payload.tv) {
            throw ApiError.unauthorized('Session has been revoked');
        }

        req.auth = { id: user.id, role: user.role as Role, tokenVersion: user.tokenVersion };
        next();
    } catch (err) {
        next(err);
    }
};

export function requireRole(...roles: Role[]): RequestHandler {
    return (req, _res, next) => {
        if (!req.auth) return next(ApiError.unauthorized());
        if (!roles.includes(req.auth.role)) return next(ApiError.forbidden());
        return next();
    };
}