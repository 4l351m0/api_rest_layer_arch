import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import AuthService from '../src/services/auth.service.js';

import Post from '../src/models/Post.js';
import User from '../src/models/User.js';

describe('Posts Endpoints', () => {
	const authService = new AuthService();
	let testUser;
	let authToken;

	beforeAll(async () => {
		console.log('Connection to Database...');
		await connectDB();
		console.log('Database connected');
	});

	afterAll(async () => {
		console.log('Closing Database Connection...');
		await User.deleteMany({});
		await Post.deleteMany({});
		await mongoose.connection.close();
		console.log('Database Connection Closed');
	});
	
	beforeEach(async () => {
		await User.deleteMany({});
		await Post.deleteMany({});

		const userPayload = {
			name: 'Admin User',
			email: 'admin@example.com',
			password: '1234567',
			role: 'admin',
			isActive: true
		}
		
		await User.create(userPayload);

		const loginPayload = {
			email: userPayload.email,
			password: userPayload.password
		}

		testUser = await authService.login(loginPayload);

		authToken = jwt.sign(
			{ id: testUser._id, role: testUser.role },
			env.JWT_SECRET,
			{ expiresIn: '2h' }
		);

	});

	describe('POST /api/posts', () => {
		it('Should return 201 if post is created correctly', async () => {
			const postPayload = {
				title: 'This is the title of the post',
				body: 'This is content that will be inside the post that I have created now',
				author: testUser._id
			}

			const response = await request(app)
				.post('/api/posts')
				.set('Authorization', `Bearer ${authToken}`)
				.send(postPayload)
				.expect(201)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty('message');
			expect(response.body).toHaveProperty('data');

			expect(response.body.data).toBeDefined();

			const postCreated = response.body.data;

			expect(postCreated).toBeDefined();
			expect(postCreated).toHaveProperty('_id');
			expect(postCreated).toHaveProperty('title');
			expect(postCreated).toHaveProperty('body');
			expect(postCreated).toHaveProperty('author');
			expect(postCreated).toHaveProperty('likesCount', 0);

		});

		it('Should return 401 Unautohrized for user not authenticated', async () => {
			const postPayload = {
				title: 'This is the title of the post',
				body: 'This is content that will be inside the post that I have created now',
				author: testUser._id
			}

			const response = await request(app)
				.post('/api/posts')
				.send(postPayload)
				.expect(401)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});
	});

	describe('GET /api/posts', () => {
		it('Should return 200 ok with all post for authenticated user', async () => {
			const post1 = await Post.create({
				title: 'post 1',
				body: 'Content for post 1',
				author: testUser._id
			});

			const post2 = await Post.create({
				title: 'post 2',
				body: 'Content for post 2',
				author: testUser._id
			});

			expect(post1).toBeDefined();
			expect(post2).toBeDefined();

			const allPostsResponse = await request(app)
				.get('/api/posts')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200)
				.expect('Content-type', /json/)

			expect(allPostsResponse.body).toBeDefined();
			expect(allPostsResponse.body).toHaveProperty('success', true);
			expect(allPostsResponse.body).toHaveProperty('message');
			expect(allPostsResponse.body).toHaveProperty('count');
			expect(allPostsResponse.body).toHaveProperty('total');

			expect(allPostsResponse.body).toHaveProperty('pagination');
			expect(allPostsResponse.body.pagination).toHaveProperty('page');
			expect(allPostsResponse.body.pagination).toHaveProperty('limit');

			expect(allPostsResponse.body).toHaveProperty('data');

			const posts = allPostsResponse.body.data;

			expect(posts).toBeDefined();
			expect(Array.isArray(posts)).toBe(true);
			expect(posts.length).toEqual(2);
		});

		it('Should return 401 Unautohrized when user is not authenticated', async () => {
			const response = await request(app)
				.get('/api/posts')
				.expect(401)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});
	});

	describe('GET /api/posts/:id', () => {
		it('Should return 200 OK and the post request by Id', async () => {
			const postCreated = await Post.create({
				title: 'post 1',
				body: 'Content for post 1',
				author: testUser._id
			});

			const response = await request(app)
				.get(`/api/posts/${postCreated._id}`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty('message');

			expect(response.body.data).toBeDefined();

			const post = response.body.data;

			expect(post).toBeDefined();
			expect(post).toHaveProperty('_id');
			expect(post).toHaveProperty('title');
			expect(post).toHaveProperty('body');
			expect(post).toHaveProperty('author');
		});

		it('Should return 401 Unauthorized for user no authenticated', async () => {
			const post = await Post.create({
				title: 'post 1',
				body: 'Content for post 1',
				author: testUser._id
			});
			
			const response = await request(app)
				.get(`/api/posts/${post._id}`)
				.expect(401)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});

		it('Should return 404 Not Found when post ID not exists', async () => {
			const nonExistentId = new mongoose.Types.ObjectId();

			const response = await request(app)
				.get(`/api/posts/${nonExistentId}`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(404)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});

		it('Should return 400 Bad Request when no ID format is invalid', async () => {
			const invalidId = 'invalid-id-format';

			const response = await request(app)
				.get(`/api/posts/${invalidId}`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(400)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});
	});

	describe('PUT /api/posts/:id', () => {
		it('Should return 200 OK with user authenticated', async () => {
			const post = await Post.create({
				title: 'Post',
				body: 'Content Post',
				author: testUser._id
			});

			const updatePostPayload = {
				title: 'Edited Post',
				body: 'Edited Post Content'
			}

			const response = await request(app)
				.put(`/api/posts/${post._id}`)
				.set('Authorization', `Bearer ${authToken}`)
				.send(updatePostPayload)
				.expect(200)
				.expect('Content-type', /json/);

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty('message');
			expect(response.body).toHaveProperty('data');

			expect(response.body.data).toBeDefined();
			expect(response.body.data).toHaveProperty('_id');
			expect(response.body.data).toHaveProperty('title');
			expect(response.body.data).toHaveProperty('body');
			expect(response.body.data).toHaveProperty('author');

			const postUpdated = await Post.findById(post._id);

			expect(postUpdated).toHaveProperty('title', updatePostPayload.title);
			expect(postUpdated).toHaveProperty('body', updatePostPayload.body);

			expect(postUpdated).toHaveProperty('author');
			expect(postUpdated.author).toHaveProperty('_id', testUser._id);
		});

		it('Should return 401 if user is not authenticated', async () => {
			const randomId = new mongoose.Types.ObjectId();

			const response = await request(app)
				.put(`/api/posts/${randomId}`)
				.expect(401)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});

		it('Should return 404 if user authenticated but postId not exists', async () => {
			const NonExistentId = new mongoose.Types.ObjectId();

			const response = await request(app)
				.put(`/api/posts/${NonExistentId}`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({title: '', body: ''})
				.expect(404)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});

		it('Should return 403 Forbidden when user is not the own of the post', async () => {
			const otherUser = await User.create({
				name: 'Other User',
				email: 'email@example.com',
				password: '1234567',
			});

			const post = await Post.create({
				title: 'Post',
				body: 'Content of the post',
				author: testUser._id
			});

			const loggedUser = await authService.login({
				email: otherUser.email,
				password: '1234567'
			});

			const altToken = jwt.sign(
				{ id: loggedUser._id, role: loggedUser.role },
				env.JWT_SECRET,
				{ expiresIn: '2h' }
			);

			const payload = {
				title: 'New title',
				body: 'New content'
			}

			const response = await request(app)
				.put(`/api/posts/${post._id}`)
				.set('Authorization', `Bearer ${altToken}`)
				.send(payload)
				.expect(403)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});
	});

	describe('DELETE /api/posts/:id', () => {
		it('Should return 200 if user authenticated', async () => {
			const post = await Post.create({
				title: 'New Post',
				body: 'Content Post',
				author: testUser._id
			});

			const response = await request(app)
				.delete(`/api/posts/${post._id}`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty('message');
		});

		it('Should return 404 if postId not exists', async () => {
			const NonExistentId = new mongoose.Types.ObjectId();

			const response = await request(app)
				.delete(`/api/posts/${NonExistentId}`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(404)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});

		it('Should return 401 Unauthorized if user is not authenticated', async () => {
			const randomId = new mongoose.Types.ObjectId();

			const response = await request(app)
				.delete(`/api/posts/${randomId}`)
				.expect(401)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});

		it('Should return 403 Forbbidden if user is not the owner of the post and not admin', async () => {
			const otherUser = await User.create({
				name: 'Other User',
				email: 'email@example.com',
				password: '1234567',
			});

			const post = await Post.create({
				title: 'Post',
				body: 'Content of the post',
				author: testUser._id
			});

			const loggedUser = await authService.login({
				email: otherUser.email,
				password: '1234567'
			});

			const altToken = jwt.sign(
				{ id: loggedUser._id, role: loggedUser.role },
				env.JWT_SECRET,
				{ expiresIn: '2h' }
			);

			const response = await request(app)
				.delete(`/api/posts/${post._id}`)
				.set('Authorization', `Bearer ${altToken}`)
				.expect(403)
				.expect('Content-type', /json/)

			expect(response.body).toBeDefined();
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty('message');
		});
	});
});