import { Category } from '../models/Category.js';
import { Story } from '../models/Story.js';
import { ApiError } from '../utils/ApiError.js';

export async function listPublicCategories() {
    const [categories, counts] = await Promise.all([
        Category.find().sort({ order: 1, name: 1 }).lean(),
        Story.aggregate<{ _id: string; count: number }>([
            { $match: { status: 'published', publishedAt: { $lte: new Date() } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
        ]),
    ]);

    const countMap = new Map(counts.map((c) => [c._id, c.count]));

    return categories.map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        order: c.order,
        storyCount: countMap.get(c.slug) ?? 0,
    }));
}

export async function listAdminCategories() {
    return Category.find().sort({ order: 1, name: 1 }).lean();
}

export async function createCategory(input: {
    name: string;
    slug: string;
    description?: string;
    order?: number;
}) {
    const exists = await Category.exists({ slug: input.slug });
    if (exists) throw ApiError.conflict('A category with that slug already exists');
    const created = await Category.create(input);
    return created.toObject();
}

export async function updateCategory(
    id: string,
    input: Partial<{ name: string; slug: string; description: string; order: number }>,
) {
    if (input.slug) {
        const clash = await Category.exists({ slug: input.slug, _id: { $ne: id } });
        if (clash) throw ApiError.conflict('A category with that slug already exists');
    }
    const updated = await Category.findByIdAndUpdate(id, input, {
        new: true,
        runValidators: true,
    }).lean();
    if (!updated) throw ApiError.notFound('Category not found');
    return updated;
}

export async function deleteCategory(id: string) {
    const category = await Category.findById(id).lean();
    if (!category) throw ApiError.notFound('Category not found');

    const inUse = await Story.exists({ category: category.slug });
    if (inUse) {
        throw ApiError.conflict('Cannot delete a category that still has stories');
    }

    await Category.findByIdAndDelete(id);
}