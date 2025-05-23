import { logger } from '../config/logger.js';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { ApiError, BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { applyQueryFeatures } from '../utils/queryFeatures.js';

class CommentService {
	create = async (text, postId, authorId) => {
		try {
			logger.info(`[Comment Service] Attempting to create new comment for post: ${postId}...`);

			const post = await Post.findById(postId).select('_id');

			if(!post) {
				logger.warn(`[Comment Service] Post was not found with thid ID ${postId}`);
				throw new NotFoundError(`Post was not found with ID: ${postId}`);
			}

			const comment = new Comment({
				text,
				post: postId,
				author: authorId
			});

			const createdComment = await comment.save();
			return createdComment;

		} catch (error) {
			logger.error(
				`[Comment Service] There was an error while creating a comment`,
				{ stack: error.stack }
			);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.name === 'ValidationError') {
				const message = 'Validation failed for comment creation';
				const data = error.errors ? error.errors : null;
				throw new BadRequestError(message, data);
			}

			if(error.kind === 'ObjectId') {
				throw new NotFoundError(`Invalid ID format for ${error.path}: ${error.value}`);
			}
			
			throw error;
		}
	}

	getById = async (postId = null, commentId) => {
		try {
			logger.info(`[Comment Service] Attempting to get comment by ID: ${commentId}...`);

			let comment = await Comment.findById(commentId)
												.populate('author', 'name email role')
												.populate('post', 'title')
												.select('-__v')
												.lean();

			if(!comment) {
				logger.warn(`[Comment Service] There was not found any comment with ID : ${commentId}`);
				throw NotFoundError(`Comment was not found with ID: ${commentId}`);
			}

			return comment;

		} catch (error) {
			logger.error(`[Comment Service] There was an error while getting comment with ID: ${commentId}`);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				throw new NotFoundError(`Invalid ID format for ${error.path}: ${error.value}`);
			}

			throw error;
		}
	}

	update = async (commentData, commentId, postId = null) => {
		logger.info(`[Comment Service] Attempting to update comment with ID: ${commentId}...`);

		const comment = await Comment.findById(commentId);

		if(!comment) {
			logger.warn(`[Comment Service] Comment was not found with ID: ${commentId}`);
			throw new NotFoundError(`Comment was not found with ID: ${commentId}`);
		}

		if(postId && comment.post && comment.post.toString() !== postId.toString()) {
			logger.warn(`[Comment Service] This comment cannot be edited. This comment doenst belong to this postId`);
			throw new ForbiddenError('Not allowed to update this comment for this post');
		}

		const allowedFields = ['text'];

		const filteredUpdateData = Object.keys(commentData)
			.reduce((obj, key) => {
				if(allowedFields.includes(key)) {
					obj[key] = commentData[key];
				}

				return obj;
			}, {});

		const commentUpdated = await Comment.findByIdAndUpdate(
			commentId,
			filteredUpdateData,
			{
				new: true,
				runValidators: true,
				select: '-__v'
			}
		)
		.populate('author', 'name email role')
		.populate('post', 'title')
		.lean();

		return commentUpdated;

	}

	remove = async (commentId, postId) => {
		try {
			logger.info(`[Comment Service] Attempting to remove comment with ID: ${commentId}...`);

			const comment = await Comment.findById(commentId);

			if(!comment) {
				logger.warn(`[Comment Service] Comment was not found with ID: ${commentId}`);
				throw new NotFoundError(`Comment was not found with ID: ${commentId}`);
			}

			if(postId && comment.post && comment.post.toString() !== postId.toString()) {
				logger.warn(`[Comment Service] This comment cannot be deleted, does not belongs to this post`);
				throw new ForbiddenError(`Comment does not belong to this post and cannot be deleted`);
			}

			const removedComment = await Comment.findByIdAndDelete(commentId)
															.select('-__v')
															.lean();

			return removedComment;
		} catch (error) {
			logger.error(`[Comment Service] There was an error while deleting comment`);
			throw error;
		}
	}

	getAllByPost = async (postId, options = {}) => {
		try {
			logger.info(`[Comment Service] Attempting to fetch comments for post: ${postId}...`);

			const post = await Post.findById(postId);

			if(!post) {
				logger.warn(`[Comment Service] Post was not found with id ${postId}`);
				throw new NotFoundError(`Post was not found with ID: ${postId}`);
			}

			const filters = { ...options.filter, post: postId };

			let query = Comment.find(filters);

			query = applyQueryFeatures(query, options);
			query = query.populate('author', 'name email role');

			const totalCount = await Comment.countDocuments(filters);

			const comments = await query.select('-__v').lean();

			logger.info(`[CommentService] Successfully fetched ${comments.length} comments (total matching filter: ${totalCount}) for Post ID: ${postId}`);

			return {
				data: comments,
				totalCount
			}
		} catch (error) {
			logger.error(`[Comment Service] There was an error while fetching comments for post: ${postId}`);
			
			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				throw new NotFoundError(`Invalid ID format: ${error.path}`);
			}

			throw error;
		}
	}
}

export default CommentService;