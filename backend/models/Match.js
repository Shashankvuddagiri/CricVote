import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  apiId: { type: String, unique: true }, // ID from cricket API
  teamA: {
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    logo: String,
  },
  teamB: {
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    logo: String,
  },
  startTime: { type: Date, required: true },
  venue: { type: String },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'abandoned'],
    default: 'upcoming'
  },
  winner: {
    type: String, // shortName of team A or B
  },
  isVotingLocked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const Match = mongoose.model('Match', matchSchema);
