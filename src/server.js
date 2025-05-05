import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const startServer = async () => {
	try {
		await connectDB();
		logger.info('✅ DB Connected Succesfully');

		app.listen(env.PORT, () => {
			logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} environment`);
		});
	} catch (error) {
		logger.error('❌ Failed to start server:', error);
		process.exit(1);
	}
}

startServer();

process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
	process.exit(1);
});

process.on('uncaughtException', (err) => {
	logger.error('Uncaught Exception', err);
	process.exit(1);
});