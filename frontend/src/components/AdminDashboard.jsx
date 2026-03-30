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
    const [adminView, setAdminView] = useState('matches'); // 'matches', 'players', 'logos'
    const [logos, setLogos] = useState([]);
    const [newLogo, setNewLogo] = useState({ teamShort: '', logoUrl: '' });
    
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
            const LOGOS_ID = import.meta.env.VITE_APPWRITE_LOGOS_ID || 'logos';
            const [matchRes, profileRes, logoRes] = await Promise.all([
                databases.listDocuments(DATABASE_ID, MATCHES_ID, [Query.orderDesc('startTime'), Query.limit(100)]),
                databases.listDocuments(DATABASE_ID, PROFILES_ID, [Query.orderDesc('points'), Query.limit(100)]),
                databases.listDocuments(DATABASE_ID, LOGOS_ID).catch(() => ({ documents: [] }))
            ]);
            setMatches(matchRes.documents);
            setProfiles(profileRes.documents);
            setLogos(logoRes.documents);
        } catch (err) {
            console.error("Dashboard Fetch Failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoSubmit = async (e) => {
        e.preventDefault();
        setUpdating('logo');
        try {
            const LOGOS_ID = import.meta.env.VITE_APPWRITE_LOGOS_ID || 'logos';
            await databases.createDocument(DATABASE_ID, LOGOS_ID, ID.unique(), {
                teamShort: newLogo.teamShort.toUpperCase(),
                logoUrl: newLogo.logoUrl
            });
            setNewLogo({ teamShort: '', logoUrl: '' });
            await fetchData();
            alert("Logo mapped successfully!");
        } catch (err) {
            alert("Logo Mapping Failed: " + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const deleteLogo = async (id) => {
        if (!window.confirm("Delete this logo mapping?")) return;
        setUpdating(id);
        try {
            const LOGOS_ID = import.meta.env.VITE_APPWRITE_LOGOS_ID || 'logos';
            await databases.deleteDocument(DATABASE_ID, LOGOS_ID, id);
            await fetchData();
        } catch (err) {
            alert("Deletion Failed: " + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const bulkImportLogos = async () => {
        if (!window.confirm("Initialize all 10 IPL 2026 Team Logos? (This will skip existing maps)")) return;
        setUpdating('bulk');
        try {
            const LOGOS_ID = import.meta.env.VITE_APPWRITE_LOGOS_ID || 'logos';
            const iplTeams = [
                { s: 'CSK', l: 'https://documents.iplt20.com/ipl/CSK/logos/Logooutline/CSKoutline.png' },
                { s: 'MI', l: 'https://documents.iplt20.com/ipl/MI/Logos/Logooutline/MIoutline.png' },
                { s: 'RCB', l: 'https://documents.iplt20.com/ipl/RCB/Logos/Logooutline/RCBoutline.png' },
                { s: 'KKR', l: 'https://documents.iplt20.com/ipl/KKR/Logos/Logooutline/KKRoutline.png' },
                { s: 'GT', l: 'https://documents.iplt20.com/ipl/GT/Logos/Logooutline/GToutline.png' },
                { s: 'LSG', l: 'https://documents.iplt20.com/ipl/LSG/Logos/Logooutline/LSGoutline.png' },
                { s: 'DC', l: 'https://documents.iplt20.com/ipl/DC/Logos/LogoOutline/DCoutline.png' },
                { s: 'PBKS', l: 'https://documents.iplt20.com/ipl/PBKS/Logos/Logooutline/PBKSoutline.png' },
                { s: 'RR', l: 'https://documents.iplt20.com/ipl/RR/Logos/Logooutline/RRoutline.png' },
                { s: 'SRH', l: 'https://documents.iplt20.com/ipl/SRH/Logos/Logooutline/SRHoutline.png' }
            ];

            for (const team of iplTeams) {
                const existing = logos.find(l => l.teamShort === team.s);
                if (existing) {
                    // Update existing broken link
                    await databases.updateDocument(DATABASE_ID, LOGOS_ID, existing.$id, {
                        logoUrl: team.l
                    });
                } else {
                    // Create new
                    await databases.createDocument(DATABASE_ID, LOGOS_ID, ID.unique(), {
                        teamShort: team.s,
                        logoUrl: team.l
                    });
                }
            }
            await fetchData();
            alert("IPL 2026 Branding Sync Complete!");
        } catch (err) {
            alert("Bulk Import Failed: " + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const updatePoints = async (userId, newPoints) => {
        setUpdating(userId);
        try {
            await databases.updateDocument(DATABASE_ID, PROFILES_ID, userId, {
                points: parseInt(newPoints)
            });
            await fetchData();
            alert("Points updated successfully!");
        } catch (err) {
            alert("Update Failed: " + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const handleManualVote = async (userId, matchId, team) => {
        setUpdating('vote-' + userId);
        try {
            const PREDICTIONS_ID = import.meta.env.VITE_APPWRITE_PREDICTIONS_ID;
            
            // 1. Create Prediction
            await databases.createDocument(DATABASE_ID, PREDICTIONS_ID, ID.unique(), {
                userId,
                matchId,
                predictedWinner: team,
                adminSource: true
            });

            // 2. Update Match Count
            const match = matches.find(m => m.$id === matchId);
            await databases.updateDocument(DATABASE_ID, MATCHES_ID, matchId, {
                votesA: match.votesA + (team === 'teamA' ? 1 : 0),
                votesB: match.votesB + (team === 'teamB' ? 1 : 0)
            });

            alert("Manual vote recorded!");
            await fetchData();
        } catch (err) {
            alert("Vote Failed: " + err.message);
        } finally {
            setUpdating(null);
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

    const deleteMatch = async (id) => {
        if (!window.confirm("Permanently remove this match from the arena?")) return;
        setUpdating(id);
        try {
            await databases.deleteDocument(DATABASE_ID, MATCHES_ID, id);
            await fetchData();
            alert("Match removed.");
        } catch (err) {
            alert("Deletion Failed: " + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const updateMatchStatus = async (matchId, status, winner = null) => {
        setUpdating(matchId);
        try {
            // 1. Update Match status & winner first
            await databases.updateDocument(DATABASE_ID, MATCHES_ID, matchId, {
                status,
                winner,
                pointsDistributed: status === 'completed' // Consider points distributed if done manually too
            });

            // 2. If completing a match with a winner, distribute points!
            if (status === 'completed' && winner) {
                console.log(`--- STARTING POINT DISTRIBUTION FOR WINNER: ${winner} ---`);
                
                // Fetch all predictions for this match
                const { Query } = await import('appwrite');
                const predRes = await databases.listDocuments(DATABASE_ID, PREDICTIONS_ID, [
                    Query.equal('matchId', matchId),
                    Query.equal('team', winner)
                ]);

                console.log(`Found ${predRes.total} winners to reward!`);

                // Iterate and award points (Manual loop for safety)
                for (const pred of predRes.documents) {
                    try {
                        const userProfile = profiles.find(p => p.username === pred.username);
                        if (userProfile) {
                            await databases.updateDocument(DATABASE_ID, PROFILES_ID, userProfile.$id, {
                                points: (userProfile.points || 0) + 1
                            });
                        }
                    } catch (pErr) {
                        console.error(`Failed to reward ${pred.username}:`, pErr);
                    }
                }
                alert(`Victory Points distributed to ${predRes.total} warriors!`);
            } else {
                alert(`Match status updated to ${status}.`);
            }

            await fetchData();
        } catch (err) {
            alert("Administrative Error: " + err.message);
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
                    <div className="flex bg-black/40 p-1 rounded-xl mr-2">
                        <button onClick={() => setAdminView('matches')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition ${adminView === 'matches' ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white/60'}`}>Matches</button>
                        <button onClick={() => setAdminView('players')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition ${adminView === 'players' ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white/60'}`}>Players</button>
                        <button onClick={() => setAdminView('logos')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition ${adminView === 'logos' ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white/60'}`}>Logos</button>
                    </div>
                    {adminView === 'matches' && (
                        <button 
                            onClick={() => { setShowForm(!showForm); if(showForm) setEditingMatchId(null); resetForm(); }} 
                            className={`flex-1 md:flex-none px-4 py-2.5 ${showForm ? 'bg-red-500 hover:bg-red-400' : 'bg-indigo-600 hover:bg-indigo-500'} text-white text-[10px] font-black uppercase rounded-lg transition shadow-lg shrink-0`}
                        >
                            {showForm ? 'Cancel Operation' : 'Add Event +'}
                        </button>
                    )}
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

            {adminView === 'matches' ? (
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
                                        {m.pointsDistributed && (
                                            <div className="mt-2 ml-2 inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-black uppercase text-[8px] tracking-widest">
                                               Referee Points Deployed 🛡️
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
                                          <button 
                                              disabled={updating === m.$id || m.pointsDistributed}
                                              onClick={() => deleteMatch(m.$id)}
                                              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition disabled:opacity-20"
                                              title="Delete Duplicate"
                                          >
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                          </button>
                                          {m.status !== 'completed' && !m.pointsDistributed && (
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
                        <h2 className="text-xl font-black uppercase text-indigo-300 mb-4 italic tracking-widest border-l-4 border-indigo-500 pl-4">Roster Preview</h2>
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
            ) : adminView === 'logos' ? (
                <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/10">
                        <div>
                           <h2 className="text-sm font-black italic uppercase text-indigo-300 tracking-widest">Branding Engine</h2>
                           <p className="text-[9px] font-bold text-white/30 uppercase">Map shortcodes to premium URLs</p>
                        </div>
                    <button 
                        disabled={updating === 'bulk'}
                        onClick={bulkImportLogos}
                        className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase rounded-xl transition shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2 border border-indigo-400/30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
                        Nuclear Branding Repair (Sync Logos)
                    </button>
                    </div>

                    <form onSubmit={handleLogoSubmit} className="bg-white/5 border border-indigo-500/20 p-8 rounded-3xl flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Team Shortcode (e.g. CSK)</label>
                            <input required placeholder="CSK" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-black uppercase" value={newLogo.teamShort} onChange={e => setNewLogo({...newLogo, teamShort: e.target.value})} />
                        </div>
                        <div className="flex-[2] space-y-2">
                            <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Logo URL (Vector/PNG preferred)</label>
                            <input required placeholder="https://..." className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm" value={newLogo.logoUrl} onChange={e => setNewLogo({...newLogo, logoUrl: e.target.value})} />
                        </div>
                        <button type="submit" disabled={updating === 'logo'} className="px-8 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase rounded-xl transition shadow-xl shadow-yellow-400/10">
                            Save Map
                        </button>
                    </form>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {logos.map((l) => (
                            <div key={l.$id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-3 relative group">
                                <button onClick={() => deleteLogo(l.$id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">×</button>
                                <div className="w-16 h-16 bg-white/5 rounded-full p-2 flex items-center justify-center border border-white/10">
                                    <img 
                                        src={l.logoUrl} 
                                        alt={l.teamShort} 
                                        className="w-full h-full object-contain" 
                                        onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Logo.svg/1200px-Indian_Premier_League_Logo.svg.png'; }}
                                    />
                                </div>
                                <span className="font-black text-indigo-300 text-xs tracking-widest">{l.teamShort}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profiles.map((p) => (
                            <div key={p.$id} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-black text-xs border border-indigo-500/30">
                                            {p.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white">{p.username}</h3>
                                            <p className="text-[10px] text-white/40 font-bold uppercase">{p.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-yellow-400 font-black text-xl">{p.points}</span>
                                        <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">RANK SCORE</p>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4 border-t border-white/10">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-indigo-300 tracking-widest ml-1">Point Correction</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" 
                                                defaultValue={p.points} 
                                                id={`points-${p.$id}`}
                                                className="flex-1 bg-black/60 border border-white/10 p-2.5 rounded-xl text-sm font-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                            />
                                            <button 
                                                onClick={() => updatePoints(p.$id, document.getElementById(`points-${p.$id}`).value)}
                                                disabled={updating === p.$id}
                                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase rounded-xl transition shadow-lg shrink-0 active:scale-95"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-4 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black uppercase text-indigo-300 tracking-widest">Prediction Injection</p>
                                            <span className="text-[8px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30 font-black uppercase">Admin Only</span>
                                        </div>
                                        <select id={`match-${p.$id}`} className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-[10px] font-bold outline-none">
                                            {matches.filter(m => m.status === 'upcoming' || m.status === 'live').map(m => (
                                                <option key={m.$id} value={m.$id}>{m.teamA_short} vs {m.teamB_short}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    const matchId = document.getElementById(`match-${p.$id}`).value;
                                                    handleManualVote(p.$id, matchId, 'teamA');
                                                }}
                                                className="flex-1 bg-white/5 hover:bg-blue-600 py-3 rounded-xl text-[9px] font-black uppercase transition active:scale-95 border border-white/10"
                                            >
                                                Cast: A
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const matchId = document.getElementById(`match-${p.$id}`).value;
                                                    handleManualVote(p.$id, matchId, 'teamB');
                                                }}
                                                className="flex-1 bg-white/5 hover:bg-yellow-500 hover:text-black py-3 rounded-xl text-[9px] font-black uppercase transition active:scale-95 border border-white/10"
                                            >
                                                Cast: B
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
