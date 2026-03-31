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
    const [showWarriors, setShowWarriors] = useState({}); // matchId -> boolean
    const [warriorsByMatch, setWarriorsByMatch] = useState({}); // matchId -> {teamA: [], teamB: []}
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
        if (!window.confirm("Initialize all 10 IPL 2026 Team Logos with HD CDN links?")) return;
        setUpdating('bulk');
        try {
            const LOGOS_ID = import.meta.env.VITE_APPWRITE_LOGOS_ID || 'logos';
            const iplTeams = [
                { s: 'CSK', l: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/CSK.png' },
                { s: 'MI', l: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/MI.png' },
                { s: 'RCB', l: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/RCB.png' },
                { s: 'KKR', l: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/KKR.png' },
                { s: 'GT', l: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/GT.png' },
                { s: 'LSG', l: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/LSG.png' },
                { s: 'DC', l: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/DC.png' },
                { s: 'PBKS', l: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/PBKS.png' },
                { s: 'RR', l: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/RR.png' },
                { s: 'SRH', l: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/SRH.png' }
            ];

            for (const team of iplTeams) {
                const existing = logos.find(l => l.teamShort === team.s);
                if (existing) {
                    await databases.updateDocument(DATABASE_ID, LOGOS_ID, existing.$id, {
                        logoUrl: team.l
                    });
                } else {
                    await databases.createDocument(DATABASE_ID, LOGOS_ID, ID.unique(), {
                        teamShort: team.s,
                        logoUrl: team.l
                    });
                }
            }
            await fetchData();
            alert("IPL 2026 HD Branding Sync Complete!");
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
            await databases.createDocument(DATABASE_ID, PREDICTIONS_ID, ID.unique(), {
                userId,
                matchId,
                predictedWinner: team
            });

            const match = matches.find(m => m.$id === matchId);
            await databases.updateDocument(DATABASE_ID, MATCHES_ID, matchId, {
                votesA: (match.votesA || 0) + (team === 'teamA' ? 1 : 0),
                votesB: (match.votesB || 0) + (team === 'teamB' ? 1 : 0)
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
                votesA: editingMatchId ? matches.find(m => m.$id === editingMatchId).votesA : 0,
                votesB: editingMatchId ? matches.find(m => m.$id === editingMatchId).votesB : 0,
            };

            if (editingMatchId) {
                await databases.updateDocument(DATABASE_ID, MATCHES_ID, editingMatchId, data);
            } else {
                await databases.createDocument(DATABASE_ID, MATCHES_ID, ID.unique(), data);
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
        if (!window.confirm("Permanently remove this match?")) return;
        setUpdating(id);
        try {
            await databases.deleteDocument(DATABASE_ID, MATCHES_ID, id);
            await fetchData();
        } catch (err) {
            alert("Deletion Failed: " + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const updateMatchStatus = async (matchId, status, winner = null) => {
        const confirmMsg = status === 'completed' 
            ? `FORCE settle match for ${winner === 'teamA' ? 'TEAM A' : 'TEAM B'}? This will distribute points!` 
            : `Set match to ${status}?`;
        if (!window.confirm(confirmMsg)) return;

        setUpdating(matchId);
        try {
            const PREDICTIONS_ID = import.meta.env.VITE_APPWRITE_PREDICTIONS_ID;
            
            await databases.updateDocument(DATABASE_ID, MATCHES_ID, matchId, {
                status,
                winner,
                pointsDistributed: status === 'completed'
            });

            if (status === 'completed' && winner) {
                const predRes = await databases.listDocuments(DATABASE_ID, PREDICTIONS_ID, [
                    Query.equal('matchId', matchId),
                    Query.equal('predictedWinner', winner)
                ]);

                for (const pred of predRes.documents) {
                    try {
                        const userProfile = profiles.find(p => p.$id === pred.userId);
                        if (userProfile) {
                            await databases.updateDocument(DATABASE_ID, PROFILES_ID, userProfile.$id, {
                                points: (userProfile.points || 0) + 1
                            });
                        }
                    } catch (pErr) {
                        console.error(`Failed to reward ${pred.userId}:`, pErr);
                    }
                }
                alert(`SUCCESS: Victory Points distributed to ${predRes.total} winners!`);
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

    const syncMatchCounts = async (matchId) => {
        setUpdating(matchId);
        try {
            const PREDICTIONS_ID = import.meta.env.VITE_APPWRITE_PREDICTIONS_ID;
            const res = await databases.listDocuments(DATABASE_ID, PREDICTIONS_ID, [
                Query.equal('matchId', matchId),
                Query.limit(100)
            ]);
            const warriorsA = [...new Set(res.documents.filter(d => d.predictedWinner === 'teamA' && d.username).map(d => d.username))];
            const warriorsB = [...new Set(res.documents.filter(d => d.predictedWinner === 'teamB' && d.username).map(d => d.username))];
            await databases.updateDocument(DATABASE_ID, MATCHES_ID, matchId, { votesA: warriorsA.length, votesB: warriorsB.length });
            await fetchData();
            alert(`Arena Aligned! A: ${warriorsA.length}, B: ${warriorsB.length}`);
        } catch (err) { alert(err.message); }
        finally { setUpdating(null); }
    };

    const syncAllMatchCounts = async () => {
        if (!window.confirm("Nuclear Alignment for ALL matches?")) return;
        setUpdating('nuclear');
        try {
            for (const m of matches) {
                const PREDICTIONS_ID = import.meta.env.VITE_APPWRITE_PREDICTIONS_ID;
                const res = await databases.listDocuments(DATABASE_ID, PREDICTIONS_ID, [Query.equal('matchId', m.$id), Query.limit(100)]);
                const warriorsA = [...new Set(res.documents.filter(d => d.predictedWinner === 'teamA' && d.username).map(d => d.username))];
                const warriorsB = [...new Set(res.documents.filter(d => d.predictedWinner === 'teamB' && d.username).map(d => d.username))];
                await databases.updateDocument(DATABASE_ID, MATCHES_ID, m.$id, { votesA: warriorsA.length, votesB: warriorsB.length });
            }
            alert("Nuclear alignment complete!");
            await fetchData();
        } catch (err) { alert(err.message); }
        finally { setUpdating(null); }
    };

    const draftWarrior = async (matchId, team) => {
        const name = window.prompt(`Draft manual warrior for ${team === 'teamA' ? 'Battalion' : 'Legion'}:`);
        if (!name) return;
        setUpdating(matchId);
        try {
            const PREDICTIONS_ID = import.meta.env.VITE_APPWRITE_PREDICTIONS_ID;
            await databases.createDocument(DATABASE_ID, PREDICTIONS_ID, ID.unique(), {
                matchId,
                predictedWinner: team,
                username: name,
                userId: 'manual-' + ID.unique()
            });
            await syncMatchCounts(matchId);
        } catch (err) { alert(err.message); }
        finally { setUpdating(null); }
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
                        <button onClick={() => { setShowForm(!showForm); if(showForm) setEditingMatchId(null); resetForm(); }} className={`flex-1 md:flex-none px-4 py-2.5 ${showForm ? 'bg-red-500' : 'bg-indigo-600'} text-white text-[10px] font-black uppercase rounded-lg transition shadow-lg`}>
                            {showForm ? 'Cancel' : 'Add Event +'}
                        </button>
                    )}
                    <button onClick={syncAllMatchCounts} disabled={updating === 'nuclear'} className="flex-1 md:flex-none px-4 py-2.5 bg-yellow-400/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-[10px] font-black uppercase transition tracking-widest">Nuclear Alignment 🛰️</button>
                    <button onClick={fetchData} className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase transition tracking-wider">Sync Data</button>
                </div>
            </div>

            {/* Manual Form Area */}
            {showForm && (
                <form onSubmit={handleFormSubmit} className="bg-white/5 border-2 border-indigo-500/20 p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    <div className="md:col-span-2"><h2 className="text-xl font-black italic uppercase text-white">{editingMatchId ? 'Refining Event' : 'Initializting Event'}</h2></div>
                    <div className="space-y-4">
                        <input required placeholder="Team A Name" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-bold" value={newMatch.teamA_name} onChange={e => setNewMatch({...newMatch, teamA_name: e.target.value})} />
                        <div className="flex gap-2">
                            <input required placeholder="Short" className="w-[80px] bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-black" value={newMatch.teamA_short} onChange={e => setNewMatch({...newMatch, teamA_short: e.target.value.toUpperCase()})} />
                            <input required placeholder="Logo URL" className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-sm" value={newMatch.teamA_logo} onChange={e => setNewMatch({...newMatch, teamA_logo: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <input required placeholder="Team B Name" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-bold" value={newMatch.teamB_name} onChange={e => setNewMatch({...newMatch, teamB_name: e.target.value})} />
                        <div className="flex gap-2">
                            <input required placeholder="Short" className="w-[80px] bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-black" value={newMatch.teamB_short} onChange={e => setNewMatch({...newMatch, teamB_short: e.target.value.toUpperCase()})} />
                            <input required placeholder="Logo URL" className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-sm" value={newMatch.teamB_logo} onChange={e => setNewMatch({...newMatch, teamB_logo: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <input required placeholder="Venue" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-bold" value={newMatch.venue} onChange={e => setNewMatch({...newMatch, venue: e.target.value})} />
                        <div className="flex gap-2">
                            <input required type="datetime-local" className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-bold" value={newMatch.startTime} onChange={e => setNewMatch({...newMatch, startTime: e.target.value})} />
                            <select className="w-1/3 bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-bold" value={newMatch.status} onChange={e => setNewMatch({...newMatch, status: e.target.value})}>
                                <option value="upcoming">Upcoming</option>
                                <option value="live">Live</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-end"><button type="submit" disabled={updating === 'processing'} className="w-full py-4 bg-yellow-400 text-black font-black uppercase rounded-2xl shadow-xl">{editingMatchId ? 'Update' : 'Initialize'}</button></div>
                </form>
            )}

            {adminView === 'matches' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                            <h2 className="text-[10px] font-black uppercase text-indigo-300">Sector Selector</h2>
                            <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
                                {['all', 'upcoming', 'live', 'completed'].map(s => (
                                    <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition ${filter === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40'}`}>{s}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            {filteredMatches.map(m => (
                                <div key={m.$id} className={`bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6`}>
                                    <div className="flex-1 w-full text-center md:text-left">
                                        <p className="text-[9px] font-black uppercase text-indigo-300 opacity-50 mb-1">{m.venue} • {m.status}</p>
                                        <h3 className="text-xl font-black italic">{m.teamA_short} vs {m.teamB_short}</h3>
                                        <div className="mt-4 border-t border-white/5 pt-4">
                                            <button onClick={async () => {
                                                if (!showWarriors[m.$id]) {
                                                    const res = await databases.listDocuments(DATABASE_ID, import.meta.env.VITE_APPWRITE_PREDICTIONS_ID, [Query.equal('matchId', [m.$id])]);
                                                    const a = res.documents.filter(d => d.predictedWinner === 'teamA').map(d => ({ id: d.$id, name: d.username || `Anon #${d.$id.slice(-4)}` }));
                                                    const b = res.documents.filter(d => d.predictedWinner === 'teamB').map(d => ({ id: d.$id, name: d.username || `Anon #${d.$id.slice(-4)}` }));
                                                    setWarriorsByMatch(prev => ({ ...prev, [m.$id]: { teamA: a, teamB: b } }));
                                                }
                                                setShowWarriors(prev => ({ ...prev, [m.$id]: !prev[m.$id] }));
                                            }} className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300">
                                                {showWarriors[m.$id] ? 'Conceal Pulse' : 'View Arena Pulse'}
                                            </button>
                                            {showWarriors[m.$id] && warriorsByMatch[m.$id] && (
                                                <div className="mt-3 grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between border-b border-blue-400/20 pb-1 mb-1 items-center">
                                                            <p className="font-black text-blue-400 text-[8px] uppercase">{m.teamA_short} Battalion</p>
                                                            <button onClick={() => draftWarrior(m.$id, 'teamA')} className="text-[7px] font-black text-indigo-300 uppercase">Draft ✙</button>
                                                        </div>
                                                        {warriorsByMatch[m.$id].teamA.map(w => (
                                                            <div key={w.id} className="flex justify-between group text-indigo-100 font-bold text-[10px] p-1 h-6 items-center">
                                                                <span className="truncate">⚔️ {w.name}</span>
                                                                <button onClick={async () => { if(window.confirm('Delete?')) { await databases.deleteDocument(DATABASE_ID, import.meta.env.VITE_APPWRITE_PREDICTIONS_ID, w.id); alert('Pruned!'); syncMatchCounts(m.$id); } }} className="opacity-0 group-hover:opacity-100 text-red-500">×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between border-b border-yellow-400/20 pb-1 mb-1 items-center">
                                                            <p className="font-black text-yellow-500 text-[8px] uppercase">{m.teamB_short} Legion</p>
                                                            <button onClick={() => draftWarrior(m.$id, 'teamB')} className="text-[7px] font-black text-indigo-300 uppercase">Draft ✙</button>
                                                        </div>
                                                        {warriorsByMatch[m.$id].teamB.map(w => (
                                                            <div key={w.id} className="flex justify-between group text-indigo-100 font-bold text-[10px] p-1 h-6 items-center">
                                                                <span className="truncate">🛡️ {w.name}</span>
                                                                <button onClick={async () => { if(window.confirm('Delete?')) { await databases.deleteDocument(DATABASE_ID, import.meta.env.VITE_APPWRITE_PREDICTIONS_ID, w.id); alert('Pruned!'); syncMatchCounts(m.$id); } }} className="opacity-0 group-hover:opacity-100 text-red-500">×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <div className="flex bg-black/40 p-1 rounded-xl gap-2">
                                            <button onClick={() => updateMatchStatus(m.$id, 'completed', 'teamA')} className="px-3 py-2 bg-indigo-600 text-white text-[9px] font-black rounded-lg uppercase">Force {m.teamA_short}</button>
                                            <button onClick={() => updateMatchStatus(m.$id, 'completed', 'teamB')} className="px-3 py-2 bg-indigo-600 text-white text-[9px] font-black rounded-lg uppercase">Force {m.teamB_short}</button>
                                        </div>
                                        <button onClick={() => syncMatchCounts(m.$id)} className="p-2.5 bg-yellow-400/10 text-yellow-500 border border-yellow-500/20 rounded-lg">🧩</button>
                                        <button onClick={() => startEdit(m)} className="p-2.5 bg-white/5 text-white rounded-lg transition">Edit</button>
                                        <button onClick={() => deleteMatch(m.$id)} className="p-2.5 bg-red-500/10 text-red-400 rounded-lg transition">×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* ... (Roster remains the same, simplified but functional) ... */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-black uppercase text-indigo-300 italic border-l-4 border-indigo-500 pl-4">Roster</h2>
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-y-auto max-h-[600px]">
                            {profiles.map(p => (
                                <div key={p.$id} className="p-4 border-b border-white/5 flex justify-between items-center group">
                                    <div className="text-sm font-bold">{p.username} <span className="text-yellow-400 font-black">[{p.points}]</span></div>
                                    <button onClick={async () => { if(window.confirm('Banish?')) { await databases.deleteDocument(DATABASE_ID, PROFILES_ID, p.$id); fetchData(); } }} className="opacity-0 group-hover:opacity-100 text-red-500 text-lg">×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : adminView === 'logos' ? (
                <div className="space-y-10">
                    <button onClick={bulkImportLogos} className="px-6 py-3 bg-indigo-600 text-[10px] font-black uppercase rounded-xl">HD Branding Sync 🛰️</button>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {logos.map(l => (
                            <div key={l.$id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-3 relative group">
                                <button onClick={() => deleteLogo(l.$id)} className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 text-red-500">×</button>
                                <img src={l.logoUrl} className="w-12 h-12 object-contain" alt={l.teamShort} />
                                <span className="font-black text-[10px] text-indigo-300">{l.teamShort}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default AdminDashboard;
