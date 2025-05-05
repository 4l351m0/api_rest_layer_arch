import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';

import {
	create,
	remove,
} from '../controllers/like.controller.js';

const router = express.Router({ mergeParams: true });

router.route('/')
	.post(
		auth,
		create
	)

	.delete(
		auth,
		remove
	)

export default router;