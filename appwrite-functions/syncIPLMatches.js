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
    
    // 1. Find the Series ID for IPL 2026
    log("Searching for IPL 2026 Series ID...");
    const seriesResp = await axios.get(`https://api.cricapi.com/v1/series`, {
      params: { apikey: CRIC_API_KEY, offset: 0, search: 'Indian Premier League 2026' }
    });

    const iplSeries = seriesResp.data.data.find(s => 
      s.name.toLowerCase().includes('indian premier league 2026')
    );

    if (!iplSeries) {
      throw new Error("Could not find Indian Premier League 2026 series in CricAPI.");
    }

    const SERIES_ID = iplSeries.id;
    log(`Found Series ID: ${SERIES_ID} (${iplSeries.name})`);

    // 2. Fetch ALL matches for this series
    const infoResp = await axios.get(`https://api.cricapi.com/v1/series_info`, {
      params: { apikey: CRIC_API_KEY, id: SERIES_ID }
    });

    if (!infoResp.data.data || !infoResp.data.data.matchList) {
       throw new Error("Failed to fetch match list for series: " + SERIES_ID);
    }

    const iplMatches = infoResp.data.data.matchList;
    log(`Processing ${iplMatches.length} total matches for the season...`);
    
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

    return res.json({ success: true, count: iplMatches.length, series: iplSeries.name });

  } catch (err) {
    error("Execution Failed: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
