import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import app from "../src/app";
import { connectDB } from "../src/config/db";
import { env } from "../src/config/env.js";

import Comment from '../src/models/Comment.js';
import Post from '../src/models/Post.js';
import User from '../src/models/User.js';

import AuthService from "../src/services/auth.service";
const authService = new AuthService();

describe('Comment Endpoints', () => {
	let testUser;
	let authToken;
	let testPost;

	beforeAll(async () => {
		console.log('Connecting to Database...');
		await connectDB();
		console.log('Database connected');
	});

	afterAll(async () => {
		console.log('Closing DB Connection...');
		await User.deleteMany({});
		await Post.deleteMany({});
		await Comment.deleteMany({});

		await mongoose.connection.close();
		console.log('Database cleaned and closed');
	});

	beforeEach(async () => {
		await User.deleteMany({});
		await Post.deleteMany({});
		await Comment.deleteMany({});

		const userPassword = '1234567';

		testUser = await User.create({
			name: 'User Authenticated',
			email: 'userauthenticated@email.com',
			password: userPassword
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
			title: 'Test Post Comment',
			body: 'This is the body of the test post for comments',
			author: testUser._id
		};

		testPost = await Post.create(postData);

		console.log('Test post created for comments');
	});

	describe('POST /api/posts/:postId/comments', () => {
		it('Should return 201 and create a new comment successfully for an authenticated user on existing post', async () => {
			const commentData = {
				text: 'This is a comment test'
			}

			const response = await request(app)
				.post(`/api/posts/${testPost._id}/comments`)
				.set('Authorization', `Bearer ${authToken}`)
				.send(commentData)
				.expect(201)
				.expect('Content-type', /json/);

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty('data');

			const createdComment = response.body.data;

			expect(createdComment).toHaveProperty('author');

			const exitentComment = await Comment.findById(createdComment._id);

			expect(exitentComment).toBeDefined();
			expect(exitentComment).toHaveProperty('text', commentData.text);
		});

		it('Should return 404 Not Found for authenticated user but non existent post', async () => {
			const nonExistentPostId = new mongoose.Types.ObjectId();

			const commentData = {
				text: 'Comment for non existent post'
			}

			const response = await request(app)
				.post(`/api/posts/${nonExistentPostId}/comments`)
				.set('Authorization', `Bearer ${authToken}`)
				.send(commentData)
				.expect(404)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false)
		});

		it('Should return 401 Unauthorized, for user not authenticated', async () => {
			const commentData = {
				text: 'Not authenticated user'
			}

			const response = await request(app)
				.post(`/api/posts/${testPost._id}/comments`)
				.send(commentData)
				.expect(401)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
		});
	});

	describe('GET /api/posts/:postId/comments', () => {
		it('Should return 200 OK when get all comments from post when user authenticated', async () => {
			const comment1 = await Comment.create({
				text: 'First comment',
				author: testUser._id,
				post: testPost._id
			});

			const comment2 = await Comment.create({
				text: 'Second Comment',
				author: testUser._id,
				post: testPost._id
			});

			expect(comment1).toBeDefined();
			expect(comment2).toBeDefined();

			const response = await request(app)
				.get(`/api/posts/${testPost._id}/comments`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty('data');

			const postComments = response.body.data;

			expect(postComments).toBeDefined();
			expect(Array.isArray(postComments)).toBe(true);
			expect(postComments.length).toBe(2);

		});

		it('Should return 404 Not Found when trying to get comments for a non existent post', async () => {
			const nonExistentPostId = new mongoose.Types.ObjectId();

			const response = await request(app)
				.get(`/api/posts/${nonExistentPostId}/comments`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(404)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false)
		});

		it('Should return 401 when user is not authenticated', async () => {
			const response = await request(app)
				.get(`/api/posts/${testPost._id}/comments`)
				.expect(401)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
		});
	});
});