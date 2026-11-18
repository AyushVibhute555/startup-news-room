import type { FilterQuery, SortOrder } from 'mongoose';
import { Story, type StoryAttrs } from '../models/Story.js';
import { Category } from '../models/Category.js';
import { PUBLIC_STORY_PROJECTION } from '../utils/storyConstants.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeContent } from '../utils/sanitize.js';

export type PublicStory = Record<string, unknown>;

export function publicStoryFilter(extra: FilterQuery<StoryAttrs> = {}): FilterQuery<StoryAttrs> {
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
    return withScore ? { ...PUBLIC_STORY_PROJECTION, score: { $meta: 'textScore' as const } } : PUBLIC_STORY_PROJECTION;
}

function stripScore<T>(doc: T): T {
    if (doc && typeof doc === 'object' && 'score' in (doc as object)) {
        delete (doc as Record<string, unknown>).score;
    }
    return doc;
}

function formatPublicStory(doc: Record<string, unknown>): PublicStory {
    const story = stripScore({ ...doc });
    if (typeof story.content === 'string') story.content = sanitizeContent(story.content);
    return story;
}

export interface ListStoriesParams {
    category?: string;
    region?: string;
    q?: string;
    page: number;
    limit: number;
    date?: string;
}

export async function listPublicStories(params: ListStoriesParams) {
    const { category, region, q, page, limit, date } = params;
    const filter: FilterQuery<StoryAttrs> = publicStoryFilter();

    if (category) {
        filter.$or = [
            { categories: { $in: [category] } },
            { category },
        ];
    }
    if (region) filter.region = region;
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
        Story.find(filter).select(publicProjection(Boolean(q))).sort(sort as never).skip(skip).limit(limit).lean(),
        Story.countDocuments(filter),
    ]);

    const data = docs.map((d) => formatPublicStory(d as Record<string, unknown>));
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
        data,
        pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    };
}

async function findFeaturedOrLatest(): Promise<PublicStory | null> {
    const lead = await Story.findOne(publicStoryFilter({ homepageSlot: 'lead' }))
        .sort({ publishedAt: -1 })
        .select(publicProjection())
        .lean();
    if (lead) return formatPublicStory(lead as Record<string, unknown>);

    const featured = await Story.findOne(publicStoryFilter({ isFeatured: true }))
        .sort({ publishedAt: -1 })
        .select(publicProjection())
        .lean();
    if (featured) return formatPublicStory(featured as Record<string, unknown>);

    const latest = await Story.findOne(publicStoryFilter())
        .sort({ publishedAt: -1, _id: -1 })
        .select(publicProjection())
        .lean();
    return latest ? formatPublicStory(latest as Record<string, unknown>) : null;
}

export async function getFeaturedStory(): Promise<PublicStory | null> {
    return findFeaturedOrLatest();
}

export async function getTopStories(): Promise<PublicStory[]> {
    const featured = await findFeaturedOrLatest();
    const filter = publicStoryFilter({ isSponsored: { $ne: true } });
    if (featured) filter._id = { $ne: (featured as { _id: unknown })._id };

    const pinned = await Story.find({ ...filter, homepageSlot: 'top' })
        .sort({ publishedAt: -1, _id: -1 })
        .limit(5)
        .select(publicProjection())
        .lean();

    if (pinned.length >= 5) return pinned.map((story) => formatPublicStory(story as Record<string, unknown>));

    const excludeIds = [...(featured ? [(featured as any)._id] : []), ...pinned.map((s) => s._id)];
    const remaining = 5 - pinned.length;

    const fillers = await Story.find({ ...filter, _id: { $nin: excludeIds } })
        .sort({ publishedAt: -1, _id: -1 })
        .limit(remaining)
        .select(publicProjection())
        .lean();

    return [...pinned, ...fillers].map((story) => formatPublicStory(story as Record<string, unknown>));
}

export async function getBreakingStories(): Promise<PublicStory[]> {
    const now = new Date();
    const filter = publicStoryFilter({
        isBreaking: true,
        $or: [
            { breakingExpiresAt: { $gt: now } },
            { breakingExpiresAt: null }
        ]
    });

    const docs = await Story.find(filter).sort({ publishedAt: -1, _id: -1 }).limit(8).select(publicProjection()).lean();
    return docs.map((story) => formatPublicStory(story as Record<string, unknown>));
}

export async function getStoryBySlug(slug: string): Promise<PublicStory> {
    const doc = await Story.findOne(publicStoryFilter({ slug })).select(publicProjection()).lean();
    if (!doc) throw ApiError.notFound('Story not found');
    return formatPublicStory(doc as Record<string, unknown>);
}

