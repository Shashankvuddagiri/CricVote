import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export const authAPI = {
  googleLogin: (token) => api.post('/auth/google', { token }),
  getMe: () => api.get('/auth/me'),
};

export const matchAPI = {
  getActiveMatches: () => api.get('/matches/active'),
  syncMatches: () => api.post('/matches/sync'), // Admin only usually
};

export const predictionAPI = {
  submitVote: (matchId, predictedWinner) => 
    api.post('/predictions', { matchId, predictedWinner }),
  getMyPredictions: () => api.get('/predictions/my'),
};

export const leaderboardAPI = {
  getTopUsers: () => api.get('/leaderboard'),
};

export default api;
