import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  movieId: {
    type: Number,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [{
    type: String, // userId
  }],
});

export const Comment = mongoose.model('Comment', commentSchema);
