import cors from 'cors';
import express from 'express';
import { logger } from './config/logger.js';
import { errorHandler } from './middlewares/error.middleware.js';
import apiRoutes from './routes/api.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
	logger.http(`${req.method} ${req.originalUrl}`);
	next();
});

app.use('/api', apiRoutes);

app.use((req, res, next) => {
	const error = new Error(`Not Found - ${req.originalUrl}`);
	res.status(404);
	next(error);
});

app.use(errorHandler);

export default app;