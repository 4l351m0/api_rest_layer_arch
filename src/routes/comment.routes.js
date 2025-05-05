import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middlewares/auth.middleware.js';
import { queryOptions } from '../middlewares/queryOptions.middleware.js';

import {
	create,
	getAllByPost,
	getById,
	remove,
	update
} from '../controllers/comment.controller.js';
import { authorizedRoles } from '../middlewares/role.middleware.js';

const router = express.Router({ mergeParams: true });

const CommentValidations = [
	body('text')
		.isString().withMessage('Text must be a string')
		.trim()
];

router.route('/')
	.get(
		auth,
		queryOptions,
		getAllByPost
	)
	.post(
		auth,
		CommentValidations,
		create
	)

router.route('/:commentId')
	.get(
		auth,
		queryOptions,
		getById
	)
	.put(
		auth,
		CommentValidations,
		authorizedRoles('admin'),
		update
	)
	.delete(
		auth,
		authorizedRoles('admin'),
		remove
	)

export default router;