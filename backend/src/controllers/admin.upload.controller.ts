import type { RequestHandler } from 'express';
import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import { storageService } from '../services/storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '../utils/imageUpload.js';

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1, fields: 12, fieldSize: 64 * 1024, parts: 14 },
});

export const uploadImage: RequestHandler = async (req, res) => {
    const file = req.file;
    if (!file) throw ApiError.badRequest('VALIDATION_ERROR', 'No image file provided');

    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_IMAGE_MIME_TYPES.has(detected.mime)) {
        throw ApiError.badRequest(
            'UNSUPPORTED_MEDIA_TYPE',
            'Only JPEG, PNG and WebP images are allowed',
        );
    }

    const result = await storageService.uploadImage(file.buffer, file.originalname);
    res.status(201).json({ data: result });
};