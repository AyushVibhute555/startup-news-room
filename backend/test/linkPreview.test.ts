import { describe, it, expect } from 'vitest';
import { fetchLinkPreview, isPublicIp } from '../src/services/linkPreview.service.js';

describe('isPublicIp', () => {
    it.each([
        '127.0.0.1',
        '10.1.2.3',
        '172.16.5.5',
        '192.168.1.1',
        '169.254.169.254',
        '0.0.0.0',
        '::1',
        'fc00::1',
        'fd12:3456::1',
        'fe80::1',
        '::ffff:127.0.0.1',
    ])('rejects private address %s', (ip) => {
        expect(isPublicIp(ip)).toBe(false);
    });

    it.each(['8.8.8.8', '1.1.1.1', '203.0.114.5', '2606:4700:4700::1111'])(
        'accepts public address %s',
        (ip) => {
            expect(isPublicIp(ip)).toBe(true);
        },
    );
});

describe('link preview SSRF protection', () => {
    it('rejects a loopback URL', async () => {
        await expect(fetchLinkPreview('http://127.0.0.1:3000/')).rejects.toMatchObject({
            code: 'LINK_PREVIEW_BLOCKED',
        });
    });

    it('rejects a private IPv4 URL', async () => {
        await expect(fetchLinkPreview('http://192.168.0.10/')).rejects.toMatchObject({
            code: 'LINK_PREVIEW_BLOCKED',
        });
    });

    it('rejects a cloud metadata IP', async () => {
        await expect(fetchLinkPreview('http://169.254.169.254/latest/meta-data/')).rejects.toMatchObject({
            code: 'LINK_PREVIEW_BLOCKED',
        });
    });

    it('rejects a non-http protocol', async () => {
        await expect(fetchLinkPreview('file:///etc/passwd')).rejects.toMatchObject({
            code: 'LINK_PREVIEW_BLOCKED',
        });
    });
});