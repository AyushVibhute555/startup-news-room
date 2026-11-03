import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from 'mongoose';

const translationSchema = new Schema(
    {
        originalText: { type: String, required: true },
        targetLang: { type: String, required: true },
        translatedText: { type: String, required: true },
    },
    { timestamps: true }
);

// This makes lookups instant and prevents duplicate translations
translationSchema.index({ originalText: 1, targetLang: 1 }, { unique: true });

export type TranslationAttrs = InferSchemaType<typeof translationSchema>;
export type TranslationDoc = HydratedDocument<TranslationAttrs>;

export const Translation =
    (mongoose.models.Translation as mongoose.Model<TranslationAttrs>) ||
    mongoose.model<TranslationAttrs>('Translation', translationSchema);