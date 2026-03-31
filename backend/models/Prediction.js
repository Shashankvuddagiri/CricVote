import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  predictedWinner: {
    type: String, // 'teamA' or 'teamB' or the shortName
    required: true
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  isProcessed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Ensure a user can only predict once per match
predictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

export const Prediction = mongoose.model('Prediction', predictionSchema);
