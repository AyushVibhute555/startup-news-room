import { describe, expect, it } from 'vitest';
import { sanitizeContent, stripHtml } from '../src/utils/sanitize.js';

describe('plain text sanitization', () => {
    it('preserves ampersands as plain text while removing HTML markup', () => {
        expect(stripHtml('Test & check')).toBe('Test & check');
        expect(stripHtml('Test <strong>&amp;</strong> check')).toBe('Test & check');
    });
});

describe('story content formatting', () => {
    it('turns plain-text Markdown into spaced paragraphs, headings and lists', () => {
        const content = sanitizeContent(
            'First **important** paragraph.\nContinued on a new line.\n\n## Key details\n\n- First point\n- Second point\n\n1. First step',
        );

        expect(content).toContain('<p>First <strong>important</strong> paragraph.<br />Continued on a new line.</p>');
        expect(content).toContain('<h3>Key details</h3>');
        expect(content).toContain('<ul><li>First point</li><li>Second point</li></ul>');
        expect(content).toContain('<ol><li>First step</li></ol>');
    });

    it('continues sanitizing existing HTML without stripping its semantic structure', () => {
        const content = sanitizeContent('<p>Existing paragraph</p><table><tbody><tr><td>Fact</td></tr></tbody></table><script>alert(1)</script>');

        expect(content).toContain('<p>Existing paragraph</p>');
        expect(content).toContain('<table><tbody><tr><td>Fact</td></tr></tbody></table>');
        expect(content).not.toContain('<script>');
    });
});
