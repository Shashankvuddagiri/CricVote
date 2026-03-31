import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

/**
 * @desc    Get top users by points
 * @route   GET /api/leaderboard
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const topUsers = await User.find({})
      .select('username points')
      .sort({ points: -1 })
      .limit(50);
      
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
