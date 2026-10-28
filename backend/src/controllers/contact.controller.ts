import type { RequestHandler } from 'express';
import { body } from '../middleware/validate.js';
import { createMessage } from '../services/contact.service.js';
import type { ContactBody } from '../validators/public.validators.js';

export const contactHandler: RequestHandler = async (req, res) => {
    const input = body<ContactBody>(req);

    // Honeypot: bots fill every field. Silently accept and store nothing.
    if (input.website && input.website.length > 0) {
        res.status(200).json({ data: { received: true } });
        return;
    }

    await createMessage({
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        type: input.type,
        ip: req.ip ?? '',
    });

    res.status(201).json({ data: { received: true } });
};