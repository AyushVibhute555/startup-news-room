import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env, isProd } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const BCRYPT_COST = 12;

/** Pre-computed dummy hash so login attempts for unknown emails still burn time. */
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-equalisation', BCRYPT_COST);

export interface AccessPayload extends JwtPayload {
    sub: string;
    role: 'admin' | 'editor';
    tv: number;
    type: 'access';
}

export interface RefreshPayload extends JwtPayload {
    sub: string;
    tv: number;
    type: 'refresh';
}

export function signAccessToken(user: { id: string; role: string; tokenVersion: number }): string {
    return jwt.sign(
        { sub: user.id, role: user.role, tv: user.tokenVersion, type: 'access' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_TTL },
    );
}

export function signRefreshToken(user: { id: string; tokenVersion: number }): string {
    return jwt.sign(
        { sub: user.id, tv: user.tokenVersion, type: 'refresh' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TTL },
    );
}

export function verifyAccessToken(token: string): AccessPayload {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
    if (payload.type !== 'access') throw ApiError.unauthorized('Invalid token');
    return payload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
    if (payload.type !== 'refresh') throw ApiError.unauthorized('Invalid token');
    return payload;
}

export const REFRESH_COOKIE = 'snr_refresh';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export function refreshCookieOptions() {
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: env.COOKIE_SAMESITE,
        path: REFRESH_COOKIE_PATH,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    } as const;
}

const GENERIC_LOGIN_ERROR = 'Invalid email or password';

export async function login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+passwordHash');

    // Constant-time-ish: always run a bcrypt compare, even for unknown users.
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const ok = await bcrypt.compare(password, hash);

    if (!user || !ok) throw new ApiError(401, 'INVALID_CREDENTIALS', GENERIC_LOGIN_ERROR);

    user.lastLoginAt = new Date();
    await user.save();

    return {
        accessToken: signAccessToken({
            id: user.id,
            role: user.role,
            tokenVersion: user.tokenVersion,
        }),
        refreshToken: signRefreshToken({ id: user.id, tokenVersion: user.tokenVersion }),
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
}

export async function refresh(refreshToken: string) {
    let payload: RefreshPayload;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch {
        throw ApiError.unauthorized('Invalid refresh token');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('Invalid refresh token');
    if (user.tokenVersion !== payload.tv) {
        throw ApiError.unauthorized('Refresh token has been revoked');
    }

    return {
        accessToken: signAccessToken({
            id: user.id,
            role: user.role,
            tokenVersion: user.tokenVersion,
        }),
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    };
}

export async function logout(userId: string): Promise<void> {
    await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}

export async function getMe(userId: string) {
    const user = await User.findById(userId).lean();
    if (!user) throw ApiError.unauthorized();
    return { _id: user._id, name: user.name, email: user.email, role: user.role };
}