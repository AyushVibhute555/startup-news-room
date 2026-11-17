import { connectDB, disconnectDB } from '../config/db.js';
import { Story } from '../models/Story.js';
import { logger } from '../utils/logger.js';

async function migrate() {
    await connectDB();
    logger.info('Starting category migration...');

    // Find all stories that have the old 'category' field
    const stories = await Story.collection.find({ category: { $exists: true } }).toArray();

    for (const story of stories) {
        const existingCategories = Array.isArray(story.categories)
            ? story.categories.filter((category): category is string => typeof category === 'string')
            : [];
        const categories = Array.from(
            new Set([
                ...existingCategories,
                ...(typeof story.category === 'string' ? [story.category] : []),
            ]),
        );

        await Story.collection.updateOne(
            { _id: story._id },
            {
                $set: { categories },
                $unset: { category: '' },
            }
        );
    }

    logger.info(`Successfully migrated ${stories.length} stories to multi-category.`);
    await disconnectDB();
}

migrate();