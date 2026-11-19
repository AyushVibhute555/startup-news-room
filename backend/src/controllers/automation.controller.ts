import type { RequestHandler } from 'express';
import { body, params } from '../middleware/validate.js';
import { adminUpdateStory, automationCreateStory } from '../services/story.service.js';
import { ApiError } from '../utils/ApiError.js';
import type {
    AutomationCreateStoryInput,
    AutomationUpdateStoryInput,
} from '../validators/admin.validators.js';

const SITE_URL = 'https://startupnewsroom.in';

export const createAutomationStory: RequestHandler = async (req, res) => {
    const input = body<AutomationCreateStoryInput>(req);
    const idempotencyKey = req.get('Idempotency-Key')?.trim();
    if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 128)) {
        throw ApiError.badRequest('VALIDATION_ERROR', 'Idempotency-Key must be 8 to 128 characters');
    }

    const { story, replayed } = await automationCreateStory(
        input,
        idempotencyKey || undefined,
    );
    if (replayed) res.setHeader('Idempotency-Replayed', 'true');
    res.status(replayed ? 200 : 201).json({
        data: {
            id: String(story._id),
            slug: story.slug,
            url: `${SITE_URL}/news/${story.slug}`,
        },
    });
};

export const updateAutomationStory: RequestHandler = async (req, res) => {
    const { id } = params<{ id: string }>(req);
    const input = body<AutomationUpdateStoryInput>(req);
    const story = await adminUpdateStory(id, input);
    res.json({
        data: {
            id: String(story._id),
            slug: story.slug,
            url: `${SITE_URL}/news/${story.slug}`,
            headline: story.title,
            status: story.status,
            homepageSlot: story.homepageSlot,
            isBreaking: story.isBreaking,
            breakingExpiresAt: story.breakingExpiresAt,
        },
    });
};

