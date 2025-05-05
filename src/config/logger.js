import { createLogger, format, transports } from 'winston';
import { env } from './env.js';

export const logger = createLogger({
	level: env.NODE_ENV === 'development' ? 'debug' : 'info',
	format:
		format.combine(
			format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
			format.errors({stack: true}),
			format.splat(),
			format.json()
		),
		transports: [
			new transports.Console({
				format: format.combine(
					format.colorize(),
					format.simple()
				)
			})
		]
});