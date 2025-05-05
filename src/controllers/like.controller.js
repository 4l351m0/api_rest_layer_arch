import { logger } from "../config/logger.js";
import LikeService from "../services/like.service.js";

const likeService = new LikeService();

export const create = async (req, res, next) => {
	try {
		const postId = req.params.postId;
		const userId = req.user._id;

		const postLikeCreated = await likeService.create(userId, postId);

		res.status(200).json({
			success: true,
			message: 'Like was added successfully',
			data: postLikeCreated
		});

		logger.info(`[Like Controller] Like was added to post ${postId} from user ${req.user.email}`);

	} catch (error) {
		logger.error(
			`[Like Controller] An error has occured while adding a like to post ${req.params.postId}`,
			{ 
				stack: error.stack,
				post: req.params.postId,
				user: req.user.email
			}
		);
		next(error);
	}
}

export const remove = async (req, res, next) => {
	try {
		const userId = req.user._id;
		const postId = req.params.postId;

		const postLikeRemoved = await likeService.remove(userId, postId);

		res.status(200).json({
			success: true,
			message: `Like was removed from post ${postId}`,
			data: postLikeRemoved
		});

		logger.info(`[Like Controller] A like was removed successfully from post ${postId}`);

	} catch (error) {
		logger.error(`[Like Controller] An error has ocurren while removing a like for post ${req.params.postId}`);
		next(error);
	}
}