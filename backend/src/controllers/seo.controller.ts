import type { RequestHandler } from 'express';
import { Story } from '../models/Story.js';

export const getSitemap: RequestHandler = async (req, res) => {
    const baseUrl = 'https://startup-news-room.vercel.app'; // Update with your real domain later
    const stories = await Story.find({ status: 'published', publishedAt: { $lte: new Date() } })
        .select('slug updatedAt')
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
                (s) => `
  <url>
    <loc>${baseUrl}/news/${s.slug}</loc>
    <lastmod>${new Date(s.updatedAt).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
            )
            .join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
};

export const getRss: RequestHandler = async (req, res) => {
    const baseUrl = 'https://startup-news-room.vercel.app';
    const stories = await Story.find({ status: 'published', publishedAt: { $lte: new Date() } })
        .select('title slug summary publishedAt')
        .sort({ publishedAt: -1 })
        .limit(50)
        .lean();

    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Startup News Room</title>
  <link>${baseUrl}</link>
  <description>Daily startup headlines, summarised and linked to the original source.</description>
  <language>en</language>
  ${stories
            .map(
                (s) => `
  <item>
    <title><![CDATA[${s.title}]]></title>
    <link>${baseUrl}/news/${s.slug}</link>
    <description><![CDATA[${s.summary}]]></description>
    <pubDate>${new Date(s.publishedAt).toUTCString()}</pubDate>
  </item>`
            )
            .join('')}
</channel>
</rss>`;

    res.header('Content-Type', 'application/rss+xml');
    res.send(xml);
};