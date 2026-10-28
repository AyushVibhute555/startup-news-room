import type { Role } from '../models/User.js';

declare global {
    namespace Express {
        interface Request {
            id: string;
            auth?: { id: string; role: Role; tokenVersion: number };
            valid?: { body?: unknown; query?: unknown; params?: unknown };
        }
    }
}

export { };
