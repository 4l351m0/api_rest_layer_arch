import { validationResult } from "express-validator";
import { logger } from "../config/logger.js";
import PostService from "../services/post.service.js";
import { BadRequestError } from "../utils/errors.js";

const postService = new PostService();

export const create = async (req, res, next) => {
	try {
		const { title, body } =  req.body;
		const errors = validationResult(req);

		if(!errors.isEmpty) {
			const validationErrors = new BadRequestError('[Post Service] Validation failed for post creation', errors.array());
			logger.warn(
				`[Post Controller] Post creation validation failed`,
				{ 
					errors: validationErrors.data,
					user: req.user.email
				}
			);
			return next(validationErrors);
		}

		const authorId = req.user._id;
		const payload = { title, body };

		const response = await postService.create(payload, authorId);

		res.status(201).json({
			success: true,
			message: 'Post was created successfully',
			data: response
		});

		logger.info(`[Post Controller] Post was created successfully`);

	} catch (error) {
		logger.error(`[Post Controller] Error while creating post by user: ${req.user.email}`);
		next(error);
	}
}

export const getById = async (req, res, next) => {
	try {
		const postId = req.params.id;

		const post = await postService.getById(postId);

		res.status(200).json({
			success: true,
			message: 'Get Post By Id successfully',
			data: post
		});

		logger.info(`[Post Controller] Get post by ID ${postId} successfully`);

	} catch (error) {
		logger.error(
			`[Post Controller] Error fetching post with ID ${req.params.id}: ${error.message}`,
			{ stack: error.stack, postId: req.params.id }
		);
		next(error);
	}
}

export const update = async (req, res, next) => {
	try {
		const postId = req.params.id;
		const errors = validationResult(req);
		const payload = { ...req.body };
		const userId = req.user._id;
		const isAdmin = req.user.role === 'admin';

		if(!errors.isEmpty) {
			const error = new BadRequestError('[Post Controller] Validation Failed');
			validationErrors.status = 400;
			validationErrors.data = errors.array();
			
			return next(error);
		}

		const post = await postService.update(payload, postId, userId, isAdmin);

		res.status(200).json({
			success: true,
			message: 'Post was updated successfully',
			data: post
		});

		logger.info(`[Post Controller] Post updated successfully with ID: ${postId} by user ID: ${userId}`);

	} catch (error) {
		logger.error(`[Post Controller] There was an error while updated post with ID: ${req.params.id}`);
		next(error);
	}
}

export const remove = async (req, res, next) => {
	try {
		const postId = req.params.id;
		const userId = req.user._id;

		const removedPost = await postService.remove(postId, userId);

		res.status(200).json({
			success: true,
			message: 'Post has been removed successfully',
			data: removedPost
		});

		logger.info(`[Post Controller] Post has been removed successfully with ID: ${postId}`);

	} catch (error) {
		logger.error(`[Post Controller] There was an error while removing post with id ${req.params.id}`);
		next(error);
	}

}

export const getAll = async (req, res, next) => {
	try {
		const queryOptions = req.queryOptions;
		const result = await postService.getAll(queryOptions);
		const data = result.data;

		res.status(200).json({
			success: true,
			message: 'Posts were fetched successfully',
			count: data.length,
			total: result.totalCount,
			pagination: {
				page: queryOptions.pagination.page,
				limit: queryOptions.pagination.limit
			},
			data,
		});

		logger.info(
			`[Post Controller] Admin user ${req.user.email} successfully accessed posts list with options: 
				${JSON.stringify(queryOptions)} (via controller)`
			);

	} catch (error) {
		logger.error(
			`[Post Controller] There was and error while fetching all posts`,
			{
				stack: error.stack,
				user: req.user.email,
				queryOptions: req.queryOptions
			}
		);

		next(error);
	}
}