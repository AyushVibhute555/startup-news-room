import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { nanoid } from 'nanoid';

const subscriberSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        status: { type: String, enum: ['active', 'unsubscribed'], default: 'active' },
        unsubscribeToken: { type: String, default: () => nanoid(32) },
        source: { type: String, default: 'website', trim: true, maxlength: 120 },
    },
    { timestamps: true },
);

subscriberSchema.index({ status: 1, createdAt: -1 });
subscriberSchema.index({ unsubscribeToken: 1 });

export type SubscriberAttrs = InferSchemaType<typeof subscriberSchema>;
export type SubscriberDoc = HydratedDocument<SubscriberAttrs>;

// ✅ Guarded
export const Subscriber =
    (mongoose.models.Subscriber as mongoose.Model<SubscriberAttrs>) ||
    mongoose.model<SubscriberAttrs>('Subscriber', subscriberSchema);