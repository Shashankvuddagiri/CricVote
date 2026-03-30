import React, { useState, useEffect } from 'react';
import { databases, client } from '../appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PROFILES_ID = import.meta.env.VITE_APPWRITE_PROFILES_ID;

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!DATABASE_ID || !PROFILES_ID || DATABASE_ID === 'your_database_id') return;

    // Initial Fetch
    const fetchLeaderboard = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          PROFILES_ID,
          [Query.orderDesc('points'), Query.limit(50)]
        );
        setUsers(response.documents);
        setLoading(false);
      } catch (err) {
        console.error("Leaderboard fetch failed", err);
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Real-time Update when someone earns points (via Admin update)
    const unsubscribe = client.subscribe(
      [`databases.${DATABASE_ID}.collections.${PROFILES_ID}.documents`],
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*')) {
          fetchLeaderboard(); // Simple refresh for simplicity in Phase 2
        }
      }
    );

    return () => unsubscribe();
  }, []);

  if (DATABASE_ID === 'your_database_id') {
      return (
        <div className="w-full max-w-2xl bg-white/10 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl text-center">
          <p className="text-indigo-200 uppercase tracking-widest font-black text-sm mb-4">Phase 2: Database Mode</p>
          <h2 className="text-2xl font-bold mb-4">Configuration Required</h2>
          <p className="text-indigo-200/70">Please configure your Appwrite Collection IDs in the <code>.env</code> file to enable the live leaderboard.</p>
        </div>
      );
  }

  if (loading) return <div className="text-center p-8 text-indigo-200">Syncing with Arena...</div>;

  return (
    <div className="w-full max-w-2xl bg-white/10 rounded-3xl p-6 backdrop-blur-md border border-white/20 shadow-2xl relative">
      <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 italic uppercase">
        Season Leaderboard
      </h2>
      
      <div className="space-y-3">
        {users.length === 0 ? (
          <p className="text-center text-indigo-200 py-10 opacity-50 uppercase tracking-widest font-bold text-xs italic">
            No warriors have entered the arena yet.
          </p>
        ) : (
          users.map((u, i) => (
            <div key={u.$id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition shadow-lg group">
              <div className="flex items-center gap-4">
                <span className={`font-black text-xl w-6 text-center transition group-hover:scale-110 ${i===0 ? 'text-yellow-400' : i===1 ? 'text-gray-300' : i===2 ? 'text-orange-400' : 'text-indigo-300'}`}>
                  #{i + 1}
                </span>
                
                <div className="w-8 h-8 rounded-full bg-indigo-500/50 flex items-center justify-center font-black text-xs border border-white/20">
                    {u.username.charAt(0).toUpperCase()}
                </div>
                
                <span className="font-bold text-lg">{u.username}</span>
                {i === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/50 uppercase font-black">King</span>}
              </div>
              <span className="font-black text-yellow-400 tracking-tighter">{u.points} PTS</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
