import type { RequestHandler } from 'express';
import { body } from '../middleware/validate.js';
import {
    REFRESH_COOKIE,
    getMe,
    login,
    logout,
    refresh,
    refreshCookieOptions,
} from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';
import type { LoginInput } from '../validators/auth.validators.js';

export const loginHandler: RequestHandler = async (req, res) => {
    const { email, password } = body<LoginInput>(req);
    const result = await login(email, password);

    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
    res.status(200).json({
        data: { accessToken: result.accessToken, user: result.user },
    });
};

export const refreshHandler: RequestHandler = async (req, res) => {
    const token = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
    if (!token) throw ApiError.unauthorized('Missing refresh token');

    const result = await refresh(token);
    res.status(200).json({ data: { accessToken: result.accessToken, user: result.user } });
};

export const logoutHandler: RequestHandler = async (req, res) => {
    if (req.auth) await logout(req.auth.id);
    res.clearCookie(REFRESH_COOKIE, {
        httpOnly: true,
        path: refreshCookieOptions().path,
        sameSite: refreshCookieOptions().sameSite,
        secure: refreshCookieOptions().secure,
    });
    res.status(200).json({ data: { loggedOut: true } });
};

export const meHandler: RequestHandler = async (req, res) => {
    if (!req.auth) throw ApiError.unauthorized();
    const user = await getMe(req.auth.id);
    res.status(200).json({ data: { user } });
};