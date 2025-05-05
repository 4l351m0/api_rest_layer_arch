import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middlewares/auth.middleware.js';
import { queryOptions } from '../middlewares/queryOptions.middleware.js';
import { authorizedRoles } from '../middlewares/role.middleware.js';

import {
	create,
	getAll,
	getById,
	getProfile,
	remove,
	update
} from '../controllers/user.controller.js';

const router = express.Router();

const userValidations = [
	body('name')
		.optional()
		.isString().withMessage('Name must be a string')
		.trim(),
	
	body('email')
		.optional()
		.isString().withMessage('Email must be a string')
		.trim()
		.toLowerCase(),

	body('isActive')
		.optional()
		.isBoolean().withMessage('isActive must be boolean'),

	body('role')
		.optional()
		.isString().withMessage('Role must be a string')
		.isIn(['user', 'admin']).withMessage('Role must be either "user" or "admin"')
]

router.route('/')
	.post(
		auth, 
		create
	)
	.get(
		auth, 
		authorizedRoles('admin'), 
		queryOptions,
		getAll
	)

router.route('/profile')
	.get(auth, getProfile);

router.route('/:id')
	.get(
		auth,
		getById
	)
	.put(
		auth, 
		userValidations, 
		update
	)
	.delete(
		auth, 
		authorizedRoles('admin'), 
		remove
	)
	

export default router;