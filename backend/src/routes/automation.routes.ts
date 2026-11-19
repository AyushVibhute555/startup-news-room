import { Router } from 'express';
import { createAutomationStory, updateAutomationStory } from '../controllers/automation.controller.js';
import { upload, uploadImage } from '../controllers/admin.upload.controller.js';
import { requireAutomationKey } from '../middleware/automationAuth.js';
import { automationLimiter } from '../middleware/rateLimits.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema, automationCreateStorySchema, automationUpdateStorySchema } from '../validators/admin.validators.js';

const router = Router();

router.post(
    '/stories',
    automationLimiter,
    requireAutomationKey,
    validate({ body: automationCreateStorySchema }),
    createAutomationStory,
);
router.patch(
    '/stories/:id',
    automationLimiter,
    requireAutomationKey,
    validate({ params: idParamSchema, body: automationUpdateStorySchema }),
    updateAutomationStory,
);
router.post(
    '/media',
    automationLimiter,
    requireAutomationKey,
    upload.single('image'),
    uploadImage,
);

export default router;
