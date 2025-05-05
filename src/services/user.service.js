import { logger } from '../config/logger.js';
import User from '../models/User.js';

import {
	ApiError,
	BadRequestError,
	ForbiddenError,
	NotFoundError
} from '../utils/errors.js';
import { applyQueryFeatures } from '../utils/queryFeatures.js';

class UserService {
	create = async(userData) => {
		try {
			logger.info(`[User Service] Attempting to create new user with email: ${userData.email}...`);
	
			const user = new User(userData);
			const createdUser = await user.save();
	
			logger.info(`[UserService] New user created successfully with ID: ${createdUser._id}`);
	
			const result = createdUser.toObject();
			delete result.password;
	
			return result;
		} catch (error) {
			logger.error(
				`[User Service] Failed to create user with email ${userData.email}: ${error.message}`,
				{ stack: error.stack }
			);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.name === 'ValidationError' || error.code === 11000) {
				const message = error.code === 11000 ? 'Email already exists' : 'Validation Failed';
				const data = error.errors ? error.errors : null;
				throw new BadRequestError(message, data);
			}

			throw error;
		}
	}
	
	getById = async(userId) => {
		try {
			logger.info(`[User Service] Attempting to get a user with id: ${userId}...`);

			const user = await User.findById(userId)
											.select('-password') 
											.lean();

			if(!user) {
				logger.warn(`[User Service] User not found with ID: ${userId}`);
				throw new NotFoundError(`[User Service] User not found with ID: ${userId}`);
			}

			return user;

		} catch (error) {
			logger.error(
				`[User Service] Failed to get user with ID: ${userId}`,
				{ stack: error.stack }
			);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				throw new NotFoundError(`User not found with ID: ${userId}`);
			}

			throw error;
		}
	}
	
	update = async(userData, userId, isAdmin) => {
		try {
			logger.info(`[User Service] Attempting to update user with id: ${userId}...`);

			const user = await User.findById(userId);
			
			if(!user) {
				logger.warn(`[User Service] User not found with ID: ${userId} during update attempt`);
				throw new NotFoundError(`[User Service] User not found with ID: ${userId}`);
			}

			const allowedFields = ['name', 'email', 'role', 'isActive'];

			for(const field in userData) {
				if(allowedFields.includes(field)) {
					if((field === 'role' || field === 'isActive') && !isAdmin) {
						logger.warn(`[User Service] Non-admin user ${userData.email} attempted to update restricted field '${field}' for user ID ${userId}`);
						throw new ForbiddenError(`[User Service] Not authorized to update '${field}'`);
					}

					user[field] = userData[field];
				} else {
					logger.warn(`[User Service] Attempted to update non-allowed field '${field}' for user ID ${userId} by ${userData.email}`);
					throw new ForbiddenError(`[User Service] '${field}' is not allowed for update`);
				}
			}

			const updatedUser = await user.save();
			const result = updatedUser.toObject();
			delete result.password;

			return result;

		} catch (error) {
			logger.error(
				`[User Service] Failed to update user with ID: ${userData._id}`,
				{ stack: error.stack }
			);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				throw new NotFoundError(`User not found with ID: ${userData._id}`);
			}

			throw error;
		}
	}
	
	remove = async(userId) => {
		try {
			const user = await User.findByIdAndDelete(userId);

			if(!user) {
				logger.warn(`[User Service] User not found with ID: ${userId}`);
				throw new NotFoundError(`[User Service] User was not found with ID: ${userId}`);
			}

			const userRemoved = user.toObject();
			return userRemoved;

		} catch (error) {
			logger.error(
				`[User Service] Error deleting user ID ${userId}: ${error.message}`,
				{ stack: error.stack, userId }
			);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				throw new NotFoundError(`User not found with ID: ${userId}`);
			}

			throw error;
		}
	}
	
	getAll = async(options = {}) => {
		try {
			logger.info('[User Service] Attempting to fetch all users...');
	
			const { filter = {} } = options;

			let query = User.find(filter);
			query = applyQueryFeatures(query, options);

			const totalCount = await User.countDocuments(filter);
			const users = await query.select('-password').lean();
	
			logger.info(`[User Service] Successfully fetched ${users.length} users (Total Matching filter: ${totalCount}) with query options`);
	
			return {
				data: users,
				totalCount
			};	
		} catch (error) {
			logger.error(`[User Service] Failed to fetch all users: ${error.message}`, { stack: error.stack });
			throw error;
		}
	}
}

export default UserService;