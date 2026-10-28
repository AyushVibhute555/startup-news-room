import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const ROLES = ['admin', 'editor'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ROLES, default: 'editor' },
        tokenVersion: { type: Number, default: 0 },
        lastLoginAt: { type: Date, default: null },
    },
    {
        timestamps: true,
        toJSON: {
            versionKey: false,
            transform: (_doc, ret: Record<string, unknown>) => {
                delete ret.passwordHash;
                delete ret.tokenVersion;
                delete ret.__v;
                return ret;
            },
        },
    },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;

export const User = mongoose.model('User', userSchema);