import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';

describe('Auth endpoints', () => {

	beforeAll(async () => {
		console.log('Connecting to Database...');
		await connectDB();
		console.log('Database connected!');
	});

	afterAll(async () => {
		console.log('Closing Database Connection...');
		await mongoose.connection.close();
		console.log('Database closed');
	});

	beforeEach(async () => {
		console.log('Cleaning User Collection...');
		await User.deleteMany({});
		console.log('User Collection Cleaned');
	});

	describe('POST /api/auth/login', () => {
		it('Should login a registered user with correct credentials', async () => {

			const payload = {
				name: 'Login user',
				email: 'loginuser@example.com',
				password: '123456'
			}

			await User.create(payload);

			const response = await request(app)
				.post('/api/auth/login')
				.send(payload)
				.expect(200)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty('message');
			expect(response.body).toHaveProperty('data');

			expect(response.body.data).toBeDefined();
			expect(response.body.data).toHaveProperty('_id');
			expect(response.body.data).toHaveProperty('name');
			expect(response.body.data).toHaveProperty('email');
			expect(response.body.data).toHaveProperty('role');
			expect(response.body.data).toHaveProperty('isActive');
			expect(response.body.data).toHaveProperty('token');
			
			expect(response.body.data.token).toBeDefined();
			expect(typeof response.body.data.token).toBe('string');

			expect(response.body.data.token.length).toBeGreaterThan(20);

		});

		it('Should return 401 Unauthorized for incorrect password or email', async () => {
			const payload = {
				name: 'Login User',
				email: 'loginuser@example.com',
				password: '123456'
			}

			const wrongPassPayload = {
				email: payload.email,
				password: 'wrongpassword'
			}

			const wrongEmailPayload = {
				email: 'email@wrong.com',
				password: payload.password
			}

			await User.create(payload);

			const passRes= await request(app)
				.post('/api/auth/login')
				.send(wrongPassPayload)
				.expect(401)
				.expect('Content-type', /json/);

			expect(passRes.body).toBeDefined();
			expect(passRes.body).toHaveProperty('success', false);
			expect(passRes.body).not.toHaveProperty('token');


			const emailRes = await request(app)
				.post('/api/auth/login')
				.send(wrongEmailPayload)
				.expect(401)
				.expect('Content-type', /json/)

			expect(emailRes.body).toBeDefined();
			expect(emailRes.body).toHaveProperty('success', false);
			expect(emailRes.body).not.toHaveProperty('token');

		});
	});

	describe('POST /api/auth/forgot-password', () => {
		it('Should send a password reset email for a registered user', async () => {
			const user = await User.create({
				name: 'Existing User',
				email: 'existing@example.com',
				password: '1234567'
			});

			expect(user).toBeDefined();
			expect(user.resetPasswordExpire).toBeUndefined();
			expect(user.resetPasswordToken).toBeUndefined();

			const response = await request(app)
				.post('/api/auth/forgot-password')
				.send({ email: user.email })
				.expect(200)
				.expect('Content-type', /json/);

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', true);

			const userAfterRequest = await User.findById(user._id);

			expect(userAfterRequest).toBeDefined();
			expect(userAfterRequest.resetPasswordToken).toBeDefined();
			expect(typeof userAfterRequest.resetPasswordToken).toBe('string');
			expect(userAfterRequest.resetPasswordToken.length).toBeGreaterThan(20);

			expect(userAfterRequest.resetPasswordExpire).toBeDefined();
			expect(userAfterRequest.resetPasswordExpire).toBeInstanceOf(Date);
			
			const expectedExpiryTime = Date.now() + parseInt(env.RESET_PASSWORD_EXPIRE_MS, 10);

			expect(userAfterRequest.resetPasswordExpire.getTime()).toBeGreaterThanOrEqual(Date.now());
			expect(userAfterRequest.resetPasswordExpire.getTime()).toBeLessThanOrEqual(expectedExpiryTime + 5000);
		});
	});

	it('Should return a generic success message for an unregistered user', async () => {
		const unregisteredEmail = 'nonexistenuser@example.com';

		const response = await request(app)
			.post('/api/auth/forgot-password')
			.send({ email: unregisteredEmail })
			.expect(200)
			.expect('Content-type', /json/)

		expect(response.body).toBeDefined();
		expect(response.body).toHaveProperty('success', true);

		const userInDb = await User.findOne({ email: unregisteredEmail });

		expect(userInDb).toBeNull();
	});

	describe('PUT /api/auth/reset-password/:token', () => {
		it('Should reset password successfully with a valid token', async () => {
			const user = await User.create({
				name: 'Reset User',
				email: 'reset@example.com',
				password: '1234567'
			});

			const resetToken = await user.getResetPasswordToken();
			await user.save({ validateBeforeSave: true });

			const userWithToken = await User.findById(user._id);

			expect(userWithToken.resetPasswordToken).toBeDefined();
			expect(userWithToken.resetPasswordExpire).toBeDefined();
			expect(userWithToken.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());

			const newPassword = '123456';

			const response = await request(app)
				.put(`/api/auth/reset-password/${resetToken}`)
				.send({ newPassword })
				.expect(200)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', true);
			
			const afterUserReset = await User.findById(user._id);

			expect(afterUserReset).toBeDefined();
			expect(afterUserReset.resetPasswordToken).toBeUndefined();
			expect(afterUserReset.resetPasswordExpire).toBeUndefined();

			expect(afterUserReset.password).toBeDefined();
			expect(afterUserReset.password).not.toBe(newPassword);
			expect(afterUserReset.password.length).toBeGreaterThan(20);
		});


		it('Should return 400 Bad Request for an expired token', async () => {
			const invalidToken = 'FakeToken1234';

			const newPassword = '123456';

			const response = await request(app)
				.put(`/api/auth/reset-password/${invalidToken}`)
				.send({ newPassword })
				.expect(400)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
		});

		it('Should return 400 for expired Token', async () => {
			
			const user = await User.create({
				name: 'Expired Token',
				email: 'expiredtoken@example.com',
				password: '123456'
			});

			const resetToken = await user.getResetPasswordToken();

			user.resetPasswordExpire = new Date(Date.now() - 10000);

			await user.save({ validateBeforeSave: false });

			const userWithExpiredToken = await User.findById(user._id);

			expect(userWithExpiredToken.resetPasswordToken).toBeDefined();
			expect(userWithExpiredToken.resetPasswordExpire).toBeDefined();
			expect(userWithExpiredToken.resetPasswordExpire.getTime()).toBeLessThan(Date.now());

			const newPassword = '123456';

			const response = await request(app)
				.put(`/api/auth/reset-password/${resetToken}`)
				.send({ newPassword })
				.expect(400)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			
			const userAfterAttempt = await User.findById(user._id);

			expect(userAfterAttempt.resetPasswordToken).toBeDefined();
			expect(userAfterAttempt.resetPasswordExpire).toBeDefined();
		});
	});

	it('Should return 400 if the token has been already used', async () => {
		const user = await User.create({
			name: 'Token Used',
			email: 'tokenused@example.com',
			password: '123456'
		});

		const resetToken = await user.getResetPasswordToken();
		await user.save({ validateBeforeSave: false });

		const newPassword = '1234567';

		await request(app)
			.put(`/api/auth/reset-password/${resetToken}`)
			.send({ newPassword })
			.expect(200)
			.expect('Content-type', /json/);

		const userAfterNewPassword = await User.findById(user._id);

		expect(userAfterNewPassword.resetPasswordToken).toBeUndefined();
		expect(userAfterNewPassword.resetPasswordExpire).toBeUndefined();

		const otherNewPassword = 'otherPass';
		
		const response = await request(app)
			.put(`/api/auth/reset-password/${resetToken}`)
			.send({ newPassword: otherNewPassword })
			.expect(400)
			.expect('Content-type', /json/);

		expect(response.body).toBeDefined();
		expect(response.body).toHaveProperty('success', false);

	});
});