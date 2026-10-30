import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from 'mongoose';

const categorySchema = new Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        description: { type: String, default: '', trim: true, maxlength: 300 },
        order: { type: Number, default: 0 },
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

// ✅ Explicit index NOT duplicated — slug already has unique:true above.
categorySchema.index({ order: 1 });

export type CategoryAttrs = InferSchemaType<typeof categorySchema>;
export type CategoryDoc = HydratedDocument<CategoryAttrs>;

// ✅ Guarded
export const Category =
    (mongoose.models.Category as mongoose.Model<CategoryAttrs>) ||
    mongoose.model<CategoryAttrs>('Category', categorySchema);