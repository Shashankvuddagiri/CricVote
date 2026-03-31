import React, { useState, useEffect } from 'react';
import { databases } from '../appwrite';
import { ID, Query } from 'appwrite';
import ShareCard from './ShareCard';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PREDICTIONS_ID = import.meta.env.VITE_APPWRITE_PREDICTIONS_ID;
const MATCHES_ID = import.meta.env.VITE_APPWRITE_MATCHES_ID;

const MatchCard = ({ match, matchId, user, profile, logoMap = {} }) => {
  const DEFAULT_LOGO = 'https://www.iplt20.com/assets/images/ipl-logo-new-old.png';
  const [timeRemaining, setTimeRemaining] = useState('');
  const [voteStats, setVoteStats] = useState({ totalVotes: 0, votesA: 0, votesB: 0, aPct: 50, bPct: 50 });
  const [hasVoted, setHasVoted] = useState(null); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarriors, setShowWarriors] = useState(false);
  const [warriors, setWarriors] = useState({ teamA: [], teamB: [] });

  useEffect(() => {
    // Check if user already voted in Phase 2
    const checkVoteHistory = async () => {
      if(!user || !DATABASE_ID || !PREDICTIONS_ID) return;
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          PREDICTIONS_ID,
          [Query.equal('userId', [user.$id]), Query.equal('matchId', [matchId])]
        );
        if (response.documents.length > 0) {
          setHasVoted(response.documents[0].predictedWinner);
        }
      } catch (err) {
        console.error("Failed to check vote history", err);
      }
    };
    checkVoteHistory();
  }, [user, matchId]);

  useEffect(() => {
      const totalA = match.votesA || 0;
      const totalB = match.votesB || 0;
      const totalVotes = totalA + totalB;
      
      setVoteStats({
        totalVotes,
        votesA: totalA,
        votesB: totalB,
        aPct: totalVotes === 0 ? 50 : Math.round((totalA / totalVotes) * 100),
        bPct: totalVotes === 0 ? 50 : Math.round((totalB / totalVotes) * 100)
      });
  }, [match]);

  useEffect(() => {
    // Countdown Timer 
    const interval = setInterval(() => {
      const startTime = new Date(match.startTime);
      const diff = startTime - new Date();
      
      if (diff <= 0) {
        setTimeRemaining('Voting Locked');
        clearInterval(interval);
      } else {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        setTimeRemaining(`Locks in ${hours}h ${mins}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [match.startTime]);

  const handleVote = async (team) => {
    if (!user) return alert('Please login to vote!');
    if (hasVoted) return;

    try {
      // 1. Create Prediction document
      await databases.createDocument(
        DATABASE_ID,
        PREDICTIONS_ID,
        ID.unique(),
        {
          userId: user.$id,
          username: profile?.username || user.name || 'Anonymous Warrior',
          matchId: matchId,
          predictedWinner: team
        }
      );

      // 2. Update global vote count for this Match
      const newVotesA = (match.votesA || 0) + (team === 'teamA' ? 1 : 0);
      const newVotesB = (match.votesB || 0) + (team === 'teamB' ? 1 : 0);
      
      await databases.updateDocument(
        DATABASE_ID,
        MATCHES_ID,
        matchId,
        {
          votesA: newVotesA,
          votesB: newVotesB
        }
      );

      setHasVoted(team);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to process vote');
    }
  };

  const startTime = new Date(match.startTime);
  const now = new Date();
  const isMatchToday = startTime.toDateString() === now.toDateString();
  const isStarted = startTime <= now;
  const isCompleted = match.status === 'completed';
  const isLocked = !isMatchToday || isStarted || isCompleted;
  const winner = match.winner; // This would be set by Admin in the dashboard

  const isToday = isMatchToday;

  return (
    <div className={`w-full max-w-2xl ${isToday ? 'bg-indigo-900/40 border-yellow-400/30 shadow-yellow-400/5' : 'bg-white/10 border-white/20'} rounded-3xl p-1 backdrop-blur-md border shadow-2xl relative overflow-hidden group transition-all duration-500`}>
      {isToday && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-1 rounded-b-xl font-black text-[9px] uppercase tracking-widest shadow-lg z-30 animate-pulse">
            🔥 Match of the Day
        </div>
      )}
      <div className="absolute top-0 right-0 p-4 z-20">
        <span className={`${isLocked ? 'bg-gray-600' : 'bg-red-500 animate-pulse'} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg`}>
          {isCompleted ? 'Completed' : isStarted ? 'Live' : isMatchToday ? 'Today' : 'Upcoming'}
        </span>
      </div>

      <div className="bg-gradient-to-b from-indigo-800/80 to-purple-900/90 rounded-[1.35rem] p-4 md:p-8 pb-10 flex flex-col items-center text-center relative z-10">
        <p className="text-indigo-200 text-[10px] md:text-sm font-semibold mb-2 uppercase tracking-widest">{match.venue}</p>
        <h2 className="text-lg md:text-2xl font-bold mb-6 md:mb-8 px-4">{match.teamA_name} vs {match.teamB_name}</h2>

        <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-md mx-auto mb-8 md:mb-10 gap-6 md:gap-0">
          <div className="flex flex-row md:flex-col items-center flex-1 gap-4 md:gap-0 relative group">
            {hasVoted === 'teamA' && (
              <div className="absolute -top-2 -left-2 z-10 bg-yellow-400 text-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-900 animate-in zoom-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            )}
            <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 shadow-lg flex items-center justify-center mb-0 md:mb-3 transition-all duration-500 overflow-hidden ${hasVoted === 'teamA' ? 'border-yellow-400 bg-yellow-400/10 scale-110 shadow-yellow-400/40 ring-4 ring-yellow-400/20' : 'border-white bg-indigo-700/50 grayscale-[0.5] opacity-60'}`}>
              <img 
                src={logoMap[match.teamA_short] || match.teamA_logo || DEFAULT_LOGO} 
                alt={match.teamA_short} 
                onError={(e) => { e.target.src = match.teamA_logo || DEFAULT_LOGO; }}
                className="w-full h-full object-contain p-2" 
              />
            </div>
            <div className="text-left md:text-center mt-2">
              <span className={`block font-black text-lg md:text-xl italic transition-colors ${hasVoted === 'teamA' ? 'text-yellow-400' : 'text-white'}`}>{match.teamA_short}</span>
              {hasVoted === 'teamA' ? (
                <span className="inline-block font-black text-[8px] bg-yellow-400 text-black px-2 py-0.5 rounded-full uppercase tracking-tighter mt-1">Your Selection</span>
              ) : (
                <span className="block font-bold text-xs md:text-sm text-indigo-300">{voteStats.aPct}%</span>
              )}
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center px-4 gap-3 md:gap-0">
            <span className="text-2xl md:text-4xl font-black text-white/50 italic mb-0 md:mb-2 leading-none">VS</span>
            {isMatchToday ? (
                <span className="text-[10px] md:text-sm font-medium bg-white/20 px-3 py-1 rounded-full text-indigo-100 border border-white/10 whitespace-nowrap">{timeRemaining}</span>
            ) : (
                <span className="text-[10px] font-black bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/50 uppercase tracking-widest">
                    {startTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
            )}
          </div>

          <div className="flex flex-row-reverse md:flex-col items-center flex-1 gap-4 md:gap-0 relative group">
            {hasVoted === 'teamB' && (
              <div className="absolute -top-2 -right-2 z-10 bg-yellow-400 text-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-900 animate-in zoom-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            )}
            <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 shadow-lg flex items-center justify-center mb-0 md:mb-3 transition-all duration-500 overflow-hidden ${hasVoted === 'teamB' ? 'border-yellow-400 bg-yellow-400/10 scale-110 shadow-yellow-400/40 ring-4 ring-yellow-400/20' : 'border-white bg-indigo-700/50 grayscale-[0.5] opacity-60'}`}>
              <img 
                src={logoMap[match.teamB_short] || match.teamB_logo || DEFAULT_LOGO} 
                alt={match.teamB_short} 
                onError={(e) => { e.target.src = match.teamB_logo || DEFAULT_LOGO; }}
                className="w-full h-full object-contain p-2" 
              />
            </div>
            <div className="text-right md:text-center mt-2">
               <span className={`block font-black text-lg md:text-xl italic transition-colors ${hasVoted === 'teamB' ? 'text-yellow-400' : 'text-white'}`}>{match.teamB_short}</span>
               {hasVoted === 'teamB' ? (
                 <span className="inline-block font-black text-[8px] bg-yellow-400 text-black px-2 py-0.5 rounded-full uppercase tracking-tighter mt-1">Your Selection</span>
               ) : (
                 <span className="block font-bold text-xs md:text-sm text-indigo-300">{voteStats.bPct}%</span>
               )}
            </div>
          </div>
        </div>

        {/* Community Pulse Section */}
        <div className="w-full flex justify-between items-end mb-1 px-1">
             <span className="text-[9px] font-black uppercase text-blue-400 tracking-tighter">{(voteStats.votesA || 0).toLocaleString()} Votes</span>
             <span className="text-[10px] font-black italic uppercase text-white/40 tracking-widest">Arena Pulse</span>
             <span className="text-[9px] font-black uppercase text-yellow-400 tracking-tighter">{(voteStats.votesB || 0).toLocaleString()} Votes</span>
        </div>

        {/* Voting Progress Bar */}
        <div className="w-full max-w-sm h-3 rounded-full bg-white/5 overflow-hidden mb-6 flex border border-white/5 shadow-inner">
           <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000 ease-out shadow-xl" style={{width: `${voteStats.aPct}%`}}></div>
           <div className="h-full bg-gradient-to-l from-yellow-500 to-orange-400 transition-all duration-1000 ease-out shadow-xl" style={{width: `${voteStats.bPct}%`}}></div>
        </div>

        <div className="w-full">
          {isCompleted && (
            <div className="w-full mb-6">
                <button 
                  onClick={async () => {
                    if (!showWarriors) {
                        try {
                            const res = await databases.listDocuments(DATABASE_ID, PREDICTIONS_ID, [Query.equal('matchId', [matchId])]);
                            const a = res.documents.filter(d => d.predictedWinner === 'teamA').map(d => d.username);
                            const b = res.documents.filter(d => d.predictedWinner === 'teamB').map(d => d.username);
                            setWarriors({ teamA: a, teamB: b });
                        } catch (err) { console.error(err); }
                    }
                    setShowWarriors(!showWarriors);
                  }}
                  className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    {showWarriors ? 'Conceal Warriors' : 'See the Warriors'}
                </button>
                
                {showWarriors && (
                    <div className="mt-4 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-2xl">
                            <h4 className="text-[8px] font-black uppercase text-blue-400 mb-2 border-b border-blue-500/10 pb-1">The {match.teamA_short} Battalion</h4>
                            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto no-scrollbar">
                                {warriors.teamA.length > 0 ? warriors.teamA.map((w, idx) => (
                                    <span key={idx} className="text-[10px] font-bold text-white/50 truncate">⚔️ {w}</span>
                                )) : <span className="text-[8px] text-white/20 italic">No warriors signed</span>}
                            </div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-2xl">
                             <h4 className="text-[8px] font-black uppercase text-yellow-400 mb-2 border-b border-yellow-500/10 pb-1">The {match.teamB_short} Legion</h4>
                             <div className="flex flex-col gap-1 max-h-32 overflow-y-auto no-scrollbar">
                                {warriors.teamB.length > 0 ? warriors.teamB.map((w, idx) => (
                                    <span key={idx} className="text-[10px] font-bold text-white/50 truncate">🛡️ {w}</span>
                                )) : <span className="text-[8px] text-white/20 italic">No warriors signed</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
          )}

          {!isMatchToday && !isCompleted ? (
              <div className="py-4 bg-white/5 border border-white/10 rounded-xl text-indigo-200 font-bold uppercase tracking-widest text-sm italic">
                  Voting opens on {startTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
          ) : (
            <div className="w-full">
                {hasVoted ? (
                    <div className="py-4 bg-green-500/10 border border-green-500/30 rounded-xl flex flex-col items-center animate-in zoom-in duration-300">
                        <span className="text-green-400 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                             Prediction Locked
                        </span>
                        {showSuccess && <span className="text-[10px] text-white/50 font-bold mt-1">Arena Intelligence Synchronized!</span>}
                        
                        <div className="mt-4 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-tighter text-indigo-100 flex items-center gap-2 mb-2">
                            <span>Predicted Winner: </span>
                            <span className={hasVoted === 'teamA' ? 'text-blue-400' : 'text-yellow-400'}>{hasVoted === 'teamA' ? match.teamA_short : match.teamB_short}</span>
                            {isCompleted && (
                                <span className={`ml-2 px-1.5 rounded transition ${match.winner === hasVoted ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-red-500 text-white'}`}>
                                    {match.winner === hasVoted ? '+1 GOLD' : 'DEFEAT'}
                                </span>
                            )}
                        </div>

                        <ShareCard match={match} prediction={hasVoted} username={profile?.username || user?.name || 'Warrior'} />
                    </div>
                ) : (
                    <div className="flex gap-4 w-full">
                        <button 
                        onClick={() => handleVote('teamA')}
                        disabled={isLocked}
                        className={`flex-1 py-4 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 ${isLocked ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                        >
                        Vote {match.teamA_short || 'A'}
                        </button>
                        <button 
                        onClick={() => handleVote('teamB')}
                        disabled={isLocked}
                        className={`flex-1 py-4 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 ${isLocked ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}
                        >
                        Vote {match.teamB_short || 'B'}
                        </button>
                    </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
