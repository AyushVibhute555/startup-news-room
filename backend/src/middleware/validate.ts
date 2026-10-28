import type { Request, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

export interface ValidateSchemas {
    body?: ZodTypeAny;
    query?: ZodTypeAny;
    params?: ZodTypeAny;
}

export function validate(schemas: ValidateSchemas): RequestHandler {
    return (req, _res, next) => {
        try {
            const valid: { body?: unknown; query?: unknown; params?: unknown } = {};
            if (schemas.params) valid.params = schemas.params.parse(req.params);
            if (schemas.query) valid.query = schemas.query.parse(req.query);
            if (schemas.body) valid.body = schemas.body.parse(req.body);
            req.valid = valid;
            next();
        } catch (err) {
            next(err);
        }
    };
}

export function body<T>(req: Request): T {
    return req.valid?.body as T;
}

export function query<T>(req: Request): T {
    return req.valid?.query as T;
}

export function params<T>(req: Request): T {
    return req.valid?.params as T;
}