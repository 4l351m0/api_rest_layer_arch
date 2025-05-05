import 'dotenv/config';

export const env = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	API_URL: process.env.API_URL || 'http://localhost:3000/api/',
	PORT: process.env.PORT || '3000',
	JWT_SECRET: process.env.JWT_SECRET,
	DB_URI: process.env.DB_URI,
	RESET_PASSWORD_EXPIRE_MS: process.env.RESET_PASSWORD_EXPIRE_MS,
	EMAIL_HOST: process.env.EMAIL_HOST,
	EMAIL_PORT: process.env.EMAIL_PORT || 587,
	EMAIL_USER: process.env.EMAIL_USER,
	EMAIL_PASS: process.env.EMAIL_PASS,
	EMAIL_FROM: process.env.EMAIL_FROM
};

if(!env.JWT_SECRET && env.NODE_ENV === 'production') {
	console.error('Fatal Error: JWT Secret is not defined');
	process.exit(1);
}