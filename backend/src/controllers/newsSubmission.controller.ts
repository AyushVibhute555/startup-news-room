import type { RequestHandler } from 'express';
import { body, params, query } from '../middleware/validate.js';
import {
    createNewsSubmission,
    listNewsSubmissions,
    publishNewsSubmission,
    rejectNewsSubmission,
} from '../services/newsSubmission.service.js';
import { ApiError } from '../utils/ApiError.js';
import type {
    adminNewsSubmissionsQuerySchema,
    publishNewsSubmissionSchema,
    rejectNewsSubmissionSchema,
} from '../validators/admin.validators.js';
import type { NewsSubmissionBody } from '../validators/public.validators.js';
import type { z } from 'zod';

type AdminSubmissionQuery = z.infer<typeof adminNewsSubmissionsQuerySchema>;
type PublishInput = z.infer<typeof publishNewsSubmissionSchema>;
type RejectInput = z.infer<typeof rejectNewsSubmissionSchema>;

export const submitNews: RequestHandler = async (req, res) => {
    const input = body<NewsSubmissionBody>(req);
    if (input.website?.trim()) {
        res.status(202).json({ data: { received: true } });
        return;
    }

    await createNewsSubmission(input, req.file);
    res.status(202).json({ data: { received: true } });
};

export const listNewsSubmissionsHandler: RequestHandler = async (req, res) => {
    const q = query<AdminSubmissionQuery>(req);
    res.json(await listNewsSubmissions(q.status, q.page, q.limit));
};

export const publishNewsSubmissionHandler: RequestHandler = async (req, res) => {
    if (!req.auth) throw ApiError.unauthorized();
    const { id } = params<{ id: string }>(req);
    const input = body<PublishInput>(req);
    const story = await publishNewsSubmission(id, input, req.auth.id);
    res.status(201).json({ data: story });
};

export const rejectNewsSubmissionHandler: RequestHandler = async (req, res) => {
    if (!req.auth) throw ApiError.unauthorized();
    const { id } = params<{ id: string }>(req);
    const input = body<RejectInput>(req);
    const submission = await rejectNewsSubmission(id, input.reason, req.auth.id);
    res.json({ data: submission });
};
