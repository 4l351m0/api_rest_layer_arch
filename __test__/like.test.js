import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import request from 'supertest';
import app from "../src/app";

import Like from "../src/models/Likes";
import Post from "../src/models/Post";
import User from "../src/models/User";

import { connectDB } from "../src/config/db";
import { env } from "../src/config/env";

import AuthService from "../src/services/auth.service";
const authService = new AuthService();

describe('Like Endpoints', () => {
	let authToken;
	let testUser;
	let testPost;

	beforeAll(async () => {
		console.log('Connecting to Database...');
		await connectDB();
		console.log('Database connected');
	});

	beforeEach(async () => {
		await User.deleteMany({});
		await Post.deleteMany({});
		await Like.deleteMany({});

		const userPassword = '1234567';

		testUser = await User.create({
			name: 'Testing User',
			email: 'likeusettesting@email.com',
			password: userPassword,
		});

		const userLoggedIn = await authService.login({
			email: testUser.email,
			password: userPassword
		});

		authToken = jwt.sign(
			{ id: userLoggedIn._id, role: userLoggedIn.role },
			env.JWT_SECRET,
			{ expiresIn: '2h' }
		);

		const postData = {
			title: 'Testing post title',
			body: 'Testing post content',
			author: testUser._id
		}

		testPost = await Post.create(postData);
	});

	afterAll(async () => {
		console.log('Closing Database Connection...');
		await User.deleteMany({});
		await Post.deleteMany({});
		await Like.deleteMany({});
		await mongoose.connection.close();
		console.log('Database connection close');
	});

	describe('POST /api/posts/:postId/like', () => {
		it('Should return 200 OK when create a like for post with authenticated user', async () => {			
			const response = await request(app)
				.post(`/api/posts/${testPost._id}/like`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', true);

			const likePost = response.body.data;

			expect(likePost).toBeDefined();
			expect(likePost).toHaveProperty('likesCount', 1);
		});

		it('Should return 409 if user has already a like for this post', async () => {
			await Like.create({
				user: testUser._id,
				post: testPost._id
			});

			const response = await request(app)
				.post(`/api/posts/${testPost._id}/like`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(409)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
		});

		it('Should return 401 Unauthorized for non authenticated user', async () => {
			const response = await request(app)
				.post(`/api/posts/${testPost._id}/like`)
				.expect(401)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
		});

		it('Shoudl return 404 Not Found if post does not exists with ID', async () => {
			const nonExistentPostId = new mongoose.Types.ObjectId();

			const response = await request(app)
				.post(`/api/posts/${nonExistentPostId}/like`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(404)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
		});
	});
});