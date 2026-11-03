import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
    contactLimiter,
    newsletterLimiter,
} from '../middleware/rateLimits.js';
import {
    contactSchema,
    listStoriesQuerySchema,
    slugParamSchema,
    subscribeSchema,
    unsubscribeQuerySchema,
} from '../validators/public.validators.js';
import {
    getRelated,
    getStory,
    listBreaking,
    listFeatured,
    listStories,
    listTop,
} from '../controllers/story.controller.js';
import { listCategories } from '../controllers/category.controller.js';
import {
    subscribeHandler,
    unsubscribeHandler,
} from '../controllers/newsletter.controller.js';
import { contactHandler } from '../controllers/contact.controller.js';
import { getSitemap, getRss } from '../controllers/seo.controller.js';
import { translateHandler } from '../controllers/translate.controller.js';
import { z } from 'zod';

const router = Router();

// Cache public GETs at the CDN.
router.use((req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }
    next();
});

// SEO Routes
router.get('/sitemap.xml', getSitemap);
router.get('/rss.xml', getRss);

// Order matters: specific routes before /stories/:slug
router.get('/stories/featured', listFeatured);
router.get('/stories/top', listTop);
router.get('/stories/breaking', listBreaking);
router.get('/stories', validate({ query: listStoriesQuerySchema }), listStories);
router.get('/stories/:slug/related', validate({ params: slugParamSchema }), getRelated);
router.get('/stories/:slug', validate({ params: slugParamSchema }), getStory);

router.get('/categories', listCategories);

router.post(
    '/newsletter/subscribe',
    newsletterLimiter,
    validate({ body: subscribeSchema }),
    subscribeHandler,
);
router.get(
    '/newsletter/unsubscribe',
    validate({ query: unsubscribeQuerySchema }),
    unsubscribeHandler,
);

router.post('/contact', contactLimiter, validate({ body: contactSchema }), contactHandler);

// Translation Route
const translateSchema = z.object({
    text: z.string().min(1).max(5000),
    targetLang: z.enum(['hi', 'kn', 'te']),
}).strict();

router.post('/translate', validate({ body: translateSchema }), translateHandler);

export default router;