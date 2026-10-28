import type { RequestHandler } from 'express';
import { body, params, query } from '../middleware/validate.js';
import { Message } from '../models/Message.js';
import { Subscriber } from '../models/Subscriber.js';
import { ApiError } from '../utils/ApiError.js';

export const listMessages: RequestHandler = async (req, res) => {
    const q = query<{ status?: 'new' | 'read'; page: number; limit: number }>(req);
    const filter: Record<string, unknown> = {};
    if (q.status) filter.status = q.status;

    const skip = (q.page - 1) * q.limit;
    const [data, total] = await Promise.all([
        Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
        Message.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / q.limit));
    res.json({ data, pagination: { page: q.page, limit: q.limit, total, totalPages, hasMore: q.page < totalPages } });
};

export const markMessage: RequestHandler = async (req, res) => {
    const { id } = params<{ id: string }>(req);
    const { status } = body<{ status: 'new' | 'read' }>(req);
    const updated = await Message.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!updated) throw ApiError.notFound('Message not found');
    res.json({ data: updated });
};

function csvEscape(value: unknown): string {
    const s = String(value ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export const listSubscribers: RequestHandler = async (req, res) => {
    const q = query<{
        status?: 'active' | 'unsubscribed';
        page: number;
        limit: number;
        format?: 'json' | 'csv';
    }>(req);

    const filter: Record<string, unknown> = {};
    if (q.status) filter.status = q.status;

    if (q.format === 'csv') {
        const rows = await Subscriber.find(filter).sort({ createdAt: -1 }).lean();
        const header = 'email,status,source,createdAt';
        const body = rows
            .map((r) =>
                [r.email, r.status, r.source, r.createdAt?.toISOString?.() ?? '']
                    .map(csvEscape)
                    .join(','),
            )
            .join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
        res.send(`${header}\n${body}\n`);
        return;
    }

    const skip = (q.page - 1) * q.limit;
    const [data, total] = await Promise.all([
        Subscriber.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
        Subscriber.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / q.limit));
    res.json({ data, pagination: { page: q.page, limit: q.limit, total, totalPages, hasMore: q.page < totalPages } });
};