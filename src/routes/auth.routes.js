import express from 'express';

import {
	forgotPassword,
	login,
	resetPassword,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);

router.put('/reset-password/:token', resetPassword);

export default router;