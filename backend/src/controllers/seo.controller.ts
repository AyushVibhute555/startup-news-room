import type { RequestHandler } from 'express';
import { Story } from '../models/Story.js';

const SITE_URL = 'https://startupnewsroom.in';

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export const getSitemap: RequestHandler = async (req, res) => {
    const baseUrl = SITE_URL;
    const stories = await Story.find({ status: 'published', publishedAt: { $lte: new Date() } })
        .select('slug publishedAt updatedAt')
        .sort({ publishedAt: -1 })
        .lean();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  ${stories
            .map(
                (s) => {
                    const url = `${baseUrl}/news/${encodeURIComponent(s.slug)}`;
                    const lastModified = s.updatedAt ?? s.publishedAt;
                    return `
  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${new Date(lastModified).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
                },
            )
            .join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
};

export const getRss: RequestHandler = async (req, res) => {
    const baseUrl = SITE_URL;
    const stories = await Story.find({ status: 'published', publishedAt: { $lte: new Date() } })
        .select('title slug summary publishedAt')
        .sort({ publishedAt: -1 })
        .lean();

    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Startup News Room</title>
  <link>${escapeXml(baseUrl)}</link>
  <description>Daily startup headlines, summarised and linked to the original source.</description>
  <language>en</language>
  ${stories
            .map(
                (s) => {
                    const url = `${baseUrl}/news/${encodeURIComponent(s.slug)}`;
                    return `
  <item>
    <title>${escapeXml(s.title)}</title>
    <link>${escapeXml(url)}</link>
    <guid isPermaLink="true">${escapeXml(url)}</guid>
    <description>${escapeXml(s.summary)}</description>
    <pubDate>${new Date(s.publishedAt).toUTCString()}</pubDate>
  </item>`;
                },
            )
            .join('')}
</channel>
</rss>`;

    res.header('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(xml);
};