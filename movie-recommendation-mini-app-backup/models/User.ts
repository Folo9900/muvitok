import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true,
  },
  username: String,
  firstName: String,
  lastName: String,
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumExpiresAt: Date,
  favorites: [{
    type: Number, // movieId
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model('User', userSchema);
