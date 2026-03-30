const { Client, Databases, Query } = require('node-appwrite');

/**
 * 2. Process Points Function (Node.js 18+)
 * Trigger: Databases -> Documents -> Matches -> Update
 */
module.exports = async function (req, res) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
  const MATCHES_ID = process.env.VITE_APPWRITE_MATCHES_ID;
  const PREDICTIONS_ID = process.env.VITE_APPWRITE_PREDICTIONS_ID;
  const PROFILES_ID = process.env.VITE_APPWRITE_PROFILES_ID;

  // The event data contains the Match document that was updated
  const match = JSON.parse(req.variables['APPWRITE_FUNCTION_EVENT_DATA']);

  // Check if match was just completed and has a winner
  if (match.status === 'completed' && match.winner) {
    console.log(`Processing points for match: ${match.$id}, winner: ${match.winner}`);

    try {
        // 1. Fetch all predictions for this match
        const predictions = await databases.listDocuments(
            DATABASE_ID,
            PREDICTIONS_ID,
            [Query.equal('matchId', [match.$id])]
        );

        console.log(`Found ${predictions.documents.length} predictions.`);

        for (const pred of predictions.documents) {
            if (pred.predictedWinner === match.winner) {
                console.log(`User ${pred.userId} guessed correctly! Awarding 10 points.`);
                
                // 2. Fetch the user's profile
                const profile = await databases.getDocument(DATABASE_ID, PROFILES_ID, pred.userId);
                
                // 3. Increment points
                await databases.updateDocument(DATABASE_ID, PROFILES_ID, pred.userId, {
                    points: (profile.points || 0) + 10
                });
            }
        }
        res.json({ success: true, processed: predictions.documents.length });
    } catch (err) {
        console.error("Points award failed", err);
        res.json({ success: false, error: err.message }, 500);
    }
  } else {
    res.json({ success: true, message: "No action required" });
  }
};
