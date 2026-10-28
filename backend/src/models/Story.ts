import mongoose, { Schema, type HydratedDocument, type InferSchemaType } from 'mongoose';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { stripHtml } from '../utils/sanitize.js';

const storySchema = new Schema(
    {
        title: { type: String, required: true, trim: true, minlength: 10, maxlength: 180 },
        slug: { type: String, required: true, unique: true, trim: true, immutable: true },
        summary: { type: String, required: true, trim: true, minlength: 40, maxlength: 500 },
        content: { type: String, default: '', trim: true, maxlength: 5000 },
        imageUrl: { type: String, required: true, trim: true },
        imageCredit: { type: String, default: '', trim: true, maxlength: 200 },
        sourceName: { type: String, required: true, trim: true, maxlength: 120 },
        sourceUrl: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true, lowercase: true },
        tags: {
            type: [String],
            default: [],
            validate: [
                (v: string[]) => v.length <= 8,
                'A story may have at most 8 tags',
            ],
        },
        status: { type: String, enum: ['draft', 'published'], default: 'draft' },
        publishedAt: { type: Date, default: () => new Date() },
        readTime: { type: Number, default: 1, min: 1 },
        isFeatured: { type: Boolean, default: false },
        isBreaking: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
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

// ── Indexes ──────────────────────────────────────────────────────────────
storySchema.index({ slug: 1 }, { unique: true });
storySchema.index({ status: 1, publishedAt: -1 });
storySchema.index({ category: 1, status: 1, publishedAt: -1 });
storySchema.index({ isFeatured: 1 });
storySchema.index({ isBreaking: 1, publishedAt: -1 });
storySchema.index(
    { title: 'text', tags: 'text', summary: 'text' },
    { weights: { title: 10, tags: 5, summary: 2 }, name: 'story_text' },
);

// ── Hooks ────────────────────────────────────────────────────────────────

// Sanitize + compute readTime + generate slug (creation only).
storySchema.pre('validate', async function (this: HydratedDocument<StoryAttrs>) {
    if (typeof this.title === 'string') this.title = stripHtml(this.title);
    if (typeof this.summary === 'string') this.summary = stripHtml(this.summary);
    if (typeof this.content === 'string') this.content = stripHtml(this.content);

    if (Array.isArray(this.tags)) {
        const cleaned = this.tags
            .map((t) => stripHtml(String(t)).trim().toLowerCase())
            .filter(Boolean);
        this.tags = Array.from(new Set(cleaned)).slice(0, 8);
    }

    const text = [this.title, this.summary, this.content].filter(Boolean).join(' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    this.readTime = Math.max(1, Math.ceil(words / 200));

    // Slug is generated once and never changed afterwards.
    if (this.isNew && !this.slug) {
        const base =
            slugify(this.title || 'story', { lower: true, strict: true, trim: true }) || 'story';
        let candidate = base;
        for (let i = 0; i < 10; i += 1) {
            const clash = await mongoose.model('Story').exists({ slug: candidate });
            if (!clash) break;
            candidate = `${base}-${nanoid(6).toLowerCase()}`;
        }
        this.slug = candidate;
    }
});

// Only one featured story at a time.
storySchema.pre('save', async function (this: HydratedDocument<StoryAttrs>) {
    if (this.isFeatured) {
        await mongoose.model('Story').updateMany(
            { _id: { $ne: this._id }, isFeatured: true },
            { $set: { isFeatured: false } },
        );
    }
});

export type StoryAttrs = InferSchemaType<typeof storySchema>;
export type StoryDoc = HydratedDocument<StoryAttrs>;

export const Story = mongoose.model('Story', storySchema);