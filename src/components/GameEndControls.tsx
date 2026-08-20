import React from "react";

export const isOpponentWatchingAdInRoom = (
  roomObj: any,
  currentSocketId?: string,
  currentUserId?: string
): boolean => {
  if (!roomObj || !roomObj.adPausedPlayersArray || roomObj.adPausedPlayersArray.length === 0) return false;
  return roomObj.adPausedPlayersArray.some((id: string) => {
    if (id && (id === currentSocketId || id === currentUserId)) return false;
    const p = roomObj.players?.find((pl: any) => pl.id === id || pl.socketId === id || pl.serial === id);
    return p && !p.isBot;
  });
};

export const isAnyPlayerWatchingAdInRoom = isOpponentWatchingAdInRoom;

export interface GameEndControlsProps {
  room: any;
  socket?: any;
  myId?: string;
  playerSerial?: string;
  onRematch?: () => void;
  onLeaveGame?: () => void;
  onChangeGame?: () => void;
  isRematchRequestedByMe?: boolean;
  isRematchRequestedByOpponent?: boolean;
  rematchLabel?: string;
  playSound?: (soundName: string) => void;
  className?: string;
  buttonSize?: "sm" | "md" | "lg";
}

export const GameEndControls: React.FC<GameEndControlsProps> = ({
  room,
  socket,
  myId,
  playerSerial,
  onRematch,
  onLeaveGame,
  onChangeGame,
  isRematchRequestedByMe,
  isRematchRequestedByOpponent,
  rematchLabel = "لعب مرة أخرى!",
  playSound,
  className = "",
  buttonSize = "md",
}) => {
  const currentSocketId = socket?.id;
  const isOpponentInAd = isOpponentWatchingAdInRoom(room, currentSocketId, myId || playerSerial);

  // Auto-detect rematch array across all game structures
  const findRematchArray = (r: any): string[] => {
    if (!r) return [];
    if (Array.isArray(r.handRematchRequestedBy)) return r.handRematchRequestedBy;
    if (Array.isArray(r.xoRematchRequestedBy)) return r.xoRematchRequestedBy;
    if (Array.isArray(r.dotsRematchRequestedBy)) return r.dotsRematchRequestedBy;
    if (Array.isArray(r.iqRematchRequestedBy)) return r.iqRematchRequestedBy;
    if (Array.isArray(r.speedCupsRematchRequestedBy)) return r.speedCupsRematchRequestedBy;
    if (Array.isArray(r.busCompleteRematchRequestedBy)) return r.busCompleteRematchRequestedBy;
    if (Array.isArray(r.beachRace?.rematchRequestedBy)) return r.beachRace.rematchRequestedBy;
    if (Array.isArray(r.puzzle?.rematchRequestedBy)) return r.puzzle.rematchRequestedBy;
    if (Array.isArray(r.wordle?.rematchRequestedBy)) return r.wordle.rematchRequestedBy;
    if (Array.isArray(r.spaceWar?.rematchRequestedBy)) return r.spaceWar.rematchRequestedBy;
    if (Array.isArray(r.bombParty?.rematchRequestedBy)) return r.bombParty.rematchRequestedBy;
    if (Array.isArray(r.connectFourWords?.rematchRequestedBy)) return r.connectFourWords.rematchRequestedBy;
    return [];
  };

  const rematchArray = findRematchArray(room);
  const myIdentifiers = [currentSocketId, myId, playerSerial].filter(Boolean);

  const opponentPlayer = room?.players?.find(
    (p: any) =>
      !myIdentifiers.includes(p.id) &&
      !myIdentifiers.includes(p.socketId) &&
      !myIdentifiers.includes(p.serial)
  );
  const oppIdentifiers = opponentPlayer
    ? [opponentPlayer.id, opponentPlayer.socketId, opponentPlayer.serial].filter(Boolean)
    : [];

  const myRequestedRematch =
    isRematchRequestedByMe !== undefined
      ? isRematchRequestedByMe
      : rematchArray.some((id) => myIdentifiers.includes(id));

  const oppRequestedRematch =
    isRematchRequestedByOpponent !== undefined
      ? isRematchRequestedByOpponent
      : rematchArray.some((id) => oppIdentifiers.includes(id));

  const handleChangeGame = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      localStorage.removeItem("khamin_pending_match_ad");
    } catch (err) {}
    if (playSound) playSound("clickOpen");
    if (onChangeGame) {
      onChangeGame();
    }
    if (socket && room?.id) {
      socket.emit("play_again", { roomId: room.id });
    }
  };

  const handleRematchClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playSound) playSound("clickOpen");
    if (onRematch) {
      onRematch();
    }
  };

  const handleLeaveClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playSound) playSound("clickClose");
    if (onLeaveGame) {
      onLeaveGame();
    } else if (socket && room?.id) {
      socket.emit("leave_room", { roomId: room.id });
    }
  };

  const getRematchButtonText = () => {
    if (isOpponentInAd) return "انتظر! المنافس يشاهد إعلان 📺";
    if (myRequestedRematch) return "في انتظار المنافس...";
    if (oppRequestedRematch) return "🎮 المنافس جاهز للعب";
    return rematchLabel;
  };

  const paddingClass =
    buttonSize === "sm"
      ? "py-2 px-2 text-xs font-black"
      : buttonSize === "lg"
      ? "py-3 px-3 text-base font-black"
      : "py-2.5 px-2.5 text-xs md:text-sm font-black";

  return (
    <div className={`flex flex-col gap-2 w-full max-w-md mx-auto ${className}`} id="game-end-controls-container">
      {/* Upper row: Change Game & Play Again */}
      <div className="flex gap-2 w-full" id="game-end-top-row">
        {/* Change Game Button */}
        <button
          id="btn-change-game"
          type="button"
          disabled={isOpponentInAd}
          onClick={handleChangeGame}
          className={`flex-1 btn-game ${paddingClass} rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isOpponentInAd
              ? "bg-gray-300 text-gray-500 shadow-none cursor-not-allowed"
              : "bg-blue-100 hover:bg-blue-200 text-blue-600 shadow-[0_4px_0_0_#93c5fd] active:shadow-transparent"
          }`}
        >
          <span>تغيير اللعبة</span>
        </button>

        {/* Play Again / Rematch Button */}
        <button
          id="btn-rematch"
          type="button"
          disabled={isOpponentInAd || myRequestedRematch}
          onClick={handleRematchClick}
          className={`flex-1 btn-game ${paddingClass} rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isOpponentInAd
              ? "bg-gray-300 text-gray-500 shadow-none cursor-not-allowed"
              : oppRequestedRematch
              ? "bg-green-500 hover:bg-green-600 text-white shadow-[0_4px_0_0_#166534] active:shadow-transparent animate-pulse"
              : myRequestedRematch
              ? "bg-green-500 hover:bg-green-600 text-white shadow-[0_4px_0_0_#166534] opacity-80 cursor-not-allowed"
              : "bg-green-100 hover:bg-green-200 text-green-700 shadow-[0_4px_0_0_#86efac] active:shadow-transparent"
          }`}
        >
          <span>{getRematchButtonText()}</span>
        </button>
      </div>

      {/* Bottom row: Exit to Home */}
      <button
        id="btn-exit-to-home"
        type="button"
        onClick={handleLeaveClick}
        className={`w-full btn-game ${paddingClass} rounded-2xl bg-red-100 hover:bg-red-200 text-red-600 shadow-[0_4px_0_0_#fca5a5] active:shadow-transparent transition-all flex items-center justify-center gap-1.5 mt-1 cursor-pointer`}
      >
        <span>🚪 خروج للرئيسية</span>
      </button>
    </div>
  );
};