export async function getRelatedStories(slug: string): Promise<PublicStory[]> {
    // 👇 Fetch both category and categories to handle migrated and un-migrated data
    const story = await Story.findOne(publicStoryFilter({ slug }))
        .select({ _id: 1, category: 1, categories: 1, tags: 1 })
        .lean();

    if (!story) throw ApiError.notFound('Story not found');

    // Safely determine the primary category
    const storyCategories = Array.isArray(story.categories) ? story.categories : [];
    const cats = Array.from(
        new Set([
            ...storyCategories,
            ...(story.category ? [story.category] : []),
        ]),
    );

    // If the story has no categories at all, just return empty to prevent a crash
    if (cats.length === 0) return [];

    const base = publicStoryFilter({
        $or: [
            { categories: { $in: cats } },
            { category: { $in: cats } },
        ],
        _id: { $ne: story._id },
        isSponsored: { $ne: true }
    });

    const sameCategory = await Story.find(base).sort({ publishedAt: -1, _id: -1 }).limit(4).select(publicProjection()).lean();
    if (sameCategory.length >= 4) return sameCategory.map((story) => formatPublicStory(story as Record<string, unknown>));

    const excludeIds = [story._id, ...sameCategory.map((s) => s._id)];
    const tags = Array.isArray(story.tags) ? story.tags : [];
    if (tags.length === 0) return sameCategory.map((item) => formatPublicStory(item as Record<string, unknown>));

    const byTags = await Story.find(publicStoryFilter({ tags: { $in: tags }, _id: { $nin: excludeIds }, isSponsored: { $ne: true } }))
        .sort({ publishedAt: -1, _id: -1 }).limit(4 - sameCategory.length).select(publicProjection()).lean();

    return [...sameCategory, ...byTags].map((item) => formatPublicStory(item as Record<string, unknown>));
}

// ── Admin ────────────────────────────────────────────────────────────────

export interface AdminListParams {
    status?: 'draft' | 'published';
    category?: string;
    region?: string;
    q?: string;
    page: number;
    limit: number;
}

export async function adminListStories(params: AdminListParams) {
    const { status, category, region, q, page, limit } = params;
    const filter: FilterQuery<StoryAttrs> = {};
    if (status) filter.status = status;
    if (category) {
        filter.$or = [
            { categories: { $in: [category] } },
            { category },
        ];
    }
    if (region) filter.region = region;
    if (q) filter.$text = { $search: q };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        Story.find(filter).sort({ publishedAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        Story.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, pagination: { page, limit, total, totalPages, hasMore: page < totalPages } };
}

export interface StoryInput {
    title: string;
    seoTitle?: string;
    summary: string;
    content?: string;
    author?: string;
    imageUrl: string;
    imageCredit?: string;
    sourceName?: string;
    sourceUrl?: string;
    categories: string[];
    region?: 'Karnataka' | 'India' | 'Global';
    city?: string;
    companies?: string[];
    keyFacts?: { label: string; value: string }[];
    fundingDetails?: {
        amountINR?: string;
        amountUSD?: string;
        round?: string;
        investors?: string[];
    };
    isSponsored?: boolean;
    sponsorName?: string;
    homepageSlot?: 'lead' | 'top' | 'none';
    breakingExpiresAt?: Date | null;
    tags?: string[];
    status?: 'draft' | 'published';
    publishedAt?: Date;
    isFeatured?: boolean;
    isBreaking?: boolean;
}

export async function assertCategoryExists(slug: string): Promise<void> {
    const exists = await Category.exists({ slug });
    if (!exists) {
        throw ApiError.badRequest('VALIDATION_ERROR', 'Unknown category', [
            { path: ['categories'], message: `Category "${slug}" does not exist` },
        ]);
    }
}

export async function adminCreateStory(input: StoryInput, userId: string) {
    for (const cat of input.categories) {
        await assertCategoryExists(cat);
    }

    const data = Object.fromEntries(Object.entries(input).filter(([_, v]) => v !== undefined));
    const story = new Story({ ...data, createdBy: userId });
    await story.save();
    return story.toObject();
}

export async function adminUpdateStory(id: string, input: Partial<StoryInput>) {
    const story = await Story.findById(id);
    if (!story) throw ApiError.notFound('Story not found');

    if (input.categories) {
        for (const cat of input.categories) {
            await assertCategoryExists(cat);
        }
    }

    const data = Object.fromEntries(Object.entries(input).filter(([_, v]) => v !== undefined));
    Object.assign(story, data);
    await story.save();
    return story.toObject();
}

export async function adminDeleteStory(id: string): Promise<void> {
    const res = await Story.findByIdAndDelete(id);
    if (!res) throw ApiError.notFound('Story not found');
}