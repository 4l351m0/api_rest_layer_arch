import crypto from 'crypto';
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendMail.js";

import {
	ApiError,
	BadRequestError,
	NotFoundError,
	UnauthorizedError
} from "../utils/errors.js";


class AuthService {

	login = async(userData) => {
		try {
			const { email, password } = userData;
			const user = await User.findOne({ email })
											.select('+password');
			
			if(!user) {
				throw new UnauthorizedError(`[Auth Service] Invalid Credentials (Email or password is not correct)`);
			}

			if(!await user.matchPassword(password)) {
				throw new UnauthorizedError(`[Auth Service] Invalid Credentials (Email or password is not correct)`);
			}

			const userLoggedIn = user.toObject();
			delete userLoggedIn.password;

			return userLoggedIn;

		} catch (error) {
			logger.error(
				`[Auth Service] An error occured while login with the user ${userData.email}`,
				{ stack: error.stack, email: userData.email }
			);

			throw error;
		}
	}

	forgotPassword = async (email, baseUrl) => {
		try {
			const user = await User.findOne({email});

			if(!user) {
				logger.warn(`[AuthService] Password reset request for UNREGISTERED email: ${email}. Simulating success response.`);
				return { message: `Password reset email sent to ${email} (if email registered)` };
			}

			const resetToken = await user.getResetPasswordToken();

			const resetUrl = `${baseUrl}auth/reset-password/${resetToken}`;

			const expireMinutes = parseInt(env.RESET_PASSWORD_EXPIRE_MS, 10) / 600000;

			const emailOptions = {
				to: user.email,
				subject: 'Password Reset Request',
				text: `You are receiving this email because you or (someone else) has requested a password reset.\n
							Please click on this link to complete the process: ${resetUrl}\n
							This token is valid for ${expireMinutes} minutes.\n
							If you did not request this, please just ignore this email`
			}

			await sendEmail(emailOptions);
			await user.save({ validateBeforeSave: true });

			return { message: `Password reset email sent to ${email} (if email registered)` }

		} catch (error) {
			logger.error(
				`[Auth Service] Failed password reset for email ${email}`,
				{ stack: error.stack }
			);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.message && error.message.startsWith('Failed to send email')) {
				logger.error(`[Auth Service] An error has ocurred while sending the email for reset password`);
				throw error;
			}

			if(error.name === 'ValidationError' || error.kind === 'ObjectId') {
				throw new BadRequestError(`Invalid user data for reset password`);
			}

			throw error;

		}
	}

	resetPassword = async (token, newPassword) => {
		try {
			logger.info(`[Auth Service] Attemting password reset`);

		const tokenHash = crypto.createHash('sha256')
										.update(token)
										.digest('hex');

		const user = await User.findOne({
			resetPasswordToken: tokenHash,
			resetPasswordExpire: { $gt: Date.now() }
		});

		if(!user) {
			logger.warn(`[Auth Service] Token provided is not valid or has expired`);
			throw new BadRequestError('Invalid or expired token provided');
		}

		user.password = newPassword;

		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		const updatedUser = await user.save();

		return {
			message: 'Password updated successfully',
			data: {
				name: updatedUser.name,
				email: updatedUser.email,
			}
		}

		} catch (error) {
			logger.error(
				`[Auth Service] An error has occured while updated password`,
				{ stack: error.stack }
			);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				throw new NotFoundError('Invalid format ID');
			}

			if(error.name === 'ValidationError') {
				throw new BadRequestError('Validation Failed for update password');
			}

			throw error;
		}

	}
}

export default AuthService;