import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  picture: {
    type: String
  },
  points: {
    type: Number,
    default: 0
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
