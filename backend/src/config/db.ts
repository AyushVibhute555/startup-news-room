import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const STATE_NAMES = ['disconnected', 'connected', 'connecting', 'disconnecting'] as const;

export function dbState(): string {
    return STATE_NAMES[mongoose.connection.readyState] ?? 'unknown';
}

export async function connectDB(uri: string = env.MONGODB_URI): Promise<void> {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 10,
    });
    logger.info({ db: dbState() }, 'MongoDB connected');
}

export async function disconnectDB(): Promise<void> {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
}