// =========================================================
// Serverless & P2P Unified Game Engine
// Manages multiplayer gameplay over WebRTC (STUN) & Bot AI
// =========================================================

import { P2PConnectionManager } from "./webrtcManager";
import { getSupabaseClient } from "./supabaseClient";
import bombPartyWords from "../data/bomb-party-words.json";
import busCompleteData from "../data/busCompleteData.json";
import speedCupsCardsData from "../data/speed-cups-cards.json";
import easyGuessData from "../data/easyGuess.json";

const englishCategoryToArabic: Record<string, string> = {
  "insects": "حشرات",
  "animals": "حيوانات",
  "birds": "طيور",
  "food": "أكلات",
  "football": "كرة القدم",
  "objects": "جماد",
  "plants": "نبات",
  "people": "اشخاص",
};

function generateIQBoard(size: number, category: string = "animals"): string[] {
  const totalCards = size * size;
  const numPairs = totalCards / 2;

  const arabCat = englishCategoryToArabic[category] || "حيوانات";
  const categoryWords = (easyGuessData as any)[arabCat];

  let imageNames: string[] = [];
  if (categoryWords) {
    imageNames = Object.keys(categoryWords);
  }

  // Shuffle image names
  imageNames.sort(() => Math.random() - 0.5);

  const cards: string[] = [];
  for (let i = 0; i < numPairs; i++) {
    // We strictly use the images from the category list
    const imgName = imageNames[i % imageNames.length];
    const imgUrl = `/api/image/${encodeURIComponent(category)}/${encodeURIComponent(imgName)}`;
    cards.push(imgUrl);
    cards.push(imgUrl);
  }

  return cards.sort(() => Math.random() - 0.5);
}

export interface VirtualRoom {
  id: string;
  gameState: string;
  category?: string;
  timer: number;
  players: any[];
  isP2P?: boolean;
  p2pManager?: P2PConnectionManager | null;
  beachRace?: any;
  spaceWar?: any;
  wordle?: any;
  puzzle?: any;
  connectFourWords?: any;
  bombParty?: any;
  xoBoard?: (string | null)[];
  xoTurn?: string | null;
  xoXPlayer?: string | null;
  xoOPlayer?: string | null;
  xoWinner?: string | null;
  xoLevel?: number;
  xoWinLength?: number;
  xoBoardSize?: number;
  handGrid?: any[];
  selectionMode?: string | null;
  [key: string]: any;
}

export type RoomUpdateCallback = (room: VirtualRoom) => void;
export type EventCallback = (data: any) => void;

export class GameEngineService {
  private static currentRoom: VirtualRoom | null = null;
  private static onRoomUpdateCallback: RoomUpdateCallback | null = null;
  private static customListeners: Map<string, Set<EventCallback>> = new Map();
  private static botTimer: any = null;

  /**
   * Set callback to update React room state
   */
  public static setOnRoomUpdate(callback: RoomUpdateCallback) {
    this.onRoomUpdateCallback = callback;
  }

  /**
   * Register custom event listeners (like socket.on)
   */
  public static on(event: string, callback: EventCallback) {
    if (!this.customListeners.has(event)) {
      this.customListeners.set(event, new Set());
    }
    this.customListeners.get(event)!.add(callback);
  }

  public static off(event: string, callback: EventCallback) {
    if (this.customListeners.has(event)) {
      this.customListeners.get(event)!.delete(callback);
    }
  }

