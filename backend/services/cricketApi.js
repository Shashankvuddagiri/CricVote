import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.CRICKET_API_KEY;
const BASE_URL = 'https://api.cricapi.com/v1';

export const fetchUpcomingMatches = async () => {
  if (!API_KEY) throw new Error('CRICKET_API_KEY is missing from .env file.');

  try {
    const response = await axios.get(`${BASE_URL}/matches`, {
      params: { apikey: API_KEY, offset: 0 }
    });

    // Extract all matches from the API
    const allMatches = response.data.data;

    // Filter strictly for IPL matches using keywords
    const iplMatches = allMatches.filter(match => {
      const seriesName = (match.series || match.name || '').toLowerCase();
      return seriesName.includes('ipl') || seriesName.includes('indian premier league');
    });

    console.log(`📡 Found ${iplMatches.length} IPL Matches.`);
    return iplMatches;
  } catch (error) {
    console.error('Error fetching cricket data:', error.message);
    throw new Error('Failed to fetch matches from API');
  }
};
