import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import AuthService from '../services/auth.service.js';
import { BadRequestError } from '../utils/errors.js';

const authService = new AuthService();

export const login = async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const payload = { email, password: String(password) };

		if(!email || !password) {
			const error = new Error('[Auth Controller] Email and password are required');
			error.status = 400;
			return next(error);
		}

		const userLoggedIn = await authService.login(payload);

		const token = jwt.sign(
			{ id: userLoggedIn._id, role: userLoggedIn.role },
			env.JWT_SECRET,
			{ expiresIn: '2h' }
		);

		res.status(200).json({
			success: true,
			message: 'User Logged In successfully',
			data: {
				_id: userLoggedIn._id,
				name: userLoggedIn.name,
				email: userLoggedIn.email,
				role: userLoggedIn.role,
				isActive: userLoggedIn.isActive,
				token
			}
		});

		logger.info(`[Auth Controller] User logged in successfully: ${userLoggedIn.email}`);

	} catch (error) {
		logger.error(`[Auth Controller] Error during user login: ${error.message}`);
		next(error);
	}
}

export const forgotPassword = async (req, res, next) => {
	try {
		const { email } = req.body;

		if(!email) {
			logger.warn(`[Auth Controller] Email is required to reset password`);
			const error = new BadRequestError('Email is required to reset password');
			return next(error);
		}

		const baseUrl = env.API_URL;
		const result = await authService.forgotPassword(email, baseUrl);

		res.status(200).json({
			success: true,
			message: result.message
		});

		logger.info(`[Auth Controller] Email was sent successfullt to reset password`);

	} catch (error) {
		logger.error(
			`[Auth Controller] An error has occured while sending reset password request`,
			{ stack: error.stack }
		);

		next(error);
	}
}

export const resetPassword = async (req, res, next) => {
	try {
		const token = req.params.token;
		const { newPassword } = req.body;

		if(!newPassword) {
			logger.warn(`[Auth Controller] The new password is required to update the previous one`);
			return next(new BadRequestError('Field new password is required to updated previous one'));
		}

		const result = await authService.resetPassword(token, newPassword);

		res.status(200).json({
			success: true,
			message: result.message,
			data: result.data
		});

		logger.info(`[Auth Controller] Password for user ${result.data.email} was updated successfully`);

	} catch (error) {
		logger.error(`[Auth Controller] An error has ocurred while resetting password`);
		next(error);
	}
}