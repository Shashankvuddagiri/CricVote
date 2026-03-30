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

  try {
    const CRIC_API_KEY = '16c49e68-3f07-4766-b5b4-b189307f86f0';
    const response = await axios.get(`https://api.cricapi.com/v1/matches`, {
      params: { apikey: CRIC_API_KEY, offset: 0, search: 'IPL' }
    });

    const matches = response.data.data;
    const iplMatches = matches.filter(m => {
      const name = (m.name || '').toLowerCase();
      const series = (m.series || '').toLowerCase();

      // STRICT FILTER: Only "Indian Premier League" or "IPL"
      return name.includes('indian premier league') || series.includes('indian premier league') ||
        name.includes('ipl') || series.includes('ipl');
    });

    log(`Processing ${iplMatches.length} matches...`);

    for (const m of iplMatches) {
      const teamA = m.teamInfo?.[0] || { name: 'TBA', shortname: 'TBA', img: '' };
      const teamB = m.teamInfo?.[1] || { name: 'TBA', shortname: 'TBA', img: '' };

      try {
        // TRY CREATE
        await databases.createDocument(DATABASE_ID, MATCHES_ID, m.id, {
          teamA_name: teamA.name,
          teamA_short: teamA.shortname,
          teamA_logo: teamA.img || '',
          teamB_name: teamB.name,
          teamB_short: teamB.shortname,
          teamB_logo: teamB.img || '',
          startTime: new Date(m.dateTimeGMT).toISOString(),
          venue: m.venue || 'TBA',
          status: (m.matchStarted || m.status.includes('live')) ? 'live' : 'upcoming',
          votesA: 0,
          votesB: 0
        });
        log(`Created: ${m.name}`);
      } catch (e) {
        // ONLY UPDATE if it's a conflict error (code 409)
        if (e.code === 409) {
          await databases.updateDocument(DATABASE_ID, MATCHES_ID, m.id, {
            status: (m.matchStarted || m.status.includes('live')) ? 'live' : 'upcoming'
          });
          log(`Updated: ${m.name}`);
        } else {
          // IF it's NOT a conflict, it means your attributes are missing!
          error(`!! FAILED Document ${m.id}: ${e.message}`);
          throw new Error(`Database Error: ${e.message}. Did you add the teamA_logo and teamB_logo attributes to the Match collection?`);
        }
      }
    }

    return res.json({ success: true, count: iplMatches.length });

  } catch (err) {
    error("Execution Failed: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
