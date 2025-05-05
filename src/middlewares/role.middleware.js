import { logger } from '../config/logger.js';

export const authorizedRoles = (...allowedRoles) => {
	return (req, res, next) => {
		if(!req.user || !req.user.role) {
			const error = new Error('User role not found in request. Ensure auth middleware is applied before role middleware.');
			error.status = 500;
			logger.error('Role middleware failed: req.user or req.user.role missing');
			return next(error);
		}

		const userHasPermission = allowedRoles.includes(req.user.role);

		if(userHasPermission) {
			next();
		} else {
			const error = new Error(`User role ${req.user.role} is not authorized to access this resource`);
			error.status = 403;
			logger.warn(`Access denied for user ${req.user.email}`);
			next(error);
		}
	}
}