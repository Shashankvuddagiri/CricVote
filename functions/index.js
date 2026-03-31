const { Client, Databases, ID } = require('node-appwrite');
const axios = require('axios');

module.exports = async function (context) {
  const { res, log, error } = context;

  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || 'mmlipl')
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '69ca3053003df331dd7e';
  const MATCHES_ID = process.env.VITE_APPWRITE_MATCHES_ID || 'matches';
  const PREDICTIONS_ID = process.env.VITE_APPWRITE_PREDICTIONS_ID || 'predictions';
  const PROFILES_ID = process.env.VITE_APPWRITE_PROFILES_ID || 'profiles';

  try {
    const CRIC_API_KEY = '16c49e68-3f07-4766-b5b4-b189307f86f0';

    // 1. Find the Series ID for IPL 2026
    log("Searching for IPL 2026 Series ID...");
    const seriesResp = await axios.get(`https://api.cricapi.com/v1/series`, {
      params: { apikey: CRIC_API_KEY, offset: 0, search: 'Indian Premier League 2026' }
    });

    const possibleSeries = (seriesResp.data.data || []).filter(s => 
      s.name.toLowerCase().includes('indian premier league 2026') ||
      s.name.toLowerCase() === 'ipl 2026'
    );

    let iplMatches = [];
    let activeSeriesName = "Indian Premier League 2026";

    log(`Found ${possibleSeries.length} potential series matches. Scanning for data...`);

    for (const s of possibleSeries) {
      log(`Checking Series: ${s.name} (${s.id})`);
      const infoResp = await axios.get(`https://api.cricapi.com/v1/series_info`, {
        params: { apikey: CRIC_API_KEY, id: s.id }
      });

      if (infoResp.data.data && infoResp.data.data.matchList && infoResp.data.data.matchList.length > 0) {
         iplMatches = infoResp.data.data.matchList;
         activeSeriesName = s.name;
         log(`SUCCESS! Found ${iplMatches.length} matches in: ${s.name}`);
         break; 
      }
    }

    // FINAL FALLBACK: If all series objects are empty, use global search
    if (iplMatches.length === 0) {
      log("WARNING: All specific IPL series objects are empty. Falling back to Global Match Search...");
      const globalResp = await axios.get(`https://api.cricapi.com/v1/matches`, {
        params: { apikey: CRIC_API_KEY, offset: 0, search: 'IPL' }
      });
      iplMatches = (globalResp.data.data || []).filter(m => 
        m.name.toLowerCase().includes('ipl') || 
        (m.series && m.series.toLowerCase().includes('indian premier league'))
      );
      log(`Fallback successful: Found ${iplMatches.length} upcoming matches.`);
    }

    log(`Final processing queue: ${iplMatches.length} matches.`);

    const DEFAULT_LOGO = 'https://www.iplt20.com/assets/images/ipl-logo-new-old.png';

    const now = new Date();
    const today = now.toDateString();

    for (const m of iplMatches) {
      if (!m.id) continue;

      const mDate = new Date(m.dateTimeGMT);
      const isMatchCompleted = m.matchEnded || (m.status && m.status.toLowerCase().includes('won by'));

      // Skip today's match ONLY if it's NOT completed
      if (mDate.toDateString() === today && !isMatchCompleted) {
          log(`Skipping Today's Active Match (Manual Control): ${m.name}`);
          continue;
      }

      // Robust Team Data Extraction
      const teamA_raw = m.teamInfo?.[0] || {};
      const teamB_raw = m.teamInfo?.[1] || {};

      const getShort = (team, fallback) => {
        const overrides = { 'RCBW': 'RCB', 'PKS': 'PBKS', 'CSKW': 'CSK' };
        let short = fallback;
        if (team.shortname && team.shortname !== 'TBA') short = team.shortname.toUpperCase();
        else if (team.name) short = team.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3);
        
        return overrides[short] || short;
      };

      const teamA = {
        name: teamA_raw.name || 'Team A',
        shortname: getShort(teamA_raw, 'TMA'),
        img: teamA_raw.img || DEFAULT_LOGO
      };

      const teamB = {
        name: teamB_raw.name || 'Team B',
        shortname: getShort(teamB_raw, 'TMB'),
        img: teamB_raw.img || DEFAULT_LOGO
      };

      // Robust Status Mapping
      let status = 'upcoming';
      if (m.matchStarted || (m.status && m.status.toLowerCase().includes('live'))) {
        status = 'live';
      }
      if (m.matchEnded || (m.status && m.status.toLowerCase().includes('won by'))) {
        status = 'completed';
      }

      // Determine which team won from the status string
      let winnerId = null;
      if (isMatchCompleted && m.status) {
        const statusLower = m.status.toLowerCase();
        if (statusLower.includes(teamA.name.toLowerCase())) winnerId = 'teamA';
        else if (statusLower.includes(teamB.name.toLowerCase())) winnerId = 'teamB';
      }

      try {
        // Fetch existing match data first to check distribution
        let existingMatch = null;
        try {
          existingMatch = await databases.getDocument(DATABASE_ID, MATCHES_ID, m.id);
        } catch (getErr) {
          // Document doesn't exist, we'll create it
        }

        if (!existingMatch) {
          // TRY CREATE
          await databases.createDocument(DATABASE_ID, MATCHES_ID, m.id, {
            teamA_name: teamA.name,
            teamA_short: teamA.shortname,
            teamA_logo: teamA.img,
            teamB_name: teamB.name,
            teamB_short: teamB.shortname,
            teamB_logo: teamB.img,
            startTime: m.dateTimeGMT ? new Date(m.dateTimeGMT).toISOString() : new Date().toISOString(),
            venue: m.venue || 'TBA Arena',
            status: status,
            votesA: 0,
            votesB: 0,
            pointsDistributed: false
          });
          log(`Created: ${m.name} [${status}]`);
        } else {
          // UPDATE
          const updateData = { 
            status: status,
            teamA_name: teamA.name,
            teamA_short: teamA.shortname,
            teamB_name: teamB.name,
            teamB_short: teamB.shortname
          };
          if (winnerId) updateData.winner = winnerId;
          
          await databases.updateDocument(DATABASE_ID, MATCHES_ID, m.id, updateData);
          log(`Updated Sync: ${m.name} -> ${status}`);
        }

        // --- AUTOMATED REFEREE SYSTEM ---
        // If match just completed and points are not yet distributed, reward the victors!
        if (isMatchCompleted && winnerId && (!existingMatch || !existingMatch.pointsDistributed)) {
          log(`🏆 AUTOMATED REFEREE: Distributing Gold for ${m.name} (Winner: ${winnerId})...`);
          
          const { Query } = require('node-appwrite');
          const winnersRes = await databases.listDocuments(DATABASE_ID, PREDICTIONS_ID, [
            Query.equal('matchId', m.id),
            Query.equal('predictedWinner', winnerId)
          ]);

          log(`Found ${winnersRes.total} winners to reward!`);

          for (const pred of winnersRes.documents) {
            try {
              // Get the profile by userId directly (assuming profile ID == user ID)
              // If not, we use listDocuments with Query.equal('userId', pred.userId)
              const profile = await databases.getDocument(DATABASE_ID, PROFILES_ID, pred.userId);
              
              if (profile) {
                await databases.updateDocument(DATABASE_ID, PROFILES_ID, profile.$id, {
                  points: (profile.points || 0) + 1
                });
              }
            } catch (err) {
              // Fallback for custom profile IDs
              try {
                const userRes = await databases.listDocuments(DATABASE_ID, PROFILES_ID, [
                  Query.equal('userId', pred.userId)
                ]);
                if (userRes.total > 0) {
                   await databases.updateDocument(DATABASE_ID, PROFILES_ID, userRes.documents[0].$id, {
                     points: (userRes.documents[0].points || 0) + 1
                   });
                }
              } catch (fallbackErr) {
                 error(`- Distribution error for user ${pred.userId}: ${fallbackErr.message}`);
              }
            }
          }

          // Mark distribution as final
          await databases.updateDocument(DATABASE_ID, MATCHES_ID, m.id, {
            pointsDistributed: true
          });
          log(`✅ POINTS DEPLOYED for ${m.name}. Arena Standings Updated.`);
        }

      } catch (e) {
        error(`!! FAILED processing ${m.id}: ${e.message}`);
      }
    }

    return res.json({ success: true, count: iplMatches.length, series: activeSeriesName });

  } catch (err) {
    error("Execution Failed: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
