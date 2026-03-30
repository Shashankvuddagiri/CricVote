import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { databases, client } from './appwrite';
import { Query } from 'appwrite';
import MatchCard from './components/MatchCard';
import LoginModal from './components/LoginModal';
import UsernameModal from './components/UsernameModal';
import Leaderboard from './components/Leaderboard';
import AdminDashboard from './components/AdminDashboard';
import logo from './assets/logo.png';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const MATCHES_ID = import.meta.env.VITE_APPWRITE_MATCHES_ID;

// CHANGE THIS TO YOUR ACTUAL APPWRITE EMAIL
const ADMIN_EMAIL = 'vshashank2005@gmail.com';

function MainApp() {
  const { user, profile, logout, loading, needsUsername } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [view, setView] = useState('home');

  const isAdmin = user && user.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!DATABASE_ID || !MATCHES_ID || DATABASE_ID === 'your_database_id') return;

    // Fetch Initial Matches
    const fetchMatches = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          MATCHES_ID,
          [Query.equal('status', ['upcoming', 'live']), Query.orderAsc('startTime')]
        );
        setMatches(response.documents);
      } catch (err) {
        console.error("Match fetch failed", err);
      }
    };

    fetchMatches();

    // Subscribe to real-time updates for Matches
    const unsubscribe = client.subscribe(
      [`databases.${DATABASE_ID}.collections.${MATCHES_ID}.documents`],
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          const updatedDoc = response.payload;
          setMatches((prev) =>
            prev.map((m) => m.$id === updatedDoc.$id ? updatedDoc : m)
          );
        }
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-indigo-900 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white flex flex-col pt-6 md:pt-10 px-4">
      <header className="flex flex-col md:flex-row justify-between items-center max-w-5xl mx-auto w-full mb-8 md:mb-10 gap-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MML Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-2xl" />
          <button onClick={() => setView('home')} className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 text-left">
            MML IPL Predictions
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4 items-center">
          {isAdmin && (
            <button
              onClick={() => setView(view === 'admin' ? 'home' : 'admin')}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-black uppercase text-[9px] md:text-[10px] border tracking-widest transition-all ${view === 'admin' ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              {view === 'admin' ? 'Exit Admin' : 'Admin'}
            </button>
          )}
          <button
            onClick={() => setView(view === 'leaderboard' ? 'home' : 'leaderboard')}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-[10px] md:text-xs font-bold uppercase backdrop-blur-sm border ${view === 'leaderboard' ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            Leaderboard
          </button>

          {user ? (
            <div className="flex gap-2 md:gap-4 items-center bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 shadow-lg">
              <span className="font-bold text-indigo-100 text-[10px] md:text-sm truncate max-w-[80px] md:max-w-none">{profile?.username || user.name}</span>
              <span className="font-bold text-yellow-400 text-[10px] md:text-sm">{profile?.points || 0} PTS</span>
              <button onClick={logout} className="text-[10px] font-bold hover:text-red-400 ml-1 md:ml-2 border-l border-white/20 pl-2 md:pl-4 uppercase tracking-tighter">Logout</button>
            </div>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-purple-900 font-bold shadow-lg transform transition hover:-translate-y-0.5 text-xs md:text-base">
              Login
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center gap-8">

        {view === 'admin' && isAdmin ? (
          <AdminDashboard />
        ) : view === 'leaderboard' ? (
          <Leaderboard />
        ) : (
          matches.length === 0 ? (
            <div className="text-indigo-200 uppercase tracking-widest font-black text-xs italic opacity-50 py-20 text-center">
              No active matches in the arena.<br />Check back soon!
            </div>
          ) : (
            matches.map((match) => (
              <MatchCard key={match.$id} matchId={match.$id} match={match} user={user} />
            ))
          )
        )}

      </main>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <UsernameModal />
    </div>
  );
}

export default MainApp;
