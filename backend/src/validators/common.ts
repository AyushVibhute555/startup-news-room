import { z } from 'zod';

export const objectId = z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Must be a valid ObjectId');

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const pageQuery = z.coerce.number().int().min(1).default(1);
export const limitQuery = (max = 50, def = 9) =>
    z.coerce.number().int().min(1).max(max).default(def);

export const emailField = z.string().trim().toLowerCase().email().max(254);

export const passwordField = z.string().min(10, 'Password must be at least 10 characters').max(200);