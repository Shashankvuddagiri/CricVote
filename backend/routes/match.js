import express from 'express';
import { Match } from '../models/Match.js';
import { fetchUpcomingMatches } from '../services/cricketApi.js';
import { processMatchResults } from '../services/pointsEngine.js';

const router = express.Router();

/**
 * Normalizes API data into our Mongo Schema format
 */
const normalizeMatchData = (apiMatch) => {
  return {
    apiId: apiMatch.id,
    teamA: {
      name: apiMatch.teamInfo[0].name,
      shortName: apiMatch.teamInfo[0].shortname,
    },
    teamB: {
      name: apiMatch.teamInfo[1].name,
      shortName: apiMatch.teamInfo[1].shortname,
    },
    startTime: new Date(apiMatch.dateTimeGMT),
    venue: apiMatch.venue,
    status: apiMatch.status.includes('not started') ? 'upcoming' : 'live'
  };
};

/**
 * @desc    Sync matches from API to database
 * @route   POST /api/matches/sync
 * @access  Public (Can be protected by Admin Middleware)
 */
router.post('/sync', async (req, res) => {
  try {
    const activeMatchesRaw = await fetchUpcomingMatches();
    
    let updatedCount = 0;
    for (const matchRaw of activeMatchesRaw) {
      const formattedMatch = normalizeMatchData(matchRaw);
      
      // Upsert: Create if doesn't exist, update if it does.
      await Match.findOneAndUpdate(
        { apiId: formattedMatch.apiId },
        { $set: formattedMatch },
        { upsert: true, new: true }
      );
      updatedCount++;
    }

    res.json({ message: `Successfully synced ${updatedCount} matches!` });
  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: 'Failed to sync matches' });
  }
});

/**
 * @desc    Get all active matches (upcoming or live)
 * @route   GET /api/matches/active
 * @access  Public
 */
router.get('/active', async (req, res) => {
  try {
    // Sort so the nearest matches show up first
    const matches = await Match.find({ status: { $in: ['upcoming', 'live'] } })
                               .sort({ startTime: 1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * @desc    Get specific match details
 * @route   GET /api/matches/:id
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * @desc    Admin: Finish a match and process results manually (for testing MVP)
 * @route   POST /api/matches/:id/finish
 * @access  Public (Should be admin guarded in production)
 */
router.post('/:id/finish', async (req, res) => {
  try {
    const { winner } = req.body; // e.g. 'teamA' or 'teamB'
    if (!winner) return res.status(400).json({ error: 'Winner team shortName must be provided' });

    const match = await Match.findByIdAndUpdate(req.params.id, {
      status: 'completed',
      winner: winner,
      isVotingLocked: true
    }, { new: true });

    if (!match) return res.status(404).json({ error: 'Match not found' });

    const result = await processMatchResults(match._id);

    res.json({ message: 'Match finished and points awarded successfully!', result });
  } catch (error) {
    res.status(500).json({ error: 'Server Error while calculating results' });
  }
});

export default router;
