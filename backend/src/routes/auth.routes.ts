import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/auth.validators.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimits.js';
import {
    loginHandler,
    logoutHandler,
    meHandler,
    refreshHandler,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginSchema }), loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', requireAuth, logoutHandler);
router.get('/me', requireAuth, meHandler);

export default router;