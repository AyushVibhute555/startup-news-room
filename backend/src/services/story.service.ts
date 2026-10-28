import type { FilterQuery, SortOrder } from 'mongoose';
import { Story, type StoryAttrs } from '../models/Story.js';
import { Category } from '../models/Category.js';
import { PUBLIC_STORY_PROJECTION } from '../utils/storyConstants.js';
import { ApiError } from '../utils/ApiError.js';

export type PublicStory = Record<string, unknown>;

/**
 * THE single source of truth for the public visibility rule.
 * A story is public only when it is published AND its publish date has passed.
 */
export function publicStoryFilter(
    extra: FilterQuery<StoryAttrs> = {},
): FilterQuery<StoryAttrs> {
    const { publishedAt, status: _ignoredStatus, ...rest } = extra as FilterQuery<StoryAttrs> & {
        status?: unknown;
        publishedAt?: Record<string, unknown>;
    };
    return {
        ...rest,
        status: 'published',
        publishedAt: { $lte: new Date(), ...(publishedAt ?? {}) },
    };
}

function publicProjection(withScore = false) {
    return withScore
        ? { ...PUBLIC_STORY_PROJECTION, score: { $meta: 'textScore' as const } }
        : PUBLIC_STORY_PROJECTION;
}

function stripScore<T>(doc: T): T {
    if (doc && typeof doc === 'object' && 'score' in (doc as object)) {
        delete (doc as Record<string, unknown>).score;
    }
    return doc;
}

export interface ListStoriesParams {
    category?: string;
    q?: string;
    page: number;
    limit: number;
    date?: string;
}

export async function listPublicStories(params: ListStoriesParams) {
    const { category, q, page, limit, date } = params;
    const filter: FilterQuery<StoryAttrs> = publicStoryFilter();

    if (category) filter.category = category;

    if (date) {
        const start = new Date(`${date}T00:00:00.000Z`);
        const end = new Date(`${date}T23:59:59.999Z`);
        filter.publishedAt = { $gte: start, $lte: end };
    }

    if (q) filter.$text = { $search: q };

    const sort: Record<string, SortOrder | { $meta: string }> = q
        ? { score: { $meta: 'textScore' }, publishedAt: -1 }
        : { publishedAt: -1, _id: -1 };

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
        Story.find(filter)
            .select(publicProjection(Boolean(q)))
            .sort(sort as never)
            .skip(skip)
            .limit(limit)
            .lean(),
        Story.countDocuments(filter),
    ]);

    const data = docs.map((d) => stripScore(d as Record<string, unknown>));
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
        },
    };
}

async function findFeaturedOrLatest(): Promise<PublicStory | null> {
    const featured = await Story.findOne(publicStoryFilter({ isFeatured: true }))
        .sort({ publishedAt: -1 })
        .select(publicProjection())
        .lean();
    if (featured) return featured as PublicStory;

    const latest = await Story.findOne(publicStoryFilter())
        .sort({ publishedAt: -1, _id: -1 })
        .select(publicProjection())
        .lean();
    return (latest as PublicStory) ?? null;
}

export async function getFeaturedStory(): Promise<PublicStory | null> {
    return findFeaturedOrLatest();
}

export async function getTopStories(): Promise<PublicStory[]> {
    const featured = await findFeaturedOrLatest();
    const filter = publicStoryFilter();
    if (featured) {
        filter._id = { $ne: (featured as { _id: unknown })._id };
    }
    const docs = await Story.find(filter)
        .sort({ publishedAt: -1, _id: -1 })
        .limit(5)
        .select(publicProjection())
        .lean();
    return docs as PublicStory[];
}

export async function getBreakingStories(): Promise<PublicStory[]> {
    const docs = await Story.find(publicStoryFilter({ isBreaking: true }))
        .sort({ publishedAt: -1, _id: -1 })
        .limit(8)
        .select(publicProjection())
        .lean();
    return docs as PublicStory[];
}

export async function getStoryBySlug(slug: string): Promise<PublicStory> {
    const doc = await Story.findOne(publicStoryFilter({ slug }))
        .select(publicProjection())
        .lean();
    if (!doc) throw ApiError.notFound('Story not found');
    return doc as PublicStory;
}

export async function getRelatedStories(slug: string): Promise<PublicStory[]> {
    const story = await Story.findOne(publicStoryFilter({ slug }))
        .select({ _id: 1, category: 1, tags: 1 })
        .lean();
    if (!story) throw ApiError.notFound('Story not found');

    const base = publicStoryFilter({ category: story.category, _id: { $ne: story._id } });

    const sameCategory = await Story.find(base)
        .sort({ publishedAt: -1, _id: -1 })
        .limit(4)
        .select(publicProjection())
        .lean();

    if (sameCategory.length >= 4) return sameCategory as PublicStory[];

    const excludeIds = [story._id, ...sameCategory.map((s) => s._id)];
    const tags = Array.isArray(story.tags) ? story.tags : [];

    if (tags.length === 0) return sameCategory as PublicStory[];

    const byTags = await Story.find(
        publicStoryFilter({ tags: { $in: tags }, _id: { $nin: excludeIds } }),
    )
        .sort({ publishedAt: -1, _id: -1 })
        .limit(4 - sameCategory.length)
        .select(publicProjection())
        .lean();

    return [...sameCategory, ...byTags] as PublicStory[];
}

// ── Admin ────────────────────────────────────────────────────────────────

export interface AdminListParams {
    status?: 'draft' | 'published';
    category?: string;
    q?: string;
    page: number;
    limit: number;
}

export async function adminListStories(params: AdminListParams) {
    const { status, category, q, page, limit } = params;
    const filter: FilterQuery<StoryAttrs> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (q) filter.$text = { $search: q };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        Story.find(filter).sort({ publishedAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        Story.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
        data,
        pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    };
}

export interface StoryInput {
    title: string;
    summary: string;
    content?: string;
    imageUrl: string;
    imageCredit?: string;
    sourceName: string;
    sourceUrl: string;
    category: string;
    tags?: string[];
    status?: 'draft' | 'published';
    publishedAt?: Date;
    isFeatured?: boolean;
    isBreaking?: boolean;
}

async function assertCategoryExists(slug: string): Promise<void> {
    const exists = await Category.exists({ slug });
    if (!exists) {
        throw ApiError.badRequest('VALIDATION_ERROR', 'Unknown category', [
            { path: ['category'], message: `Category "${slug}" does not exist` },
        ]);
    }
}

export async function adminCreateStory(input: StoryInput, userId: string) {
    await assertCategoryExists(input.category);
    const story = new Story({ ...input, createdBy: userId });
    await story.save();
    return story.toObject();
}

export async function adminUpdateStory(id: string, input: Partial<StoryInput>) {
    const story = await Story.findById(id);
    if (!story) throw ApiError.notFound('Story not found');

    if (input.category && input.category !== story.category) {
        await assertCategoryExists(input.category);
    }

    Object.assign(story, input);
    await story.save();
    return story.toObject();
}

export async function adminDeleteStory(id: string): Promise<void> {
    const res = await Story.findByIdAndDelete(id);
    if (!res) throw ApiError.notFound('Story not found');
}