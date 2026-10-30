import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from 'mongoose';

const messageSchema = new Schema(
    {
        type: { type: String, enum: ['contact', 'tip'], required: true },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, lowercase: true, trim: true },
        subject: { type: String, default: '', trim: true, maxlength: 200 },
        message: { type: String, required: true, trim: true, maxlength: 5000 },
        status: { type: String, enum: ['new', 'read'], default: 'new' },
        ip: { type: String, default: '' },
    },
    { timestamps: true },
);

messageSchema.index({ status: 1, createdAt: -1 });

export type MessageAttrs = InferSchemaType<typeof messageSchema>;
export type MessageDoc = HydratedDocument<MessageAttrs>;

// ✅ Guarded
export const Message =
    (mongoose.models.Message as mongoose.Model<MessageAttrs>) ||
    mongoose.model<MessageAttrs>('Message', messageSchema);