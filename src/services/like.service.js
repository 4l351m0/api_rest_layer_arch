import { logger } from "../config/logger.js";
import Like from "../models/Likes.js";
import Post from "../models/Post.js";

import {
	ApiError,
	ConflictError,
	NotFoundError
} from "../utils/errors.js";

class LikeService {
	create = async (user, post) => {
		try {
			logger.info(`[Like Service] Attemting creating like for post ${post}...`);

			const likeExists = await Like.findOne({ user, post });

			if(likeExists) {
				logger.warn(`[Like Service] This user has already one like for this post`);
				throw new ConflictError(`This user has liked this post already`);
			}

			const postExists = await Post.findById(post).select('_id');

			if(!postExists) {
				logger.warn(`[Like Service] This post does not exist ${post}`);
				throw new NotFoundError(`Post does not exists with ID ${post}`);
			}

			const like = new Like({ user, post });
			like.save();

			const postLikesUpdated = await Post.findByIdAndUpdate(
				post,
				{ $inc: { likesCount: 1 } },
				{ new : true}
			)
			.select('-__v')
			.lean();

			if(!postLikesUpdated) {
				logger.error(`[Like Service] There was an error while updating post likesCount`);
				throw new NotFoundError(`Post not found or failed while updating likesCount`);
			}

			return postLikesUpdated;

		} catch (error) {
			logger.error(`[Like Service] An error has ocurred while adding a post like`);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				logger.error(`[Like Service] Invalid format ID`);
				throw new NotFoundError(`Resource was not found`);
			}

			throw error;
		}
	}

	remove = async (user, post) => {
		try {
			logger.info(`[Like Service] Attemting remove a like from post ${post}`);

			const removedLike = await Like.findOneAndDelete({ post, user });

			if(!removedLike) {
				logger.warn(`[Like Service] Like not found for this post ${post}`);

				const postFound = await Post.findById(post);

				if(!postFound) {
					throw new NotFoundError(`Post was not found for ID ${post}`);
				}

				return post;
			}

			const postLikesUpdated = await Post.findByIdAndUpdate(
				post,
				{ $inc: { likesCount: 1 } },
				{ new: true }
			);

			return postLikesUpdated;

		} catch (error) {
			logger.error(`[Like Service] An error has occured while removing like for post ${post}`);

			if(error instanceof ApiError) {
				throw error;
			}

			if(error.kind === 'ObjectId') {
				throw new NotFoundError('Format ID invalid');
			}

			throw error;
		}
	}
}

export default LikeService;