import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export default function ConnectFourWordsGame({
  room,
  socket,
  playerSerial,
  isAdmin,
  hasProPackage,
  CategoryPageAd,
  renderConnectFourWordsRewardBar,
  playSound,
  handleLeaveGame
}: any) {
  const me = room.players.find((p: any) => p.serial === playerSerial || p.id === socket?.id);
  const opp = room.players.find((p: any) => p.serial !== playerSerial && p.id !== socket?.id);
  
  const myId = me?.id;
  const oppId = opp?.id;

  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Time limit of 10 minutes
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (room.gameState !== "connect_four_words_playing" || !room.connectFourWords?.startTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const duration = 10 * 60 * 1000;
      const elapsed = Date.now() - room.connectFourWords.startTime;
      const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [room.gameState, room.connectFourWords?.startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isMyTurn = room.connectFourWords?.turn === myId;
  const isMeReady = room.connectFourWords?.readyPlayers?.includes(myId);

  const [flashIndex, setFlashIndex] = useState<number | null>(null);

  // Tracking last dropped cell for physics-based gravity-bounce animation
  const [lastDroppedCell, setLastDroppedCell] = useState<{ r: number, c: number, playerId: string, letter: string, timestamp: number } | null>(null);
  const prevBoardRef = useRef<any[][] | null>(null);

  useEffect(() => {
    if (!room.connectFourWords?.board) {
      prevBoardRef.current = null;
      return;
    }
    const currentBoard = room.connectFourWords.board;
    if (prevBoardRef.current) {
      let newlyAdded: { r: number, c: number, playerId: string, letter: string } | null = null;
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
          const oldCell = prevBoardRef.current[r]?.[c];
          const newCell = currentBoard[r]?.[c];
          if (newCell?.playerId && !oldCell?.playerId) {
            newlyAdded = { r, c, playerId: newCell.playerId, letter: newCell.letter };
            break;
          }
        }
        if (newlyAdded) break;
      }

      if (newlyAdded) {
        setLastDroppedCell({ ...newlyAdded, timestamp: Date.now() });
        // If the newly added piece belongs to the opponent/bot, play the drop sound for us to hear
        if (newlyAdded.playerId !== myId && playSound) {
          playSound("connect4Fall");
        }
      }
    }
    // Deep copy current board state to ref
    prevBoardRef.current = currentBoard.map((row: any[]) => row.map((cell: any) => ({ ...cell })));
  }, [room.connectFourWords?.board, myId, playSound]);

  // Reset tracking on game state reset or rematch
  useEffect(() => {
    if (room.gameState !== "connect_four_words_playing") {
      setLastDroppedCell(null);
      prevBoardRef.current = null;
    }
  }, [room.gameState]);

  // Win / Lose / Draw game end sound effects
  const prevGameStateRef = useRef<string | null>(null);
  useEffect(() => {
    if (room.gameState === "connect_four_words_finished" && prevGameStateRef.current === "connect_four_words_playing") {
      if (room.connectFourWords?.winnerId === myId) {
        if (playSound) playSound("win");
      } else if (room.connectFourWords?.winnerId === "draw" || !room.connectFourWords?.winnerId) {
        if (playSound) playSound("pop");
      } else if (room.connectFourWords?.winnerId === oppId) {
        if (playSound) playSound("lose");
      }
    }
    prevGameStateRef.current = room.gameState;
  }, [room.gameState, room.connectFourWords?.winnerId, myId, oppId, playSound]);

  const handleCellClick = (colIndex: number) => {
        if (((room.adPausedPlayersArray?.length || 0) > 0)) return;
        if (!isMyTurn || !selectedLetter || room.gameState !== "connect_four_words_playing") {
            if (isMyTurn && !selectedLetter && room.gameState === "connect_four_words_playing") {
                if (playSound) playSound("pop");
                let count = 0;
                const flashInt = setInterval(() => {
                    setFlashIndex(count % 4);
                    count++;
                    if (playSound) playSound("pop");
                    if (count > 8) {
                        clearInterval(flashInt);
                        setFlashIndex(null);
                    }
                }, 100);
            }
            return;
        }
    
    // Find bottom-most empty cell in this column
    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (!room.connectFourWords.board[r][colIndex].playerId) {
        targetRow = r;
        break;
      }
    }
    
    if (targetRow !== -1) {
      if (playSound) playSound("connect4Fall");
      socket?.emit("connect_four_words_drop", { roomId: room.id, colIndex, letter: selectedLetter });
      setSelectedLetter(null);
    }
  };

  const isWinningCell = (r: number, c: number) => {
    if (!room.connectFourWords?.winningCells) return false;
    return room.connectFourWords.winningCells.some((cell: any) => cell.r === r && cell.c === c);
  };

  const getCellColorOnly = (playerId: string, isWinning: boolean) => {
    const isP1 = playerId === room.players[0]?.id;
    const baseColor = isP1 ? "bg-red-500" : "bg-yellow-400";
    
    if (isWinning) {
      return `${baseColor} animate-pulse border-4 border-white shadow-lg shadow-white/50`;
    }
    
    return `${baseColor} border-2 border-black/20`;
  };

  const getCellColor = (playerId: string | null, isWinning: boolean) => {
    if (!playerId) return "bg-white border-2 border-blue-300";
    
    const isP1 = playerId === room.players[0]?.id;
    const baseColor = isP1 ? "bg-red-500" : "bg-yellow-400";
    
    if (isWinning) {
      return `${baseColor} animate-pulse shadow-lg shadow-white border-4 border-white`;
    }
    
    return `${baseColor} border-2 border-black/20`;
  };

  return (
    <React.Fragment>
      <div className="w-full card-game p-1.5 sm:p-3 md:p-4 text-center space-y-3 md:space-y-4 relative overflow-hidden flex flex-col min-h-[auto] bg-gradient-to-b from-blue-50 to-blue-100 border-blue-500 rounded-3xl shadow-xl">
        {renderConnectFourWordsRewardBar && renderConnectFourWordsRewardBar()}
        
        {room.gameState === "connect_four_words_setup" && (
          <div className="flex flex-col items-center justify-center py-2 z-20 relative bg-white/95 backdrop-blur-sm rounded-2xl p-2 border border-blue-200 shadow-sm w-full max-w-md mx-auto">
            <img src="/connect-4-logo.png" className="w-16 h-16 p-2 inline object-contain items-center" />
            <h2 className="text-3xl font-black text-blue-600 mb-2">كونكت فور الكلمات</h2>
            <p className="text-gray-500 font-bold mb-2 text-sm">أمامك 10 دقائق للفوز!</p>
            
            <div className="w-full bg-blue-50/60 rounded-2xl p-2 mb-2 border border-blue-100 text-right space-y-3" dir="rtl">
              <h4 className="text-blue-800 font-black text-sm flex items-center gap-1.5">
                💡 كيف تلعب وتفوز؟
              </h4>
              <ul className="text-xs text-gray-600 font-bold space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="leading-relaxed"><strong className="text-blue-700 font-black">الكلمة المستهدفة:</strong> سيتم اختيار كلمة من 4 حروف.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="leading-relaxed"><strong className="text-blue-700 font-black">دورك:</strong> اختر حرفاً من أسفل الشاشة، ثم اضغط على أي عمود في اللوحة لإسقاطه.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="leading-relaxed"><strong className="text-blue-700 font-black">طريقة الفوز:</strong> رتب الحروف لتكوين الكلمة بخط مستقيم (أفقي، رأسي، أو قطري). يمكنك قراءتها من اليمين لليسار أو العكس!</span>
                </li>
              </ul>
            </div>
            
            <div className="w-full flex flex-col gap-3">
              {!isMeReady ? (
                <button
                  onClick={() => {
                    if (playSound) playSound("clickOpen");
                    socket?.emit("start_connect_four_words", { roomId: room.id });
                  }}
                  disabled={((room.adPausedPlayersArray?.length || 0) > 0)}
                  className={`btn-game w-full ${((room.adPausedPlayersArray?.length || 0) > 0) ? "bg-gray-300 text-gray-500 shadow-none cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white shadow-[0_4px_0_0_#1d4ed8] active:shadow-transparent hover:scale-102"} py-3.5 px-2 text-xl font-black rounded-2xl transition-all flex items-center justify-center gap-2`}
                >
                  {((room.adPausedPlayersArray?.length || 0) > 0) ? "انتظر! المنافس يشاهد إعلان 📺" : "👍 موافقة وبدء اللعب"}
                </button>
              ) : (
                <div className="text-center bg-blue-50 border border-blue-100 p-4 rounded-xl w-full">
                  <p className="text-blue-600 font-black text-base animate-pulse mb-1">لقد أبديت موافقتك! 🌟</p>
                  <p className="text-gray-400 font-bold text-xs">في انتظار موافقة اللاعب الآخر لبدء اللعب...</p>
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

        {(room.gameState === "connect_four_words_playing" || room.gameState === "connect_four_words_finished") && (
          <div className="flex flex-col w-full h-full space-y-3 z-20 items-center">
            
            {/* Header */}
            <div className="flex justify-between items-center w-full mb-2 px-1 relative z-20 max-w-lg">
              <div className={`flex flex-col items-center bg-white border-2 ${myId === room.players[0]?.id ? 'border-red-500' : 'border-yellow-400'} px-3 py-1.5 rounded-xl shadow-sm min-w-[90px]`} dir="rtl">
                <span className="text-[10px] md:text-xs font-black text-gray-500 max-w-[95px] truncate text-center">
                  {me?.playerName || me?.name || "أنت"}
                </span>
                <span className={`text-xs md:text-sm font-black ${myId === room.players[0]?.id ? "text-red-500" : "text-yellow-600"} mt-0.5`}>🏆 {me?.connectFourWordsWins || 0}</span>
              </div>

              <div className="flex justify-center items-center gap-1 mx-2" dir="ltr">
                {room.gameState === "connect_four_words_finished" ? (
                  <span className="font-black text-[10px] md:text-xs text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">انتهت المباراة</span>
                ) : (
                  <div className="border-2 border-blue-300 px-3 py-1 rounded-xl shadow-sm min-w-[80px] bg-white text-center">
                    <span className={`text-lg md:text-xl font-black font-mono tracking-wider ${timeLeft <= 60 ? "text-red-600 animate-pulse" : "text-blue-700"}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
              </div>

              <div className={`flex flex-col items-center bg-white border-2 ${oppId === room.players[0]?.id ? 'border-red-500' : 'border-yellow-400'} px-3 py-1.5 rounded-xl shadow-sm min-w-[90px]`} dir="rtl">
                <span className="text-[10px] md:text-xs font-black text-gray-500 max-w-[95px] truncate text-center">
                  {opp?.playerName || opp?.name || "الخصم"}
                </span>
                <span className={`text-xs md:text-sm font-black ${oppId === room.players[0]?.id ? "text-red-500" : "text-yellow-600"} mt-0.5`}>🏆 {opp?.connectFourWordsWins || 0}</span>
              </div>
            </div>
            
            {((room.gameState === "connect_four_words_playing") || (room.gameState === "connect_four_words_finished")) && (
            <>
            
           {((room.adPausedPlayersArray?.length || 0) > 0) && !room.adPausedPlayersArray?.includes(socket?.id) && (
              <div className="w-full bg-blue-100 text-blue-800 font-bold text-center py-2 px-4 rounded-xl shadow-sm text-sm md:text-base animate-pulse">
                انتظر قليلا! اللاعب ({room.players?.find((p: any) => room.adPausedPlayersArray?.includes(p.id))?.name || "الآخر"}) يشاهد إعلان قصير 📺
              </div>
            )}

            {/* Target Word Display */}
            <div className="bg-white/90 px-6 py-1 mb-0.5 rounded-2xl shadow border-2 border-blue-200">
                <h3 className="text-sm md:text-xl font-black text-blue-800 text-center">الكلمة المستهدفة: {room.connectFourWords?.targetWord}</h3>
            </div>
            
            <div className={`mt-2 bg-blue-500 p-2 md:p-3 rounded-xl shadow-blue-500/50 border-b-8 border-blue-700 ${isMyTurn && room.gameState === "connect_four_words_playing" ? "shadow-blue-400/50" : ""}`}>
               <div className="grid grid-cols-7 gap-0">
                 {/* Invisible drop buttons column headers */}
                 {Array.from({ length: 7 }).map((_, colIndex) => (
                     <div key={`col-${colIndex}`} 
                          className={`h-6 md:h-8 bg-black/10 w-full ${room.gameState === "connect_four_words_playing" ? 'cursor-pointer hover:bg-white/20' : ''} rounded-t-lg transition-colors flex items-end justify-center`}
                          onClick={() => room.gameState === "connect_four_words_playing" && handleCellClick(colIndex)}>
                          {isMyTurn && selectedLetter && room.gameState === "connect_four_words_playing" && (
                              <div className="w-4 h-4 rounded-full bg-white/50 animate-bounce"></div>
                          )}
                     </div>
                 ))}
                 
                 {room.connectFourWords?.board.map((row: any[], rIndex: number) => (
                    <React.Fragment key={`row-${rIndex}`}>
                        {row.map((cell: any, cIndex: number) => {
                            const isWinning = isWinningCell(rIndex, cIndex);
                            const isLastDropped = lastDroppedCell && lastDroppedCell.r === rIndex && lastDroppedCell.c === cIndex;
                             
                             // Rebound bounce factors based on landing row height (physics-based bounce factor)
                             const bounceFactor = (rIndex + 1) / 6; // 1.0 at row 5 (bottom) down to 0.16 at row 0 (top)
                             const rebound1 = bounceFactor * 32; // Stronger bounce
                             const rebound2 = bounceFactor * 12; // Stronger second bounce

                             return (
                                 <div key={`${rIndex}-${cIndex}`} 
                                      onClick={() => handleCellClick(cIndex)}
                                      className="w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 relative cursor-pointer hover:opacity-100 overflow-visible flex items-center justify-center">
                                      
                                      {/* 1. Underlay for empty slot (white circle with inset shadow) */}
                                      {!cell.playerId && (
                                          <div className="absolute inset-0.5 bg-white rounded-full shadow-[inner_0_2px_4px_rgba(0,0,0,0.15)] border border-blue-300/40 z-0" />
                                      )}

                                      {/* 2. Chip Layer */}
                                      {cell.playerId && (
                                          <motion.div
                                              {...(isLastDropped ? {
                                                  initial: { y: `-${(rIndex + 1) * 110}%` },
                                                  animate: { 
                                                      y: [
                                                          `-${(rIndex + 1) * 110}%`, 
                                                          "0%", 
                                                          `-${rebound1}%`, 
                                                          "0%", 
                                                          `-${rebound2}%`, 
                                                          "0%"
                                                      ] 
                                                  },
                                                  transition: {
                                                      duration: 0.38 + (rIndex + 1) * 0.08,
                                                      times: [0, 0.55, 0.72, 0.84, 0.92, 1.0],
                                                      ease: "easeOut"
                                                  }
                                              } : {})}
                                              className={`absolute inset-0.5 rounded-full flex items-center justify-center text-sm md:text-xl font-black ${getCellColorOnly(cell.playerId, isWinning)} shadow-md z-10`}>
                                              {cell.letter && (
                                                  <span className={cell.playerId === room.players[0]?.id ? "text-white" : "text-brown-dark"}>
                                                      {cell.letter}
                                                  </span>
                                              )}
                                          </motion.div>
                                      )}

                                      {/* 3. Connect Four Board Plate Hole Mask */}
                                      <div className="absolute inset-0 z-20 pointer-events-none"
                                           style={{ background: 'radial-gradient(circle, transparent 47%, #3b82f6 49%)' }} />

                                      {/* 4. Bevel and Hole Inner Shadow */}
                                      <div className="absolute inset-0.5 rounded-full border border-black/10 z-25 pointer-events-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]" />
                                 </div>
                             );
                        })}
                    </React.Fragment>
                 ))}
               </div>
            </div>
            </>
            )}
            
            {/* Letter selection */}
            {room.gameState === "connect_four_words_playing" && (
    
                <div className="mt-1 w-full max-w-xs flex flex-col items-center">
                    <h4 className="text-sm font-bold text-gray-600 mb-2">
                        {isMyTurn ? "اختر حرفاً لإسقاطه:" : "انتظر دورك..."}
                    </h4>
                    <div className="flex gap-2 justify-center" dir="ltr">
                        {[...(room.connectFourWords?.letters || [])].reverse().map((char: string, i: number) => {
                            const isPlayer1 = myId === room.players[0]?.id;
                            const baseColorClass = isPlayer1 ? "bg-red-500 text-white" : "bg-yellow-400 text-brown-dark";
                            const selectedColorClass = isPlayer1 ? "bg-red-500 text-white scale-110 shadow-lg ring-4 ring-red-200" : "bg-yellow-400 text-brown-dark scale-110 shadow-lg ring-4 ring-yellow-200";
                            
                            return (
                            <button
                                key={`letter-${i}`}
                                onClick={() => {
                                    if (isMyTurn) {
                                        setSelectedLetter(char);
                                        if (playSound) playSound("connect4PickPiece");
                                    }
                                }}
                                disabled={!isMyTurn || ((room.adPausedPlayersArray?.length || 0) > 0)}
                                className={`w-12 h-12 md:w-14 md:h-14 border-2 border-black/20 shadow-md rounded-full flex items-center justify-center font-black text-xl md:text-2xl transition-all ${
                                    !isMyTurn ? "bg-gray-300 text-gray-500 border-2 border-black/20 shadow-md opacity-50 cursor-not-allowed" :
                                    selectedLetter === char ? selectedColorClass :
                                    `${baseColorClass} opacity-90 hover:opacity-100 hover:scale-105 shadow active:scale-95`
                                } ${flashIndex === i ? "ring-4 ring-white animate-pulse scale-110" : ""}`}
                            >
                                {char}
                            </button>
                            );
                        })}
                    </div>
                </div>

)}
{room.gameState === "connect_four_words_finished" && (
              <div className="flex w-full mt-4 p-2 bg-white rounded-3xl border-[3px] border-blue-500 flex flex-col items-center gap-3 shadow-lg max-w-md mx-auto z-30 animate-scaleUp">
                <h3 className="text-xl font-black text-blue-600">
                  {room.connectFourWords.winnerId === myId ? "🎉 لقد فزت بالمواجهة!" : room.connectFourWords.winnerId === oppId ? "😞 حظ أوفر، لقد فاز الخصم!" : "🤝 تعادل رائع!"}
                </h3>
                
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => {
                        if (playSound) playSound("clickOpen");
                        socket?.emit("select_private_mode", { roomId: room.id, mode: null });
                      }}
                      className="flex-1 btn-game bg-purple-500 hover:bg-purple-600 text-white shadow-[0_4px_0_0_#7c3aed] active:shadow-transparent py-3 px-2 text-sm font-black rounded-2xl flex items-center justify-center gap-2"
                    >
                      🎮 تغيير اللعبة
                    </button>

                    <button
                      onClick={() => {
                        if (playSound) playSound("clickOpen");
                        socket?.emit("request_connect_four_words_rematch", { roomId: room.id });
                      }}
                      disabled={((room.adPausedPlayersArray?.length || 0) > 0) || room.connectFourWords?.rematchRequestedBy?.includes(socket?.id || "")}
                      className={`flex-1 btn-game ${((room.adPausedPlayersArray?.length || 0) > 0) ? "bg-gray-300 text-gray-500 shadow-none cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white shadow-[0_4px_0_0_#1d4ed8] active:shadow-transparent"} py-3 px-2 text-sm font-black rounded-2xl flex items-center justify-center gap-2`}
                    >
                      {room.connectFourWords.rematchRequestedBy?.includes(myId) ? (
                        <span className="animate-pulse">🔄 بانتظار الخصم...</span>
                      ) : room.connectFourWords.rematchRequestedBy?.includes(oppId) ? (
                        <span>🤝 الخصم جاهز!</span>
                      ) : (
                        <span>{((room.adPausedPlayersArray?.length || 0) > 0) ? "انتظر! 📺" : "🔄 لعب مرة أخرى"}</span>
                      )}
                    </button>
                  </div>

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
