import { connectDB, disconnectDB } from '../config/db.js';
import { Category } from '../models/Category.js';
import { Story } from '../models/Story.js';
import { logger } from '../utils/logger.js';

const LEGACY_SLUG = 'markets';
const CANONICAL_SLUG = 'ipo-markets';

async function migrateMarketCategory(): Promise<void> {
    await connectDB();

    await Category.updateOne(
        { slug: CANONICAL_SLUG },
        {
            $set: {
                name: 'IPOs & Markets',
                description: 'Public listings, market trends and analysis.',
                order: 7,
            },
            $setOnInsert: { slug: CANONICAL_SLUG },
        },
        { upsert: true },
    );

    const legacyStories = await Story.collection.find({
        $or: [{ categories: LEGACY_SLUG }, { category: LEGACY_SLUG }],
    }).toArray();

    for (const story of legacyStories) {
        const categories = Array.isArray(story.categories)
            ? story.categories.filter((category): category is string => typeof category === 'string')
            : [];
        const migratedCategories = Array.from(
            new Set(categories.map((category) => category === LEGACY_SLUG ? CANONICAL_SLUG : category)),
        );

        if (story.category === LEGACY_SLUG && !migratedCategories.includes(CANONICAL_SLUG)) {
            migratedCategories.push(CANONICAL_SLUG);
        }

        await Story.collection.updateOne(
            { _id: story._id },
            {
                $set: {
                    categories: migratedCategories,
                    ...(story.category === LEGACY_SLUG ? { category: CANONICAL_SLUG } : {}),
                },
            },
        );
    }

    const remainingLegacyStories = await Story.exists({
        $or: [{ categories: LEGACY_SLUG }, { category: LEGACY_SLUG }],
    });
    if (remainingLegacyStories) {
        throw new Error('Legacy market stories remain; the old category was not deleted');
    }

    const deleted = await Category.deleteMany({ slug: LEGACY_SLUG });
    logger.info(
        { migratedStories: legacyStories.length, deletedCategories: deleted.deletedCount },
        'Market category migration complete',
    );
}

migrateMarketCategory()
    .catch((err: unknown) => {
        logger.fatal({ err }, 'Market category migration failed');
        process.exitCode = 1;
    })
    .finally(async () => {
        await disconnectDB();
    });
