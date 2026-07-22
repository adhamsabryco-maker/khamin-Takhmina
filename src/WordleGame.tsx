import React, { useState, useEffect, useRef } from 'react';
import bombPartyWords from './data/bomb-party-words.json';

export default function WordleGame({
  room,
  socket,
  playerSerial,
  isAdmin,
  hasProPackage,
  CategoryPageAd,
  renderWordleRewardBar,
  playSound,
  handleLeaveGame,
  showAlert,
  showConfirm,
  showAd
}: any) {
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [shakeRow, setShakeRow] = useState(false);
  const [showNotWordMsg, setShowNotWordMsg] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  useEffect(() => {
    if (hintCooldown > 0) {
      const timer = setTimeout(() => setHintCooldown(hintCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [hintCooldown]);
  
  const me = room.players.find((p: any) => p.serial === playerSerial || p.id === socket?.id);
  const opp = room.players.find((p: any) => p.serial !== playerSerial && p.id !== socket?.id);
  
  const myId = me?.id;
  const oppId = opp?.id;

  const targetLength = room.wordle?.targetWord?.length || 5;
  const myGuesses = room.wordle?.guesses?.[myId] || [];

  const knownCorrectIndices = new Set<number>();
  myGuesses.forEach((g: any) => {
    g.result.forEach((res: string, idx: number) => {
      if (res === 'correct') knownCorrectIndices.add(idx);
    });
  });

  let nextHintIdx = -1;
  if (room.wordle?.targetWord) {
    for (let i = 0; i < targetLength; i++) {
      if (!knownCorrectIndices.has(i) && !revealedHints.includes(i)) {
        nextHintIdx = i;
        break;
      }
    }
  }

  const requestHint = () => {
    if (hintCooldown > 0 || nextHintIdx === -1) return;

    const orderNames = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'];
    const letterOrder = orderNames[nextHintIdx] || 'التالي';

    showConfirm(
      `هل تود مشاهدة إعلان لمعرفة الحرف ${letterOrder}؟`,
      () => {
        showAd(room.id, myId, () => {
          setRevealedHints(prev => [...prev, nextHintIdx]);
          setHintCooldown(30);
          if (playSound) playSound("levelUp");
          
          setGuess(prevGuess => {
             const guessChars = prevGuess.split('');
             if (nextHintIdx < guessChars.length) {
               guessChars[nextHintIdx] = room.wordle.targetWord[nextHintIdx];
               return guessChars.join('');
             } else if (nextHintIdx === prevGuess.length) {
                return prevGuess + room.wordle.targetWord[nextHintIdx];
             }
             return prevGuess;
          });
        }, () => {
          socket?.emit("wordle_pause", room.id);
        }, () => {
          socket?.emit("wordle_resume", room.id);
        });
      },
      "وسيلة مساعدة"
    );
  };

  const prevMyGuessesCount = useRef(myGuesses.length);
  const prevGameState = useRef(room.gameState);
  const guessesContainerRef = useRef<HTMLDivElement>(null);

  // Clear typed guess and hints when gameState or targetWord changes to clean up the grid completely
  useEffect(() => {
    setGuess('');
    setRevealedHints([]);
    setHintCooldown(0);
  }, [room.gameState, room.wordle?.targetWord]);

  // Time limit of 10 minutes
  useEffect(() => {
    if (room.gameState !== "wordle_playing" || !room.wordle?.startTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const duration = 10 * 60 * 1000;
      let elapsed = 0;
      if (room.wordle.pausedAt) {
         elapsed = room.wordle.pausedAt - room.wordle.startTime;
      } else {
         elapsed = Date.now() - room.wordle.startTime;
      }
      const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [room.gameState, room.wordle?.startTime, room.wordle?.pausedAt]);

  // Auto-scroll the grid container to the bottom when guess count increases
  useEffect(() => {
    if (guessesContainerRef.current) {
      guessesContainerRef.current.scrollTo({
        top: guessesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [myGuesses.length]);

  // Reactive Sound Effects
  useEffect(() => {
    if (myGuesses.length > prevMyGuessesCount.current) {
      const lastGuess = myGuesses[myGuesses.length - 1];
      const isWin = lastGuess?.result?.every((r: string) => r === 'correct');
      if (isWin) {
        if (playSound) playSound("correctAnswer");
      } else {
        if (playSound) playSound("wrong");
      }
      prevMyGuessesCount.current = myGuesses.length;
    }
  }, [myGuesses.length, playSound]);

  useEffect(() => {
    if (room.gameState !== prevGameState.current) {
      if (room.gameState === "wordle_playing") {
        if (playSound) playSound("bell");
      } else if (room.gameState === "wordle_finished") {
        if (room.wordle?.winnerId === myId) {
          if (playSound) playSound("win");
        } else {
          if (playSound) playSound("lose");
        }
      }
      prevGameState.current = room.gameState;
    }
  }, [room.gameState, room.wordle?.winnerId, myId, playSound]);

  const handleGuessSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!guess.trim()) return;
    if (guess.length !== room.wordle.targetWord.length) return;
    
    if (!bombPartyWords.includes(guess)) {
      if (playSound) playSound("wrong");
      setShakeRow(true);
      setShowNotWordMsg(true);
      setTimeout(() => setShakeRow(false), 500);
      setTimeout(() => setShowNotWordMsg(false), 3000);
      return;
    }

    if (playSound) playSound("clickOpen");
    socket?.emit("wordle_guess", { roomId: room.id, word: guess });
    setGuess('');
  };

  const getLetterColor = (res: string) => {
    if (res === 'correct') return 'bg-green-500 text-white border-green-600 shadow-sm shadow-green-200';
    if (res === 'present') return 'bg-yellow-400 text-brown-dark border-yellow-500 shadow-sm shadow-yellow-100';
    return 'bg-gray-200 text-gray-700 border-gray-300';
  };

  const renderGuesses = (guesses: any[]) => {
    const targetLength = room.wordle?.targetWord?.length || 5;
    const rows = [];
    // If player reaches 6, dynamically add 5 more attempts so they know they can continue guessing
    const totalRows = guesses.length >= 6 ? guesses.length + 5 : 6;

    // 1. Render submitted guesses (RTL)
    guesses.forEach((g, i) => {
      rows.push(
        <div key={`submitted-${i}`} className="flex gap-1 justify-center animate-fadeIn" dir="rtl">
          {g.result.map((r: string, idx: number) => (
            <div
              key={idx}
              className={`w-9 h-9 md:w-11 md:h-11 flex items-center justify-center font-black text-lg md:text-2xl rounded-xl border-b-4 transition-all ${getLetterColor(r)}`}
            >
              {g.word[idx]}
            </div>
          ))}
        </div>
      );
    });

    // 2. Render active typing row if playing
    if (room.gameState === "wordle_playing" && guesses.length < totalRows) {
      const activeRowCells = [];
      for (let idx = 0; idx < targetLength; idx++) {
        const isTyped = idx < guess.length;
        let char = '';
        let isHinted = false;
        let isKnown = false;

        if (isTyped) {
           char = guess[idx];
        } else if (revealedHints.includes(idx)) {
           char = room.wordle.targetWord[idx];
           isHinted = true;
        } else if (knownCorrectIndices.has(idx)) {
           char = room.wordle.targetWord[idx];
           isKnown = true;
        }

        activeRowCells.push(
          <div
            key={`active-cell-${idx}`}
            className={`w-9 h-9 md:w-11 md:h-11 flex items-center justify-center font-black text-lg md:text-2xl rounded-xl border-b-4 transition-all duration-200 ${
              isTyped
                ? "bg-white border-emerald-400 text-emerald-800 scale-105 shadow-sm"
                : isHinted
                  ? "bg-yellow-100/80 border-yellow-400 text-yellow-700 scale-105 hint-glow"
                  : isKnown
                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-600 scale-105"
                    : "bg-white border-gray-100 text-gray-300"
            }`}
          >
            {char || "-"}
          </div>
        );
      }
      rows.push(
        <div key="active-row" className={`flex gap-1 justify-center relative ${shakeRow ? 'animate-shake' : 'animate-pulse'}`} dir="rtl">
          {showNotWordMsg && (
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap z-50 animate-fadeInOut">
               ليست كلمة
             </div>
          )}
          {activeRowCells}
        </div>
      );
    }

    // 3. Render empty remaining rows
    const remainingCount = totalRows - guesses.length - (room.gameState === "wordle_playing" && guesses.length < totalRows ? 1 : 0);
    if (remainingCount > 0) {
      Array.from({ length: remainingCount }).forEach((_, i) => {
        rows.push(
          <div key={`empty-${i}`} className="flex gap-1 justify-center opacity-40" dir="rtl">
            {Array.from({ length: targetLength }).map((_, idx) => (
              <div
                key={idx}
                className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center font-black text-lg md:text-2xl rounded-xl border-b-4 bg-white border-gray-100 text-gray-200"
              >
                -
              </div>
            ))}
          </div>
        );
      });
    }

    return (
      <div 
        ref={guessesContainerRef} 
        className="flex flex-col gap-1.5 overflow-y-auto max-h-[350px] p-2 w-full scroll-smooth"
      >
        {rows}
      </div>
    );
  };

  // Keyboard helper - Arabic layout without "z"
  const ARABIC_KEYS = [
    ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
    ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط", "ذ"],
    ["ئ", "ء", "ؤ", "ر", "ى", "ة", "و", "ز", "ظ", "أ", "إ"]
  ];

  const letterStatuses: { [key: string]: 'correct' | 'present' | 'absent' } = {};
  myGuesses.forEach((g: any) => {
    g.result.forEach((status: string, idx: number) => {
      const char = g.word[idx];
      const current = letterStatuses[char];
      if (status === 'correct') {
        letterStatuses[char] = 'correct';
      } else if (status === 'present') {
        if (current !== 'correct') {
          letterStatuses[char] = 'present';
        }
      } else if (status === 'absent') {
        if (current !== 'correct' && current !== 'present') {
          letterStatuses[char] = 'absent';
        }
      }
    });
  });

  const getKeyClass = (char: string) => {
    const status = letterStatuses[char];
    const base = "flex-1 min-w-0 h-11 sm:h-13 font-black text-sm sm:text-lg rounded-lg sm:rounded-xl transition-all active:scale-95 flex items-center justify-center p-0 border-b-2 ";
    if (status === 'correct') return base + "bg-green-500 text-white border-green-600 shadow-sm";
    if (status === 'present') return base + "bg-yellow-400 text-brown-dark border-yellow-500 shadow-sm";
    if (status === 'absent') return base + "bg-gray-300 text-gray-500 border-gray-400 opacity-60 line-through";
    return base + "bg-white text-emerald-800 border-gray-300 hover:bg-emerald-50 shadow-sm";
  };

  const handleKeyClick = (char: string) => {
    const targetLength = room.wordle?.targetWord?.length || 5;
    if (guess.length < targetLength) {
      if (playSound) playSound("click");
      setGuess(prev => prev + char);
    }
  };

  const handleBackspace = () => {
    if (playSound) playSound("pop");
    setGuess(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (room.gameState !== "wordle_playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (e.g. chat)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter') {
        handleGuessSubmit();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else {
        const char = e.key;
        // Check if the typed character is an Arabic letter in our keys
        if (ARABIC_KEYS.flat().includes(char)) {
          handleKeyClick(char);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [room.gameState, guess, handleGuessSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isMeReady = room.wordle?.readyPlayers?.includes(me?.id);

  return (
    <React.Fragment>
      <div className="w-full card-game p-0.5 sm:p-3 md:p-4 text-center space-y-3 md:space-y-4 relative overflow-hidden flex flex-col min-h-[auto] bg-gradient-to-b from-gray-50 to-emerald-50/20 border-emerald-500 rounded-3xl shadow-xl">
        {renderWordleRewardBar && renderWordleRewardBar()}
        
        {/* Waiting / Lobby Screen */}
        {room.gameState === "wordle_setup" && (
          <div className="flex flex-col items-center justify-center py-2 z-20 relative bg-white/95 backdrop-blur-sm rounded-2xl p-2 border border-emerald-100 shadow-sm w-full max-w-md mx-auto">
            <img src="/word-le-logo.png" className="w-16 h-16 p-2 inline object-contain items-center" />
            <h2 className="text-3xl font-black text-emerald-600 mb-2">تخمينة كلمة لي</h2>
            <p className="text-gray-500 font-bold mb-2 text-sm">أمامك 10 دقائق لتخمين الكلمة ذات {room.wordle?.targetWord?.length || 5} حروف!</p>
            
            {/* دليل اللعبة وتوضيح الألوان */}
            <div className="w-full bg-emerald-50/60 rounded-2xl p-2 mb-2 border border-emerald-100 text-right space-y-3" dir="rtl">
              <h4 className="text-emerald-800 font-black text-sm flex items-center gap-1.5">
                💡 كيف تلعب وتخمن الكلمة؟
              </h4>
              <ul className="text-xs text-gray-600 font-bold space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-green-500 text-white flex items-center justify-center text-xs font-black border-b-2 border-green-600 shadow-sm">
                    ✓
                  </span>
                  <span className="leading-relaxed"><strong className="text-green-700 font-black">المربع الأخضر:</strong> الحرف صحيح وفي المكان الصحيح تماماً.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-yellow-400 text-brown-dark flex items-center justify-center text-xs font-black border-b-2 border-yellow-500 shadow-sm">
                    ⏳
                  </span>
                  <span className="leading-relaxed"><strong className="text-yellow-600 font-black">المربع الأصفر:</strong> الحرف صحيح ولكن في المكان الخاطئ.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-black border-b-2 border-gray-300">
                    ✕
                  </span>
                  <span className="leading-relaxed"><strong className="text-gray-500 font-black">المربع الرمادي:</strong> الحرف غير موجود نهائياً في الكلمة المستهدفة.</span>
                </li>
                <li className="pt-2 border-t border-emerald-100 text-[11px] text-emerald-700/90 font-bold flex items-center gap-1 leading-relaxed">
                  ⭐ يمكنك إدخال وتخمين الكلمة بالضغط على الحروف أو كتابتها ثم الضغط على زر "تأكيد"!
                </li>
              </ul>
            </div>
            
            <div className="w-full flex flex-col gap-3">
              {!isMeReady ? (
                <button
                  onClick={() => {
                    if (playSound) playSound("clickOpen");
                    socket?.emit("start_wordle", { roomId: room.id });
                  }}
                  className="btn-game w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_0_0_#047857] active:shadow-transparent py-3.5 px-2 text-x1 font-black rounded-2xl transition-all hover:scale-102 flex items-center justify-center gap-2"
                >
                  👍 موافقة وبدء اللعب والتخمين
                </button>
              ) : (
                <div className="text-center bg-emerald-50 border border-emerald-100 p-4 rounded-xl w-full">
                  <p className="text-emerald-600 font-black text-base animate-pulse mb-1">لقد أبديت موافقتك! 🌟</p>
                  <p className="text-gray-400 font-bold text-xs">في انتظار موافقة اللاعب الآخر لبدء التخمين...</p>
                </div>
              )}

              <button
                onClick={() => {
                  if (handleLeaveGame) handleLeaveGame();
                }}
                className="btn-game w-full bg-red-100 hover:bg-red-200 text-red-700 shadow-[0_4px_0_0_#fca5a5] active:shadow-transparent py-2.5 px-6 text-sm font-black rounded-2xl transition-all"
              >
                🚪 خروج للرئيسية
              </button>
            </div>
          </div>
        )}

        {/* Playing & Finished Screen */}
        {(room.gameState === "wordle_playing" || room.gameState === "wordle_finished") && (
          <div className="flex flex-col w-full h-full space-y-3 z-20">
            
            {/* Standard Header (Players names, Win count, middle timer) */}
            <div className="flex justify-between items-center w-full mb-2 px-1 relative z-20">
              {/* Left Player Profile */}
              <div className="flex flex-col items-center bg-white border-2 border-red-200 px-3 py-1.5 rounded-xl shadow-sm min-w-[90px]" dir="rtl">
                <span className="text-[10px] md:text-xs font-black text-gray-500 max-w-[95px] truncate text-center">
                  {me?.playerName || me?.name || "أنت"}
                </span>
                <span className="text-xs md:text-sm font-black text-red-500 mt-0.5">🏆 {me?.wordleWins || 0}</span>
              </div>

              {/* Middle Timer / Match Status */}
              <div className="flex justify-center items-center gap-1 mx-2" dir="ltr">
                {room.gameState === "wordle_finished" ? (
                  <span className="font-black text-[10px] md:text-xs text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">انتهت المباراة</span>
                ) : (
                  <div className="border-2 border-emerald-200 px-3 py-1 rounded-xl shadow-sm min-w-[80px] bg-white text-center">
                    <span className={`text-lg md:text-xl font-black font-mono tracking-wider ${timeLeft <= 60 ? "text-red-600 animate-pulse" : "text-emerald-700"}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Player Profile */}
              <div className="flex flex-col items-center bg-white border-2 border-green-200 px-3 py-1.5 rounded-xl shadow-sm min-w-[90px]" dir="rtl">
                <span className="text-[10px] md:text-xs font-black text-gray-500 max-w-[95px] truncate text-center">
                  {opp?.playerName || opp?.name || "الخصم"}
                </span>
                <span className="text-xs md:text-sm font-black text-green-600 mt-0.5">🏆 {opp?.wordleWins || 0}</span>
              </div>
            </div>
            
            {/* Show grid and keyboard ONLY during active play */}
            {room.gameState === "wordle_playing" && (
              <div className="flex flex-col gap-3 w-full justify-center items-center">
                <div className="w-full max-w-lg bg-emerald-50/50 flex flex-col items-center relative">
                  {/* Grid Container */}
                  <div className="relative inline-block w-full max-w-sm mx-auto mb-2">
                    <div className="flex flex-col gap-1 justify-center items-center w-full">
                       {renderGuesses(myGuesses)}
                    </div>
                    
                    {/* Hint Button */}
                    {!room.wordle?.gameOver && nextHintIdx !== -1 && (
                      <button
                        onClick={requestHint}
                        disabled={hintCooldown > 0}
                        className={`absolute -bottom-2 right-2 sm:right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 flex items-center justify-center text-xl sm:text-2xl shadow-lg transition-transform z-10 ${
                          hintCooldown > 0 
                            ? 'bg-gray-300 border-gray-400 cursor-not-allowed opacity-80' 
                            : 'bg-yellow-400 border-yellow-600 hover:scale-110 active:scale-95'
                        }`}
                      >
                        💡
                        {hintCooldown > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full text-white text-sm font-black">
                            {hintCooldown}
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="bg-gray-100/90 dark:bg-black/40 mt-1 w-full p-1.5 sm:p-2.5 rounded-2xl flex flex-col gap-2">

                    {/* Custom Keyboard */}
                    <div className="bg-gray-200/90 p-1.5 sm:p-2 rounded-2xl w-full flex flex-col gap-1.5 sm:gap-2 overflow-hidden shadow-inner" dir="rtl">
                      {ARABIC_KEYS.map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-1 sm:gap-1.5 justify-center w-full">
                          {row.map((char) => (
                            <button
                              key={char}
                              onClick={() => handleKeyClick(char)}
                              className={`${getKeyClass(char)}`}
                            >
                              {char}
                            </button>
                          ))}
                        </div>
                      ))}
                      <div className="flex gap-2 mt-1.5 w-full justify-center">
                        <button
                          onClick={handleBackspace}
                          className="flex-1 bg-red-100 text-red-700 border-b-4 border-red-300 hover:bg-red-200 h-10 md:h-12 rounded-xl font-bold text-sm md:text-base active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          🔙 مسح
                        </button>
                        <button
                          onClick={() => handleGuessSubmit()}
                          disabled={guess.length !== room.wordle.targetWord.length}
                          className="flex-[2] bg-emerald-500 text-white border-b-4 border-emerald-600 hover:bg-emerald-600 disabled:opacity-50 h-10 md:h-12 rounded-xl font-bold text-sm md:text-base active:scale-95 transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-200"
                        >
                          ✅ تأكيد الكلمة ({guess.length}/{room.wordle.targetWord.length})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Standard Results Overlay Screen (Grid is hidden now) */}
            {room.gameState === "wordle_finished" && (
              <div className="flex w-full mt-4 p-2 bg-white rounded-3xl border-[3px] border-emerald-500 flex flex-col items-center gap-3 shadow-lg max-w-md mx-auto z-30 animate-scaleUp">
                <h3 className="text-xl font-black text-emerald-600">
                  {room.wordle.winnerId === myId ? "🎉 لقد فزت بالمواجهة!" : room.wordle.winnerId === oppId ? "😞 حظ أوفر، لقد فاز الخصم!" : "🤝 تعادل رائع!"}
                </h3>
                <p className="text-xl font-bold text-gray-700 bg-red-50 border border-red-100 px-5 py-2 rounded-full">
                  الكلمة المخفية هي: <span className="text-red-500 font-black">{room.wordle.targetWord}</span>
                </p>
                
                {/* Match result buttons (تغيير اللعبة - لعب مرة أخرى - خروج للرئيسية) */}
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2 w-full">
                    {/* تغيير اللعبة (Now on the right/first inside DOM order) */}
                    <button
                      onClick={() => {
                        if (playSound) playSound("clickOpen");
                        socket?.emit("select_private_mode", { roomId: room.id, mode: null });
                      }}
                      className="flex-1 btn-game bg-purple-500 hover:bg-purple-600 text-white shadow-[0_4px_0_0_#7c3aed] active:shadow-transparent py-3 px-2 text-sm font-black rounded-2xl flex items-center justify-center gap-2"
                    >
                      🎮 تغيير اللعبة
                    </button>

                    {/* لعب مرة أخرى (Now on the left/second inside DOM order) */}
                    <button
                      onClick={() => {
                        if (playSound) playSound("clickOpen");
                        socket?.emit("request_wordle_rematch", { roomId: room.id });
                      }}
                      className="flex-1 btn-game bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_0_0_#047857] active:shadow-transparent py-3 px-2 text-sm font-black rounded-2xl flex items-center justify-center gap-2"
                    >
                      {room.wordle.rematchRequestedBy?.includes(myId) ? (
                        <span className="animate-pulse">🔄 بانتظار الخصم...</span>
                      ) : room.wordle.rematchRequestedBy?.includes(oppId) ? (
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
                    className="w-full btn-game bg-red-100 hover:bg-red-200 text-red-700 shadow-[0_4px_0_0_#fca5a5] active:shadow-transparent py-3 px-6 text-base font-black rounded-2xl flex items-center justify-center gap-2"
                  >
                    🚪 خروج للرئيسية
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {CategoryPageAd && <CategoryPageAd isAdmin={isAdmin} isPro={hasProPackage} />}
    </React.Fragment>
  );
}
