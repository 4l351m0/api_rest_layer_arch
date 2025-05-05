import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
	{
		text: {
			type: String,
			require: [true, 'Text is required'],
			trim: true
		},
		post: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Post',
			required: true
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		}
	},
	{
		timestamps: true
	}
);

const Comment = mongoose.model('Comment', CommentSchema);

export default Comment;