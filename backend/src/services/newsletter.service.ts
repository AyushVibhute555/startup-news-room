import { Subscriber } from '../models/Subscriber.js';

/**
 * Idempotent subscribe. Never reveals whether the email already existed.
 *
 * TODO(email): hook up a transactional email provider here (double opt-in,
 * welcome mail). Intentionally not implemented in this phase.
 */
export async function subscribe(email: string, source = 'website'): Promise<void> {
    const existing = await Subscriber.findOne({ email });

    if (existing) {
        if (existing.status === 'unsubscribed') {
            existing.status = 'active';
            await existing.save();
        }
        return;
    }

    await Subscriber.create({ email, source, status: 'active' });
}

/**
 * Idempotent unsubscribe. Returns silently for unknown tokens so we don't
 * leak whether a token is valid.
 */
export async function unsubscribe(token: string): Promise<void> {
    await Subscriber.updateOne(
        { unsubscribeToken: token },
        { $set: { status: 'unsubscribed' } },
    );
}