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
    const DEFAULT_LOGO = 'https://www.iplt20.com/assets/images/ipl-logo-new-old.png';

    for (const m of iplMatches) {
      if (!m.id) continue;

      // Robust Team Data Extraction
      const teamA_raw = m.teamInfo?.[0] || {};
      const teamB_raw = m.teamInfo?.[1] || {};

      const getShort = (team, fallback) => {
        if (team.shortname && team.shortname !== 'TBA') return team.shortname.toUpperCase();
        if (team.name) return team.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3);
        return fallback;
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

      try {
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
          votesB: 0
        });
        log(`Created: ${m.name}`);
      } catch (e) {
        if (e.code === 409) {
          // Update status if match info changes
          await databases.updateDocument(DATABASE_ID, MATCHES_ID, m.id, {
            status: status
          });
          log(`Updated Status: ${m.name} -> ${status}`);
        } else {
          error(`!! FAILED Document ${m.id}: ${e.message}`);
        }
      }
    }

    return res.json({ success: true, count: iplMatches.length });

  } catch (err) {
    error("Execution Failed: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
