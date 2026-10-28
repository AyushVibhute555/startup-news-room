import dns from 'node:dns/promises';
import net from 'node:net';
import * as cheerio from 'cheerio';
import { ApiError } from '../utils/ApiError.js';

const TIMEOUT_MS = 5000;
const MAX_BYTES = 1024 * 1024; // 1 MB
const MAX_REDIRECTS = 3;
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

// ── IP classification ────────────────────────────────────────────────────

const BLOCKED_V4: Array<[string, number]> = [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['192.88.99.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
];

function ipv4ToInt(ip: string): number | null {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    let n = 0;
    for (const p of parts) {
        if (!/^\d{1,3}$/.test(p)) return null;
        const v = Number(p);
        if (v > 255) return null;
        n = n * 256 + v;
    }
    return n >>> 0;
}

function intToIpv4(n: number): string {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function inCidrV4(ipInt: number, base: string, bits: number): boolean {
    const baseInt = ipv4ToInt(base);
    if (baseInt === null) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipInt & mask) === (baseInt & mask);
}

function parseIPv6Groups(input: string): number[] | null {
    let ip = input.toLowerCase();
    const zoneIdx = ip.indexOf('%');
    if (zoneIdx !== -1) ip = ip.slice(0, zoneIdx);
    if (!net.isIPv6(ip)) return null;

    let v4Groups: number[] = [];
    const lastColon = ip.lastIndexOf(':');
    const tail = ip.slice(lastColon + 1);
    if (tail.includes('.')) {
        const v4 = ipv4ToInt(tail);
        if (v4 === null) return null;
        v4Groups = [(v4 >>> 16) & 0xffff, v4 & 0xffff];
        ip = `${ip.slice(0, lastColon + 1)}0:0`;
    }

    const parts = ip.split('::');
    if (parts.length > 2) return null;

    let groups: number[];
    if (parts.length === 1) {
        groups = parts[0]!.split(':').map((h) => parseInt(h, 16));
    } else {
        const left = parts[0] ? parts[0].split(':') : [];
        const right = parts[1] ? parts[1].split(':') : [];
        const leftN = left.map((h) => parseInt(h, 16));
        const rightN = right.map((h) => parseInt(h, 16));
        const missing = 8 - leftN.length - rightN.length;
        if (missing < 0) return null;
        groups = [...leftN, ...new Array<number>(missing).fill(0), ...rightN];
    }

    if (groups.length !== 8) return null;
    if (groups.some((g) => Number.isNaN(g) || g < 0 || g > 0xffff)) return null;

    if (v4Groups.length === 2) {
        groups[6] = v4Groups[0]!;
        groups[7] = v4Groups[1]!;
    }

    return groups;
}

/** True only for globally-routable public addresses. */
export function isPublicIp(ip: string): boolean {
    if (net.isIPv4(ip)) {
        const n = ipv4ToInt(ip);
        if (n === null) return false;
        return !BLOCKED_V4.some(([base, bits]) => inCidrV4(n, base, bits));
    }

    const g = parseIPv6Groups(ip);
    if (!g) return false;

    const allZero = g.every((x) => x === 0);
    if (allZero) return false; // ::

    const isLoopback = g.slice(0, 7).every((x) => x === 0) && g[7] === 1;
    if (isLoopback) return false; // ::1

    if ((g[0]! & 0xfe00) === 0xfc00) return false; // fc00::/7 unique-local
    if ((g[0]! & 0xffc0) === 0xfe80) return false; // fe80::/10 link-local
    if ((g[0]! & 0xff00) === 0xff00) return false; // ff00::/8 multicast

    // IPv4-mapped ::ffff:a.b.c.d
    const mapped =
        g[0] === 0 && g[1] === 0 && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0xffff;
    if (mapped) {
        const v4 = ((g[6]! << 16) | g[7]!) >>> 0;
        return !BLOCKED_V4.some(([base, bits]) => inCidrV4(v4, base, bits));
    }

    // IPv4-compatible ::a.b.c.d (deprecated but still resolvable)
    const compatible = g.slice(0, 6).every((x) => x === 0);
    if (compatible) {
        const v4 = ((g[6]! << 16) | g[7]!) >>> 0;
        if (v4 === 0 || v4 === 1) return false;
        return !BLOCKED_V4.some(([base, bits]) => inCidrV4(v4, base, bits));
    }

    return true;
}

async function assertPublicUrl(url: URL): Promise<void> {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw ApiError.badRequest('LINK_PREVIEW_BLOCKED', 'Only http and https URLs are allowed');
    }

    const host = url.hostname.replace(/^\[|\]$/g, '');

    if (net.isIP(host)) {
        if (!isPublicIp(host)) {
            throw ApiError.badRequest('LINK_PREVIEW_BLOCKED', 'URL points to a private address');
        }
        return;
    }

    let addresses: Array<{ address: string }>;
    try {
        addresses = await dns.lookup(host, { all: true, verbatim: true });
    } catch {
        throw ApiError.badRequest('LINK_PREVIEW_ERROR', 'Could not resolve host');
    }

    if (addresses.length === 0) {
        throw ApiError.badRequest('LINK_PREVIEW_ERROR', 'Could not resolve host');
    }

    for (const a of addresses) {
        if (!isPublicIp(a.address)) {
            throw ApiError.badRequest(
                'LINK_PREVIEW_BLOCKED',
                `URL resolves to a private address (${intToIpv4(ipv4ToInt(a.address) ?? 0) === a.address ? a.address : a.address})`,
            );
        }
    }
}

