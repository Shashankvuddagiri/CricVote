import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ isOpen, onClose }) => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Initiates the redirect
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Authentication Failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="bg-indigo-900 border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-sm relative transform transition-all flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">✕</button>
        <h2 className="text-2xl font-bold text-center mb-6 text-white">Sign In</h2>
        
        {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-lg text-sm mb-6 border border-red-500/50 text-center w-full">{error}</div>}
        
        <p className="text-indigo-200 text-center text-sm mb-6">
          Access the live leaderboard and lock in your IPL predictions!
        </p>

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-900 font-bold rounded-full mb-4 hover:bg-gray-100 transition shadow-lg disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          {loading ? 'Redirecting...' : 'Sign in with Google'}
        </button>
        
        <p className="text-center text-xs text-indigo-300/50 mt-4">
          Powered by Appwrite Cloud
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
