export const PUBLIC_STORY_PROJECTION = {
    _id: 1,
    title: 1,
    slug: 1,
    summary: 1,
    content: 1,
    imageUrl: 1,
    imageCredit: 1,
    sourceName: 1,
    sourceUrl: 1,
    category: 1,
    tags: 1,
    publishedAt: 1,
    readTime: 1,
    isFeatured: 1,
    isBreaking: 1,
} as const;

export const SEED_CATEGORIES = [
    { name: 'Funding', slug: 'funding', order: 1, description: 'Rounds, raises and investors.' },
    { name: 'Launches', slug: 'launches', order: 2, description: 'New products and public releases.' },
    { name: 'AI', slug: 'ai', order: 3, description: 'Artificial intelligence and machine learning.' },
    { name: 'Fintech', slug: 'fintech', order: 4, description: 'Payments, banking and financial infrastructure.' },
    { name: 'SaaS', slug: 'saas', order: 5, description: 'Software as a service and B2B tooling.' },
    { name: 'Founders', slug: 'founders', order: 6, description: 'People building companies.' },
    { name: 'Markets', slug: 'markets', order: 7, description: 'Market trends and analysis.' },
    { name: 'Policy', slug: 'policy', order: 8, description: 'Regulation and public policy.' },
];