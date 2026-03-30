import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UsernameModal = () => {
  const { needsUsername, createProfile, user } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!needsUsername) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim().length < 3) return setError('Username must be at least 3 characters');
    
    setLoading(true);
    setError('');
    try {
      await createProfile(username);
    } catch (err) {
      setError(err.message || 'Username might already be taken');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <div className="bg-indigo-900 border border-yellow-500/30 p-8 rounded-3xl shadow-2xl w-full max-w-md relative transform transition-all flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/20">
          <span className="text-2xl">🏏</span>
        </div>
        
        <h2 className="text-3xl font-black text-center mb-2 text-white italic uppercase tracking-tighter">Choose Your Handle</h2>
        <p className="text-indigo-200 text-center text-sm mb-8">
          Welcome, {user?.name}! Choose a unique username to appear on the global leaderboard.
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative mb-6">
             <input 
              type="text" 
              placeholder="e.g. MS_Dhoni_Fan" 
              className="w-full bg-white/5 border border-white/20 rounded-xl px-5 py-4 focus:border-yellow-500 focus:outline-none text-white text-lg transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && <div className="text-red-400 text-sm mb-4 text-center font-bold uppercase tracking-wider">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-black font-black uppercase tracking-widest hover:scale-[1.02] shadow-xl shadow-yellow-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Setting up profile...' : 'Join the Arena'}
          </button>
        </form>

        <p className="text-center text-[10px] text-indigo-300/30 mt-8 uppercase tracking-widest font-bold">
          Once chosen, your handle represents you in the MML leaderboard.
        </p>
      </div>
    </div>
  );
};

export default UsernameModal;
