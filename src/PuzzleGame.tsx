import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import puzzlePiecesData from './puzzlePiecesData.json';

export default function PuzzleGame({
  room,
  socket,
  playerSerial,
  isAdmin,
  playSound,
  stopSound,
  handleLeaveGame,
  showAlert,
  showConfirm,
  showAd
}: any) {
  const me = room.players.find((p: any) => p.serial === playerSerial || p.id === socket?.id);
  const opp = room.players.find((p: any) => p.serial !== playerSerial && p.id !== socket?.id);

  const round = room.puzzle?.currentRound || 1;
  const rawImage = room.puzzle?.images?.[round - 1];
  const image = typeof rawImage === 'object' && rawImage ? rawImage.image : rawImage;
  const imageName = typeof rawImage === 'object' && rawImage ? rawImage.name : null;
  const roundStartTime = room.puzzle?.roundStartTime;
  const lastChanceStartTime = room.puzzle?.lastChanceStartTime;
  const playersProgress = room.puzzle?.playersProgress || {};

  const myTotalScore = (room.puzzle?.totalScores?.[me?.id] || 0) + (playersProgress[me?.id] || 0);
  const oppTotalScore = (room.puzzle?.totalScores?.[opp?.id] || 0) + (playersProgress[opp?.id] || 0);
  const myProgress = playersProgress[me?.id] || 0;
  const oppProgress = playersProgress[opp?.id] || 0;

  const [placedPieces, setPlacedPieces] = useState<number[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [availablePieces, setAvailablePieces] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const [previewState, setPreviewState] = useState<'clear' | 'transparent' | 'hidden'>('hidden');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [roundBannerText, setRoundBannerText] = useState<string | null>(null);

  const playedFinishSoundRef = useRef(false);
  const shownAdRef = useRef(false);

  // Play game end sound (win, lose, draw) & Show Google Ad after 3 rounds
  useEffect(() => {
    if (room.gameState === "puzzle_finished") {
      if (!playedFinishSoundRef.current) {
        playedFinishSoundRef.current = true;
        if (myTotalScore > oppTotalScore) {
          if (playSound) playSound("win");
        } else if (myTotalScore < oppTotalScore) {
          if (playSound) playSound("lose");
        } else {
          if (playSound) playSound("draw");
        }
      }
      if (!shownAdRef.current) {
        shownAdRef.current = true;
        const myId = me?.id || socket?.id;
        if (showAd && myId) {
          showAd(room.id, myId, () => {});
        }
      }
    } else {
      playedFinishSoundRef.current = false;
      shownAdRef.current = false;
    }
  }, [room.gameState, myTotalScore, oppTotalScore, playSound, showAd, room.id, me?.id, socket?.id]);

  // Clock ticking sound during Last Chance (20 seconds timer)
  useEffect(() => {
    if (lastChanceStartTime) {
      if (playSound) playSound("clockTicking");
    } else {
      if (stopSound) stopSound("clockTicking");
    }
    return () => {
      if (stopSound) stopSound("clockTicking");
    };
  }, [lastChanceStartTime, playSound, stopSound]);

  // Round banner animation trigger
  useEffect(() => {
    let text = `الجولة رقم ${round}`;
    if (round === 3) {
      text = "الجولة رقم 3 والأخيرة";
    }
    setRoundBannerText(text);

    const timer = setTimeout(() => {
      setRoundBannerText(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [round]);

  // Initialize round
  useEffect(() => {
    const pieces = Array.from({ length: 49 }).map((_, i) => i);
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    setAvailablePieces(pieces);
    setPlacedPieces([]);
    setSelectedPiece(null);
    setPage(0);

    if (round < 3) {
      setPreviewState('clear');
      const t = setTimeout(() => {
        setPreviewState(round === 1 ? 'transparent' : 'hidden');
      }, 3000);
      return () => clearTimeout(t);
    } else {
      setPreviewState('hidden');
    }
  }, [round, image]);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      let limit = 0;
      if (round === 1) limit = 5 * 60 * 1000;
      else if (round === 2) limit = 10 * 60 * 1000;
      else if (round === 3) limit = 15 * 60 * 1000;

      let remaining = 0;
      if (lastChanceStartTime) {
        remaining = Math.max(0, 20 * 1000 - (Date.now() - lastChanceStartTime));
        if (remaining === 0) {
           if (me?.id === room.players[0].id) {
              socket?.emit("puzzle_round_end", { roomId: room.id });
           }
        }
      } else if (roundStartTime) {
        remaining = Math.max(0, limit - (Date.now() - roundStartTime));
        if (remaining === 0) {
           if (me?.id === room.players[0].id) {
              socket?.emit("puzzle_round_end", { roomId: room.id });
           }
        }
      }
      setTimeLeft(Math.floor(remaining / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [roundStartTime, lastChanceStartTime, round, me?.id, room.id, room.players, socket]);

  const currentAvailable = availablePieces.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(availablePieces.length / ITEMS_PER_PAGE);

  const handleCellClick = (cellIdx: number) => {
    if (selectedPiece === null) return;
    if (placedPieces.includes(cellIdx)) return;

    if (selectedPiece === cellIdx) {
      if (playSound) playSound("pop");
      const nextPlaced = [...placedPieces, cellIdx];
      setPlacedPieces(nextPlaced);
      
      const newProgress = Math.floor((nextPlaced.length / 49) * 100);
      socket?.emit("puzzle_progress", { roomId: room.id, progress: newProgress });

      const newAvailable = availablePieces.filter(p => p !== cellIdx);
      setAvailablePieces(newAvailable);
      setSelectedPiece(null);
      
      const newTotalPages = Math.ceil(newAvailable.length / ITEMS_PER_PAGE);
      if (page >= newTotalPages && newTotalPages > 0) {
         setPage(newTotalPages - 1);
      }
    } else {
      if (playSound) playSound("wrong");
      if (navigator.vibrate) navigator.vibrate(200);
      const el = document.getElementById(`cell-${cellIdx}`);
      if (el) {
        el.classList.add("shake-animation");
        setTimeout(() => el.classList.remove("shake-animation"), 400);
      }
    }
  };

  const handleDone = () => {
    if (placedPieces.length < 49) return;
    if (playSound) playSound("bell");
    socket?.emit("puzzle_done", { roomId: room.id });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, '0')}`;
  };

  if (room.gameState === "puzzle_setup") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 w-full max-w-lg mx-auto p-6">
        <h1 className="text-3xl font-black text-white mb-6">🧩 تخمينة Puzzle</h1>
        <div className="bg-gray-800 p-6 rounded-2xl w-full text-center border-2 border-gray-700 mb-4">
           <h2 className="text-xl font-bold text-yellow-400 mb-4">طريقة اللعب</h2>
           <ul className="text-gray-300 text-sm md:text-base space-y-3 text-right" dir="rtl">
              <li>1. المباراة 3 جولات بصور مختلفة.</li>
              <li>2. قم بتركيب 49 قطعة بازل في أماكنها الصحيحة.</li>
              <li>3. إذا ضغطت "انا خلصت 🧩"، سيتم تفعيل عداد 60 ثانية للخصم!</li>
           </ul>
        </div>
        <button
          onClick={() => {
            if (playSound) playSound("clickOpen");
            socket?.emit("start_puzzle", { roomId: room.id });
          }}
          className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_4px_0_0_#4338ca] active:shadow-transparent py-4 px-8 text-xl font-black rounded-2xl transition-all w-full mb-2"
        >
          ابدأ التجميع 🧩
        </button>
        <button
          onClick={handleLeaveGame}
          className="bg-red-500 hover:bg-red-600 text-gray-900 hover:text-white shadow-[0_4px_0_0_#4338ca] active:shadow-transparent py-4 px-8 font-bold transition-all w-full mb-2"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  if (room.gameState === "puzzle_finished") {
    const myId = me?.id || socket?.id;
    const oppId = opp?.id;
    const rematchList = room.puzzle?.rematchRequestedBy || [];
    const myRequestedRematch = rematchList.includes(myId);
    const oppRequestedRematch = oppId && rematchList.includes(oppId);

    const myName = me?.displayName || me?.name || "أنا";
    const oppName = opp?.displayName || opp?.name || "الخصم";

    const isTie = myTotalScore === oppTotalScore;
    const iWon = myTotalScore > oppTotalScore;
    const winnerName = iWon ? myName : oppName;
    const loserName = iWon ? oppName : myName;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 w-full max-w-lg mx-auto p-6 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">انتهت المباراة! 🏁</h1>
        
        {/* Match Winner Announcement Banner */}
        <div className="w-full bg-gray-800/90 border-2 border-gray-700 rounded-2xl p-4 my-3 flex flex-col items-center shadow-xl">
          {isTie ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">🤝</span>
              <span className="text-xl md:text-2xl font-black text-yellow-400">مباراة متكافئة - تعادل!</span>
              <span className="text-sm md:text-base text-gray-300 font-bold mt-1">
                تعادل بين <span className="text-emerald-400 font-black">{myName}</span> و <span className="text-rose-400 font-black">{oppName}</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">🏆</span>
              <span className="text-xl md:text-2xl font-black text-emerald-400">الفائز: {winnerName}</span>
              <span className="text-xs md:text-sm text-gray-400 font-bold mt-0.5">
                حظاً أوفراً للاعب <span className="text-rose-400 font-black">{loserName}</span>
              </span>
            </div>
          )}
        </div>

        {/* Players Score Cards */}
        <div className="grid grid-cols-2 gap-3 w-full my-3">
           {/* My Score Card */}
           <div className={`flex flex-col items-center p-3.5 rounded-2xl border transition-all ${iWon && !isTie ? 'bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : isTie ? 'bg-yellow-500/15 border-yellow-500/40' : 'bg-gray-800/80 border-gray-700'}`}>
              <div className="flex items-center gap-1">
                {iWon && !isTie && <span className="text-sm">👑</span>}
                <span className="text-base md:text-lg font-black text-emerald-400 truncate max-w-[120px]">{myName}</span>
              </div>
              <span className="text-3xl md:text-4xl text-white mt-1 font-black">{myTotalScore}</span>
              <span className="text-xs text-gray-400 font-bold mt-0.5">نقطة</span>
              {iWon && !isTie && <span className="mt-2 text-[11px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">الفائز 🏆</span>}
              {!iWon && !isTie && <span className="mt-2 text-[11px] font-black bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full border border-gray-600">المركز الثاني</span>}
              {isTie && <span className="mt-2 text-[11px] font-black bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">تعادل 🤝</span>}
           </div>

           {/* Opponent Score Card */}
           <div className={`flex flex-col items-center p-3.5 rounded-2xl border transition-all ${!iWon && !isTie ? 'bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : isTie ? 'bg-yellow-500/15 border-yellow-500/40' : 'bg-gray-800/80 border-gray-700'}`}>
              <div className="flex items-center gap-1">
                {!iWon && !isTie && <span className="text-sm">👑</span>}
                <span className="text-base md:text-lg font-black text-rose-400 truncate max-w-[120px]">{oppName}</span>
              </div>
              <span className="text-3xl md:text-4xl text-white mt-1 font-black">{oppTotalScore}</span>
              <span className="text-xs text-gray-400 font-bold mt-0.5">نقطة</span>
              {!iWon && !isTie && <span className="mt-2 text-[11px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">الفائز 🏆</span>}
              {iWon && !isTie && <span className="mt-2 text-[11px] font-black bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full border border-gray-600">المركز الثاني</span>}
              {isTie && <span className="mt-2 text-[11px] font-black bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">تعادل 🤝</span>}
           </div>
        </div>
        
        {/* Match result buttons (تغيير اللعبة - لعب مرة أخرى - خروج للرئيسية) */}
        <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
          <div className="flex gap-2 w-full">
            {/* تغيير اللعبة */}
            <button
              onClick={() => {
                if (playSound) playSound("clickOpen");
                socket?.emit("select_private_mode", { roomId: room.id, mode: null });
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-[0_4px_0_0_#6b21a8] active:shadow-transparent py-3.5 px-2 text-sm md:text-base font-black rounded-2xl flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              🎮 تغيير اللعبة
            </button>

            {/* لعب مرة أخرى */}
            <button
              onClick={() => {
                if (playSound) playSound("clickOpen");
                socket?.emit("request_puzzle_rematch", { roomId: room.id });
              }}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_0_0_#047857] active:shadow-transparent py-3.5 px-2 text-sm md:text-base font-black rounded-2xl flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              {myRequestedRematch ? (
                <span className="animate-pulse">🔄 بانتظار الخصم...</span>
              ) : oppRequestedRematch ? (
                <span>🤝 الخصم جاهز!</span>
              ) : (
                <span>🔄 لعب مرة أخرى</span>
              )}
            </button>
          </div>

          {/* خروج للرئيسية */}
          <button
            onClick={() => {
              if (playSound) playSound("clickOpen");
              if (handleLeaveGame) handleLeaveGame();
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_0_0_#991b1b] active:shadow-transparent py-3.5 px-6 text-base font-black rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            🚪 خروج للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pt-2 pb-2 bg-gray-900 w-full max-w-lg mx-auto overflow-hidden relative">
      {/* Round Start Banner Animation */}
      <AnimatePresence>
         {roundBannerText && (
            <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
               <motion.div
                  initial={{ x: '100vw', opacity: 0, scale: 0.8 }}
                  animate={{ x: 0, opacity: 1, scale: 1.05 }}
                  exit={{ x: '-100vw', opacity: 0, scale: 0.8 }}
                  transition={{ 
                     type: "spring", 
                     stiffness: 220, 
                     damping: 22,
                     exit: { duration: 0.4, ease: "easeIn" }
                  }}
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-950 px-8 py-4 rounded-3xl shadow-[0_0_40px_rgba(245,158,11,0.9)] border-4 border-yellow-200 flex items-center justify-center gap-3"
               >
                  <span className="text-2xl md:text-3xl font-black drop-shadow-sm text-gray-950">
                     🎮 {roundBannerText}
                  </span>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="w-full px-1 flex flex-col gap-2 relative z-10">
         <div className="flex justify-between items-center">
            {/* Player 1 (Me) */}
            <div className="flex flex-col items-center flex-1 max-w-[140px] md:max-w-[160px]">
               <span className="text-white font-black text-xs md:text-sm truncate max-w-[100px] md:max-w-[130px]" title={me?.name || me?.displayName || "أنا"}>
                  {(me?.name || me?.displayName || "أنا").substring(0, 10)}
               </span>
               <div className="w-full bg-gray-700 h-4 md:h-5 rounded-full mt-1 overflow-hidden relative border border-gray-600 shadow-inner flex items-center justify-center">
                  <div className="bg-emerald-500 h-full absolute left-0 top-0 transition-all duration-300 rounded-full" style={{ width: `${myProgress}%` }} />
                  <span className="relative z-10 text-white font-black text-[10px] md:text-xs leading-none">
                     {myProgress}%
                  </span>
               </div>
            </div>
            
            {/* Timer & Round */}
            <div className="flex flex-col justify-center items-center px-2 md:px-4 shrink-0">
               <div className={`text-xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>{formatTime(timeLeft)}</div>
               <div className="text-xs text-gray-400">جولة {round}/3</div>
               {lastChanceStartTime && <div className="text-[9px] md:text-[10px] text-red-400 font-bold animate-pulse mt-0.5">فرصة أخيرة!</div>}
            </div>

            {/* Player 2 (Opponent) */}
            <div className="flex flex-col items-center flex-1 max-w-[140px] md:max-w-[160px]">
               <span className="text-white font-black text-xs md:text-sm truncate max-w-[100px] md:max-w-[130px]" title={opp?.name || opp?.displayName || "الخصم"}>
                  {(opp?.name || opp?.displayName || "الخصم").substring(0, 10)}
               </span>
               <div className="w-full bg-gray-700 h-4 md:h-5 rounded-full mt-1 overflow-hidden relative border border-gray-600 shadow-inner flex items-center justify-center">
                  <div className="bg-rose-500 h-full absolute left-0 top-0 transition-all duration-300 rounded-full" style={{ width: `${oppProgress}%` }} />
                  <span className="relative z-10 text-white font-black text-[10px] md:text-xs leading-none">
                     {oppProgress}%
                  </span>
               </div>
            </div>
         </div>
      </div>

      {/* Puzzle Grid */}
      <div className="relative p-1 md:p-2 rounded-xl mx-auto z-10 w-full max-w-[400px]">
         <div className="w-full aspect-square relative z-10 bg-gray-900/90 rounded-lg shadow-inner overflow-hidden border border-gray-700">
            <svg viewBox="0 0 696 696" className="w-full h-full relative z-10 overflow-hidden">
               <defs>
                  {puzzlePiecesData.map((p) => (
                     <clipPath key={`clip-${p.id}`} id={`clip-puzzle-${p.id}`}>
                        <path d={p.d} />
                     </clipPath>
                  ))}
               </defs>

               {/* Grid background lines */}
               <image 
                  href="/puzzle-pieces/full-puzzle-pices-in-one.svg" 
                  width="696" 
                  height="696" 
                  opacity={0.35} 
                  className="pointer-events-none" 
               />

               {/* Placed Pieces */}
               {placedPieces.map((pieceId) => {
                  const p = puzzlePiecesData[pieceId];
                  if (!p) return null;
                  return (
                     <g key={`placed-${pieceId}`}>
                        <image 
                           href={image} 
                           width="696" 
                           height="696" 
                           preserveAspectRatio="none"
                           clipPath={`url(#clip-puzzle-${pieceId})`} 
                           className="pointer-events-none"
                        />
                        <path 
                           d={p.d} 
                           fill="none" 
                           stroke="#000" 
                           strokeWidth="1" 
                           opacity="0.3" 
                           className="pointer-events-none" 
                        />
                     </g>
                  );
               })}

               {/* Clickable Grid Cells (No location hints) */}
               {puzzlePiecesData.map((p) => {
                  const isPlaced = placedPieces.includes(p.id);
                  return (
                     <path 
                        key={`cell-${p.id}`}
                        id={`cell-${p.id}`}
                        d={p.d}
                        fill="transparent"
                        className={!isPlaced ? "cursor-pointer hover:fill-white/10 transition-colors" : ""}
                        onClick={() => handleCellClick(p.id)}
                     />
                  );
               })}
            </svg>
            
            {/* Preview Overlay */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${previewState === 'clear' ? 'opacity-100' : previewState === 'transparent' ? 'opacity-25' : 'opacity-0'} z-30`}>
               <div className="w-full h-full" style={{
                  backgroundImage: `url(${image})`,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
               }} />
            </div>
         </div>
      </div>

      {/* Available Pieces (Bottom Drawer) OR Completion Image Name Banner */}
      <div className="w-full px-2 z-10">
        {placedPieces.length >= 49 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-[170px] sm:h-[185px] md:h-[210px] shrink-0 rounded-2xl bg-gradient-to-br from-emerald-950 via-gray-900 to-amber-950/80 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none" />
            <span className="text-3xl md:text-4xl mb-1 animate-bounce">🎉</span>
            <span className="text-amber-300 font-black text-sm md:text-base mb-1 drop-shadow-sm">
              أحسنت! أتممت كشف الصورة بنجاح
            </span>
            <div className="bg-gray-950/80 text-white font-black text-lg md:text-2xl px-5 py-2 rounded-2xl border border-amber-400/50 mt-1 max-w-[90%] truncate shadow-inner flex items-center gap-2">
              <span>🖼️</span>
              <span className="text-yellow-200">{imageName || `صورة الجولة ${round}`}</span>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex justify-between w-full items-center">
               <span className="text-gray-300 font-bold text-xs md:text-sm">عدد القطع ({availablePieces.length})</span>
               <button 
                  onClick={() => { if (playSound) playSound("chestOpen"); setPage((p) => (p + 1) % (totalPages || 1)); }}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-xs md:text-sm py-1 px-2 rounded-lg active:scale-95 transition-transform font-bold border border-gray-600 z-50 relative"
               >
                  🔄 تغيير القطع ({page + 1}/{totalPages || 1})
               </button>
            </div>
            
            <div className="w-full h-[170px] sm:h-[185px] md:h-[210px] shrink-0 rounded-lg bg-gray-900/50 border border-gray-700 overflow-hidden flex flex-wrap justify-center items-center content-center relative">
               <AnimatePresence>
                  {currentAvailable.map(pieceIdx => {
                     const p = puzzlePiecesData[pieceIdx];
                     if (!p) return null;

                     const rotate = ((pieceIdx * 47) % 40) - 20; // -20 to 20 deg for cleaner layout
                     const tx = ((pieceIdx * 13) % 10) - 5;
                     const ty = ((pieceIdx * 29) % 10) - 5;
                     const isSelected = selectedPiece === pieceIdx;
                     
                     return (
                        <motion.div
                           key={pieceIdx}
                           initial={{ opacity: 0, scale: 0 }}
                           animate={{ opacity: 1, scale: isSelected ? 1.15 : 1 }}
                           exit={{ opacity: 0, scale: 0 }}
                           onClick={() => { if (playSound) playSound("handXFill"); setSelectedPiece(isSelected ? null : pieceIdx); }}
                           className={`relative cursor-pointer transition-all ${isSelected ? 'z-50' : 'z-10 hover:z-20'}`}
                           style={{
                              width: `clamp(42px, ${(p.w / 696) * 70}vw, ${(p.w / 696) * 350}px)`,
                              height: `clamp(42px, ${(p.h / 696) * 70}vw, ${(p.h / 696) * 350}px)`,
                              margin: '2px',
                              transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`,
                           }}
                        >
                           <svg viewBox={`${p.minX} ${p.minY} ${p.w} ${p.h}`} className="w-full h-full overflow-visible">
                              <defs>
                                 <clipPath id={`drawer-clip-${p.id}`}>
                                    <path d={p.d} />
                                 </clipPath>
                              </defs>
                              <image 
                                 href={image} 
                                 width="696" 
                                 height="696" 
                                 preserveAspectRatio="none"
                                 clipPath={`url(#drawer-clip-${p.id})`} 
                              />
                              {/* Glowing edge outline on selection (No drop-shadow) */}
                              <path 
                                 d={p.d} 
                                 fill="none" 
                                 stroke={isSelected ? "#facc15" : "rgba(255,255,255,0.25)"} 
                                 strokeWidth={isSelected ? "3.5" : "1"} 
                                 vectorEffect="non-scaling-stroke"
                                 className={isSelected ? "animate-pulse" : ""}
                              />
                           </svg>
                        </motion.div>
                     );
                  })}
               </AnimatePresence>
               {currentAvailable.length === 0 && (
                  <div className="text-gray-500 flex items-center justify-center text-sm font-bold w-full h-full">لا يوجد قطع إضافية</div>
               )}
            </div>
          </div>
        )}
      </div>
      
      {/* Done Button */}
      <div className="mt-2 md:mt-3 z-10">
         <button
            disabled={placedPieces.length < 49 || !!lastChanceStartTime}
            onClick={handleDone}
            className={`px-6 py-2.5 md:px-8 md:py-3 rounded-full font-black text-[16px] md:text-lg transition-all ${placedPieces.length === 49 && !lastChanceStartTime ? 'bg-gradient-to-r from-emerald-400 via-yellow-400 to-emerald-400 text-black shadow-[0_0_25px_rgba(250,204,21,0.9)] border-2 border-yellow-300 animate-pulse scale-105 active:scale-95 cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}`}
         >
            انا خلصت 🧩
         </button>
      </div>
      
      <style>{`
        @keyframes shake {
           0%, 100% { transform: translateX(0); }
           20%, 60% { transform: translateX(-4px); }
           40%, 80% { transform: translateX(4px); }
        }
        .shake-animation {
           animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
           background-color: rgba(239, 68, 68, 0.5) !important;
        }
      `}</style>
    </div>
  );
}
