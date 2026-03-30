import React, { useState, useEffect } from 'react';
import { databases, ID, Query } from '../appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const MATCHES_ID = import.meta.env.VITE_APPWRITE_MATCHES_ID;
const PROFILES_ID = import.meta.env.VITE_APPWRITE_PROFILES_ID;

const AdminDashboard = () => {
    const [matches, setMatches] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [filter, setFilter] = useState('all');
    
    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingMatchId, setEditingMatchId] = useState(null);
    const [newMatch, setNewMatch] = useState({
        teamA_name: '', teamA_short: '', teamA_logo: '',
        teamB_name: '', teamB_short: '', teamB_logo: '',
        startTime: '', venue: '', status: 'upcoming'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!DATABASE_ID) return;
        setLoading(true);
        try {
            const [matchRes, profileRes] = await Promise.all([
                databases.listDocuments(DATABASE_ID, MATCHES_ID, [Query.orderDesc('startTime')]),
                databases.listDocuments(DATABASE_ID, PROFILES_ID, [Query.orderDesc('points')])
            ]);
            setMatches(matchRes.documents);
            setProfiles(profileRes.documents);
        } catch (err) {
            console.error("Dashboard Fetch Failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setUpdating('processing');
        try {
            const data = {
                ...newMatch,
                startTime: new Date(newMatch.startTime).toISOString(),
                // Keep votes if editing, otherwise 0
                votesA: editingMatchId ? matches.find(m => m.$id === editingMatchId).votesA : 0,
                votesB: editingMatchId ? matches.find(m => m.$id === editingMatchId).votesB : 0,
            };

            if (editingMatchId) {
                await databases.updateDocument(DATABASE_ID, MATCHES_ID, editingMatchId, data);
                alert("Match updated!");
            } else {
                await databases.createDocument(DATABASE_ID, MATCHES_ID, ID.unique(), data);
                alert("Match created!");
            }

            setShowForm(false);
            setEditingMatchId(null);
            resetForm();
            await fetchData();
        } catch (err) {
            alert("Action Failed: " + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const resetForm = () => {
        setNewMatch({
            teamA_name: '', teamA_short: '', teamA_logo: '',
            teamB_name: '', teamB_short: '', teamB_logo: '',
            startTime: '', venue: '', status: 'upcoming'
        });
    };

    const startEdit = (match) => {
        setNewMatch({
            teamA_name: match.teamA_name, teamA_short: match.teamA_short, teamA_logo: match.teamA_logo,
            teamB_name: match.teamB_name, teamB_short: match.teamB_short, teamB_logo: match.teamB_logo,
            startTime: new Date(match.startTime).toISOString().slice(0, 16),
            venue: match.venue,
            status: match.status
        });
        setEditingMatchId(match.$id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const updateMatchStatus = async (matchId, status, winner = null) => {
        setUpdating(matchId);
        try {
            await databases.updateDocument(DATABASE_ID, MATCHES_ID, matchId, {
                status,
                winner
            });
            await fetchData();
            alert(`Match updated to ${status}.`);
        } catch (err) {
            alert("Update Failed: " + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const filteredMatches = matches.filter(m => filter === 'all' || m.status === filter);

    if (loading) return <div className="p-20 text-center animate-pulse text-yellow-400 font-black italic tracking-widest text-sm uppercase">Synchronizing Arena Intelligence...</div>;

    return (
        <div className="w-full max-w-6xl mx-auto p-4 space-y-10 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-6">
                <div>
                   <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">Arena Command</h1>
                   <p className="text-indigo-300 font-bold uppercase text-[9px] md:text-[10px] tracking-widest mt-1 opacity-50">Master Control Panel</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => { setShowForm(!showForm); if(showForm) setEditingMatchId(null); resetForm(); }} 
                        className={`flex-1 md:flex-none px-4 py-2.5 ${showForm ? 'bg-red-500 hover:bg-red-400' : 'bg-indigo-600 hover:bg-indigo-500'} text-white text-[10px] font-black uppercase rounded-lg transition shadow-lg shrink-0`}
                    >
                        {showForm ? 'Cancel Operation' : 'Add Event +'}
                    </button>
                    <button onClick={fetchData} className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-[10px] font-bold uppercase transition tracking-wider shrink-0">Sync Data</button>
                </div>
            </div>

            {/* Manual Form Area */}
            {showForm && (
                <form onSubmit={handleFormSubmit} className="bg-white/5 border-2 border-indigo-500/20 p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="md:col-span-2 flex justify-between items-center mb-2">
                        <h2 className="text-xl font-black italic uppercase text-white">{editingMatchId ? 'Refining Event Data' : 'Initializing New Arena Event'}</h2>
                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                            {editingMatchId ? 'EDIT MODE' : 'CREATE MODE'}
                        </span>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Team Alpha Configuration</h3>
                        <input required placeholder="Team A Name" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-bold" value={newMatch.teamA_name} onChange={e => setNewMatch({...newMatch, teamA_name: e.target.value})} />
                        <div className="flex gap-2">
                            <input required placeholder="Short" className="w-[80px] bg-black/40 border border-white/10 p-3 rounded-xl text-sm uppercase font-black" value={newMatch.teamA_short} onChange={e => setNewMatch({...newMatch, teamA_short: e.target.value.toUpperCase()})} />
                            <input required placeholder="Logo Vector URL" className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-sm" value={newMatch.teamA_logo} onChange={e => setNewMatch({...newMatch, teamA_logo: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Team Omega Configuration</h3>
                        <input required placeholder="Team B Name" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-bold" value={newMatch.teamB_name} onChange={e => setNewMatch({...newMatch, teamB_name: e.target.value})} />
                        <div className="flex gap-2">
                            <input required placeholder="Short" className="w-[80px] bg-black/40 border border-white/10 p-3 rounded-xl text-sm uppercase font-black" value={newMatch.teamB_short} onChange={e => setNewMatch({...newMatch, teamB_short: e.target.value.toUpperCase()})} />
                            <input required placeholder="Logo Vector URL" className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-sm" value={newMatch.teamB_logo} onChange={e => setNewMatch({...newMatch, teamB_logo: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Arena Metadata</h3>
                        <input required placeholder="Venue Information" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-bold" value={newMatch.venue} onChange={e => setNewMatch({...newMatch, venue: e.target.value})} />
                        <div className="flex gap-2">
                            <input required type="datetime-local" className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-bold" value={newMatch.startTime} onChange={e => setNewMatch({...newMatch, startTime: e.target.value})} />
                            <select className="w-1/3 bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-bold" value={newMatch.status} onChange={e => setNewMatch({...newMatch, status: e.target.value})}>
                                <option value="upcoming">Upcoming</option>
                                <option value="live">Live</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button type="submit" disabled={updating === 'processing'} className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase rounded-2xl shadow-xl shadow-yellow-400/20 transition-all active:scale-95 disabled:opacity-50">
                            {editingMatchId ? 'Commit Changes' : 'Initialize Event'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                        <h2 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest italic">Match Overview</h2>
                        <div className="flex flex-wrap justify-center gap-1.5 p-1 bg-black/40 rounded-xl w-full sm:w-auto">
                            {['all', 'upcoming', 'live', 'completed'].map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => setFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition flex-1 sm:flex-none ${filter === s ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white/5 text-white/40'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Match List */}
                    <div className="space-y-4">
                        {filteredMatches.length === 0 ? (
                            <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center text-white/30 font-bold uppercase text-[10px] tracking-tighter">No Matches Found in current sector</div>
                        ) : filteredMatches.map(m => (
                            <div key={m.$id} className={`bg-white/5 border ${editingMatchId === m.$id ? 'border-yellow-400/50' : 'border-white/10'} p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 transition-all`}>
                                <div className="text-center md:text-left flex-1 min-w-0 w-full">
                                    <div className="flex items-center gap-2 mb-1 justify-center md:justify-start flex-wrap">
                                        <p className="text-[9px] font-black uppercase text-indigo-300 opacity-50 truncate">{m.venue}</p>
                                        <span className={`text-[8px] px-1.5 rounded font-black uppercase ${m.status === 'completed' ? 'bg-green-500/20 text-green-400' : m.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white/40'}`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-black italic tracking-tight mb-0.5">{m.teamA_short} vs {m.teamB_short}</h3>
                                    <p className="text-[9px] md:text-[10px] text-white/30 font-bold">{new Date(m.startTime).toLocaleString()}</p>
                                    
                                    {m.winner && (
                                        <div className="mt-2 inline-flex items-center gap-2 bg-yellow-400 text-black px-2 py-0.5 rounded font-black uppercase text-[9px] tracking-tighter italic">
                                            Victor: {m.winner === 'teamA' ? m.teamA_name : m.teamB_name}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-wrap justify-center gap-2">
                                      <button 
                                          onClick={() => startEdit(m)}
                                          className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition"
                                          title="Modify Match"
                                      >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                      </button>

                                      {m.status !== 'completed' && (
                                          <>
                                            <button 
                                                disabled={updating === m.$id}
                                                onClick={() => updateMatchStatus(m.$id, 'completed', 'teamA')}
                                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg uppercase transition-all"
                                            >
                                                Win {m.teamA_short}
                                            </button>
                                            <button 
                                                disabled={updating === m.$id}
                                                onClick={() => updateMatchStatus(m.$id, 'completed', 'teamB')}
                                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg uppercase transition-all"
                                            >
                                                Win {m.teamB_short}
                                            </button>
                                          </>
                                      )}
                                      
                                      {m.status === 'upcoming' && (
                                            <button 
                                                disabled={updating === m.$id}
                                                onClick={() => updateMatchStatus(m.$id, 'live')}
                                                className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-lg uppercase transition-all shadow-lg shadow-red-600/20"
                                            >
                                                Deploy Live
                                            </button>
                                      )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leaderboard preview (unchanged but stylized) */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black uppercase text-indigo-300 mb-4 italic tracking-widest border-l-4 border-indigo-500 pl-4">Roster</h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left font-bold">
                            <thead className="bg-white/5 text-[9px] font-black uppercase text-indigo-300 border-b border-white/10 tracking-widest">
                                <tr>
                                    <th className="p-4">Handle</th>
                                    <th className="p-4 text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {profiles.map((p, idx) => (
                                    <tr key={p.$id} className="hover:bg-indigo-500/5 transition">
                                        <td className="p-4 text-sm flex items-center gap-2">
                                            <span className="text-[10px] opacity-20 italic">#{idx+1}</span>
                                            {p.username}
                                        </td>
                                        <td className="p-4 text-sm text-right font-black text-yellow-400">{p.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
