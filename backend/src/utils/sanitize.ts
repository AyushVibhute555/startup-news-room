import sanitizeHtml from 'sanitize-html';

/** Strips ALL HTML tags and returns plain text. */
export function stripHtml(input: string): string {
    return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
        .replace(/\s+/g, ' ')
        .trim();
}