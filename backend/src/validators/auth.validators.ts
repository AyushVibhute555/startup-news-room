import { z } from 'zod';
import { emailField, passwordField } from './common.js';

export const loginSchema = z
    .object({
        email: emailField,
        password: passwordField,
    })
    .strict();

export type LoginInput = z.infer<typeof loginSchema>;