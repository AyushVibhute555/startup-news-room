import { Message } from '../models/Message.js';

export interface ContactInput {
    name: string;
    email: string;
    subject?: string;
    message: string;
    type: 'contact' | 'tip';
    ip: string;
}

/**
 * TODO(email): forward the message to the editorial inbox once an email
 * provider is wired up. For now messages are persisted only.
 */
export async function createMessage(input: ContactInput): Promise<void> {
    await Message.create({
        type: input.type,
        name: input.name,
        email: input.email,
        subject: input.subject ?? '',
        message: input.message,
        status: 'new',
        ip: input.ip,
    });
}