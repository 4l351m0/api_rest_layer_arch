import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const connectDB = async() => {
	try {
		const conn = await mongoose.connect(env.DB_URI, {
			dbName: env.NODE_ENV === 'development' ? 'node' : 'test'
		});
		logger.info(`✅ MongoDB Connected to ${env.NODE_ENV}: ${conn.connection.host}`);
	} catch (error) {
		logger.error(`❌ Error Connecting to MongoDB: ${error.message}`);
		process.exit(1);
	}
}