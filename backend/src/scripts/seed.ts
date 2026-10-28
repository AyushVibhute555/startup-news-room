import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { Story } from '../models/Story.js';
import { SEED_CATEGORIES } from '../utils/storyConstants.js';

interface SeedStory {
    title: string;
    summary: string;
    content: string;
    category: string;
    tags: string[];
    sourceName: string;
    sourceUrl: string;
    imageUrl: string;
    imageCredit: string;
    daysAgo: number;
    isFeatured?: boolean;
    isBreaking?: boolean;
}

const UNSPLASH = (id: string) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const SEED_STORIES: SeedStory[] = [
    {
        title: 'Nimbus Labs Raises $12M Series A to Scale Edge Data Pipelines',
        summary:
            'The fictional Amsterdam-based startup says the round will fund hiring and a new region in Singapore, targeting mid-market data teams.',
        content:
            'Nimbus Labs, a fictional data-infrastructure company, announced a $12 million Series A led by a made-up venture firm. The company builds edge-native pipelines for mid-market analytics teams.\n\nThe team plans to double headcount and open a Singapore region in Q3.',
        category: 'funding',
        tags: ['series-a', 'data', 'edge'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/nimbus-labs-series-a',
        imageUrl: UNSPLASH('1556742049-0cfed4f6a45d'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 0,
        isFeatured: true,
    },
    {
        title: 'Verdant AI Ships an Open Model Tuned for Supply-Chain Forecasting',
        summary:
            'The fictional open-weights model claims a 20% accuracy improvement over generic baselines on public logistics datasets.',
        content:
            'Verdant AI, a fictional research lab, released a model checkpoint tuned for supply-chain forecasting under a permissive licence.\n\nBenchmarks on two public datasets showed a double-digit improvement over generic baselines.',
        category: 'ai',
        tags: ['open-source', 'forecasting', 'models'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/verdant-ai-supply-chain-model',
        imageUrl: UNSPLASH('1555066931-4365d14bab8c'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 0,
        isBreaking: true,
    },
    {
        title: 'LedgerLoop Launches Instant Payouts for Cross-Border Contractors',
        summary:
            'The fictional fintech says contractors in 40 countries can now receive same-day settlement in local currency.',
        content:
            'LedgerLoop, a fictional payments startup, launched a same-day payout product aimed at freelance marketplaces.\n\nThe company says settlement times drop from five days to under six hours in supported corridors.',
        category: 'fintech',
        tags: ['payments', 'payouts', 'cross-border'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/ledgerloop-instant-payouts',
        imageUrl: UNSPLASH('1563013544-824ae1b704d3'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 1,
        isBreaking: true,
    },
    {
        title: 'QuantaForge Opens a Self-Serve Tier for Its Developer Platform',
        summary:
            'The fictional SaaS vendor is dropping the sales call for small teams, with usage-based pricing starting at zero.',
        content:
            'QuantaForge, a fictional developer-tooling company, moved to a self-serve motion for teams under ten seats.\n\nExisting contract customers keep their negotiated pricing until renewal.',
        category: 'saas',
        tags: ['pricing', 'self-serve', 'devtools'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/quantforge-self-serve',
        imageUrl: UNSPLASH('1551288049-bebda4e38f71'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 1,
    },
    {
        title: 'Brightpath Closes $4M Seed to Reinvent Small-Team Onboarding',
        summary:
            'The fictional people-ops startup wants to replace the take-home assignment with a structured two-day pairing session.',
        content:
            'Brightpath, a fictional people-operations startup, raised a $4 million seed round to productise a structured onboarding format.\n\nThe company says pilot customers cut time-to-productivity by three weeks.',
        category: 'funding',
        tags: ['seed', 'hiring', 'people-ops'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/brightpath-seed',
        imageUrl: UNSPLASH('1521737604893-d14cc237f11d'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 2,
    },
    {
        title: 'Cobalt Systems Debuts a Compliance Copilot for Early-Stage Startups',
        summary:
            'The fictional tool auto-drafts SOC 2 evidence requests and flags gaps before the auditor call.',
        content:
            'Cobalt Systems, a fictional compliance-automation startup, launched a copilot aimed at teams preparing for their first SOC 2 audit.\n\nThe product integrates with common cloud providers to gather evidence automatically.',
        category: 'launches',
        tags: ['compliance', 'soc2', 'launch'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/cobalt-systems-launch',
        imageUrl: UNSPLASH('1454165804606-c3d57bc86b40'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 2,
    },
    {
        title: 'Harbor Analytics Says Its New Query Engine Cuts Warehouse Bills',
        summary:
            'The fictional analytics vendor claims customers can save up to 30% by caching repeated dashboard queries.',
        content:
            'Harbor Analytics, a fictional BI company, shipped a caching layer for its query engine.\n\nInternal benchmarks show reduced scan volume on repeated dashboard loads.',
        category: 'saas',
        tags: ['analytics', 'warehouse', 'cost'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/harbor-analytics-engine',
        imageUrl: UNSPLASH('1551288049-bebda4e38f71'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 3,
    },
    {
        title: 'OrbitPay Brings Tap-to-Pay to Independent Coffee Chains',
        summary:
            'The fictional point-of-sale startup is packaging hardware and software for shops with fewer than ten locations.',
        content:
            'OrbitPay, a fictional point-of-sale company, launched a bundle aimed at independent coffee chains.\n\nThe hardware supports offline card authorisation and syncs once connectivity returns.',
        category: 'fintech',
        tags: ['pos', 'payments', 'retail'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/orbitpay-tap-to-pay',
        imageUrl: UNSPLASH('1556742049-0cfed4f6a45d'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 3,
    },
    {
        title: 'Fernway Founder on Why the Second Product Is Harder Than the First',
        summary:
            'In a fictional interview, the founder argues that distribution, not ideation, is the real constraint at Series B.',
        content:
            'In this fictional interview, Fernway co-founder Alex Moreau discusses the transition from a single-product company to a platform.\n\n"The second product inherits the first product\'s assumptions," Moreau said.',
        category: 'founders',
        tags: ['interview', 'product', 'strategy'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/fernway-founder-interview',
        imageUrl: UNSPLASH('1552664730-d307ca884978'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 3,
    },
    {
        title: 'Kite Robotics Unveils a Warehouse Arm Aimed at Mid-Size 3PLs',
        summary:
            'The fictional robotics company says the arm can be deployed in a single shift without a dedicated integrator.',
        content:
            'Kite Robotics, a fictional automation vendor, announced a warehouse arm designed for facilities that cannot afford a full integration project.\n\nPilot deployments begin next quarter with three logistics partners.',
        category: 'launches',
        tags: ['robotics', 'warehouse', 'logistics'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/kite-robotics-arm',
        imageUrl: UNSPLASH('1565043666747-69f6646db940'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 4,
    },
    {
        title: 'Slate Health Lands $9M to Bring Triage Tools to Rural Clinics',
        summary:
            'The fictional health-tech startup plans to deploy its triage assistant in 200 clinics over the next 18 months.',
        content:
            'Slate Health, a fictional health-technology company, closed a $9 million round led by a made-up impact fund.\n\nThe company says its triage assistant runs offline on commodity tablets.',
        category: 'funding',
        tags: ['health', 'series-a', 'rural'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/slate-health-funding',
        imageUrl: UNSPLASH('1576091160399-112ba8d25d1d'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 4,
    },
    {
        title: 'PixelMill Argues Generative Tools Need a Licence Ledger',
        summary:
            'The fictional media startup proposes a registry that tracks which model generations were used in published work.',
        content:
            'PixelMill, a fictional media startup, published a proposal for a "licence ledger" that records the provenance of AI-assisted content.\n\nThe proposal is open for comment.',
        category: 'ai',
        tags: ['policy', 'generative', 'media'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/pixelmill-licence-ledger',
        imageUrl: UNSPLASH('1677442136019-21780ecad995'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 5,
    },
    {
        title: 'Regulators Publish Draft Rules for Buy-Now-Pay-Later Providers',
        summary:
            'The fictional rules would require clearer fee disclosures and a standard affordability check for small-ticket purchases.',
        content:
            'A fictional regulator published draft rules for buy-now-pay-later providers, opening a 90-day comment period.\n\nThe draft focuses on fee transparency and affordability checks.',
        category: 'policy',
        tags: ['regulation', 'bnpl', 'consumer'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/draft-bnpl-rules',
        imageUrl: UNSPLASH('1450101499163-c8848c66ca85'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 5,
    },
    {
        title: 'Tidewater Markets Sees a Rotation Into Infrastructure Startups',
        summary:
            'A fictional analyst note argues that late-stage capital is shifting away from consumer apps toward infrastructure.',
        content:
            'A fictional analyst note from Tidewater Markets tracks deal volume across late-stage rounds.\n\nInfrastructure startups accounted for the largest share of new capital commitments last quarter.',
        category: 'markets',
        tags: ['analysis', 'infrastructure', 'capital'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/tidewater-rotation',
        imageUrl: UNSPLASH('1611974789855-9c2a0a7236a3'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 5,
    },
    {
        title: 'Loopwise Launches a Usage-Based Billing Engine for AI Products',
        summary:
            'The fictional billing startup handles token metering, credits and overage in a single integration.',
        content:
            'Loopwise, a fictional billing company, launched a metering engine for AI products that supports credits, seat-based pricing and overages.\n\nThe company says the engine handles retries and reconciliation.',
        category: 'saas',
        tags: ['billing', 'usage-based', 'ai'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/loopwise-billing',
        imageUrl: UNSPLASH('1554224155-6726b3ff858f'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 6,
    },
    {
        title: 'Founder Survey Finds Hiring Is Still the Top Constraint for Seed Teams',
        summary:
            'A fictional survey of 400 seed-stage founders found hiring, not fundraising, cited as the biggest bottleneck.',
        content:
            'A fictional survey of 400 seed-stage founders found that hiring remains the top constraint.\n\nThe report also found longer sales cycles for B2B products.',
        category: 'founders',
        tags: ['survey', 'hiring', 'seed'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/founder-survey-hiring',
        imageUrl: UNSPLASH('1522071820081-009f0129c71c'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 6,
    },
    {
        title: 'Copperline AI Raises $6M to Build Evaluation Tooling for Agents',
        summary:
            'The fictional startup sells regression tests for multi-step agent workflows, with replayable traces.',
        content:
            'Copperline AI, a fictional evaluation-tooling company, raised a $6 million seed round.\n\nThe product records agent traces and replays them against new model versions.',
        category: 'ai',
        tags: ['agents', 'evaluation', 'seed'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/copperline-ai-seed',
        imageUrl: UNSPLASH('1620712943543-bcc4688e7485'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 6,
    },
    {
        title: 'Meridian Bank Partners With a Fictional Open-Banking Startup',
        summary:
            'The partnership gives small business customers a read-only cash-flow view across multiple accounts.',
        content:
            'Meridian Bank, a fictional institution, announced a partnership with an open-banking startup to provide cash-flow views.\n\nThe feature launches in beta next month.',
        category: 'fintech',
        tags: ['open-banking', 'partnership', 'smb'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/meridian-open-banking',
        imageUrl: UNSPLASH('1563986768609-322da13575f3'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 6,
    },
    {
        title: 'Startup Policy Group Publishes a Template for AI Transparency Reports',
        summary:
            'The fictional template gives early-stage teams a lightweight way to document model changes and evaluation results.',
        content:
            'A fictional startup policy group published a template for AI transparency reports aimed at companies without a dedicated compliance function.\n\nThe template is released under a permissive licence.',
        category: 'policy',
        tags: ['ai', 'transparency', 'template'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/ai-transparency-template',
        imageUrl: UNSPLASH('1454165804606-c3d57bc86b40'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 6,
    },
    {
        title: 'Northwind Studio Launches a No-Code Dashboard Builder',
        summary:
            'The fictional product lets operations teams assemble dashboards from spreadsheets without a data engineer.',
        content:
            'Northwind Studio, a fictional software company, launched a no-code dashboard builder aimed at operations teams.\n\nThe tool ships with connectors for common spreadsheet providers.',
        category: 'launches',
        tags: ['no-code', 'dashboards', 'launch'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/northwind-launch',
        imageUrl: UNSPLASH('1551288049-bebda4e38f71'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 6,
    },
    {
        title: 'Analysts Flag a Widening Gap Between Seed and Series A Valuations',
        summary:
            'A fictional market report notes that seed valuations held steady while Series A multiples compressed.',
        content:
            'A fictional market report from a made-up research firm examined valuation trends across stages.\n\nSeries A multiples compressed for the third consecutive quarter.',
        category: 'markets',
        tags: ['valuations', 'seed', 'series-a'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/valuation-gap-report',
        imageUrl: UNSPLASH('1611974789855-9c2a0a7236a3'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 6,
    },
    {
        title: 'Juniper Works Debuts an API-First Payroll Product for Marketplaces',
        summary:
            'The fictional payroll startup lets marketplace operators pay gig workers in multiple currencies.',
        content:
            'Juniper Works, a fictional payroll startup, released an API-first product for marketplace operators.\n\nThe product supports multi-currency payouts and tax withholding in supported regions.',
        category: 'fintech',
        tags: ['payroll', 'api', 'marketplaces'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/juniper-payroll',
        imageUrl: UNSPLASH('1554224155-6726b3ff858f'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 6,
    },
    {
        title: 'Studio Nine Ships a Design-System Audit Service for Growth Teams',
        summary:
            'The fictional agency packages a two-week audit that scores component coverage and accessibility.',
        content:
            'Studio Nine, a fictional design agency, launched a productised design-system audit aimed at growth teams.\n\nThe audit covers component coverage, token drift and accessibility.',
        category: 'saas',
        tags: ['design-systems', 'audit', 'accessibility'],
        sourceName: 'Example Wire',
        sourceUrl: 'https://example.com/news/studio-nine-audit',
        imageUrl: UNSPLASH('1559028012-481c04fa702d'),
        imageCredit: 'Illustrative — Unsplash',
        daysAgo: 6,
    },
];

function readTimeOf(text: string): number {
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}

async function seed(): Promise<void> {
    await connectDB();
    logger.info('Seeding database…');

    // 1. Categories
    for (const c of SEED_CATEGORIES) {
        await Category.updateOne(
            { slug: c.slug },
            { $setOnInsert: { name: c.name, slug: c.slug, description: c.description, order: c.order } },
            { upsert: true },
        );
    }
    logger.info(`Categories ensured: ${SEED_CATEGORIES.length}`);

    // 2. Admin user
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    const adminResult = await User.updateOne(
        { email: env.ADMIN_EMAIL.toLowerCase() },
        {
            $setOnInsert: {
                name: env.ADMIN_NAME,
                email: env.ADMIN_EMAIL.toLowerCase(),
                passwordHash,
                role: 'admin',
                tokenVersion: 0,
            },
        },
        { upsert: true },
    );
    const admin = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
    if (!admin) throw new Error('Failed to create/find admin user');
    logger.info(`Admin user ready: ${admin.email} (${adminResult.upsertedCount ? 'created' : 'existing'})`);

    // 3. Stories
    let created = 0;
    const now = Date.now();

    for (const s of SEED_STORIES) {
        const slug = slugify(s.title, { lower: true, strict: true, trim: true });
        const publishedAt = new Date(now - s.daysAgo * 24 * 60 * 60 * 1000);
        const readTime = readTimeOf([s.title, s.summary, s.content].join(' '));

        const res = await Story.updateOne(
            { slug },
            {
                $setOnInsert: {
                    title: s.title,
                    slug,
                    summary: s.summary,
                    content: s.content,
                    imageUrl: s.imageUrl,
                    imageCredit: s.imageCredit,
                    sourceName: s.sourceName,
                    sourceUrl: s.sourceUrl,
                    category: s.category,
                    tags: s.tags,
                    status: 'published',
                    publishedAt,
                    readTime,
                    isFeatured: Boolean(s.isFeatured),
                    isBreaking: Boolean(s.isBreaking),
                    createdBy: admin._id,
                },
            },
            { upsert: true },
        );

        if (res.upsertedCount) created += 1;
    }

    // Ensure featured uniqueness in case seed data changed between runs.
    const featuredCount = await Story.countDocuments({ isFeatured: true });
    if (featuredCount > 1) {
        const keep = await Story.findOne({ isFeatured: true }).sort({ publishedAt: -1 }).lean();
        if (keep) {
            await Story.updateMany(
                { isFeatured: true, _id: { $ne: keep._id } },
                { $set: { isFeatured: false } },
            );
        }
    }

    logger.info(`Stories created: ${created} / ${SEED_STORIES.length} (idempotent)`);
    logger.info('Seed complete.');
    await disconnectDB();
}

seed().catch(async (err) => {
    logger.fatal({ err }, 'Seed failed');
    await disconnectDB().catch(() => undefined);
    process.exit(1);
});