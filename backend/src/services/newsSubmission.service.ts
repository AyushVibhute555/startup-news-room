import { fileTypeFromBuffer } from 'file-type';
import { Types, type FilterQuery } from 'mongoose';
import { NewsSubmission, type NewsSubmissionAttrs } from '../models/NewsSubmission.js';
import { Story } from '../models/Story.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { ALLOWED_IMAGE_MIME_TYPES } from '../utils/imageUpload.js';
import { storageService } from './storage.service.js';
import { assertCategoryExists } from './story.service.js';
import type { NewsSubmissionBody } from '../validators/public.validators.js';
import type { PublishNewsSubmissionInput } from '../validators/admin.validators.js';

export async function createNewsSubmission(
    input: NewsSubmissionBody,
    file: Express.Multer.File | undefined,
) {
    if (!file) throw ApiError.badRequest('VALIDATION_ERROR', 'Please attach one image');
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_IMAGE_MIME_TYPES.has(detected.mime)) {
        throw ApiError.badRequest('UNSUPPORTED_MEDIA_TYPE', 'Only JPEG, PNG and WebP images are allowed');
    }

    await assertCategoryExists(input.category);
    const image = await storageService.uploadImage(file.buffer, 'community-news-image');

    try {
        const submission = await NewsSubmission.create({
            submitterName: input.submitterName,
            submitterEmail: input.submitterEmail,
            title: input.title,
            summary: input.summary,
            content: input.content,
            keyFacts: input.keyFacts,
            author: input.author,
            imageUrl: image.url,
            imagePublicId: image.publicId,
            imageCredit: input.imageCredit,
            category: input.category,
            publishedAt: input.publishedAt ?? null,
        });
        return submission.toObject();
    } catch (error) {
        try {
            await storageService.deleteImage(image.publicId);
        } catch (cleanupError) {
            logger.error({ err: cleanupError }, 'Could not clean up an unlinked submission image');
        }
        throw error;
    }
}

export async function listNewsSubmissions(
    status: NewsSubmissionAttrs['status'],
    page: number,
    limit: number,
) {
    const filter: FilterQuery<NewsSubmissionAttrs> = { status };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        NewsSubmission.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        NewsSubmission.countDocuments(filter),
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            hasMore: page * limit < total,
        },
    };
}

export async function publishNewsSubmission(
    id: string,
    input: PublishNewsSubmissionInput,
    reviewerId: string,
) {
    const submission = await NewsSubmission.findById(id);
    if (!submission) throw ApiError.notFound('News submission not found');

    if (submission.status === 'published' && submission.storyId) {
        const existingStory = await Story.findById(submission.storyId).lean();
        if (existingStory) return existingStory;
    } else if (submission.status !== 'pending') {
        throw ApiError.conflict('Only pending submissions can be published');
    }

    await assertCategoryExists(input.category);
    let story = await Story.findOne({ newsSubmissionId: submission._id });
    if (!story) {
        try {
            story = new Story({
                title: input.title,
                summary: input.summary,
                content: input.content,
                keyFacts: input.keyFacts ?? submission.keyFacts,
                author: input.author || submission.submitterName,
                imageUrl: input.imageUrl,
                imageCredit: input.imageCredit,
                categories: [input.category],
                category: input.category,
                status: 'published',
                publishedAt: input.publishedAt === null
                    ? new Date()
                    : input.publishedAt ?? submission.publishedAt ?? new Date(),
                createdBy: reviewerId,
                newsSubmissionId: submission._id,
            });
            await story.save();
        } catch (error) {
            if (
                typeof error !== 'object' ||
                error === null ||
                !('code' in error) ||
                (error as { code?: unknown }).code !== 11000
            ) {
                throw error;
            }
            story = await Story.findOne({ newsSubmissionId: submission._id });
            if (!story) throw error;
        }
    }

    submission.status = 'published';
    submission.storyId = story._id;
    submission.reviewedBy = new Types.ObjectId(reviewerId);
    submission.reviewedAt = new Date();
    submission.rejectionReason = '';
    await submission.save();
    return story.toObject();
}

export async function rejectNewsSubmission(id: string, reason: string | undefined, reviewerId: string) {
    const submission = await NewsSubmission.findById(id);
    if (!submission) throw ApiError.notFound('News submission not found');
    if (submission.status !== 'pending') {
        throw ApiError.conflict('Only pending submissions can be rejected');
    }

    submission.status = 'rejected';
    submission.reviewedBy = new Types.ObjectId(reviewerId);
    submission.reviewedAt = new Date();
    submission.rejectionReason = reason ?? '';
    await submission.save();
    return submission.toObject();
}
