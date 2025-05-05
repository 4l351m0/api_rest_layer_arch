import express from 'express';
import { body } from "express-validator";
import { auth } from '../middlewares/auth.middleware.js';
import { authorizedRoles } from '../middlewares/role.middleware.js';

import commentRouter from './comment.routes.js';
import likeRouter from './like.routes.js';

import {
	create,
	getAll,
	getById,
	remove,
	update
} from '../controllers/post.controller.js';
import { queryOptions } from '../middlewares/queryOptions.middleware.js';

const router = express.Router();

const postValidations = [
	body('title')
		.isString().withMessage('Title must be a string')
		.trim(),

	body('body')
		.isString().withMessage('Post content must be a string'),
	
	body('authorId')
		.isString().withMessage('ID format is not valid')
];

router.route('/')
	.get(
		auth,
		authorizedRoles('admin', 'user'),
		queryOptions,
		getAll
	)
	.post(
		auth,
		authorizedRoles('admin', 'user'),
		postValidations,
		create
	)

router.route('/:id')
	.get(
		auth,
		authorizedRoles('admin', 'user'),
		getById
	)
	.put(
		auth,
		authorizedRoles('admin'),
		update
	)
	.delete(
		auth,
		authorizedRoles('admin'),
		remove
	)

router.use('/:postId/comments', commentRouter);
router.use('/:postId/like', likeRouter);

export default router;