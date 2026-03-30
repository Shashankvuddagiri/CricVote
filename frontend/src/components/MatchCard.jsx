import React, { useState, useEffect } from 'react';
import { databases } from '../appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PREDICTIONS_ID = import.meta.env.VITE_APPWRITE_PREDICTIONS_ID;
const MATCHES_ID = import.meta.env.VITE_APPWRITE_MATCHES_ID;

const MatchCard = ({ match, matchId, user }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [voteStats, setVoteStats] = useState({ totalVotes: 0, aPct: 50, bPct: 50 });
  const [hasVoted, setHasVoted] = useState(null); 
  const [showSuccess, setShowSuccess] = useState(false);

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

  return (
    <div className="w-full max-w-2xl bg-white/10 rounded-3xl p-1 backdrop-blur-md border border-white/20 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 z-20">
        <span className={`${isLocked ? 'bg-gray-600' : 'bg-red-500 animate-pulse'} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg`}>
          {isCompleted ? 'Completed' : isStarted ? 'Live' : isMatchToday ? 'Today' : 'Upcoming'}
        </span>
      </div>

      <div className="bg-gradient-to-b from-indigo-800/80 to-purple-900/90 rounded-[1.35rem] p-4 md:p-8 pb-10 flex flex-col items-center text-center relative z-10">
        <p className="text-indigo-200 text-[10px] md:text-sm font-semibold mb-2 uppercase tracking-widest">{match.venue}</p>
        <h2 className="text-lg md:text-2xl font-bold mb-6 md:mb-8 px-4">{match.teamA_name} vs {match.teamB_name}</h2>

        <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-md mx-auto mb-8 md:mb-10 gap-6 md:gap-0">
          <div className="flex flex-row md:flex-col items-center flex-1 gap-4 md:gap-0">
            <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 shadow-lg flex items-center justify-center mb-0 md:mb-3 transition duration-300 overflow-hidden ${hasVoted === 'teamA' ? 'border-yellow-400 bg-white/20' : 'border-white bg-indigo-700/50'}`}>
              {match.teamA_logo ? (
                <img src={match.teamA_logo} alt={match.teamA_name} className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-xl md:text-2xl font-black text-white">{match.teamA_short}</span>
              )}
            </div>
            <div className="text-left md:text-center">
              <span className="block font-bold text-base md:text-lg text-white">{match.teamA_short}</span>
              <span className="block font-bold text-xs md:text-sm text-indigo-300">{voteStats.aPct}%</span>
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

          <div className="flex flex-row-reverse md:flex-col items-center flex-1 gap-4 md:gap-0">
            <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 shadow-lg flex items-center justify-center mb-0 md:mb-3 transition duration-300 overflow-hidden ${hasVoted === 'teamB' ? 'border-yellow-400 bg-white/20' : 'border-white bg-indigo-700/50'}`}>
              {match.teamB_logo ? (
                <img src={match.teamB_logo} alt={match.teamB_name} className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-xl md:text-2xl font-black text-white">{match.teamB_short}</span>
              )}
            </div>
            <div className="text-right md:text-center">
               <span className="block font-bold text-base md:text-lg text-white">{match.teamB_short}</span>
               <span className="block font-bold text-xs md:text-sm text-indigo-300">{voteStats.bPct}%</span>
            </div>
          </div>
        </div>

        {/* Voting Progress Bar */}
        <div className="w-full max-w-sm h-4 rounded-full bg-white/10 overflow-hidden mb-6 flex border border-white/10 shadow-inner">
           <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500 shadow-xl" style={{width: `${voteStats.aPct}%`}}></div>
           <div className="h-full bg-gradient-to-l from-yellow-500 to-orange-400 transition-all duration-500 shadow-xl" style={{width: `${voteStats.bPct}%`}}></div>
        </div>

        <div className="w-full">
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
