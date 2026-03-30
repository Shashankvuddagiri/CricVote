import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import logo from '../assets/logo.png';

const ShareCard = ({ match, prediction, username }) => {
  const cardRef = useRef(null);

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `MML-Prediction-${match.teamA_short}-vs-${match.teamB_short}.png`;
      link.href = dataUrl;
      link.click();
      
      // Native Share Sheet if available
      if (navigator.share) {
        const file = await (await fetch(dataUrl)).blob();
        const shareFile = new File([file], "prediction.png", { type: 'image/png' });
        await navigator.share({
          files: [shareFile],
          title: 'My MML IPL Prediction',
          text: `I'm backing ${prediction === 'teamA' ? match.teamA_name : match.teamB_name} in today's IPL match! Join me on MML Predictions.`,
        });
      }
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hidden Card for Export */}
      <div className="fixed -left-[2000px] top-0">
        <div ref={cardRef} className="w-[400px] h-[400px] bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-8 flex flex-col justify-between items-center text-white border-8 border-yellow-500/20">
          <div className="flex items-center gap-3">
             <img src={logo} className="w-12 h-12" alt="MML" />
             <div className="text-left">
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-yellow-400">MML IPL</h1>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Arena Prediction</p>
             </div>
          </div>

          <div className="text-center">
             <p className="text-xs font-bold text-indigo-200 uppercase mb-4 italic">{match.venue}</p>
             <div className="flex justify-between items-center gap-6">
                <div className="flex flex-col items-center">
                   <div className={`w-20 h-20 rounded-full border-4 ${prediction === 'teamA' ? 'border-yellow-400 scale-110 shadow-lg shadow-yellow-400/20' : 'border-white/10 opacity-50'} flex items-center justify-center bg-white/5`}>
                      <img src={match.teamA_logo} className="w-12 h-12 object-contain" alt="A" />
                   </div>
                   <span className="text-sm font-black mt-2">{match.teamA_short}</span>
                </div>
                <span className="text-3xl font-black italic text-white/20">VS</span>
                <div className="flex flex-col items-center">
                   <div className={`w-20 h-20 rounded-full border-4 ${prediction === 'teamB' ? 'border-yellow-400 scale-110 shadow-lg shadow-yellow-400/20' : 'border-white/10 opacity-50'} flex items-center justify-center bg-white/5`}>
                      <img src={match.teamB_logo} className="w-12 h-12 object-contain" alt="B" />
                   </div>
                   <span className="text-sm font-black mt-2">{match.teamB_short}</span>
                </div>
             </div>
          </div>

          <div className="w-full bg-white/10 p-3 rounded-xl border border-white/10 text-center">
             <p className="text-[10px] text-indigo-200 uppercase font-black tracking-widest mb-1"> Warrior Verdict </p>
             <p className="text-lg font-black italic text-white">
                {username}'s Pick: <span className="text-yellow-400 uppercase">{prediction === 'teamA' ? match.teamA_name : match.teamB_name}</span>
             </p>
          </div>
        </div>
      </div>

      <button 
        onClick={handleShare}
        className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        Share Verdict 🚀
      </button>
    </div>
  );
};

export default ShareCard;
