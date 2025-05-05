import { logger } from "../config/logger.js";
import Post from "../models/Post.js";

import {
	ApiError,
	BadRequestError,
	ForbiddenError,
	NotFoundError
} from "../utils/errors.js";
import { applyQueryFeatures } from "../utils/queryFeatures.js";

class PostService {
	create = async(postData, authorId) => {
		try {
			logger.info(`[Post Service] Attempting to create new post for author ID: ${authorId}...`);

			const payload = { 
				...postData,
				author: authorId
			};
			
			const post = new Post({ ...payload });

			const postCreated = await post.save();

			return postCreated;
		} catch (error) {
			logger.error(
				`[Post Service] Failed to create post for author ID ${authorId}: ${error.message}`,
				{ stack: error.stack, postData }
			);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.name === 'ValidationError' || error.kind === 'ObjectId') {
				const message = error.name === 'ValidationError' 
										? '[Post Service] Validation failed for post data'
										: `[Post Service] Invalid ID format for author: ${authorId}`;
				
				const data = error.errors ? error.errors : null;
				throw new BadRequestError(message, data);
			}

			throw error;
		}
	}

	getById = async(postId) => {
		try {
			logger.info(`[Post Service] Attempting to get post by ID: ${postId}...`);

			const post = await Post.findById(postId)
											.populate('author', 'name email role')
											.select('-__v')
											.lean();
										
			if(!post) {
				logger.warn(`[Post Service] Post was not found with ID: ${postId}`);
				throw new NotFoundError(`[Post Service] Post not found with ID: ${postId}`);
			}

			logger.info(`[Post Service] Post fetched successfully with ID: ${postId}`);

			return post;

		} catch (error) {
			logger.warn(`[Post Service] Failed to fetch post with ID: ${postId}...`);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				throw NotFoundError(`[Post Service] Post not found with ID: ${postId}`);
			}

			throw error;
		}
	}

	update = async(postData, postId, userId) => {
		try {
			logger.info(`[Post Service] Attemting to update post with ID: ${postId}`);

			const post = await Post.findById(postId);

			if(!post) {
				logger.warn(`[Post Service] Post was not found with ID: ${postId}`);
				throw new NotFoundError([`[Post Service] Post was not found with ID: ${postId}`]);
			}

			const isAuthor = post.author && post.author.equals(userId);

			if(!isAuthor) {
				logger.warn(`[Post Service] User with ID: ${userId} is not authorized to update this resource`);
				throw new ForbiddenError(`[Post Service] User not allowed to update this resource`);
			}

			const allowedFields = ['title', 'body'];
			const filteredUpdateData = Object.keys(postData)
				.reduce((obj, key) => {
					if(allowedFields.includes(key)) {
						obj[key] = postData[key];
					}
					return obj;
				}, {});


			const postUpdated = await Post.findByIdAndUpdate(
				postId,
				filteredUpdateData,
				{
					new: true,
					runValidators: true,
					select: '-__v'
				}
			).populate('author', 'name email role').lean();

			logger.info(`[Post Service] Post was updated sucessfullt with ID: ${postId}`);

			return postUpdated;

		} catch (error) {
			logger.error(
				`[Post Service] Failed to update post with ID: ${postId}`,
				{ stack: error.stack }
			);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				throw new NotFoundError(`[Post Service] Post was not found with ID: ${postId}`);
			}

			throw error;
		}
	}

	remove = async(postId, userId) => {
		try {
			logger.info(`[Post Service] Attempting delete post with ID: ${postId}...`);
	
			const post = await Post.findById(postId);

			if(!post) {
				logger.warn(`[Post Service] Post was not found with ID: ${postId}`);
				throw new NotFoundError(`[Post Service] Post was not found with ID: ${postId}`);
			}

			const isAuthor = post.author && post.author.equals(userId);

			if(!isAuthor) {
				logger.warn(`[Post Service] User is not auhtorized to remove this post`);
				throw new ForbiddenError(`[Post Service] User is not authroized to remove this post`);
			}

			const removedPost = Post.findByIdAndDelete(postId)
												.select('-__v')
												.lean();

			if(!removedPost) {
				logger.warn(`[Post Service] Post was not found and cannot be removed with ID: ${postId}`);
				throw new NotFoundError(`[Post Service] Post was not found and cannot be removed with ID: ${postId}`);
			}

			return removedPost;
		} catch (error) {
			logger.error(`[Post Service] An error has occured while removed post with ID: ${postId}`);
			
			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				throw new NotFoundError(`[Post Service] Post was not found and cannot be removed with ID: ${postId}`);
			}

			throw error;
		}
	}

	getAll = async(options = {}) => {
		try {
			logger.info(`[Post Service] Attempting to fetch all posts...`);

			const { filters } = options;

			let query = Post.find(filters);
			query = applyQueryFeatures(query, options);
			query = query.populate('author', 'name email role');

			const totalCount = await Post.countDocuments(filters);
			const posts = await query.select('-__v').lean();

			logger.info(`[Post Service] Successfully fetched ${posts.length} posts (total matching filter: ${totalCount}) with query options`);

			return {
				data: posts,
				totalCount
			}

		} catch (error) {
			logger.error(
				`[Post Service] Failed to fetch all posts with query options: ${error.message}`, 
				{ stack: error.stack, options }
			);

			throw error;
		}
	}
}

export default PostService;