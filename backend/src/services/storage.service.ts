import { Readable } from 'node:stream';
import { cloudinary } from '../config/cloudinary.js';

export interface UploadResult {
    url: string;
    width: number;
    height: number;
    publicId: string;
}

/** Swap this interface to change storage providers later. */
export interface StorageService {
    uploadImage(buffer: Buffer, filename: string): Promise<UploadResult>;
}

export const CLOUDINARY_FOLDER = 'startup-news-room/stories';

class CloudinaryStorageService implements StorageService {
    uploadImage(buffer: Buffer, _filename: string): Promise<UploadResult> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: CLOUDINARY_FOLDER,
                    resource_type: 'image',
                    overwrite: false,
                    unique_filename: true,
                },
                (error, result) => {
                    if (error || !result) {
                        reject(error ?? new Error('Cloudinary upload failed'));
                        return;
                    }
                    resolve({
                        url: result.secure_url,
                        width: result.width,
                        height: result.height,
                        publicId: result.public_id,
                    });
                },
            );
            Readable.from(buffer).pipe(stream);
        });
    }
}

export const storageService: StorageService = new CloudinaryStorageService();