import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const sendEmail = async (options) => {
	const { to, subject, text, html } = options;

	const transporter = nodemailer.createTransport(
		{
			host: env.EMAIL_HOST,
			post: env.EMAIL_PORT,
			auth: {
				user: env.EMAIL_USER,
				pass: env.EMAIL_PASS
			}
		}
	)

	const mailOptions = {
		from: env.EMAIL_FROM,
		to,
		subject,
		text,
		html
	}

	try {
		const info = await transporter.sendMail(mailOptions);

		logger.info(`[Email Utility] Message sent: ${info.messageId}`);

	} catch (error) {
		logger.error(`
			[Email Utility] Error sending mail to ${to}: ${error.message}`,
			{ stack: error.stack, options }
		);

		throw error;
	}
}