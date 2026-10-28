import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { linkPreviewLimiter } from '../middleware/rateLimits.js';
import {
    adminListStoriesQuerySchema,
    createCategorySchema,
    createStorySchema,
    idParamSchema,
    linkPreviewSchema,
    markMessageSchema,
    messagesQuerySchema,
    subscribersQuerySchema,
    updateCategorySchema,
    updateStorySchema,
} from '../validators/admin.validators.js';
import {
    createStory,
    deleteStory,
    listStories,
    updateStory,
} from '../controllers/admin.story.controller.js';
import {
    create as createCategory,
    list as listCategories,
    remove as removeCategory,
    update as updateCategory,
} from '../controllers/admin.category.controller.js';
import { upload, uploadImage } from '../controllers/admin.upload.controller.js';
import { linkPreview } from '../controllers/admin.linkPreview.controller.js';
import {
    listMessages,
    listSubscribers,
    markMessage,
} from '../controllers/admin.inbox.controller.js';

const router = Router();

router.use(requireAuth);

// ── Stories ──────────────────────────────────────────────────────────────
router.get('/stories', validate({ query: adminListStoriesQuerySchema }), listStories);
router.post('/stories', validate({ body: createStorySchema }), createStory);
router.patch(
    '/stories/:id',
    validate({ params: idParamSchema, body: updateStorySchema }),
    updateStory,
);
router.delete(
    '/stories/:id',
    requireRole('admin'),
    validate({ params: idParamSchema }),
    deleteStory,
);

// ── Uploads & previews ───────────────────────────────────────────────────
router.post('/uploads/image', upload.single('image'), uploadImage);
router.post(
    '/link-preview',
    linkPreviewLimiter,
    validate({ body: linkPreviewSchema }),
    linkPreview,
);

// ── Categories ───────────────────────────────────────────────────────────
router.get('/categories', listCategories);
router.post('/categories', validate({ body: createCategorySchema }), createCategory);
router.patch(
    '/categories/:id',
    validate({ params: idParamSchema, body: updateCategorySchema }),
    updateCategory,
);
router.delete(
    '/categories/:id',
    requireRole('admin'),
    validate({ params: idParamSchema }),
    removeCategory,
);

// ── Inbox ────────────────────────────────────────────────────────────────
router.get('/messages', validate({ query: messagesQuerySchema }), listMessages);
router.patch(
    '/messages/:id',
    validate({ params: idParamSchema, body: markMessageSchema }),
    markMessage,
);
router.get(
    '/subscribers',
    requireRole('admin'),
    validate({ query: subscribersQuerySchema }),
    listSubscribers,
);

export default router;