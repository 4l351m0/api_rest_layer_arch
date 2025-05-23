import { validationResult } from "express-validator";
import { logger } from "../config/logger.js";
import CommentService from "../services/comment.service.js";
import { BadRequestError } from "../utils/errors.js";

const commentService = new CommentService();

export const create = async (req, res, next) => {
	try {
		const postId = req.params.postId;
		const authorId = req.user._id;
		const { text } = req.body;

		const errors = validationResult(req);

		if(!errors.isEmpty) {
			const validationErrors = new BadRequestError(`[Comment Controller] Validation failed for comment creation`, errors.array());
			logger.warn(
				`[Comment Controller] Comment creation failed`,
				{ 
					errors: validationErrors.data,
					user: req.user.email
				}
			);
			return next(validationErrors);
		}

		const createdComment = await commentService.create(text, postId, authorId);

		res.status(201).json({
			success: true,
			message: `Comment was added for post ${postId}`,
			data: createdComment
		});

		logger.info(`[Comment Controller] Comment was created succesfully`);

	} catch (error) {
		logger.error(`[Comment Controller] There was an error while creating the comment for post ${req.params.postId}`);
		next(error);
	}
}

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}:
 *   get:
 *     summary: Obtiene un comentario específico de un post.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del post al que pertenece el comentario.
 *         example: 60d5ec49f8a3c80015f8a3c8
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del comentario a obtener.
 *         example: 60d5ec49f8a3c80015f8a3c9
 *     responses:
 *       200:
 *         description: Comentario obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: ID de post o comentario con formato inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid ID format
 *       401:
 *         description: No autorizado (token JWT faltante o inválido).
 *       404:
 *         description: Post o comentario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Comment not found with ID: 60d5ec49f8a3c80015f8a3c9 for Post: 60d5ec49f8a3c80015f8a3c8
 *       500:
 *         description: Error interno del servidor.
 */

export const getById = async (req, res, next) => {
	try {
		const postId = req.params.postId;
		const commentId = req.params.commentId;

		const comment = await commentService.getById(postId, commentId);

		res.status(200).json({
			success: true,
			data: comment
		});

		logger.info(`[Comment Controller] Comment was get sucessfully`);

	} catch (error) {
		logger.error(
			`[Comment Controller] There was an error while getting comment with ID: ${req.params.commentId}`,
			{
				stack: error.stack,
				commentId: req.params.commentId,
				postId: req.params.postId,
				user: req.user.email
			}
		);

		next(error);
	}
}

export const update = async(req, res, next) => {
	try {
		const postId = req.params.postId;
		const commentId = req.params.commentId;
		const payload = { ...req.body };

		const errors = validationResult(req);

		if(!errors.isEmpty) {
			const error = new BadRequestError(`[Comment Controller] Validation Failed`);
			validationErrors.status = 404;
			validationErrors.data = error.array();

			return next(error);
		}

		const comment = await commentService.update(payload, commentId, postId);

		res.status(200).json({
			success: true,
			data: comment
		});

		logger.info(`[Comment Controller] The comment with ID: ${commentId} was updated successfully`);
	} catch (error) {
		logger.error(
			`[Comment Controller] There was an error while updating a comment`,
			{ stack: error.stack }
		);

		next(error);
	}
}

export const remove = async (req, res, next) => {
	try {
		const postId = req.params.postId;
		const commentId = req.params.commentId;

		const removedComment = await commentService.remove(commentId, postId);

		res.status(200).json({
			success: true,
			message: 'Comment was removed successfully',
			data: removedComment
		});

		logger.info(`[Comment Controller] Comment was removed successfully`);
	} catch (error) {
		logger.error(
			`[Comment Controller] There was an error while removing a comment`,
			{ stack: error.stack }
		);
		next(error);
	}
}

export const getAllByPost = async (req, res , next) => {
	try {
		const queryOptions = req.queryOptions;
		const postId = req.params.postId;

		const result = await commentService.getAllByPost(postId, queryOptions);
		const data = result.data;

		res.status(200).json({
			success: true,
			count: data.length,
			total: result.totalCount,
			pagination: {
				page: queryOptions.page,
				limit: queryOptions.pagination.limit
			},
			data
		});

		logger.info(
					`[Comment Controller] User ${req.user.email} successfully accessed to post's comments list with options: 
						${JSON.stringify(queryOptions)} (via controller)`
					);

	} catch (error) {
		logger.error(
			`[Comment Controller] There was an error while fetching comments for post with ID: ${req.params.postId}`,
			{ stack: error.stack }		
		);
		next(error);
	}
}