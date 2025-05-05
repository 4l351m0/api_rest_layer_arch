import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
	const statusCode = err.statusCode || err.status || 500;
	const message = err.message || 'Internal Server Error';

	logger.error(
		`[Error Handler] - ${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`,
		{ 
			stack: env.NODE_ENV === 'development' ? err.stack : undefined, 
			status: statusCode,
			method: req.method,
			path: req.originalUrl,
			user: req.user ? req.user.email : ''
		}
	);

	if(err instanceof ApiError) {
		res.status(statusCode).json({
			success: false,
			message,
			data: err.data,
			stack: env.NODE_ENV === 'development' ? err.stack : undefined
		});
	} else {
		res.status(statusCode).json({
			success: false,
			message: env.NODE_ENV === 'production' && statusCode === 500
						? 'Server Error'
						: err.message,
			stack: env.NODE_ENV === 'development' ? err.stack : undefined
		});
	}
}