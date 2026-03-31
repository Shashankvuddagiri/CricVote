import express from 'express';
import { Prediction } from '../models/Prediction.js';
import { Match } from '../models/Match.js';
import { User } from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Very secure middleware to parse and verify the Google Token on every request.
 */
const authMiddleware = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    const payload = ticket.getPayload();
    // Look up the exact Mongo User using their googleId
    const user = await User.findOne({ googleId: payload.sub });
    
    if(!user) return res.status(404).json({ msg: 'User matching token not found in database.' });

    // Store the database user ID so the route below uses it
    req.user = { id: user._id };
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid or expired' });
  }
};

/**
 * @desc    Submit a prediction for a match
 * @route   POST /api/predictions
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { matchId, predictedWinner } = req.body;
    
    // Check if match exists and if voting is locked
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    
    if (match.isVotingLocked || new Date() >= new Date(match.startTime)) {
        return res.status(400).json({ error: 'Voting is locked for this match. Toss time passed.' });
    }

    // Upsert prediction 
    let prediction = await Prediction.findOneAndUpdate(
      { userId: req.user.id, matchId },
      { $set: { predictedWinner } },
      { upsert: true, new: true }
    );

    res.json(prediction);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already voted!' });
    }
    console.error('Prediction Error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

/**
 * @desc    Get user's predictions
 * @route   GET /api/predictions/my
 * @access  Private
 */
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const predictions = await Prediction.find({ userId: req.user.id }).populate('matchId', 'teamA teamB startTime');
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
