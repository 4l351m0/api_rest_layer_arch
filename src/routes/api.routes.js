import express from 'express';
import { logger } from '../config/logger.js';
import authRoutes from './auth.routes.js';
import postRoutes from './post.routes.js';
import userRoutes from './user.routes.js';

const router = express.Router();

router.get('/status', (req, res) => {
	logger.info(`🕥 API status check...`);
	res.json({
		status: 'OK',
		environment: process.env.NODE_ENV
	});
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);

export default router;