async function readLimited(res: Response, maxBytes: number): Promise<string> {
    const declared = Number(res.headers.get('content-length') ?? '0');
    if (declared && declared > maxBytes) {
        throw ApiError.badRequest('LINK_PREVIEW_ERROR', 'Response is too large');
    }

    const body = res.body;
    if (!body) return '';

    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    for (; ;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
            total += value.byteLength;
            if (total > maxBytes) {
                await reader.cancel();
                throw ApiError.badRequest('LINK_PREVIEW_ERROR', 'Response is too large');
            }
            chunks.push(value);
        }
    }

    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
}

function metaContent($: cheerio.CheerioAPI, selector: string): string | undefined {
    const v = $(selector).first().attr('content');
    const trimmed = v?.trim();
    return trimmed ? trimmed : undefined;
}

function parseMeta(html: string, baseUrl: URL) {
    const $ = cheerio.load(html);

    const title =
        metaContent($, 'meta[property="og:title"]') ??
        metaContent($, 'meta[name="twitter:title"]') ??
        ($('title').first().text().trim() || undefined);

    const description =
        metaContent($, 'meta[property="og:description"]') ??
        metaContent($, 'meta[name="twitter:description"]') ??
        metaContent($, 'meta[name="description"]');

    const siteName =
        metaContent($, 'meta[property="og:site_name"]') ??
        metaContent($, 'meta[name="application-name"]');

    const rawImage =
        metaContent($, 'meta[property="og:image"]') ??
        metaContent($, 'meta[name="twitter:image"]') ??
        metaContent($, 'meta[name="twitter:image:src"]');

    let imageUrl: string | undefined;
    if (rawImage) {
        try {
            const resolved = new URL(rawImage, baseUrl);
            if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
                imageUrl = resolved.toString();
            }
        } catch {
            imageUrl = undefined;
        }
    }

    return { title, description, imageUrl, siteName };
}

export interface LinkPreview {
    title?: string;
    description?: string;
    imageUrl?: string;
    siteName?: string;
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview> {
    let current: URL;
    try {
        current = new URL(rawUrl);
    } catch {
        throw ApiError.badRequest('VALIDATION_ERROR', 'Invalid URL');
    }

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        await assertPublicUrl(current);

        let res: Response;
        try {
            res = await fetch(current, {
                method: 'GET',
                redirect: 'manual',
                signal: AbortSignal.timeout(TIMEOUT_MS),
                headers: {
                    'user-agent': 'StartupNewsRoomBot/1.0 (+https://startupnewsroom.com)',
                    accept: 'text/html,application/xhtml+xml',
                },
            });
        } catch {
            throw ApiError.badRequest('LINK_PREVIEW_ERROR', 'Could not fetch the URL');
        }

        if (REDIRECT_CODES.has(res.status)) {
            const loc = res.headers.get('location');
            if (!loc) throw ApiError.badRequest('LINK_PREVIEW_ERROR', 'Redirect without a Location header');
            try {
                current = new URL(loc, current);
            } catch {
                throw ApiError.badRequest('LINK_PREVIEW_ERROR', 'Invalid redirect target');
            }
            continue; // revalidate on next loop
        }

        if (!res.ok) {
            throw ApiError.badRequest('LINK_PREVIEW_ERROR', `Upstream responded with ${res.status}`);
        }

        const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
        if (!contentType.includes('text/html')) {
            throw ApiError.badRequest('LINK_PREVIEW_ERROR', 'Expected an HTML page');
        }

        const html = await readLimited(res, MAX_BYTES);
        return parseMeta(html, current);
    }

    throw ApiError.badRequest('LINK_PREVIEW_ERROR', 'Too many redirects');
}