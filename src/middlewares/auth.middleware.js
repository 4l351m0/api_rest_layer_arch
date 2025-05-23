import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
	let token;

	if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		try {
			token = req.headers.authorization.split(' ')[1];

			const decoded = jwt.verify(token, env.JWT_SECRET);

			const user = await User.findById(decoded.id).select('-password');

			if(user) {
				req.user = user;
				logger.info(`User ${user.email} authenticated successfully`);
				next();
			} else {
				const error = new Error('User not found, authorization denied');
				error.status = 401;
				logger.warn(`Auth failed: User ID ${decoded.id} not found`);
				return next(error);
			}
		} catch (error) {
			logger.error(
				`Authentication failed: ${error.message}`,
				{ stack: error.stack }
			);

			const authError = new Error('Not authorized, token invalid or expired');
			authError.status = 401;
			next(authError);
		}
	} else {
		const error = new Error('Not authorized, no token provided');
		error.status = 401;
		next(error);
	}
}