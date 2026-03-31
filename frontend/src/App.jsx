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
  const [matchFilter, setMatchFilter] = useState('week'); // 'week', 'upcoming', 'history'
  const [visibleDays, setVisibleDays] = useState(7);
  const [logoMap, setLogoMap] = useState({
    'CSK': 'https://documents.iplt20.com/ipl/IPLHeadshot2024/CSK.png',
    'MI': 'https://documents.iplt20.com/ipl/IPLHeadshot2024/MI.png',
    'RCB': 'https://documents.iplt20.com/ipl/IPLHeadshot2024/RCB.png',
    'KKR': 'https://documents.iplt20.com/ipl/IPLHeadshot2024/KKR.png',
    'DC': 'https://documents.iplt20.com/ipl/IPLHeadshot2024/DC.png',
    'PBKS': 'https://documents.iplt20.com/ipl/IPLHeadshot2024/PBKS.png',
    'RR': 'https://documents.iplt20.com/ipl/IPLHeadshot2024/RR.png',
    'GT': 'https://documents.iplt20.com/ipl/IPLHeadshot2024/GT.png',
    'LSG': 'https://documents.iplt20.com/ipl/IPLHeadshot2024/LSG.png',
    'SRH': 'https://documents.iplt20.com/ipl/IPLHeadshot2024/SRH.png'
  });

  const isAdmin = user && user.email === ADMIN_EMAIL;

  // Intelligent Notification Logic
  useEffect(() => {
    if (!matches.length) return;

    const checkLockTimes = () => {
      const now = new Date();
      matches.forEach(m => {
        const startTime = new Date(m.startTime);
        const diffMs = startTime - now;
        const diffMins = Math.floor(diffMs / 1000 / 60);

        // Notify if 15 minutes remains
        if (diffMins === 15) {
          if (Notification.permission === 'granted') {
             new Notification('🏏 MML Prediction Alert!', {
                body: `The arena for ${m.teamA_short} vs ${m.teamB_short} locks in 15 minutes! Lock in your verdict now.`,
                icon: logo
             });
          }
        }
      });
    };

    const interval = setInterval(checkLockTimes, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [matches]);

  const requestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (!DATABASE_ID || !MATCHES_ID || DATABASE_ID === 'your_database_id') return;

    // Fetch Initial Matches
    // Fetch Initial Matches and Logos
    const fetchArenaData = async () => {
      try {
        const LOGOS_ID = import.meta.env.VITE_APPWRITE_LOGOS_ID || 'logos';
        const [matchRes, logoRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, MATCHES_ID, [Query.orderAsc('startTime'), Query.limit(100)]),
          databases.listDocuments(DATABASE_ID, LOGOS_ID).catch(() => ({ documents: [] }))
        ]);
        
        setMatches(matchRes.documents);
        
        // Build Logo Map with local fallbacks
        const lMap = { ...logoMap };
        logoRes.documents.forEach(l => {
          lMap[l.teamShort] = l.logoUrl;
        });
        setLogoMap(lMap);
      } catch (err) {
        console.error("Match fetch failed", err);
      }
    };

    fetchArenaData();

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
              {view === 'admin' ? 'Exit Admin' : 'Admin Area'}
            </button>
          )}

          <div className="flex bg-black/20 p-1 rounded-full border border-white/5 mx-2">
              <button onClick={() => setView('home')} className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase transition-all tracking-widest ${view === 'home' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}>Arena</button>
              <button onClick={() => setView('history')} className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase transition-all tracking-widest ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}>History</button>
              <button onClick={() => setView('leaderboard')} className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase transition-all tracking-widest ${view === 'leaderboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}>Ranks</button>
          </div>
            
            {/* Notification Toggle */}
            {'Notification' in window && Notification.permission !== 'granted' && (
                <button 
                  onClick={requestPermission} 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-yellow-400 hover:bg-white/10 transition group"
                  title="Enable Alerts"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </button>
            )}

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

      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center gap-8 pb-20">
        
        {view === 'home' && (
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 self-center">
             {[
               { id: 'week', label: 'This Week' },
               { id: 'upcoming', label: 'All Upcoming' },
               { id: 'history', label: 'History' }
             ].map(f => (
               <button
                 key={f.id}
                 onClick={() => setMatchFilter(f.id)}
                 className={`px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all tracking-wider ${matchFilter === f.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
               >
                 {f.label}
               </button>
             ))}
          </div>
        )}

        {view === 'admin' && isAdmin ? (
          <AdminDashboard />
        ) : view === 'leaderboard' ? (
          <Leaderboard />
        ) : view === 'history' ? (
          <div className="w-full flex flex-col items-center gap-8">
              <h2 className="text-2xl font-black italic uppercase text-indigo-300 tracking-widest border-b-2 border-indigo-500/30 pb-2">Your Prediction History</h2>
              {matches.filter(m => m.status === 'completed').length === 0 ? (
                  <div className="py-20 text-white/20 font-black uppercase text-xs italic tracking-widest">No completed matches in history archives.</div>
              ) : (
                  matches.filter(m => m.status === 'completed').map(match => (
                    <MatchCard 
                      key={match.$id} 
                      matchId={match.$id} 
                      match={match} 
                      user={user} 
                      profile={profile} 
                      logoMap={logoMap}
                    />
                  ))
              )}
          </div>
        ) : (
          (() => {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
            startOfWeek.setHours(0,0,0,0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23,59,59,999);

            const filtered = matches.filter(m => {
              const mDate = new Date(m.startTime);
              if (matchFilter === 'week') {
                const limit = new Date(now);
                limit.setDate(now.getDate() + visibleDays);
                return mDate >= now && mDate <= limit && m.status !== 'completed';
              }
              if (matchFilter === 'upcoming') {
                return m.status !== 'completed';
              }
              if (matchFilter === 'history') {
                return m.status === 'completed';
              }
              return true;
            });

            return (
              <div className="w-full flex flex-col items-center gap-8">
                {filtered.length === 0 ? (
                  <div className="text-indigo-200 uppercase tracking-widest font-black text-xs italic opacity-50 py-20 text-center">
                    No matches found in this sector.<br />Try another filter!
                  </div>
                ) : (
                  filtered.map((match) => (
                    <MatchCard 
                      key={match.$id} 
                      matchId={match.$id} 
                      match={match} 
                      user={user} 
                      profile={profile} 
                      logoMap={logoMap}
                    />
                  ))
                )}
                
                {matchFilter === 'week' && filtered.length > 0 && filtered.length < matches.filter(m => m.status !== 'completed' && new Date(m.startTime) >= now).length && (
                  <button 
                    onClick={() => setVisibleDays(prev => prev + 7)}
                    className="mt-4 px-8 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Load Next Phase +7 Days
                  </button>
                )}
              </div>
            );
          })()
        )}

      </main>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <UsernameModal />
    </div>
  );
}

export default MainApp;
