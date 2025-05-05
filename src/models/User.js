import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

const UserSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			trim: true,
			lowercase: true
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			trim: true
		},
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user',
		},
		isActive: {
			type: Boolean,
			default: true
		},
		resetPasswordToken: String,
		resetPasswordExpire: Date
	},
	{
		timestamps: true
	}
);

UserSchema.pre('save', async function(next) {
	if(!this.isModified('password')) {
		next();
	}

	try {
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(this.password, salt);
		this.password = hashedPassword;
		next();
	} catch (error) {
		next(error);
	}
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
}

UserSchema.methods.getResetPasswordToken = async function() {
	const resetToken = crypto.randomBytes(20)
										.toString('hex');

	const resetTokenHash = crypto.createHash('sha256')
												.update(resetToken)
												.digest('hex');

	this.resetPasswordToken = resetTokenHash;

	const expireDurationMs = parseInt(env.RESET_PASSWORD_EXPIRE_MS, 10);

	if(isNaN(expireDurationMs)) {
		loggers.error(`RESET_PASSWORD_EXPIRE_MS environment variable is not a valid number. Password reset expiry may not be set correctly`);
	}

	this.resetPasswordExpire = Date.now() + expireDurationMs;

	return resetToken;
}

const User = mongoose.model('User', UserSchema);

export default User;