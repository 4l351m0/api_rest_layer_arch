import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Post title is required'],
			trim: true,
			maxLength: [100, 'Post title length cannot be greated than 100']
		},
		body: {
			type: String,
			required: [true, 'Post content is required'],
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		likesCount: {
			type: Number,
			default: 0,
			min: [0, 'Likes count cannot be negative']
		}
	}
);

const Post = mongoose.model('Post', PostSchema);

export default Post;