import mongoose from "mongoose";

const LikeSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true
		},
		post: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Post',
			required: true,
			index: true
		}
	},
	{
		timestamps: true
	}
);

LikeSchema.index({ user: 1, post: 1 }, { required: true });

const Like = mongoose.model('Like', LikeSchema);

export default Like;