import { Match } from '../models/Match.js';
import { Prediction } from '../models/Prediction.js';
import { User } from '../models/User.js';

/**
 * Calculates and awards points for a completed match
 * @param {ObjectId} matchId 
 */
export const processMatchResults = async (matchId) => {
  try {
    const match = await Match.findById(matchId);
    if (!match || match.status !== 'completed' || !match.winner) {
      throw new Error('Match is invalid, not completed, or has no winner yet.');
    }

    // Find all unprocessed predictions for this match
    const predictions = await Prediction.find({ matchId, isProcessed: false });

    console.log(`Processing ${predictions.length} predictions for match ${matchId}`);

    for (const prediction of predictions) {
      let pointsToAward = 0;

      // Base points for correct winner
      if (prediction.predictedWinner === match.winner) {
        pointsToAward = 10;
        
        // Add streak logic / double or nothing logic here in the future
      }

      prediction.pointsAwarded = pointsToAward;
      prediction.isProcessed = true;
      await prediction.save();

      // Update User Points
      if (pointsToAward > 0) {
        await User.findByIdAndUpdate(prediction.userId, {
          $inc: { points: pointsToAward }
        });
      }
    }

    // Award badges after processing (Simple logical check)
    // Here we could query top users and append a "Prediction King" badge

    console.log(`Match ${matchId} processing complete!`);
    return { success: true, processedCount: predictions.length };

  } catch (error) {
    console.error('Points Engine Error:', error);
    throw error;
  }
};
