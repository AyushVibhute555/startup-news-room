import mongoose, { Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { stripHtml } from '../utils/sanitize.js';

const keyFactSchema = new Schema(
    {
        label: { type: String, required: true, trim: true, maxlength: 80 },
        value: { type: String, required: true, trim: true, maxlength: 300 },
    },
    { _id: false },
);

const newsSubmissionSchema = new Schema(
    {
        submitterName: { type: String, required: true, trim: true, maxlength: 120 },
        submitterEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
        title: { type: String, required: true, trim: true, minlength: 10, maxlength: 180 },
        summary: { type: String, required: true, trim: true, minlength: 40, maxlength: 500 },
        content: { type: String, required: true, trim: true, maxlength: 50000 },
        keyFacts: { type: [keyFactSchema], default: [], validate: [(facts: unknown[]) => facts.length <= 8, 'A story may have at most 8 key facts'] },
        author: { type: String, default: '', trim: true, maxlength: 120 },
        imageUrl: { type: String, required: true, trim: true },
        imagePublicId: { type: String, required: true, trim: true },
        imageCredit: { type: String, default: '', trim: true, maxlength: 200 },
        category: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
        publishedAt: { type: Date, default: null },
        status: { type: String, enum: ['pending', 'published', 'rejected'], default: 'pending' },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        storyId: { type: Schema.Types.ObjectId, ref: 'Story', default: null },
        rejectionReason: { type: String, default: '', trim: true, maxlength: 500 },
    },
    {
        timestamps: true,
        toJSON: {
            versionKey: false,
            transform: (_doc, ret: Record<string, unknown>) => {
                delete ret.__v;
                return ret;
            },
        },
    },
);

newsSubmissionSchema.index({ status: 1, createdAt: -1 });

newsSubmissionSchema.pre('validate', function () {
    if (typeof this.title === 'string') this.title = stripHtml(this.title);
    if (typeof this.summary === 'string') this.summary = stripHtml(this.summary);
    if (typeof this.author === 'string') this.author = stripHtml(this.author);
});

export type NewsSubmissionAttrs = InferSchemaType<typeof newsSubmissionSchema>;
export type NewsSubmissionDoc = HydratedDocument<NewsSubmissionAttrs>;

export const NewsSubmission =
    (mongoose.models.NewsSubmission as mongoose.Model<NewsSubmissionAttrs>) ||
    mongoose.model<NewsSubmissionAttrs>('NewsSubmission', newsSubmissionSchema);
