import type { RequestHandler } from 'express';
import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import { storageService } from '../services/storage.service.js';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export const uploadImage: RequestHandler = async (req, res) => {
    const file = req.file;
    if (!file) throw ApiError.badRequest('VALIDATION_ERROR', 'No image file provided');

    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED.has(detected.mime)) {
        throw ApiError.badRequest(
            'UNSUPPORTED_MEDIA_TYPE',
            'Only JPEG, PNG and WebP images are allowed',
        );
    }

    const result = await storageService.uploadImage(file.buffer, file.originalname);
    res.status(201).json({ data: result });
};