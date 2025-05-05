import { validationResult } from 'express-validator';
import { logger } from '../config/logger.js';
import UserService from '../services/user.service.js';
import { BadRequestError, ForbiddenError } from '../utils/errors.js';

const userService = new UserService();

export const create = async (req, res, next) => {
	try {
		const userPayload = req.body;
		const errors = validationResult(req);

		if(!errors.isEmpty) {
			const validationErrors = new Error('[User Controller] Validation Failed');
			validationErrors.status = 400;
			validationErrors.data = errors.array();

			return next(validationErrors);
		}

		const createdUser = await userService.create(userPayload);

		res.status(201).json({
			success: true,
			response: createdUser
		});

		logger.info(`[User Controller] User registered successfully: ${createdUser.email}`);

	} catch (error) {
		logger.error(`[User Controller] Error registering user: ${error.message}`, { stack: error.stack, email: req.body.email });
		next(error);
	}
};

export const getById = async (req, res, next) => {
	try {
		const userId = req.params.id;

		const isSameUser = req.user._id.equals(userId);
		const isAdmin = req.user.role === 'admin';

		if(isSameUser || isAdmin) {

			const user = await userService.getById(userId);

			res.status(200).json({
				success: true,
				data: user
			});

			logger.info(`[User Controller] User ${req.user.email} accessed profile for user ID: ${userId}`);
		} else {
			const error = new Error(`[User Controller] Not authorized to access this user profile`);
			error.status = 403;
			logger.warn(`[User Controller] Access denied for user ${req.user.email} (Role: ${req.user.role}) to access user ID: ${userId}`);
			next(error);
		}
	} catch (error) {
		logger.error(
			`[User Controller] Error fetching user by ID: ${error.message}`,
			{ 
				stack: error.stack, 
				userId: req.params.id, 
				authenticatedUser: req.user.email 
			}
		);

		next(error);
	}
}

export const update = async (req, res, next) => {
	try {
		const userId = req.params.id;
		const errors = validationResult(req);
		const isSameUser = req.user._id.equals(userId);
		const isAdmin = req.user.role === 'admin';
		const payload = { ...req.body };

		if(!isSameUser && !isAdmin) {
			const error = new ForbiddenError(`[User Controller] Not authorized to update this profile user`);
			error.status = 403;
			logger.warn(`[User Controller] Access denied for user ${req.user.email} (Role: ${req.user.role}) to update user ID: ${userId}`);
			return next(error);
		}

		if(!errors.isEmpty) {
			const validationErrors = new BadRequestError('[User Controller] Validation Failed');
			validationErrors.status = 400;
			validationErrors.data = errors.array();

			return next(validationErrors);
		}

		const user = await userService.update(payload, userId, isAdmin);

		res.status(200).json({
			success: true,
			data: user
		});

		logger.info(`[User Controller] User ID ${userId} updated successfully by user ${req.user.email}`);

	} catch (error) {

		logger.error(
			`[User Controller] Error updating user ID ${req.params.id}: ${error.message}`, 
			{ 
				stack: error.stack, 
				userId: req.params.id, 
				authenticatedUser: req, 
				body: req.body 
			}
		);

		if(error.name === 'ValidatorError' || error.code === 11000) {
			error.status = 400;
		}

		next(error);

	}
}

export const remove = async (req, res, next) => {
	try {
		const userId = req.params.id;

		const userRemoved = await userService.remove(userId);

		res.status(200).json({
			success: true,
			message: `User with ID: ${userId} deleted successfully`,
			data: userRemoved
		});

		logger.info(`[User Controller] User ID ${userId} deleted successfully by user ${req.user.email}`);
	} catch (error) {
		logger.error(`[User Controller] Error deleting user ID ${req.params.id}: ${error.message}`,
			{
				stack: error.stack,
				userId: req.params.id,
				authenticatedUser: req.user.email
			}
		);

		next(error);
	}
}

export const getProfile = async (req, res, next) => {
	if(req.user) {
		res.status(200).json({
			_id: req.user._id,
			name: req.user.name,
			email: req.user.email,
			role: req.user.role,
			isActive: req.user.isActive,
			createdAt: req.user.createdAt,
			updatedAt: req.user.updatedAt
		});
	} else {
		const error = new Error('[User Controller] User not found in request (auth middleware failed)');
		error.status = 401;
		next(error);
	}
}

export const getAll = async (req, res, next) => {
	try {
		const queryOptions = req.queryOptions;
		const result = await userService.getAll(queryOptions);
		const data = result.data;

		res.status(200).json({
			success: true,
			count: data.length,
			total: result.totalCount,
			pagination: {
				page: queryOptions.pagination.page,
				limit: queryOptions.pagination.limit
			},
			data
		});

		logger.info(
			`[User Controller] Admin user ${req.user.email} successfully accessed users list with options: 
				${JSON.stringify(queryOptions)} (via controller)`
			);

	} catch (error) {
		logger.error(
			`[User Controller] Error fetching all users: ${error.message}`,
			{ 
				stack: error.stack,
				user: req.user.email,
				queryOptions: req.queryOptions
			}
		);
		next(error);
	}
}