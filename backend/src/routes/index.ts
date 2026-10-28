import { Router } from 'express';
import mongoose from 'mongoose';
import publicRoutes from './public.routes.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

const STATE_NAMES = ['disconnected', 'connected', 'connecting', 'disconnecting'] as const;

router.get('/health', (_req, res) => {
    const db = STATE_NAMES[mongoose.connection.readyState] ?? 'unknown';
    res.json({
        data: {
            status: 'ok',
            db,
            uptime: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        },
    });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/', publicRoutes);

export default router;