  public static triggerEvent(event: string, data: any = {}) {
    const listeners = this.customListeners.get(event);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[GameEngine] Error in listener "${event}":`, e);
        }
      });
    }
  }

  /**
   * Broadcast room state update to local React state and P2P peer
   */
  public static updateRoom(partialRoom: Partial<VirtualRoom>) {
    if (!this.currentRoom) return;
    this.currentRoom = { ...this.currentRoom, ...partialRoom };

    if (this.onRoomUpdateCallback) {
      this.onRoomUpdateCallback(this.currentRoom);
    }

    if (this.currentRoom.p2pManager && this.currentRoom.p2pManager.isConnected) {
      this.currentRoom.p2pManager.emit("sync_room_state", { room: this.currentRoom });
    }
  }

  /**
   * Initialize a new room
   */
  public static initRoom(room: VirtualRoom) {
    if (this.botTimer) {
      clearInterval(this.botTimer);
      this.botTimer = null;
    }

    this.currentRoom = room;

    // Attach P2P listeners if P2P manager is present
    if (room.p2pManager) {
      room.p2pManager.on("sync_room_state", (payload: any) => {
        if (payload?.room) {
          this.currentRoom = { ...this.currentRoom, ...payload.room };
          if (this.onRoomUpdateCallback) {
            this.onRoomUpdateCallback(this.currentRoom!);
          }
        }
      });

      room.p2pManager.on("game_event", (payload: any) => {
        if (payload?.event) {
          this.triggerEvent(payload.event, payload.data);
        }
      });
    }

    if (this.onRoomUpdateCallback) {
      this.onRoomUpdateCallback(this.currentRoom);
    }
  }

  public static getCurrentRoom(): VirtualRoom | null {
    return this.currentRoom;
  }

  /**
   * Send game actions / events (Interprets actions for P2P and Bot AI)
   */
  public static handleAction(event: string, payload: any = {}) {
    if (!this.currentRoom) return;

    const me = this.currentRoom.players[0];
    const opp = this.currentRoom.players[1];
    const isBot = opp?.isBot || !this.currentRoom.p2pManager;

    // 1. If connected via P2P to a real player, send event
    if (this.currentRoom.p2pManager && this.currentRoom.p2pManager.isConnected) {
      this.currentRoom.p2pManager.emit("game_event", { event, data: payload });
    }

    // 2. Process Game Action Logic
    switch (event) {
      // -------------------------------------------------------------
      // Selection Mode & Game Transition
      // -------------------------------------------------------------
      case "propose_selection_mode": {
        const mode = payload.mode;
        if (isBot) {
          // Bot agrees immediately to the selected game mode
          this.setupGameMode(mode);
        } else {
          // P2P: Set player's proposed mode
          const updatedPlayers = this.currentRoom.players.map((p) =>
            p.id === payload.playerId ? { ...p, selectedSelectionMode: mode } : p
          );
          const bothAgreed = updatedPlayers.every((p) => p.selectedSelectionMode === mode);
          if (bothAgreed) {
            this.setupGameMode(mode);
          } else {
            this.updateRoom({ players: updatedPlayers });
          }
        }
        break;
      }

      // -------------------------------------------------------------
      // 1. Beach Race (سباق الشاطئ)
      // -------------------------------------------------------------
      case "start_beach_race": {
        const playerId = payload.playerId || me?.id;
        const currentBR = this.currentRoom.beachRace || {};
        const readyPlayers = Array.from(new Set([...(currentBR.readyPlayers || []), playerId]));

        if (isBot || readyPlayers.length >= this.currentRoom.players.length) {
          const wordList = ["باندا", "أسد", "صقر", "قمر", "شمس", "نجم", "سفينة", "بحر", "طائرة", "قطار"];
          const targetWord = wordList[Math.floor(Math.random() * wordList.length)];
          this.updateRoom({
            gameState: "beach_race_playing",
            beachRace: {
              targetWord,
              questionIds: ["q_hint_1", "q_hint_2"],
              readyPlayers: this.currentRoom.players.map((p) => p.id),
              winnerId: null,
              playersProgress: {},
              rematchRequestedBy: [],
            },
          });

          if (isBot) {
            this.startBotBeachRunner();
          }
        } else {
          this.updateRoom({
            beachRace: {
              ...currentBR,
              readyPlayers,
            },
          });
        }
        break;
      }

      case "beach_race_update_progress": {
        const dist = payload.distance || 0;
        const playerId = payload.playerId || me?.id;
        const currentBeachRace = this.currentRoom.beachRace || {};
        const playersProgress = {
          ...(currentBeachRace.playersProgress || {}),
          [playerId]: { distance: dist, collectedLetters: payload.collectedLetters || [] },
        };

        this.updateRoom({
          beachRace: {
            ...currentBeachRace,
            playersProgress,
          },
        });

        this.triggerEvent("beach_race_progress_updated", {
          playerId,
          distance: dist,
        });
        break;
      }

      case "beach_race_submit_guess": {
        const guess = payload.guessWord || "";
        const playerId = payload.playerId || me?.id;
        const carrotsCount = payload.carrotsCount || 0;
        const currentBeachRace = this.currentRoom.beachRace || {};
        const target = currentBeachRace.targetWord || "";

        const normalizeArabic = (text: string) => {
          if (!text) return "";
          return text
            .replace(/[\u064B-\u0652\u0670]/g, "")
            .replace(/[أإآء]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي")
            .replace(/ؤ/g, "و")
            .replace(/ئ/g, "ي")
            .replace(/لآ/g, "لا")
            .replace(/[ـ]/g, "")
            .replace(/[؟?]/g, "")
            .replace(/\s+/g, "")
            .trim();
        };

        if (normalizeArabic(guess) === normalizeArabic(target)) {
          const updatedPlayers = this.currentRoom.players.map((p) =>
            p.id === playerId ? { ...p, beachRaceWins: (p.beachRaceWins || 0) + 1 } : p
          );

          this.updateRoom({
            players: updatedPlayers,
            gameState: "beach_race_finished",
            beachRace: {
              ...currentBeachRace,
              winnerId: playerId,
            },
          });
          this.triggerEvent("beach_race_finished", { winnerId: playerId });
          this.saveMatchReward(playerId, 10 + Math.floor(carrotsCount / 10));
        } else {
          this.triggerEvent("beach_race_wrong_guess", { playerId });
        }
        break;
      }

      case "beach_race_time_up": {
        const currentBeachRace = this.currentRoom.beachRace || {};
        this.updateRoom({
          gameState: "beach_race_finished",
          beachRace: {
            ...currentBeachRace,
            winnerId: null,
          },
        });
        this.triggerEvent("beach_race_finished", { winnerId: null });
        break;
      }

      case "request_beach_race_rematch": {
        const currentBeachRace = this.currentRoom.beachRace || {};
        const currentList = currentBeachRace.rematchRequestedBy || [];
        const updatedList = Array.from(new Set([...currentList, payload.playerId || me?.id]));

        if (isBot || updatedList.length >= this.currentRoom.players.length) {
          this.setupGameMode("beach_race");
        } else {
          this.updateRoom({
            beachRace: {
              ...currentBeachRace,
              rematchRequestedBy: updatedList,
            },
          });
        }
        break;
      }

      // -------------------------------------------------------------
      // 2. Space War (حرب الفضاء)
      // -------------------------------------------------------------
      case "space_war_ready": {
        const playerId = payload.playerId || me?.id;
        const currentSpaceWar = this.currentRoom.spaceWar || {};
        const readyPlayers = Array.from(new Set([...(currentSpaceWar.readyPlayers || []), playerId]));
        
        if (isBot || readyPlayers.length >= this.currentRoom.players.length) {
          this.handleAction("start_space_war");
        } else {
          this.updateRoom({
            spaceWar: {
              ...currentSpaceWar,
              readyPlayers,
            },
          });
        }
        break;
      }

      case "start_space_war": {
        const words = ["صاروخ", "كوكب", "مجرة", "فضاء", "شهاب", "مذنب", "مدار"];
        const p1Word = words[Math.floor(Math.random() * words.length)];
        const p2Word = words[Math.floor(Math.random() * words.length)];

        this.updateRoom({
          gameState: "space_war_playing",
          spaceWar: {
            p1Word,
            p2Word,
            p1Revealed: [],
            p2Revealed: [],
            winnerId: null,
            startTime: Date.now(),
            readyPlayers: this.currentRoom.players.map((p) => p.id),
          },
        });

        if (isBot) {
          this.startBotSpaceWar();
        }
        break;
      }

      case "space_war_powerup": {
        this.triggerEvent("space_war_powerup", payload);
        this.triggerEvent("space_war_powerup_received", payload);
        break;
      }

      case "space_war_unreveal_index": {
        const currentSpaceWar = this.currentRoom.spaceWar || {};
        const p1Revealed = (currentSpaceWar.p1Revealed || []).filter((idx: number) => idx !== payload.index);
        this.updateRoom({
          spaceWar: {
            ...currentSpaceWar,
            p1Revealed,
          },
        });
        break;
      }

      case "space_war_reveal_index": {
        const idx = payload.index;
        const currentSpaceWar = this.currentRoom.spaceWar || {};
        const isMeP1 = me?.id === this.currentRoom.players[0]?.id;
        const p1Revealed = [...(currentSpaceWar.p1Revealed || []), idx];
        const isWin = p1Revealed.length >= (currentSpaceWar.p1Word?.length || 5);

        this.updateRoom({
          spaceWar: {
            ...currentSpaceWar,
            p1Revealed,
            winnerId: isWin ? me?.id : null,
          },
          gameState: isWin ? "space_war_finished" : "space_war_playing",
        });

        if (isWin) {
          this.saveMatchReward(me?.id, 20);
        }
        break;
      }

      case "space_war_timeup": {
        const currentSpaceWar = this.currentRoom.spaceWar || {};
        const p1Count = (currentSpaceWar.p1Revealed || []).length;
        const p2Count = (currentSpaceWar.p2Revealed || []).length;
        let winnerId: string | null = null;
        if (p1Count > p2Count) winnerId = this.currentRoom.players[0]?.id;
        else if (p2Count > p1Count) winnerId = this.currentRoom.players[1]?.id;

        this.updateRoom({
          spaceWar: {
            ...currentSpaceWar,
            winnerId,
          },
          gameState: "space_war_finished",
        });
        break;
      }

      case "request_space_war_rematch": {
        this.setupGameMode("space_war");
        break;
      }

      // -------------------------------------------------------------
      // 3. Wordle Game (وردل الكلمات)
      // -------------------------------------------------------------
      case "start_wordle": {
        const playerId = payload.playerId || me?.id;
        const currentW = this.currentRoom.wordle || {};
        const readyPlayers = Array.from(new Set([...(currentW.readyPlayers || []), playerId]));

        if (isBot || readyPlayers.length >= this.currentRoom.players.length) {
          const targetWords = (bombPartyWords as string[]).filter((w) => w.length === 5);
          const targetWord = targetWords[Math.floor(Math.random() * targetWords.length)] || "كواكب";

          this.updateRoom({
            gameState: "wordle_playing",
            wordle: {
              targetWord,
              startTime: Date.now(),
              pausedAt: null,
              guesses: { [me?.id]: [], [opp?.id]: [] },
              readyPlayers: this.currentRoom.players.map((p) => p.id),
              winnerId: null,
              rematchRequestedBy: [],
            },
          });

          if (isBot) {
            this.startBotWordle();
          }
        } else {
          this.updateRoom({
            wordle: {
              ...currentW,
              readyPlayers,
            },
          });
        }
        break;
      }

      case "wordle_guess": {
        const word = payload.word;
        const playerId = payload.playerId || me?.id;
        const currentWordle = this.currentRoom.wordle || {};
        const target = currentWordle.targetWord || "كواكب";

        const result: string[] = [];
        for (let i = 0; i < word.length; i++) {
          if (word[i] === target[i]) {
            result.push("correct");
          } else if (target.includes(word[i])) {
            result.push("present");
          } else {
            result.push("absent");
          }
        }

        const isWin = result.every((r) => r === "correct");
        const existingGuesses = currentWordle.guesses?.[playerId] || [];
        const updatedGuesses = [...existingGuesses, { word, result }];

        const updatedPlayers = isWin
          ? this.currentRoom.players.map((p) =>
              p.id === playerId ? { ...p, wordleWins: (p.wordleWins || 0) + 1 } : p
            )
          : this.currentRoom.players;

        this.updateRoom({
          players: updatedPlayers,
          wordle: {
            ...currentWordle,
            guesses: {
              ...(currentWordle.guesses || {}),
              [playerId]: updatedGuesses,
            },
            winnerId: isWin ? playerId : currentWordle.winnerId,
          },
          gameState: isWin ? "wordle_finished" : "wordle_playing",
        });

        if (isWin) {
          this.saveMatchReward(playerId, 15);
        }
        break;
      }

      case "wordle_pause": {
        const currentWordle = this.currentRoom.wordle || {};
        this.updateRoom({
          wordle: {
            ...currentWordle,
            pausedAt: Date.now(),
          },
        });
        break;
      }

      case "wordle_resume": {
        const currentWordle = this.currentRoom.wordle || {};
        if (currentWordle.pausedAt && currentWordle.startTime) {
          const elapsedPaused = Date.now() - currentWordle.pausedAt;
          this.updateRoom({
            wordle: {
              ...currentWordle,
              startTime: currentWordle.startTime + elapsedPaused,
              pausedAt: null,
            },
          });
        } else {
          this.updateRoom({
            wordle: {
              ...currentWordle,
              pausedAt: null,
            },
          });
        }
        break;
      }

      case "request_wordle_rematch": {
        const currentWordle = this.currentRoom.wordle || {};
        const currentList = currentWordle.rematchRequestedBy || [];
        const updatedList = Array.from(new Set([...currentList, payload.playerId || me?.id]));

        if (isBot || updatedList.length >= this.currentRoom.players.length) {
          this.setupGameMode("wordle");
        } else {
          this.updateRoom({
            wordle: {
              ...currentWordle,
              rematchRequestedBy: updatedList,
            },
          });
        }
        break;
      }

      // -------------------------------------------------------------
      // 4. Puzzle Game (البازل)
      // -------------------------------------------------------------
      case "start_puzzle": {
        const categories = ["حيوانات", "أكلات", "أشياء", "شخصيات"];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)] || "حيوانات";
        const imagesList = [
          { category: "حيوانات", name: "أسد" },
          { category: "حيوانات", name: "باندا" },
          { category: "حيوانات", name: "أرنب" },
        ];

        this.updateRoom({
          gameState: "puzzle_playing",
          puzzle: {
            currentRound: 1,
            totalRounds: 3,
            roundStartTime: Date.now(),
            lastChanceStartTime: null,
            images: imagesList,
            playersProgress: { [me?.id]: 0, [opp?.id]: 0 },
            totalScores: { [me?.id]: 0, [opp?.id]: 0 },
            rematchRequestedBy: [],
            winnerId: null,
          },
        });

        if (isBot) {
          this.startBotPuzzleProgress();
        }
        break;
      }

      case "puzzle_progress": {
        const prog = payload.progress || 0;
        const currentPuzzle = this.currentRoom.puzzle || {};
        const playersProgress = { ...(currentPuzzle.playersProgress || {}), [me?.id]: prog };

        this.updateRoom({
          puzzle: {
            ...currentPuzzle,
            playersProgress,
          },
        });
        break;
      }

      case "puzzle_done": {
        const currentPuzzle = this.currentRoom.puzzle || {};
        // Trigger last chance 20s for opponent
        this.updateRoom({
          puzzle: {
            ...currentPuzzle,
            lastChanceStartTime: Date.now(),
          },
        });
        break;
      }

      case "puzzle_round_end": {
        const currentPuzzle = this.currentRoom.puzzle || {};
        const currentRound = currentPuzzle.currentRound || 1;
        const p1Score = (currentPuzzle.totalScores?.[me?.id] || 0) + (currentPuzzle.playersProgress?.[me?.id] || 0);
        const p2Score = (currentPuzzle.totalScores?.[opp?.id] || 0) + (currentPuzzle.playersProgress?.[opp?.id] || 0);

        if (currentRound >= 3) {
          // Final match end
          let winnerId = null;
          if (p1Score > p2Score) winnerId = me?.id;
          else if (p2Score > p1Score) winnerId = opp?.id;

          this.updateRoom({
            gameState: "puzzle_finished",
            puzzle: {
              ...currentPuzzle,
              totalScores: { [me?.id]: p1Score, [opp?.id]: p2Score },
              playersProgress: { [me?.id]: 0, [opp?.id]: 0 },
              lastChanceStartTime: null,
              winnerId,
            },
          });

          if (winnerId === me?.id) {
            this.saveMatchReward(me?.id, 25);
          }
        } else {
          // Next round
          this.updateRoom({
            puzzle: {
              ...currentPuzzle,
              currentRound: currentRound + 1,
              roundStartTime: Date.now(),
              lastChanceStartTime: null,
              totalScores: { [me?.id]: p1Score, [opp?.id]: p2Score },
              playersProgress: { [me?.id]: 0, [opp?.id]: 0 },
            },
          });

          if (isBot) {
            this.startBotPuzzleProgress();
          }
        }
        break;
      }

      case "request_puzzle_rematch": {
        const currentPuzzle = this.currentRoom.puzzle || {};
        const currentList = currentPuzzle.rematchRequestedBy || [];
        const updatedList = Array.from(new Set([...currentList, payload.playerId || me?.id]));

        if (isBot || updatedList.length >= this.currentRoom.players.length) {
          this.setupGameMode("puzzle");
        } else {
          this.updateRoom({
            puzzle: {
              ...currentPuzzle,
              rematchRequestedBy: updatedList,
            },
          });
        }
        break;
      }

      // -------------------------------------------------------------
      // 5. Connect Four Words (أربعة أحرف وكلمة)
      // -------------------------------------------------------------
      case "start_connect_four_words": {
        const playerId = payload.playerId || me?.id;
        const currentC4 = this.currentRoom.connectFourWords || {};
        const readyPlayers = Array.from(new Set([...(currentC4.readyPlayers || []), playerId]));

        if (isBot || readyPlayers.length >= this.currentRoom.players.length) {
          const validWords = ["كتاب", "فضاء", "سحاب", "شجرة", "طائر", "أرنب", "نحلة", "قارب", "هاتف", "نجمة", "أبيض", "أزرق", "أحمر", "أخضر", "غزال", "هلال", "وردة", "سماء", "شاطئ", "منزل"];
          const targetWord = validWords[Math.floor(Math.random() * validWords.length)];
          const letters = targetWord.split("");
          const board = Array(6).fill(null).map(() => Array(7).fill(null).map(() => ({ playerId: null, letter: null })));

          this.updateRoom({
            gameState: "connect_four_words_playing",
            connectFourWords: {
              board,
              targetWord,
              letters,
              turn: me?.id,
              startTime: Date.now(),
              readyPlayers: this.currentRoom.players.map((p) => p.id),
              winningCells: null,
              winnerId: null,
              rematchRequestedBy: [],
            },
          });
        } else {
          this.updateRoom({
            connectFourWords: {
              ...currentC4,
              readyPlayers,
            },
          });
        }
        break;
      }

      case "connect_four_words_drop": {
        const { colIndex, letter } = payload;
        const playerId = payload.playerId || me?.id;
        const currentC4 = this.currentRoom.connectFourWords;
        if (!currentC4 || !currentC4.board) break;

        const board = currentC4.board.map((row: any[]) => row.map((cell: any) => ({ ...cell })));
        let targetRow = -1;
        for (let r = 5; r >= 0; r--) {
          if (!board[r][colIndex].playerId) {
            targetRow = r;
            break;
          }
        }

        if (targetRow === -1) break;

        board[targetRow][colIndex] = { playerId, letter };
        const winResult = this.checkConnectFourWin(board, currentC4.targetWord, playerId);

        if (winResult) {
          const updatedPlayers = this.currentRoom.players.map((p) =>
            p.id === playerId ? { ...p, connectFourWordsWins: (p.connectFourWordsWins || 0) + 1 } : p
          );
          this.updateRoom({
            players: updatedPlayers,
            gameState: "connect_four_words_finished",
            connectFourWords: {
              ...currentC4,
              board,
              winningCells: winResult,
              winnerId: playerId,
            },
          });

          if (playerId === me?.id) {
            this.saveMatchReward(me?.id, 20);
          }
        } else {
          const isFull = board[0].every((cell: any) => cell.playerId !== null);
          if (isFull) {
            this.updateRoom({
              gameState: "connect_four_words_finished",
              connectFourWords: {
                ...currentC4,
                board,
                winningCells: null,
                winnerId: "draw",
              },
            });
          } else {
            const nextTurn = playerId === me?.id ? opp?.id : me?.id;
            this.updateRoom({
              connectFourWords: {
                ...currentC4,
                board,
                turn: nextTurn,
              },
            });

            if (isBot && nextTurn === opp?.id) {
              setTimeout(() => this.makeBotConnectFourMove(), 1000);
            }
          }
        }
        break;
      }

      case "request_connect_four_words_rematch": {
        const currentC4 = this.currentRoom.connectFourWords || {};
        const currentList = currentC4.rematchRequestedBy || [];
        const updatedList = Array.from(new Set([...currentList, payload.playerId || me?.id]));

        if (isBot || updatedList.length >= this.currentRoom.players.length) {
          this.setupGameMode("connect_four_words");
        } else {
          this.updateRoom({
            connectFourWords: {
              ...currentC4,
              rematchRequestedBy: updatedList,
            },
          });
        }
        break;
      }

      // -------------------------------------------------------------
      // 6. XO Game
      // -------------------------------------------------------------
      case "submit_xo_move": {
        const idx = payload.index;
        const playerId = payload.playerId || me?.id;
        const boardSize = this.currentRoom.xoBoardSize || 3;
        const winLength = this.currentRoom.xoWinLength || 3;
        const currentBoard = [...(this.currentRoom.xoBoard || Array(boardSize * boardSize).fill(null))];
        const xoXPlayer = this.currentRoom.xoXPlayer || me?.id;
        const isX = playerId === xoXPlayer;
        
        if (currentBoard[idx] !== null) break;
        currentBoard[idx] = isX ? "X" : "O";

        const winResult = this.checkXOWinnerN(currentBoard, boardSize, winLength);
        const isFull = currentBoard.every((cell) => cell !== null);

        let winnerId: string | null = null;
        if (winResult) {
          winnerId = winResult.winner === "X" ? this.currentRoom.xoXPlayer : this.currentRoom.xoOPlayer;
        }

        const matchWins = { ...(this.currentRoom.xoMatchWins || {}) };
        if (winnerId) {
          matchWins[winnerId] = (matchWins[winnerId] || 0) + 1;
        }

        let updatedPlayers = this.currentRoom.players;
        if (winnerId) {
          updatedPlayers = this.currentRoom.players.map((p) =>
            p.id === winnerId ? { ...p, xoWins: (p.xoWins || 0) + 1 } : p
          );
        }

        const nextTurn = playerId === me?.id ? opp?.id : me?.id;

        this.updateRoom({
          players: updatedPlayers,
          xoBoard: currentBoard,
          xoTurn: winResult || isFull ? null : nextTurn,
          gameState: winResult || isFull ? "xo_finished" : "xo_playing",
          xoWinner: winResult ? winnerId : isFull ? "draw" : null,
          xoWinningLine: winResult ? winResult.line : null,
          xoMatchWins: matchWins,
        });

        if (winnerId) {
          this.saveMatchReward(winnerId, 10);
        } else if (isBot && !winResult && !isFull && nextTurn === opp?.id) {
          setTimeout(() => this.makeBotXOMove(), 600);
        }
        break;
      }

      case "restart_xo": {
        const currentLevel = this.currentRoom.xoLevel || 1;
        const nextLevel = currentLevel < 8 ? currentLevel + 1 : 1;
        const boardSize = this.getXOBoardSize(nextLevel);
        const winLength = this.getXOWinLength(nextLevel);

        this.updateRoom({
          gameState: "xo_playing",
          selectionMode: "xo",
          xoBoard: Array(boardSize * boardSize).fill(null),
          xoXPlayer: me?.id,
          xoOPlayer: opp?.id,
          xoTurn: me?.id,
          xoBoardSize: boardSize,
          xoWinLength: winLength,
          xoLevel: nextLevel,
          xoWinningLine: null,
          xoWinner: null,
        });

        if (isBot && me?.id !== this.currentRoom.players[0]?.id) {
          setTimeout(() => this.makeBotXOMove(), 600);
        }
        break;
      }

      // -------------------------------------------------------------
      // Bomb Party (قنبلة الكلمات)
      // -------------------------------------------------------------
      case "start_bomb_party":
      case "request_bomb_party_rematch": {
        const words = bombPartyWords as string[];
        const substring = GameEngineService.getRandomBombPartySubstring(words);
        const turnPlayerId = me?.id || this.currentRoom.players[0]?.id;

        const stats: { [key: string]: { correct: number; incorrect: number } } = {};
        this.currentRoom.players.forEach((p) => {
          stats[p.id] = { correct: 0, incorrect: 0 };
        });

        this.updateRoom({
          gameState: "bomb_party_playing",
          selectionMode: "bomb_party",
          bombParty: {
            turnPlayerId,
            bombStartTime: Date.now(),
            turnTimeLimit: 20000,
            currentSubstring: substring,
            usedWords: [],
            gameOver: false,
            explodedPlayerId: null,
            matchWinnerId: null,
            stats,
          },
        });

        GameEngineService.startBombPartyTimer();

        if (isBot && turnPlayerId === opp?.id) {
          GameEngineService.scheduleBotBombParty();
        }
        break;
      }

      case "bomb_party_guess": {
        const bp = this.currentRoom.bombParty;
        if (!bp || bp.gameOver) break;

        const playerId = payload.playerId || me?.id;
        if (bp.turnPlayerId !== playerId) break;

        const word = (payload.word || "").trim();
        if (!word) break;

        const normalize = (str: string) =>
          str.replace(/[\u064B-\u0652\u0670]/g, "").replace(/[أإآء]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, "").trim();

        const words = bombPartyWords as string[];
        const normWord = normalize(word);
        const normSub = normalize(bp.currentSubstring);

        const containsSub = normWord.includes(normSub);
        const isValidWord = words.some((w) => normalize(w) === normWord);
        const notUsed = !(bp.usedWords || []).some((w: string) => normalize(w) === normWord);

        const stats = { ...(bp.stats || {}) };
        if (!stats[playerId]) stats[playerId] = { correct: 0, incorrect: 0 };

        if (containsSub && isValidWord && notUsed) {
          stats[playerId].correct += 1;
          const usedWords = [...(bp.usedWords || []), word];
          const nextTurnPlayer = this.currentRoom.players.find((p) => p.id !== playerId)?.id || playerId;
          const nextSubstring = GameEngineService.getRandomBombPartySubstring(words);

          this.updateRoom({
            bombParty: {
              ...bp,
              turnPlayerId: nextTurnPlayer,
              bombStartTime: Date.now(),
              turnTimeLimit: 20000,
              currentSubstring: nextSubstring,
              usedWords,
              stats,
            },
          });

          this.triggerEvent("bomb_party_correct_guess", { playerId, word });

          if (isBot && nextTurnPlayer === opp?.id) {
            GameEngineService.scheduleBotBombParty();
          }
        } else {
          stats[playerId].incorrect += 1;
          this.updateRoom({
            bombParty: {
              ...bp,
              stats,
            },
          });
          this.triggerEvent("bomb_party_error", { playerId, word });
        }
        break;
      }

      // -------------------------------------------------------------
      // Bus Complete (أتوبيس كومبليت / تخمينة كومبليت)
      // -------------------------------------------------------------
      case "search_bus_complete_letter": {
        const letters = ["أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي"];
        const chosenLetter = letters[Math.floor(Math.random() * letters.length)];

        this.updateRoom({
          gameState: "bus_complete_spin",
          busCompleteLetter: chosenLetter,
          busCompleteHideResults: !!payload.hideResults,
          busCompleteSubmittedPlayers: [],
          busCompleteAnswers: {},
          busCompleteDraftAnswers: {},
          busCompleteScores: {},
          busCompleteWinner: null,
          busCompleteSubmitTimes: {},
          timer: 300,
        });

        setTimeout(() => {
          if (!this.currentRoom || this.currentRoom.gameState !== "bus_complete_spin") return;
          this.updateRoom({
            gameState: "bus_complete_playing",
            timer: 300,
          });
          GameEngineService.startBusCompleteTimer();

          if (isBot) {
            GameEngineService.scheduleBotBusComplete();
          }
        }, 1500);
        break;
      }

      case "update_bus_answers_draft": {
        const playerId = payload.playerId || me?.id;
        const answers = payload.answers || {};
        this.updateRoom({
          busCompleteDraftAnswers: {
            ...(this.currentRoom.busCompleteDraftAnswers || {}),
            [playerId]: answers,
          },
        });
        break;
      }

      case "submit_bus_complete": {
        const playerId = payload.playerId || me?.id;
        const answers = payload.answers || {};
        const currentSubmitted = this.currentRoom.busCompleteSubmittedPlayers || [];

        if (!currentSubmitted.includes(playerId)) {
          const newSubmitted = [...currentSubmitted, playerId];
          const newAnswers = {
            ...(this.currentRoom.busCompleteAnswers || {}),
            [playerId]: answers,
          };
          const elapsed = 300 - (this.currentRoom.timer || 300);
          const newTimes = {
            ...(this.currentRoom.busCompleteSubmitTimes || {}),
            [playerId]: elapsed,
          };

          this.updateRoom({
            busCompleteSubmittedPlayers: newSubmitted,
            busCompleteAnswers: newAnswers,
            busCompleteSubmitTimes: newTimes,
          });

          if (isBot || newSubmitted.length >= this.currentRoom.players.length) {
            GameEngineService.evaluateBusCompleteScores();
          }
        }
        break;
      }

      case "undo_bus_complete": {
        const playerId = payload.playerId || me?.id;
        const currentSubmitted = this.currentRoom.busCompleteSubmittedPlayers || [];
        const updatedSubmitted = currentSubmitted.filter((id) => id !== playerId);

        this.updateRoom({
          busCompleteSubmittedPlayers: updatedSubmitted,
        });
        break;
      }

      case "request_bus_complete_rematch": {
        this.setupGameMode("bus_complete");
        break;
      }

      // -------------------------------------------------------------
      // Hand Khamin (كف يد / يد تخمينة)
      // -------------------------------------------------------------
      case "hand_pick_number": {
        const num = payload.number;
        const opp = this.currentRoom.players[1];

        this.updateRoom({
          handTargetNumber: num,
          handPhase: "searching",
          timer: 30,
        });

        if (isBot && this.currentRoom.handSearcherId === opp?.id) {
          GameEngineService.scheduleBotHandSearch();
        }
        if (isBot && this.currentRoom.handPickerId === opp?.id) {
          GameEngineService.startBotHandGridFill();
        }
        break;
      }

      case "hand_select_number": {
        const num = payload.number;
        this.updateRoom({
          handSearcherSelected: num,
        });
        break;
      }

      case "hand_ring_bell": {
        this.triggerEvent("hand_bell_rung", {});
        const room = this.currentRoom;
        if (!room || room.handPhase !== "searching") break;

        if (room.handSearcherSelected === room.handTargetNumber) {
          GameEngineService.finishHandRound();
        } else {
          this.triggerEvent("hand_wrong_guess", {});
        }
        break;
      }

      case "hand_click_cell": {
        const room = this.currentRoom;
        if (!room || room.handPhase !== "searching" || !room.handGrid) break;

        const pickerId = room.handPickerId || payload.playerId;
        const nextIdx = room.handGrid.findIndex((c: any) => c === null);
        if (nextIdx !== -1) {
          const updatedGrid = [...room.handGrid];
          updatedGrid[nextIdx] = pickerId;
          this.updateRoom({
            handGrid: updatedGrid,
          });

          if (updatedGrid.every((c: any) => c !== null)) {
            GameEngineService.finishHandRound();
          }
        }
        break;
      }

      case "request_hand_rematch": {
        this.setupGameMode("hand_khamin");
        break;
      }

      // -------------------------------------------------------------
      // Dots & Boxes (توصيل النقاط / نقطة وخط)
      // -------------------------------------------------------------
      case "submit_dots_move": {
        const room = this.currentRoom;
        if (!room || (room.gameState !== "dots_playing" && room.gameState !== "dots_finished")) break;

        const { r1, c1, r2, c2 } = payload;
        const lineId = `${r1},${c1}-${r2},${c2}`;

        if (room.dotsLines && room.dotsLines[lineId]) break;

        const pid = payload.playerId || room.dotsTurn;
        const updatedLines = { ...(room.dotsLines || {}), [lineId]: pid };
        const size = room.dotsBoardSize || 4;

        const currentBoxes = { ...(room.dotsBoxes || {}) };
        const newBoxes: Record<string, string> = {};
        let newBoxesCount = 0;

        for (let br = 0; br < size - 1; br++) {
          for (let bc = 0; bc < size - 1; bc++) {
            const boxKey = `${br},${bc}`;
            if (!currentBoxes[boxKey]) {
              const top = `${br},${bc}-${br},${bc+1}`;
              const bot = `${br+1},${bc}-${br+1},${bc+1}`;
              const left = `${br},${bc}-${br+1},${bc}`;
              const right = `${br},${bc+1}-${br+1},${bc+1}`;

              if (updatedLines[top] && updatedLines[bot] && updatedLines[left] && updatedLines[right]) {
                newBoxes[boxKey] = pid;
                newBoxesCount++;
              }
            }
          }
        }

        const updatedBoxes = { ...currentBoxes, ...newBoxes };
        let p1Score = room.dotsP1Score || 0;
        let p2Score = room.dotsP2Score || 0;

        if (newBoxesCount > 0) {
          if (pid === room.dotsPlayer1) {
            p1Score += newBoxesCount;
          } else {
            p2Score += newBoxesCount;
          }
        }

        let nextTurn = room.dotsTurn;
        if (newBoxesCount === 0) {
          nextTurn = pid === room.dotsPlayer1 ? room.dotsPlayer2 : room.dotsPlayer1;
        }

        const totalBoxes = (size - 1) * (size - 1);
        const totalClaimed = Object.keys(updatedBoxes).length;
        let gameState = room.gameState;
        let levelWinner = room.dotsWinner;
        let matchWins = { ...(room.dotsMatchWins || {}) };

        if (totalClaimed >= totalBoxes) {
          gameState = "dots_finished";
          if (p1Score > p2Score) {
            levelWinner = room.dotsPlayer1;
          } else if (p2Score > p1Score) {
            levelWinner = room.dotsPlayer2;
          } else {
            levelWinner = "draw";
          }

          if (levelWinner !== "draw") {
            matchWins[levelWinner] = (matchWins[levelWinner] || 0) + 1;
            this.saveMatchReward(levelWinner, 15);
          }
        }

        this.updateRoom({
          dotsLines: updatedLines,
          dotsBoxes: updatedBoxes,
          dotsP1Score: p1Score,
          dotsP2Score: p2Score,
          dotsTurn: nextTurn,
          dotsLastMove: lineId,
          gameState,
          dotsWinner: levelWinner,
          dotsMatchWins: matchWins,
        });

        if (room.isBot && gameState === "dots_playing" && nextTurn === room.players[1]?.id) {
          GameEngineService.scheduleBotDotsMove();
        }
        break;
      }

      case "restart_dots": {
        const room = this.currentRoom;
        if (!room) break;

        let currentLevel = room.dotsLevel || 1;
        let matchWins = { ...(room.dotsMatchWins || {}) };

        if (room.gameState === "dots_finished") {
          if (currentLevel < 3) {
            currentLevel += 1;
          } else {
            currentLevel = 1;
            const p1 = room.dotsPlayer1 || room.players[0]?.id;
            const p2 = room.dotsPlayer2 || room.players[1]?.id;
            matchWins = { [p1]: 0, [p2]: 0 };
          }
        }

        const p1Id = room.dotsPlayer1 || room.players[0]?.id;
        const p2Id = room.dotsPlayer2 || room.players[1]?.id;
        const newBoardSize = currentLevel + 3;

        this.updateRoom({
          gameState: "dots_playing",
          selectionMode: "dots",
          dotsLevel: currentLevel,
          dotsBoardSize: newBoardSize,
          dotsPlayer1: p1Id,
          dotsPlayer2: p2Id,
          dotsTurn: p1Id,
          dotsLines: {},
          dotsBoxes: {},
          dotsP1Score: 0,
          dotsP2Score: 0,
          dotsLastMove: null,
          dotsWinner: null,
          dotsMatchWins: matchWins,
          timer: 180,
        });

        if (room.isBot && p1Id !== room.players[0]?.id) {
          GameEngineService.scheduleBotDotsMove();
        }
        break;
      }

      // -------------------------------------------------------------
      // IQ Test (اختبار الذكاء / الذاكرة)
      // -------------------------------------------------------------
      case "submit_iq_move": {
        const room = this.currentRoom;
        if (!room || room.gameState !== "iq_playing") break;

        const { index } = payload;
        if (index === undefined || index < 0 || index >= (room.iqBoard?.length || 0)) break;

        // Ignore if already matched or already flipped
        if (room.iqMatched?.includes(index) || room.iqFlipped?.includes(index)) break;

        const pid = payload.playerId || room.iqTurn;
        if (pid !== room.iqTurn) break;

        const currentFlipped = [...(room.iqFlipped || [])];

        if (currentFlipped.length === 0) {
          // Flip first card
          this.updateRoom({
            iqFlipped: [index],
          });

          // If Bot's turn, schedule Bot's second card pick
          if (room.isBot && pid === room.players[1]?.id) {
            GameEngineService.scheduleBotIQMove(true);
          }
        } else if (currentFlipped.length === 1) {
          // Flip second card
          const firstIdx = currentFlipped[0];
          const newFlipped = [firstIdx, index];

          const card1 = room.iqBoard?.[firstIdx];
          const card2 = room.iqBoard?.[index];

          if (card1 && card2 && card1 === card2) {
            // MATCH!
            const newMatched = [...(room.iqMatched || []), firstIdx, index];
            let p1Score = room.iqP1Score || 0;
            let p2Score = room.iqP2Score || 0;

            if (pid === room.iqPlayer1) {
              p1Score += 1;
            } else {
              p2Score += 1;
            }

            const totalCards = room.iqBoard?.length || 16;
            let gameState = room.gameState;
            let levelWinner = room.iqWinner;
            let matchWins = { ...(room.iqMatchWins || {}) };

            if (newMatched.length >= totalCards) {
              gameState = "iq_finished";
              if (p1Score > p2Score) {
                levelWinner = room.iqPlayer1;
              } else if (p2Score > p1Score) {
                levelWinner = room.iqPlayer2;
              } else {
                levelWinner = "draw";
              }

              if (levelWinner !== "draw") {
                matchWins[levelWinner] = (matchWins[levelWinner] || 0) + 1;
                this.saveMatchReward(levelWinner, 20);
              }
            }

            this.updateRoom({
              iqFlipped: [],
              iqMatched: newMatched,
              iqP1Score: p1Score,
              iqP2Score: p2Score,
              gameState,
              iqWinner: levelWinner,
              iqMatchWins: matchWins,
            });

            // If game is still playing and it's Bot's turn, Bot continues turn
            if (room.isBot && gameState === "iq_playing" && room.iqTurn === room.players[1]?.id) {
              GameEngineService.scheduleBotIQMove(false);
            }
          } else {
            // NOT A MATCH
            this.updateRoom({
              iqFlipped: newFlipped,
            });

            // After 1s, flip back and switch turn
            setTimeout(() => {
              if (!this.currentRoom || this.currentRoom.gameState !== "iq_playing") return;
              const nextTurn = pid === this.currentRoom.iqPlayer1 ? this.currentRoom.iqPlayer2 : this.currentRoom.iqPlayer1;
              this.updateRoom({
                iqFlipped: [],
                iqTurn: nextTurn,
              });

              if (this.currentRoom.isBot && nextTurn === this.currentRoom.players[1]?.id) {
                GameEngineService.scheduleBotIQMove(false);
              }
            }, 1000);
          }
        }
        break;
      }

      case "restart_iq": {
        const room = this.currentRoom;
        if (!room) break;

        let currentLevel = room.iqLevel || 1;
        let matchWins = { ...(room.iqMatchWins || {}) };

        if (room.gameState === "iq_finished") {
          if (currentLevel < 3) {
            currentLevel += 1;
          } else {
            currentLevel = 1;
            const p1 = room.iqPlayer1 || room.players[0]?.id;
            const p2 = room.iqPlayer2 || room.players[1]?.id;
            matchWins = { [p1]: 0, [p2]: 0 };
          }
        }

        let iqLevelCategories = room.iqLevelCategories;
        if (!iqLevelCategories || iqLevelCategories.length === 0) {
          const allPossibleCategories = ["animals", "birds", "food", "people", "objects", "plants", "insects", "football"];
          iqLevelCategories = [...allPossibleCategories].sort(() => Math.random() - 0.5).slice(0, 3);
        }

        const selectedCategory = iqLevelCategories[currentLevel - 1] || "animals";
        const arabicCategoryNames: Record<string, string> = {
          animals: "حيوانات",
          birds: "طيور",
          food: "أكلات",
          people: "اشخاص",
          objects: "جماد",
          plants: "نبات",
          insects: "حشرات",
          football: "كرة القدم",
        };
        const categoryName = arabicCategoryNames[selectedCategory] || selectedCategory;

        const p1Id = room.iqPlayer1 || room.players[0]?.id;
        const p2Id = room.iqPlayer2 || room.players[1]?.id;
        const boardSize = currentLevel === 1 ? 4 : currentLevel === 2 ? 6 : 8;
        const board = generateIQBoard(boardSize, selectedCategory);

        this.updateRoom({
          gameState: "iq_playing",
          selectionMode: "iq",
          iqLevel: currentLevel,
          iqLevelCategories: iqLevelCategories,
          iqCategory: selectedCategory,
          iqCategoryName: categoryName,
          iqBoardSize: boardSize,
          iqBoard: board,
          iqPlayer1: p1Id,
          iqPlayer2: p2Id,
          iqTurn: p1Id,
          iqTurnTimer: 15,
          iqFlipped: [],
          iqMatched: [],
          iqP1Score: 0,
          iqP2Score: 0,
          iqWinner: null,
          iqMatchWins: matchWins,
          iqRematchRequestedBy: [],
          timer: 180,
        });

        if (room.isBot && p1Id !== room.players[0]?.id) {
          GameEngineService.scheduleBotIQMove(false);
        }
        break;
      }

      // -------------------------------------------------------------
      // Speed Cups (أكواب السرعة)
      // -------------------------------------------------------------
      case "speed_cups_start": {
        const room = this.currentRoom;
        if (!room) break;
        this.updateRoom({
          gameState: "speed_cups_countdown",
          speedCupsTimer: 3,
        });
        GameEngineService.startSpeedCupsCountdown();
        break;
      }

      case "speed_cups_click_cup": {
        const room = this.currentRoom;
        if (!room || room.gameState !== "speed_cups_playing") break;
        const pid = payload.playerId || room.players[0]?.id;
        const color = payload.color;
        if (!color) break;

        const currentStack = room.speedCupsStacks?.[pid] || [];
        if (currentStack.length < 5) {
          const newStack = [...currentStack, color];
          const updatedStacks = { ...(room.speedCupsStacks || {}), [pid]: newStack };
          this.updateRoom({
            speedCupsStacks: updatedStacks,
          });

          if (room.isBot && pid === room.players[0]?.id && newStack.length < 5) {
            GameEngineService.scheduleBotSpeedCupsClick();
          }
        }
        break;
      }

      case "speed_cups_clear_cups": {
        const room = this.currentRoom;
        if (!room) break;
        const pid = payload.playerId || room.players[0]?.id;
        const updatedStacks = { ...(room.speedCupsStacks || {}), [pid]: [] };
        this.updateRoom({
          speedCupsStacks: updatedStacks,
        });
        break;
      }

      case "speed_cups_ring_bell": {
        const room = this.currentRoom;
        if (!room || room.gameState !== "speed_cups_playing") break;
        const pid = payload.playerId || room.players[0]?.id;
        const updatedDone = { ...(room.speedCupsDone || {}), [pid]: true };
        const playerStack = room.speedCupsStacks?.[pid] || [];
        const currentCard = room.speedCupsCards?.[room.speedCupsCurrentCardIndex];

        let scores = { ...(room.speedCupsScores || {}) };
        if (currentCard && JSON.stringify(playerStack) === JSON.stringify(currentCard.color_order)) {
          scores[pid] = (scores[pid] || 0) + 1;
        }

        this.updateRoom({
          gameState: "speed_cups_evaluating",
          speedCupsDone: updatedDone,
          speedCupsScores: scores,
        });

        setTimeout(() => {
          if (!this.currentRoom) return;
          const nextIndex = (this.currentRoom.speedCupsCurrentCardIndex || 0) + 1;
          const totalCards = this.currentRoom.speedCupsCards?.length || 10;

          if (nextIndex < totalCards) {
            const p1 = this.currentRoom.players[0]?.id;
            const p2 = this.currentRoom.players[1]?.id;
            this.updateRoom({
              speedCupsCurrentCardIndex: nextIndex,
              speedCupsStacks: { [p1]: [], [p2]: [] },
              speedCupsDone: { [p1]: false, [p2]: false },
              gameState: "speed_cups_countdown",
              speedCupsTimer: 3,
            });
            GameEngineService.startSpeedCupsCountdown();
          } else {
            const p1 = this.currentRoom.players[0]?.id;
            const p2 = this.currentRoom.players[1]?.id;
            const p1Score = scores[p1] || 0;
            const p2Score = scores[p2] || 0;
            let winner = "draw";
            if (p1Score > p2Score) winner = p1;
            else if (p2Score > p1Score) winner = p2;

            this.updateRoom({
              gameState: "speed_cups_finished",
              speedCupsWinner: winner,
            });

            if (winner !== "draw") {
              this.saveMatchReward(winner, 20);
            }
          }
        }, 2200);
        break;
      }

      case "speed_cups_propose_rematch": {
        this.setupGameMode("speed_cups");
        break;
      }

      // -------------------------------------------------------------
      // Custom Categories & Image Upload (فئات التخمين وارفع صورة)
      // -------------------------------------------------------------
      case "select_category": {
        const room = this.currentRoom;
        if (!room) break;
        const pid = payload.playerId || room.players[0]?.id;
        const category = payload.category;
        const level = payload.level;

        const updatedPlayers = room.players.map((p) => {
          if (room.isBot) {
            return { ...p, selectedCategory: category, selectedLevel: level };
          }
          if (p.id === pid) {
            return { ...p, selectedCategory: category, selectedLevel: level };
          }
          return p;
        });

        this.updateRoom({ players: updatedPlayers });
        break;
      }

      case "submit_custom_image": {
        const room = this.currentRoom;
        if (!room) break;
        const pid = payload.playerId || room.players[0]?.id;
        const { imageBase64, answer } = payload;
        const customImages = { ...(room.customImages || {}), [pid]: { imageBase64, answer } };

        if (room.isBot) {
          const botId = room.players[1]?.id;
          if (botId && !customImages[botId]) {
            const botSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" rx="20" fill="#fde047"/><text x="100" y="120" font-size="80" text-anchor="middle">🐱</text></svg>`;
            customImages[botId] = {
              imageBase64: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(botSvg),
              answer: "قطة",
            };
          }
        }

        this.updateRoom({ customImages });
        break;
      }

      case "request_match_intro":
      case "force_start_game":
      case "start_game_custom": {
        const room = this.currentRoom;
        if (!room) break;

        const p1Id = room.players[0]?.id || "player1";
        const p2Id = room.players[1]?.id || "player2";

        if (room.selectionMode === "custom") {
          this.updateRoom({
            gameState: "playing",
            timer: 30,
            turn: p1Id,
            p1Score: 0,
            p2Score: 0,
          });
        } else {
          // Standard Category Guessing Game
          let categoryKey = room.players[0]?.selectedCategory || "حيوانات";
          let categoryObj = (easyGuessData as any)[categoryKey] || (easyGuessData as any)["حيوانات"];
          let keys = Object.keys(categoryObj || {});
          let shuffledKeys = [...keys].sort(() => Math.random() - 0.5).slice(0, 5);

          let questions = shuffledKeys.map((k) => ({
            name: k,
            choices: categoryObj[k] || [k],
            correctAnswer: k,
          }));

          this.updateRoom({
            gameState: "playing",
            questions: questions,
            currentQuestionIndex: 0,
            p1Score: 0,
            p2Score: 0,
            turn: p1Id,
            timer: 20,
          });
        }
        break;
      }

      case "submit_guess": {
        const room = this.currentRoom;
        if (!room || room.gameState !== "playing") break;
        const pid = payload.playerId || room.players[0]?.id;
        const guess = payload.guess?.trim();

        const p1Id = room.players[0]?.id;
        const p2Id = room.players[1]?.id;

        let p1Score = room.p1Score || 0;
        let p2Score = room.p2Score || 0;

        if (room.selectionMode === "custom") {
          const oppId = pid === p1Id ? p2Id : p1Id;
          const targetAnswer = room.customImages?.[oppId]?.answer;

          if (guess && targetAnswer && guess.toLowerCase() === targetAnswer.toLowerCase()) {
            if (pid === p1Id) p1Score += 1;
            else p2Score += 1;

            let winner = "draw";
            if (p1Score > p2Score) winner = p1Id;
            else if (p2Score > p1Score) winner = p2Id;

            this.updateRoom({
              gameState: "finished",
              p1Score,
              p2Score,
              winner,
            });

            if (winner !== "draw") {
              this.saveMatchReward(winner, 20);
            }
          } else {
            // Wrong guess, pass turn
            this.updateRoom({
              turn: pid === p1Id ? p2Id : p1Id,
            });
          }
        } else {
          // Standard Question Category
          const currentQ = room.questions?.[room.currentQuestionIndex || 0];
          const isCorrect = guess && currentQ && (guess === currentQ.correctAnswer || currentQ.choices?.includes(guess));

          if (isCorrect) {
            if (pid === p1Id) p1Score += 1;
            else p2Score += 1;

            const nextIndex = (room.currentQuestionIndex || 0) + 1;
            if (nextIndex < (room.questions?.length || 5)) {
              this.updateRoom({
                currentQuestionIndex: nextIndex,
                p1Score,
                p2Score,
                turn: pid === p1Id ? p2Id : p1Id,
                timer: 20,
              });
            } else {
              let winner = "draw";
              if (p1Score > p2Score) winner = p1Id;
              else if (p2Score > p1Score) winner = p2Id;

              this.updateRoom({
                gameState: "finished",
                p1Score,
                p2Score,
                winner,
              });

              if (winner !== "draw") {
                this.saveMatchReward(winner, 20);
              }
            }
          } else {
            // Wrong guess -> pass turn
            this.updateRoom({
              turn: pid === p1Id ? p2Id : p1Id,
            });
          }
        }
        break;
      }

      case "pass_turn": {
        const room = this.currentRoom;
        if (!room || room.gameState !== "playing") break;
        const pid = payload.playerId || room.turn;
        const p1Id = room.players[0]?.id;
        const p2Id = room.players[1]?.id;

        this.updateRoom({
          turn: pid === p1Id ? p2Id : p1Id,
          timer: 20,
        });
        break;
      }

      default:
        break;
    }
  }

  /**
   * Helper to initialize game mode setups
   */
  private static setupGameMode(mode: string) {
    if (!this.currentRoom) return;
    const me = this.currentRoom.players[0];
    const opp = this.currentRoom.players[1];

    switch (mode) {
      case "beach_race":
        this.updateRoom({
          gameState: "beach_race_setup",
          selectionMode: "beach_race",
          beachRace: { readyPlayers: [] },
        });
        break;

      case "space_war":
        this.updateRoom({
          gameState: "space_war_setup",
          selectionMode: "space_war",
          spaceWar: { readyPlayers: [] },
        });
        break;

      case "wordle":
        this.updateRoom({
          gameState: "wordle_setup",
          selectionMode: "wordle",
          wordle: {},
        });
        break;

      case "puzzle":
        this.updateRoom({
          gameState: "puzzle_setup",
          selectionMode: "puzzle",
          puzzle: {},
        });
        break;

      case "connect_four_words":
        this.updateRoom({
          gameState: "connect_four_words_setup",
          selectionMode: "connect_four_words",
          connectFourWords: {},
        });
        break;

      case "xo":
        this.updateRoom({
          gameState: "xo_playing",
          selectionMode: "xo",
          xoBoard: Array(9).fill(null),
          xoXPlayer: me?.id,
          xoOPlayer: opp?.id,
          xoTurn: me?.id,
          xoBoardSize: 3,
          xoWinLength: 3,
          xoLevel: 1,
        });
        break;

      case "bomb_party":
        this.updateRoom({
          gameState: "bomb_party_setup",
          selectionMode: "bomb_party",
        });
        break;

      case "bus_complete":
        this.updateRoom({
          gameState: "bus_complete_setup",
          selectionMode: "bus_complete",
          busCompleteLetter: null,
          busCompleteAnswers: {},
          busCompleteSubmittedPlayers: [],
          busCompleteScores: {},
          busCompleteWinner: null,
          busCompleteSubmitTimes: {},
          busCompleteDraftAnswers: {},
          busCompleteHideResults: false,
          busCompleteCooldowns: {},
          busCompleteAdViewers: [],
          timer: 300,
        });
        break;

      case "hand_khamin": {
        const picker = me?.id;
        const searcher = opp?.id;
        const handNumbers = GameEngineService.generateHandNumbers();

        this.updateRoom({
          gameState: "hand_playing",
          selectionMode: "hand_khamin",
          handP1Score: 0,
          handP2Score: 0,
          handRound: 1,
          handPhase: "picking",
          handPickerId: picker,
          handSearcherId: searcher,
          handNumbers: handNumbers,
          handTargetNumber: null,
          handSearcherSelected: null,
          handGrid: Array(25).fill(null),
          handWinner: null,
          timer: 15,
        });

        GameEngineService.startHandPickerTimer();

        if (this.currentRoom.isBot && picker === opp?.id) {
          GameEngineService.scheduleBotHandPick();
        }
        break;
      }

      case "dots": {
        const p1Id = me?.id || "player1";
        const p2Id = opp?.id || "player2";
        this.updateRoom({
          gameState: "dots_playing",
          selectionMode: "dots",
          dotsPlayer1: p1Id,
          dotsPlayer2: p2Id,
          dotsBoardSize: 4,
          dotsLevel: 1,
          dotsTurn: p1Id,
          dotsLines: {},
          dotsBoxes: {},
          dotsP1Score: 0,
          dotsP2Score: 0,
          dotsLastMove: null,
          dotsWinner: null,
          dotsMatchWins: { [p1Id]: 0, [p2Id]: 0 },
          timer: 180,
        });

        if (this.currentRoom.isBot && p1Id !== me?.id) {
          GameEngineService.scheduleBotDotsMove();
        }
        break;
      }

      case "iq": {
        const p1Id = me?.id || "player1";
        const p2Id = opp?.id || "player2";

        const allPossibleCategories = ["animals", "birds", "food", "people", "objects", "plants", "insects", "football"];
        const shuffled = [...allPossibleCategories].sort(() => Math.random() - 0.5);
        const iqLevelCategories = shuffled.slice(0, 3);
        const currentLevel = 1;
        const selectedCategory = iqLevelCategories[currentLevel - 1] || "animals";

        const arabicCategoryNames: Record<string, string> = {
          animals: "حيوانات",
          birds: "طيور",
          food: "أكلات",
          people: "اشخاص",
          objects: "جماد",
          plants: "نبات",
          insects: "حشرات",
          football: "كرة القدم",
        };
        const categoryName = arabicCategoryNames[selectedCategory] || selectedCategory;

        const board = generateIQBoard(4, selectedCategory);

        this.updateRoom({
          gameState: "iq_playing",
          selectionMode: "iq",
          iqPlayer1: p1Id,
          iqPlayer2: p2Id,
          iqBoardSize: 4,
          iqLevel: currentLevel,
          iqLevelCategories: iqLevelCategories,
          iqCategory: selectedCategory,
          iqCategoryName: categoryName,
          iqBoard: board,
          iqTurn: p1Id,
          iqTurnTimer: 15,
          iqFlipped: [],
          iqMatched: [],
          iqP1Score: 0,
          iqP2Score: 0,
          iqWinner: null,
          iqMatchWins: { [p1Id]: 0, [p2Id]: 0 },
          iqRematchRequestedBy: [],
          timer: 180,
        });

        if (this.currentRoom.isBot && p1Id !== me?.id) {
          GameEngineService.scheduleBotIQMove(false);
        }
        break;
      }

      case "speed_cups": {
        const cards = [...(speedCupsCardsData.cards || [])].sort(() => Math.random() - 0.5);
        const meId = me?.id || "player1";
        const oppId = opp?.id || "player2";
        this.updateRoom({
          gameState: "speed_cups_waiting",
          selectionMode: "speed_cups",
          speedCupsCards: cards,
          speedCupsCurrentCardIndex: 0,
          speedCupsScores: { [meId]: 0, [oppId]: 0 },
          speedCupsStacks: { [meId]: [], [oppId]: [] },
          speedCupsDone: { [meId]: false, [oppId]: false },
          speedCupsTimer: 3,
          speedCupsWinner: null,
        });

        if (this.currentRoom.isBot) {
          setTimeout(() => {
            GameEngineService.handleAction("speed_cups_start", {});
          }, 600);
        }
        break;
      }

      case "custom": {
        this.updateRoom({
          gameState: "waiting",
          selectionMode: "custom",
          customImages: {},
        });
        break;
      }

      default:
        this.updateRoom({
          gameState: "ready",
          selectionMode: "ready",
        });
        break;
    }
  }

  // -------------------------------------------------------------
  // Speed Cups Countdown & Bot Helpers
  // -------------------------------------------------------------
  private static speedCupsTimerRef: any = null;

  public static startSpeedCupsCountdown() {
    if (this.speedCupsTimerRef) clearInterval(this.speedCupsTimerRef);
    let count = 3;

    this.speedCupsTimerRef = setInterval(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "speed_cups_countdown") {
        clearInterval(this.speedCupsTimerRef);
        return;
      }
      count -= 1;
      this.updateRoom({ speedCupsTimer: count });

      if (count <= 0) {
        clearInterval(this.speedCupsTimerRef);
        const p1 = this.currentRoom.players[0]?.id || "player1";
        const p2 = this.currentRoom.players[1]?.id || "player2";
        this.updateRoom({
          gameState: "speed_cups_playing",
          speedCupsTimer: 15,
          speedCupsStacks: { [p1]: [], [p2]: [] },
          speedCupsDone: { [p1]: false, [p2]: false },
        });

        if (this.currentRoom.isBot) {
          GameEngineService.scheduleBotSpeedCupsClick();
        }
      }
    }, 1000);
  }

  public static scheduleBotSpeedCupsClick() {
    const opp = this.currentRoom?.players[1];
    if (!opp || !this.currentRoom) return;

    const currentCard = this.currentRoom.speedCupsCards?.[this.currentRoom.speedCupsCurrentCardIndex];
    if (!currentCard) return;

    const targetColors = currentCard.color_order || ["red", "blue", "green", "yellow", "black"];
    const delay = Math.floor(Math.random() * 300) + 300;

    setTimeout(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "speed_cups_playing") return;
      const curBotStack = this.currentRoom.speedCupsStacks?.[opp.id] || [];

      if (curBotStack.length < 5) {
        const nextColor = targetColors[curBotStack.length];
        this.handleAction("speed_cups_click_cup", { color: nextColor, playerId: opp.id });
      } else {
        this.handleAction("speed_cups_ring_bell", { playerId: opp.id });
      }
    }, delay);
  }

  // -------------------------------------------------------------
  // Bot AI Simulators
  // -------------------------------------------------------------
  private static startBotBeachRunner() {
    let botDist = 0;
    const interval = setInterval(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "beach_race_playing") {
        clearInterval(interval);
        return;
      }
      botDist += 4 + Math.random() * 4;
      const opp = this.currentRoom.players[1];
      if (opp) {
        this.triggerEvent("beach_race_progress_updated", {
          playerId: opp.id,
          distance: Math.min(1000, botDist),
        });
      }
    }, 1000);
  }

  private static startBotSpaceWar() {
    let revealedCount = 0;
    const interval = setInterval(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "space_war_playing") {
        clearInterval(interval);
        return;
      }
      revealedCount++;
      const currentSpaceWar = this.currentRoom.spaceWar || {};
      const opp = this.currentRoom.players[1];
      const p2Revealed = Array.from({ length: revealedCount }, (_, i) => i);
      const isBotWin = revealedCount >= (currentSpaceWar.p2Word?.length || 5);

      this.updateRoom({
        spaceWar: {
          ...currentSpaceWar,
          p2Revealed,
          winnerId: isBotWin ? opp?.id : null,
        },
        gameState: isBotWin ? "space_war_finished" : "space_war_playing",
      });
    }, 3500);
  }

  private static startBotPuzzleProgress() {
    let botProgress = 0;
    const interval = setInterval(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "puzzle_playing") {
        clearInterval(interval);
        return;
      }
      botProgress += Math.floor(2 + Math.random() * 4);
      const capped = Math.min(49, botProgress);
      const currentPuzzle = this.currentRoom.puzzle || {};
      const opp = this.currentRoom.players[1];
      const progPercentage = Math.floor((capped / 49) * 100);

      if (opp) {
        this.updateRoom({
          puzzle: {
            ...currentPuzzle,
            playersProgress: {
              ...(currentPuzzle.playersProgress || {}),
              [opp.id]: progPercentage,
            },
          },
        });
      }

      if (capped >= 49) {
        clearInterval(interval);
        // If bot finishes first, trigger lastChance
        if (!currentPuzzle.lastChanceStartTime) {
          this.handleAction("puzzle_done");
        }
      }
    }, 2000);
  }

  private static startBotWordle() {
    const opp = this.currentRoom.players[1];
    setTimeout(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "wordle_playing") return;
      const currentWordle = this.currentRoom.wordle || {};
      const target = currentWordle.targetWord || "كواكب";
      const sampleGuess = "كواكب"; // Bot makes a guess after 25s
      const isWin = true;

      this.updateRoom({
        wordle: {
          ...currentWordle,
          guesses: {
            ...currentWordle.guesses,
            [opp?.id]: [{ word: sampleGuess, result: ["correct", "correct", "correct", "correct", "correct"] }],
          },
          winnerId: isWin ? opp?.id : null,
        },
        gameState: isWin ? "wordle_finished" : "wordle_playing",
      });
    }, 25000);
  }

  private static checkConnectFourWin(
    board: { playerId: string | null; letter: string | null }[][],
    targetWord: string,
    playerId: string
  ): { r: number; c: number }[] | null {
    if (!targetWord || targetWord.length !== 4) return null;
    const reverseWord = targetWord.split("").reverse().join("");

    const rows = 6;
    const cols = 7;

    const directions = [
      { dr: 0, dc: 1 },  // Horizontal
      { dr: 1, dc: 0 },  // Vertical
      { dr: 1, dc: 1 },  // Diagonal down-right
      { dr: -1, dc: 1 }, // Diagonal up-right
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        for (const { dr, dc } of directions) {
          const cells: { r: number; c: number }[] = [];
          let wordFormed = "";
          let allMatchPlayer = true;

          for (let step = 0; step < 4; step++) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
              allMatchPlayer = false;
              break;
            }
            const cell = board[nr][nc];
            if (cell.playerId !== playerId) {
              allMatchPlayer = false;
              break;
            }
            wordFormed += cell.letter || "";
            cells.push({ r: nr, c: nc });
          }

          if (allMatchPlayer && (wordFormed === targetWord || wordFormed === reverseWord)) {
            return cells;
          }
        }
      }
    }

    return null;
  }

  private static makeBotConnectFourMove() {
    if (!this.currentRoom || this.currentRoom.gameState !== "connect_four_words_playing") return;
    const c4 = this.currentRoom.connectFourWords;
    if (!c4 || !c4.board || !c4.letters) return;

    const opp = this.currentRoom.players[1];
    if (!opp) return;

    const availableCols: number[] = [];
    for (let c = 0; c < 7; c++) {
      if (!c4.board[0][c].playerId) {
        availableCols.push(c);
      }
    }

    if (availableCols.length === 0) return;

    const chosenCol = availableCols[Math.floor(Math.random() * availableCols.length)];
    const chosenLetter = c4.letters[Math.floor(Math.random() * c4.letters.length)];

    this.handleAction("connect_four_words_drop", {
      colIndex: chosenCol,
      letter: chosenLetter,
      playerId: opp.id,
    });
  }

  private static getXOBoardSize(level: number): number {
    if (level <= 1) return 3;
    if (level <= 3) return 4;
    if (level === 4) return 5;
    if (level === 5) return 6;
    if (level === 6) return 7;
    if (level === 7) return 8;
    return 9;
  }

  private static getXOWinLength(level: number): number {
    if (level <= 2) return 3;
    if (level <= 5) return 4;
    return 5;
  }

  private static checkXOWinnerN(
    board: (string | null)[],
    size: number,
    winLength: number
  ): { winner: string; line: number[] } | null {
    if (!board || board.length !== size * size) return null;

    const directions = [
      { dr: 0, dc: 1 },  // Horizontal
      { dr: 1, dc: 0 },  // Vertical
      { dr: 1, dc: 1 },  // Diagonal down-right
      { dr: -1, dc: 1 }, // Diagonal up-right
    ];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const startSymbol = board[r * size + c];
        if (!startSymbol) continue;

        for (const { dr, dc } of directions) {
          const line: number[] = [];
          let match = true;

          for (let step = 0; step < winLength; step++) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
              match = false;
              break;
            }
            const idx = nr * size + nc;
            if (board[idx] !== startSymbol) {
              match = false;
              break;
            }
            line.push(idx);
          }

          if (match) {
            return { winner: startSymbol, line };
          }
        }
      }
    }

    return null;
  }

  private static makeBotXOMove() {
    if (!this.currentRoom || this.currentRoom.gameState !== "xo_playing") return;
    const size = this.currentRoom.xoBoardSize || 3;
    const winLength = this.currentRoom.xoWinLength || 3;
    const board = this.currentRoom.xoBoard || Array(size * size).fill(null);
    const available = board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1);
    if (available.length === 0) return;

    const botPlayerId = this.currentRoom.players[1]?.id;
    if (!botPlayerId) return;

    // 1. Check if bot can win in 1 move
    for (const moveIdx of available) {
      const testBoard = [...board];
      testBoard[moveIdx] = "O";
      const win = this.checkXOWinnerN(testBoard, size, winLength);
      if (win && win.winner === "O") {
        this.handleAction("submit_xo_move", { index: moveIdx, playerId: botPlayerId });
        return;
      }
    }

    // 2. Check if player can win in 1 move (and block)
    for (const moveIdx of available) {
      const testBoard = [...board];
      testBoard[moveIdx] = "X";
      const win = this.checkXOWinnerN(testBoard, size, winLength);
      if (win && win.winner === "X") {
        this.handleAction("submit_xo_move", { index: moveIdx, playerId: botPlayerId });
        return;
      }
    }

    // 3. Otherwise choose a random move
    const chosenMove = available[Math.floor(Math.random() * available.length)];
    this.handleAction("submit_xo_move", { index: chosenMove, playerId: botPlayerId });
  }

  // -------------------------------------------------------------
  // Bomb Party Helpers & Timers
  // -------------------------------------------------------------
  private static bombPartyInterval: any = null;
  private static botBombPartyTimeout: any = null;

  public static getRandomBombPartySubstring(wordList: string[]): string {
    if (!wordList || wordList.length === 0) return "بر";
    const normalize = (str: string) =>
      str.replace(/[\u064B-\u0652\u0670]/g, "").replace(/[أإآء]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, "").trim();

    for (let attempt = 0; attempt < 50; attempt++) {
      const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
      const clean = normalize(randomWord);
      if (clean.length >= 3) {
        const len = Math.random() < 0.7 ? 2 : 3;
        const start = Math.floor(Math.random() * (clean.length - len + 1));
        const sub = clean.substring(start, start + len);
        const matchCount = wordList.filter((w) => normalize(w).includes(sub)).length;
        if (matchCount >= 4) {
          return sub;
        }
      }
    }
    return "بر";
  }

  public static startBombPartyTimer() {
    if (this.bombPartyInterval) clearInterval(this.bombPartyInterval);
    this.bombPartyInterval = setInterval(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "bomb_party_playing" || !this.currentRoom.bombParty) {
        clearInterval(this.bombPartyInterval);
        this.bombPartyInterval = null;
        return;
      }
      const bp = this.currentRoom.bombParty;
      if (bp.gameOver) {
        clearInterval(this.bombPartyInterval);
        this.bombPartyInterval = null;
        return;
      }
      const elapsed = Date.now() - bp.bombStartTime;
      if (elapsed >= (bp.turnTimeLimit || 20000)) {
        const explodedId = bp.turnPlayerId;
        const winner = this.currentRoom.players.find((p) => p.id !== explodedId);
        const winnerId = winner ? winner.id : null;

        const updatedPlayers = this.currentRoom.players.map((p) =>
          p.id === winnerId ? { ...p, bombPartyWins: (p.bombPartyWins || 0) + 1 } : p
        );

        this.updateRoom({
          players: updatedPlayers,
          gameState: "bomb_party_finished",
          bombParty: {
            ...bp,
            gameOver: true,
            explodedPlayerId: explodedId,
            matchWinnerId: winnerId,
          },
        });

        if (winnerId) {
          this.saveMatchReward(winnerId, 10);
        }

        this.triggerEvent("bomb_exploded", { explodedPlayerId: explodedId, winnerId });
        clearInterval(this.bombPartyInterval);
        this.bombPartyInterval = null;
      }
    }, 200);
  }

  public static scheduleBotBombParty() {
    if (this.botBombPartyTimeout) clearTimeout(this.botBombPartyTimeout);
    this.botBombPartyTimeout = setTimeout(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "bomb_party_playing" || !this.currentRoom.bombParty) return;
      const bp = this.currentRoom.bombParty;
      const opp = this.currentRoom.players[1];
      if (!opp || bp.turnPlayerId !== opp.id || bp.gameOver) return;

      const sub = bp.currentSubstring;
      const normalize = (str: string) =>
        str.replace(/[\u064B-\u0652\u0670]/g, "").replace(/[أإآء]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, "").trim();
      const normSub = normalize(sub);

      const validWords = (bombPartyWords as string[]).filter((w) => {
        const normW = normalize(w);
        return normW.includes(normSub) && !(bp.usedWords || []).some((uw: string) => normalize(uw) === normW);
      });

      if (validWords.length > 0) {
        const chosenWord = validWords[Math.floor(Math.random() * validWords.length)];
        this.handleAction("bomb_party_guess", { word: chosenWord, playerId: opp.id });
      }
    }, 2000 + Math.random() * 2500);
  }

  // -------------------------------------------------------------
  // Bus Complete Helpers & Logic
  // -------------------------------------------------------------
  private static busCompleteInterval: any = null;
  private static botBusTimeout: any = null;

  public static startBusCompleteTimer() {
    if (this.busCompleteInterval) clearInterval(this.busCompleteInterval);
    this.busCompleteInterval = setInterval(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "bus_complete_playing") {
        clearInterval(this.busCompleteInterval);
        this.busCompleteInterval = null;
        return;
      }
      const currentTimer = Math.max(0, (this.currentRoom.timer || 300) - 1);
      this.updateRoom({ timer: currentTimer });

      if (currentTimer <= 0) {
        clearInterval(this.busCompleteInterval);
        this.busCompleteInterval = null;
        this.evaluateBusCompleteScores();
      }
    }, 1000);
  }

  public static evaluateBusCompleteScores() {
    if (!this.currentRoom) return;

    const normalize = (text: string): string => {
      if (!text) return "";
      let norm = text.trim().replace(/\s+/g, " ");
      norm = norm.replace(/[أإآ]/g, "ا");
      norm = norm.replace(/ة/g, "ه");
      norm = norm.replace(/ى/g, "ي");
      norm = norm.replace(/ؤ/g, "و");
      norm = norm.replace(/ئ/g, "ي");
      return norm;
    };

    let mappedLetter = this.currentRoom.busCompleteLetter || "ا";
    if (mappedLetter === "أ" || mappedLetter === "إ" || mappedLetter === "آ") mappedLetter = "ا";
    if (mappedLetter === "ة") mappedLetter = "ه";
    if (mappedLetter === "ى") mappedLetter = "ي";

    const letterData = (busCompleteData as any)[mappedLetter] || {};
    const categories = ["boy", "girl", "animal", "plant", "inanimate", "country"];

    const scores: Record<string, any> = {};
    const players = this.currentRoom.players || [];

    players.forEach((p) => {
      scores[p.id] = { boy: 0, girl: 0, animal: 0, plant: 0, inanimate: 0, country: 0, total: 0 };
    });

    const validAnswers: Record<string, Record<string, string>> = {};
    const targetLetterNorm = normalize(mappedLetter);

    categories.forEach((cat) => {
      const validListPhonetic = (letterData[cat] || []).map((val: string) => normalize(val));

      players.forEach((p) => {
        const ans = (this.currentRoom.busCompleteAnswers?.[p.id] as any)?.[cat] || "";
        const normAns = normalize(ans);
        if (normAns && normAns.startsWith(targetLetterNorm) && validListPhonetic.includes(normAns)) {
          if (!validAnswers[cat]) validAnswers[cat] = {};
          validAnswers[cat][p.id] = normAns;
        }
      });

      players.forEach((p) => {
        if (validAnswers[cat]?.[p.id]) {
          const myAns = validAnswers[cat][p.id];
          const otherPlayers = players.filter((other) => other.id !== p.id);
          const matchOther = otherPlayers.some((other) => validAnswers[cat]?.[other.id] === myAns);

          const pts = matchOther ? 5 : 10;
          scores[p.id][cat] = pts;
          scores[p.id].total += pts;
        }
      });
    });

    let maxScore = -1;
    let winners: string[] = [];
    players.forEach((p) => {
      const tot = scores[p.id]?.total || 0;
      if (tot > maxScore) {
        maxScore = tot;
        winners = [p.id];
      } else if (tot === maxScore) {
        winners.push(p.id);
      }
    });

    let winnerId: string | "tie" = "tie";
    if (winners.length === 1) {
      winnerId = winners[0];
    } else if (winners.length > 1) {
      const times = this.currentRoom.busCompleteSubmitTimes || {};
      let bestTime = Infinity;
      let bestPlayer = "tie";
      let tieInTime = false;

      winners.forEach((pId) => {
        const t = times[pId] ?? 300;
        if (t < bestTime) {
          bestTime = t;
          bestPlayer = pId;
          tieInTime = false;
        } else if (t === bestTime) {
          tieInTime = true;
        }
      });

      winnerId = tieInTime ? "tie" : bestPlayer;
    }

    const updatedPlayers = players.map((p) =>
      p.id === winnerId ? { ...p, busCompleteWins: (p.busCompleteWins || 0) + 1 } : p
    );

    this.updateRoom({
      players: updatedPlayers,
      gameState: "bus_complete_evaluating",
      busCompleteScores: scores,
      busCompleteWinner: winnerId,
    });

    if (winnerId && winnerId !== "tie") {
      this.saveMatchReward(winnerId, 15);
    }
  }

  public static scheduleBotBusComplete() {
    if (this.botBusTimeout) clearTimeout(this.botBusTimeout);
    const botPlayer = this.currentRoom?.players?.[1];
    if (!botPlayer) return;

    const delay = 8000 + Math.random() * 12000;
    this.botBusTimeout = setTimeout(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "bus_complete_playing") return;
      const letter = this.currentRoom.busCompleteLetter || "ا";
      let mappedLetter = letter;
      if (mappedLetter === "أ" || mappedLetter === "إ" || mappedLetter === "آ") mappedLetter = "ا";
      if (mappedLetter === "ة") mappedLetter = "ه";
      if (mappedLetter === "ى") mappedLetter = "ي";

      const letterData = (busCompleteData as any)[mappedLetter] || {};
      const categories = ["boy", "girl", "animal", "plant", "inanimate", "country"];
      const botAns: Record<string, string> = {};

      categories.forEach((cat) => {
        const words = letterData[cat] || [];
        if (words.length > 0 && Math.random() > 0.1) {
          botAns[cat] = words[Math.floor(Math.random() * words.length)];
        } else {
          botAns[cat] = "";
        }
      });

      this.handleAction("submit_bus_complete", { playerId: botPlayer.id, answers: botAns });
    }, delay);
  }

  // -------------------------------------------------------------
  // Hand Khamin Helpers & Logic
  // -------------------------------------------------------------
  private static handPickerInterval: any = null;
  private static botHandTimeout: any = null;
  private static botHandGridInterval: any = null;

  public static generateHandNumbers(): any[] {
    const count = 15;
    const numbers: any[] = [];
    const coords: { top: number; left: number }[] = [];

    for (let i = 1; i <= count; i++) {
      let top = 0;
      let left = 0;
      let valid = false;
      let attempts = 0;

      while (!valid && attempts < 50) {
        attempts++;
        top = Math.floor(15 + Math.random() * 70);
        left = Math.floor(15 + Math.random() * 70);
        valid = !coords.some((c) => Math.abs(c.top - top) < 12 && Math.abs(c.left - left) < 12);
      }
      coords.push({ top, left });

      const rotate = `${Math.floor(Math.random() * 60 - 30)}deg`;
      const fontSizes = ["1.1rem", "1.3rem", "1.5rem", "1.7rem"];
      const fontSize = fontSizes[Math.floor(Math.random() * fontSizes.length)];

      numbers.push({
        val: i,
        left: `${left}%`,
        top: `${top}%`,
        fontSize,
        rotate,
      });
    }

    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    return numbers;
  }

  public static startHandPickerTimer() {
    if (this.handPickerInterval) clearInterval(this.handPickerInterval);
    this.handPickerInterval = setInterval(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "hand_playing" || this.currentRoom.handPhase !== "picking") {
        clearInterval(this.handPickerInterval);
        this.handPickerInterval = null;
        return;
      }
      const curTimer = Math.max(0, (this.currentRoom.timer || 15) - 1);
      this.updateRoom({ timer: curTimer });

      if (curTimer <= 0) {
        clearInterval(this.handPickerInterval);
        this.handPickerInterval = null;
        if (this.currentRoom.handTargetNumber === null && this.currentRoom.handNumbers?.length) {
          const autoVal = this.currentRoom.handNumbers[Math.floor(Math.random() * this.currentRoom.handNumbers.length)].val;
          this.handleAction("hand_pick_number", { number: autoVal });
        }
      }
    }, 1000);
  }

  public static scheduleBotHandPick() {
    if (this.botHandTimeout) clearTimeout(this.botHandTimeout);
    const opp = this.currentRoom?.players[1];
    if (!opp) return;

    this.botHandTimeout = setTimeout(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "hand_playing" || this.currentRoom.handPhase !== "picking") return;
      const nums = this.currentRoom.handNumbers || [];
      if (nums.length > 0) {
        const chosen = nums[Math.floor(Math.random() * nums.length)].val;
        this.handleAction("hand_pick_number", { number: chosen, playerId: opp.id });
      }
    }, 1500 + Math.random() * 2000);
  }

  public static scheduleBotHandSearch() {
    if (this.botHandTimeout) clearTimeout(this.botHandTimeout);
    const opp = this.currentRoom?.players[1];
    if (!opp) return;

    this.botHandTimeout = setTimeout(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "hand_playing" || this.currentRoom.handPhase !== "searching") return;
      const target = this.currentRoom.handTargetNumber;
      if (target !== null && target !== undefined) {
        this.handleAction("hand_select_number", { number: target, playerId: opp.id });
        setTimeout(() => {
          if (this.currentRoom && this.currentRoom.gameState === "hand_playing" && this.currentRoom.handPhase === "searching") {
            this.handleAction("hand_ring_bell", { playerId: opp.id });
          }
        }, 500);
      }
    }, 2500 + Math.random() * 3000);
  }

  public static startBotHandGridFill() {
    if (this.botHandGridInterval) clearInterval(this.botHandGridInterval);
    const opp = this.currentRoom?.players[1];
    if (!opp) return;

    this.botHandGridInterval = setInterval(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "hand_playing" || this.currentRoom.handPhase !== "searching") {
        clearInterval(this.botHandGridInterval);
        this.botHandGridInterval = null;
        return;
      }
      this.handleAction("hand_click_cell", { playerId: opp.id });
    }, 300 + Math.random() * 150);
  }

  public static finishHandRound() {
    if (this.botHandTimeout) clearTimeout(this.botHandTimeout);
    if (this.botHandGridInterval) clearInterval(this.botHandGridInterval);

    if (!this.currentRoom) return;
    const bp = this.currentRoom;
    const p1Id = bp.players[0]?.id;
    const p2Id = bp.players[1]?.id;

    const p1Filled = (bp.handGrid || []).filter((c: any) => c === p1Id).length;
    const p2Filled = (bp.handGrid || []).filter((c: any) => c === p2Id).length;

    const newP1Score = (bp.handP1Score || 0) + p1Filled;
    const newP2Score = (bp.handP2Score || 0) + p2Filled;
    const currentRound = bp.handRound || 1;

    if (currentRound >= 2) {
      let winnerId: string | "draw" = "draw";
      if (newP1Score > newP2Score) winnerId = p1Id;
      else if (newP2Score > newP1Score) winnerId = p2Id;

      const updatedPlayers = bp.players.map((p) =>
        p.id === winnerId ? { ...p, handWins: (p.handWins || 0) + 1 } : p
      );

      this.updateRoom({
        players: updatedPlayers,
        gameState: "hand_finished",
        handP1Score: newP1Score,
        handP2Score: newP2Score,
        handWinner: winnerId,
      });

      if (winnerId !== "draw") {
        this.saveMatchReward(winnerId, 15);
      }
    } else {
      const newPicker = bp.handSearcherId;
      const newSearcher = bp.handPickerId;
      const newNumbers = this.generateHandNumbers();

      this.updateRoom({
        handP1Score: newP1Score,
        handP2Score: newP2Score,
        handRound: currentRound + 1,
        handPhase: "picking",
        handPickerId: newPicker,
        handSearcherId: newSearcher,
        handNumbers: newNumbers,
        handTargetNumber: null,
        handSearcherSelected: null,
        handGrid: Array(25).fill(null),
        timer: 15,
      });

      this.startHandPickerTimer();

      if (bp.isBot && newPicker === bp.players[1]?.id) {
        this.scheduleBotHandPick();
      }
    }
  }

  private static botDotsTimeout: any = null;

  public static scheduleBotDotsMove() {
    if (this.botDotsTimeout) clearTimeout(this.botDotsTimeout);
    const opp = this.currentRoom?.players[1];
    if (!opp) return;

    this.botDotsTimeout = setTimeout(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "dots_playing" || this.currentRoom.dotsTurn !== opp.id) return;
      const room = this.currentRoom;
      const size = room.dotsBoardSize || 4;
      const lines = room.dotsLines || {};
      const boxes = room.dotsBoxes || {};

      const availableLines: { r1: number; c1: number; r2: number; c2: number; id: string }[] = [];

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size - 1; c++) {
          const id = `${r},${c}-${r},${c+1}`;
          if (!lines[id]) {
            availableLines.push({ r1: r, c1: c, r2: r, c2: c + 1, id });
          }
        }
      }
      for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size; c++) {
          const id = `${r},${c}-${r+1},${c}`;
          if (!lines[id]) {
            availableLines.push({ r1: r, c1: c, r2: r + 1, c2: c, id });
          }
        }
      }

      if (availableLines.length === 0) return;

      const getBoxLineCount = (br: number, bc: number, testLineId: string) => {
        const top = `${br},${bc}-${br},${bc+1}`;
        const bot = `${br+1},${bc}-${br+1},${bc+1}`;
        const left = `${br},${bc}-${br+1},${bc}`;
        const right = `${br},${bc+1}-${br+1},${bc+1}`;

        let count = 0;
        if (lines[top] || testLineId === top) count++;
        if (lines[bot] || testLineId === bot) count++;
        if (lines[left] || testLineId === left) count++;
        if (lines[right] || testLineId === right) count++;
        return count;
      };

      const getAffectedBoxes = (line: { r1: number; c1: number; r2: number; c2: number }) => {
        const affected: { br: number; bc: number }[] = [];
        const { r1, c1, r2, c2 } = line;
        if (r1 === r2) {
          if (r1 - 1 >= 0) affected.push({ br: r1 - 1, bc: c1 });
          if (r1 < size - 1) affected.push({ br: r1, bc: c1 });
        } else {
          if (c1 - 1 >= 0) affected.push({ br: r1, bc: c1 - 1 });
          if (c1 < size - 1) affected.push({ br: r1, bc: c1 });
        }
        return affected;
      };

      // Priority 1: Pick line that completes a box
      const completingLine = availableLines.find(line => {
        const aff = getAffectedBoxes(line);
        return aff.some(b => !boxes[`${b.br},${b.bc}`] && getBoxLineCount(b.br, b.bc, line.id) === 4);
      });

      if (completingLine) {
        this.handleAction("submit_dots_move", { ...completingLine, playerId: opp.id });
        return;
      }

      // Priority 2: Pick safe line
      const safeLines = availableLines.filter(line => {
        const aff = getAffectedBoxes(line);
        return aff.every(b => boxes[`${b.br},${b.bc}`] || getBoxLineCount(b.br, b.bc, line.id) < 3);
      });

      if (safeLines.length > 0) {
        const chosen = safeLines[Math.floor(Math.random() * safeLines.length)];
        this.handleAction("submit_dots_move", { ...chosen, playerId: opp.id });
        return;
      }

      // Priority 3: Random line
      const chosen = availableLines[Math.floor(Math.random() * availableLines.length)];
      this.handleAction("submit_dots_move", { ...chosen, playerId: opp.id });
    }, 600);
  }

  private static botIQTimeout: any = null;

  public static scheduleBotIQMove(isSecondCard: boolean) {
    if (this.botIQTimeout) clearTimeout(this.botIQTimeout);
    const opp = this.currentRoom?.players[1];
    if (!opp) return;

    const delay = isSecondCard ? 600 : 800;

    this.botIQTimeout = setTimeout(() => {
      if (!this.currentRoom || this.currentRoom.gameState !== "iq_playing" || this.currentRoom.iqTurn !== opp.id) return;
      const room = this.currentRoom;
      const board = room.iqBoard || [];
      const matched = room.iqMatched || [];
      const flipped = room.iqFlipped || [];

      // Find available cards
      const unrevealedIndices: number[] = [];
      for (let i = 0; i < board.length; i++) {
        if (!matched.includes(i) && !flipped.includes(i)) {
          unrevealedIndices.push(i);
        }
      }

      if (unrevealedIndices.length === 0) return;

      if (flipped.length === 1) {
        // Flipping 2nd card
        const firstCardValue = board[flipped[0]];
        const matchingIdx = unrevealedIndices.find(i => board[i] === firstCardValue);

        // Bot has ~60% chance to pick matching card if available
        if (matchingIdx !== undefined && Math.random() < 0.6) {
          this.handleAction("submit_iq_move", { index: matchingIdx, playerId: opp.id });
        } else {
          const randomIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
          this.handleAction("submit_iq_move", { index: randomIdx, playerId: opp.id });
        }
      } else {
        // Flipping 1st card
        const randomIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        this.handleAction("submit_iq_move", { index: randomIdx, playerId: opp.id });
      }
    }, delay);
  }

  // -------------------------------------------------------------
  // Rewards & Level Persistence
  // -------------------------------------------------------------
  private static async saveMatchReward(playerId: string, xpEarned: number) {
    try {
      const currentXp = parseInt(localStorage.getItem("khamin_xp") || "0", 10) + xpEarned;
      const currentWins = parseInt(localStorage.getItem("khamin_wins") || "0", 10) + 1;
      localStorage.setItem("khamin_xp", currentXp.toString());
      localStorage.setItem("khamin_wins", currentWins.toString());

      // Sync to cloud database
      const supabase = getSupabaseClient();
      const serial = localStorage.getItem("khamin_player_serial");
      if (serial) {
        await supabase
          .from("players")
          .update({
            xp: currentXp,
            wins: currentWins,
            updated_at: new Date().toISOString(),
          })
          .eq("serial", serial);
      }
    } catch (e) {
      console.warn("[GameEngine] Reward save error:", e);
    }
  }
}
