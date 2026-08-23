import React, { useState, useEffect, useRef, useCallback } from "react";
import { Zap, Bomb, Target, WifiOff, Rocket, Sparkles, Gamepad2, Snowflake, ShieldCheck, ShieldAlert, Clock, Box, Swords, ShieldPlus } from "lucide-react";
import { GameEndControls } from "./components/GameEndControls";
import { GameEngineService } from "./services/gameEngineService";

const GAME_WIDTH = 400;
const GAME_HEIGHT = 450;
const ROCKET_WIDTH = 50;
const ROCKET_HEIGHT = 70;
const LASER_WIDTH = 4;
const LASER_HEIGHT = 16;
const LETTER_SIZE = 32;

const ARABIC_LETTERS = "ابتثجحخدذرزسشصضطظعغفقكلمنهويأإآؤئء".split('');

export default function SpaceWarGame({ room, socket, playerSerial, isAdmin, playSound, hasProPackage, CategoryPageAd, showAlert, showConfirm, showAd, handleLeaveGame, renderSpaceWarRewardBar }: any) {
  const [freezeCountdown, setFreezeCountdown] = useState(0);
  const [bombWarning, setBombWarning] = useState(false);
  const [freezeWarning, setFreezeWarning] = useState(false);
  const [speedCountdown, setSpeedCountdown] = useState(0);
  const [isFrozenState, setIsFrozenState] = useState(false);
  const prevIsFrozenRef = useRef(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gamePlayContainerRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLImageElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  
  const roomGameStateRef = useRef(room?.gameState);
  roomGameStateRef.current = room?.gameState;

  const playGameSound = useCallback((soundName: string) => {
    if (roomGameStateRef.current === 'space_war_playing' && playSound) {
      playSound(soundName);
    }
  }, [playSound]);
  
  const myId = socket?.id;
  const isPlayer1 = room?.players[0]?.id === myId;
  const myPlayerObj = isPlayer1 ? room?.players[0] : room?.players[1];
  const oppPlayerObj = isPlayer1 ? room?.players[1] : room?.players[0];

  const myWord = isPlayer1 ? room?.spaceWar?.p1Word : room?.spaceWar?.p2Word;
  const oppWord = isPlayer1 ? room?.spaceWar?.p2Word : room?.spaceWar?.p1Word;
  const myRevealed = (isPlayer1 ? room?.spaceWar?.p1Revealed : room?.spaceWar?.p2Revealed) || [];
  const oppRevealed = (isPlayer1 ? room?.spaceWar?.p2Revealed : room?.spaceWar?.p1Revealed) || [];

  const myRevealedRef = useRef(myRevealed);
  useEffect(() => {
    myRevealedRef.current = myRevealed;
  }, [myRevealed]);

  const oppRevealedRef = useRef(oppRevealed);
  useEffect(() => {
    oppRevealedRef.current = oppRevealed;
  }, [oppRevealed]);

  const usePowerupRef = useRef<(type: 'speed' | 'slow' | 'bomb' | 'jam' | 'freeze') => void>(() => {});
  
  const [rocketLevel, setRocketLevel] = useState(1);
  const [score, setScore] = useState(0);

  const [powerups, setPowerups] = useState({
    speed: 0,
    slow: 0,
    bomb: 0,
    jam: 0,
    freeze: 0
  });

  const isBotMatch = room?.players?.some((p: any) => p.isBot);

  const gameStateRef = useRef({
    x: GAME_WIDTH / 2 - ROCKET_WIDTH / 2,
    y: GAME_HEIGHT - ROCKET_HEIGHT - 30,
    vx: 0,
    vy: 0,
    keys: {} as Record<string, boolean>,
    lasers: [] as any[],
    letters: [] as any[],
    upgrades: [] as any[],
    bombs: [] as any[],
    particles: [] as any[],
    lastShootTime: 0,
    slowFactor: 1,
    slowEndTime: 0,
    speedEndTime: 0,
    isJamming: false,
    jamEndTime: 0,
    upgradeEndTime: 0,
    isTouchDragging: false,
    lastBotPowerupTime: Date.now(),
    lastUpgradeSpawnTime: 0,
    snows: [] as any[],
    isFrozen: false,
    frozenEndTime: 0,
    frozenRotate: 0,
    frozenRotateDir: 1,
    joystick: { active: false, originX: 0, originY: 0, currentX: 0, currentY: 0 }
  });

  // Speed Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (speedCountdown > 0) {
      timer = setInterval(() => {
        setSpeedCountdown(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [speedCountdown]);

  // Freeze Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (freezeCountdown > 0) {
      timer = setInterval(() => {
        setFreezeCountdown(prev => {
          if (prev <= 1) {
            gameStateRef.current.slowFactor = 1;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [freezeCountdown]);

  const [matchTimeLeft, setMatchTimeLeft] = useState<number>(120);

  // 2-Minute Match Countdown Timer
  useEffect(() => {
    if (room?.gameState !== 'space_war_playing' || !room?.spaceWar?.startTime) {
      setMatchTimeLeft(120);
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - room.spaceWar.startTime) / 1000);
      const remaining = Math.max(0, 120 - elapsed);
      setMatchTimeLeft(remaining);

      if (remaining <= 0 && !room?.spaceWar?.gameOver) {
        socket?.emit("space_war_timeup", { roomId: room.id });
        GameEngineService.handleAction("space_war_timeup", { roomId: room.id, playerId: myId });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [room?.gameState, room?.spaceWar?.startTime, room?.spaceWar?.gameOver, room?.id, socket]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [botStatusText, setBotStatusText] = useState<string>('');
  const botJammedUntilRef = useRef<number>(0);
  const botBombedUntilRef = useRef<number>(0);
  const botFrozenUntilRef = useRef<number>(0);

  // Dynamic Bot shooting & defense simulation
  useEffect(() => {
    if (!isBotMatch || room?.gameState !== 'space_war_playing') return;

    const botInterval = setInterval(() => {
      if (room?.spaceWar?.gameOver) return;
      const humanWord = room?.spaceWar?.p1Word;
      const humanRevealed = room?.spaceWar?.p1Revealed || [];

      if (!humanWord || humanRevealed.length >= humanWord.length) return;

      const unrevealedIndices: number[] = [];
      for (let i = 0; i < humanWord.length; i++) {
        if (!humanRevealed.includes(i)) unrevealedIndices.push(i);
      }
      if (unrevealedIndices.length === 0) return;

      const now = Date.now();
      const isJammed = now < botJammedUntilRef.current;
      const isBombed = now < botBombedUntilRef.current;
      const isFrozen = now < botFrozenUntilRef.current;

      // Base miss probability per tick (checks every 12 seconds for balanced 2-min match pacing)
      let missProbability = 0.15;
      if (isFrozen) missProbability = 1.0;
      else if (isJammed && isBombed) missProbability = 0.85;
      else if (isJammed) missProbability = 0.70;
      else if (isBombed) missProbability = 0.55;

      if (Math.random() < missProbability) {
        const missIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        socket?.emit("space_war_bot_missed", { roomId: room.id, index: missIdx });
      }
    }, 12000);

    return () => clearInterval(botInterval);
  }, [isBotMatch, room?.gameState, room?.spaceWar?.gameOver, room?.spaceWar?.p1Word, room?.spaceWar?.p1Revealed, room?.id, socket]);

  // Reset game state on new match
  useEffect(() => {
    const state = gameStateRef.current;
    state.joystick = { active: false, originX: 0, originY: 0, currentX: 0, currentY: 0 };
    state.vx = 0;
    state.vy = 0;
    state.keys = {};
    state.isTouchDragging = false;
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.left = '50%';
      joystickKnobRef.current.style.top = '50%';
    }

    if (room?.gameState === 'space_war_playing' || room?.gameState === 'space_war_setup') {
      if (canvasRef.current) {
        canvasRef.current.width = GAME_WIDTH;
        canvasRef.current.height = GAME_HEIGHT;
      }
      state.x = GAME_WIDTH / 2 - ROCKET_WIDTH / 2;
      state.y = GAME_HEIGHT - ROCKET_HEIGHT - 30;
      state.lasers = [];
      state.letters = [];
      state.upgrades = [];
      state.bombs = [];
      state.snows = [];
      state.particles = [];
      state.slowFactor = 1;
      state.slowEndTime = 0;
      state.isJamming = false;
      state.jamEndTime = 0;
      state.isFrozen = false;
      state.frozenEndTime = 0;
      state.frozenRotate = 0;
      state.frozenRotateDir = 1;
      state.upgradeEndTime = 0;
      state.lastBotPowerupTime = Date.now();
      state.lastUpgradeSpawnTime = 0;
      
      setRocketLevel(1);
      setScore(0);
      setPowerups({ speed: 0, slow: 0, bomb: 0, jam: 0, freeze: 0 });
      setFreezeCountdown(0);
      setBombWarning(false);
      setFreezeWarning(false);
    }
  }, [room?.gameState, room?.spaceWar?.p1Word, room?.spaceWar?.p2Word]);

  // Listen to powerup socket events
  useEffect(() => {
    if (!socket) return;
    const handlePowerup = (data: any) => {
      const senderId = data.senderId || data.from;
      if (senderId === myId) return;
      const type = data.type;
      const state = gameStateRef.current;
      const gw = canvasRef.current?.width || GAME_WIDTH;
      if (type === 'slow') {
        state.slowFactor = 0.3;
        setFreezeCountdown(10);
        playGameSound("clockTicking");
      } else if (type === 'bomb') {
        playGameSound("alarm");
        setBombWarning(true);
        setTimeout(() => {
          setBombWarning(false);
          const state = gameStateRef.current;
          const gw = canvasRef.current?.width || GAME_WIDTH;
          playGameSound("pop");
          for (let i = 0; i < 5; i++) {
             state.bombs.push({
               x: 20 + Math.random() * (gw - 60),
               y: -50 - Math.random() * 250,
               vy: 85 + Math.random() * 35,
               size: 28,
               hit: false
             });
          }
        }, 1500);
      } else if (type === 'jam') {
        state.isJamming = true;
        state.jamEndTime = Date.now() + 6000;
        playGameSound("alarm");
        for (let i = 0; i < 6; i++) {
           state.letters.push({
             x: Math.random() * (gw - LETTER_SIZE),
             y: -Math.random() * 200,
             char: ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)],
             vy: 60 + Math.random() * 30,
             isFake: true,
             color: '#fef08a'
           });
        }
      } else if (type === 'freeze') {
        playGameSound("alarm");
        setFreezeWarning(true);
        setTimeout(() => {
          setFreezeWarning(false);
          const state = gameStateRef.current;
          const gw = canvasRef.current?.width || GAME_WIDTH;
          playGameSound("pop");
          for (let i = 0; i < 5; i++) {
             state.snows.push({
               x: 20 + Math.random() * (gw - 60),
               y: -50 - Math.random() * 250,
               vy: 85 + Math.random() * 35,
               size: 28,
               hit: false
             });
          }
        }, 1500);
      }
    };

    socket?.on("space_war_powerup_received", handlePowerup);
    socket?.on("space_war_powerup", handlePowerup);
    GameEngineService.on("space_war_powerup_received", handlePowerup);
    GameEngineService.on("space_war_powerup", handlePowerup);

    return () => { 
      socket?.off("space_war_powerup_received", handlePowerup);
      socket?.off("space_war_powerup", handlePowerup);
      GameEngineService.off("space_war_powerup_received", handlePowerup);
      GameEngineService.off("space_war_powerup", handlePowerup);
    };
  }, [socket, myId, playGameSound]);

  // Activate Powerup Helper
  const usePowerup = (type: 'speed' | 'slow' | 'bomb' | 'jam' | 'freeze') => {
    if (powerups[type] < 100) return;
    setPowerups(prev => ({ ...prev, [type]: 0 }));
    if (playSound) playSound("clickOpen");

    if (type === 'speed') {
      gameStateRef.current.speedEndTime = Date.now() + 8000;
      setSpeedCountdown(8);
      playGameSound("rocket-laser-single-shoot");
    } else if (type === 'slow') {
      gameStateRef.current.slowFactor = 0.25;
      setFreezeCountdown(10);
    } else if (type === 'jam' && isBotMatch) {
      botJammedUntilRef.current = Date.now() + 8000;
      setBotStatusText('المنافس تعرض للتشويش! 📡 (زادت فرصة تفويت الحروف)');
      setTimeout(() => setBotStatusText(''), 8000);
    } else if (type === 'bomb' && isBotMatch) {
      botBombedUntilRef.current = Date.now() + 7000;
      setBotStatusText('المنافس يتفادى القنابل! 💣 (زادت فرصة تفويت الحروف)');
      setTimeout(() => setBotStatusText(''), 7000);
    } else if (type === 'freeze' && isBotMatch) {
      botFrozenUntilRef.current = Date.now() + 3000;
      setBotStatusText('المنافس تجمدت سفينته! 🧊 (لن يصطاد حروف)');
      setTimeout(() => setBotStatusText(''), 3000);
    }

    socket?.emit("space_war_powerup", { roomId: room.id, type, from: myId });
    GameEngineService.handleAction("space_war_powerup", { roomId: room.id, type, from: myId });
  };

  useEffect(() => {
    usePowerupRef.current = usePowerup;
  }, [usePowerup]);

  const updateGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (room?.gameState !== 'space_war_playing') {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        return;
      }

      const state = gameStateRef.current;
      const now = Date.now();
      const dt = 16 / 1000;
      const gw = GAME_WIDTH;
      const gh = GAME_HEIGHT;

      if (canvas.width !== GAME_WIDTH) canvas.width = GAME_WIDTH;
      if (canvas.height !== GAME_HEIGHT) canvas.height = GAME_HEIGHT;

      // Handle Bot Powerups (Charges & Fires every ~10-14 seconds)
      if (isBotMatch) {
        if (now - state.lastBotPowerupTime > 10000 + Math.random() * 4000) {
          state.lastBotPowerupTime = now;
          const randomVal = Math.random();
          const chosen = randomVal < 0.33 ? 'bomb' : randomVal < 0.66 ? 'jam' : 'freeze';
          if (chosen === 'bomb') {
            setBotStatusText('المنافس يحضر القنبلة! 💣');
            playGameSound("alarm");
            setBombWarning(true);
            setTimeout(() => {
              setBombWarning(false);
              const state = gameStateRef.current;
              const gw = canvasRef.current?.width || GAME_WIDTH;
              playGameSound("pop");
              for (let i = 0; i < 5; i++) {
                state.bombs.push({
                  x: 20 + Math.random() * (gw - 60),
                  y: -50 - Math.random() * 180,
                  vy: 85 + Math.random() * 35,
                  size: 28,
                  hit: false
                });
              }
              setBotStatusText('المنافس أطلق القنابل ضدك! 💣');
              setTimeout(() => setBotStatusText(''), 3000);
            }, 1500);
            setTimeout(() => setBotStatusText(''), 5000);
          } else if (chosen === 'freeze') {
            setBotStatusText('المنافس يحضر وسيلة التجميد! 🧊');
            playGameSound("alarm");
            setFreezeWarning(true);
            setTimeout(() => {
              setFreezeWarning(false);
              const state = gameStateRef.current;
              const gw = canvasRef.current?.width || GAME_WIDTH;
              playGameSound("pop");
              for (let i = 0; i < 5; i++) {
                state.snows.push({
                  x: 20 + Math.random() * (gw - 60),
                  y: -50 - Math.random() * 180,
                  vy: 85 + Math.random() * 35,
                  size: 28,
                  hit: false
                });
              }
              setBotStatusText('المنافس أسقط الثلج عليك! 🧊');
              setTimeout(() => setBotStatusText(''), 3000);
            }, 1500);
            setTimeout(() => setBotStatusText(''), 5000);
          } else {
            state.isJamming = true;
            state.jamEndTime = now + 6000;
            setBotStatusText('المنافس شحن واستخدم التشويش ضدك! 📡');
            setTimeout(() => setBotStatusText(''), 6000);
          }
        }
      }

      // Powerup duration expiries
      if (freezeCountdown <= 0 && now > state.slowEndTime) state.slowFactor = 1;
      if (now > state.jamEndTime) state.isJamming = false;
      if (state.upgradeEndTime > 0 && now > state.upgradeEndTime) {
        state.upgradeEndTime = 0;
        setRocketLevel(1);
      }

      // Freeze Logic
      if (now > state.frozenEndTime) {
        state.isFrozen = false;
        state.frozenRotate = 0;
      }
      if (state.isFrozen !== prevIsFrozenRef.current) {
         setIsFrozenState(state.isFrozen);
         prevIsFrozenRef.current = state.isFrozen;
      }

      // Joystick & Keyboard Movement
      if (state.isFrozen) {
        state.frozenRotate += state.frozenRotateDir * 30 * dt;
        state.vx = 0;
        state.vy = 20; // slow drift down
      } else if (state.joystick.active) {
        const dx = state.joystick.currentX - state.joystick.originX;
        const dy = state.joystick.currentY - state.joystick.originY;
        const maxDist = 35;
        state.vx = (dx / maxDist) * 260;
        state.vy = (dy / maxDist) * 260;
      } else {
        const speed = 240;
        let vx = 0;
        let vy = 0;
        if (state.keys['ArrowLeft']) vx -= speed;
        if (state.keys['ArrowRight']) vx += speed;
        if (state.keys['ArrowUp']) vy -= speed;
        if (state.keys['ArrowDown']) vy += speed;
        state.vx = vx;
        state.vy = vy;
      }

      state.x += state.vx * dt;
      state.y += state.vy * dt;
      state.x = Math.max(0, Math.min(gw - ROCKET_WIDTH, state.x));
      state.y = Math.max(0, Math.min(gh - ROCKET_HEIGHT, state.y));

      // Sync Rocket DOM Position
      if (rocketRef.current) {
         rocketRef.current.style.left = `${(state.x / GAME_WIDTH) * 100}%`;
         rocketRef.current.style.top = `${(state.y / GAME_HEIGHT) * 100}%`;
         rocketRef.current.style.width = `${(ROCKET_WIDTH / GAME_WIDTH) * 100}%`;
         rocketRef.current.style.height = `${(ROCKET_HEIGHT / GAME_HEIGHT) * 100}%`;
         rocketRef.current.style.transform = `rotate(${state.frozenRotate}deg)`;

         const expectedSrc = state.isFrozen 
           ? (isPlayer1 ? `/rockets/blue-rocket-snow-lvl-${rocketLevel}.png` : `/rockets/red-rocket-snow-lvl-${rocketLevel}.png`)
           : (isPlayer1 ? `/rockets/blue-rocket-lvl-${rocketLevel}.gif` : `/rockets/red-rocket-lvl-${rocketLevel}.gif`);
         
         if (rocketRef.current.getAttribute('src') !== expectedSrc) {
           rocketRef.current.setAttribute('src', expectedSrc);
         }
      }

      // Shooting logic
      const isSpeedBoosted = now < state.speedEndTime;
      const fireDelay = isSpeedBoosted ? 75 : Math.max(100, 300 - rocketLevel * 45);

      if (!state.isFrozen && (state.keys['Shoot'] || state.keys[' '] || isSpeedBoosted) && now - state.lastShootTime > fireDelay) {
        state.lastShootTime = now;
        playGameSound("rocket-laser-single-shoot");
        if (rocketLevel >= 2 && !isSpeedBoosted) setTimeout(() => playGameSound("rocket-laser-single-shoot"), 80);
        if (rocketLevel >= 3 && !isSpeedBoosted) setTimeout(() => playGameSound("rocket-laser-single-shoot"), 160);
        
        const fireLaser = (offsetX: number) => {
           state.lasers.push({
              x: state.x + ROCKET_WIDTH / 2 - LASER_WIDTH / 2 + offsetX,
              y: state.y,
              vy: isSpeedBoosted ? -560 : -390
           });
        };
        
        fireLaser(0);
        if (rocketLevel >= 2) {
           fireLaser(-15);
           fireLaser(15);
        }
        if (rocketLevel >= 3) {
           fireLaser(-25);
           fireLaser(25);
        }
      }

      // Move lasers
      state.lasers.forEach(l => l.y += l.vy * dt);
      state.lasers = state.lasers.filter(l => l.y > -LASER_HEIGHT);

      // Spawn falling rocket upgrades (🚀) (Max 1 on screen, min 5 seconds between spawns)
      if (now - state.lastUpgradeSpawnTime > 5000 && Math.random() < 0.003 * state.slowFactor && state.upgrades.length < 1) {
        state.upgrades.push({
          x: Math.random() * (gw - 30),
          y: -30,
          vy: 60 * state.slowFactor,
          size: 28
        });
        state.lastUpgradeSpawnTime = now;
      }

      // Handle Bot dodging bombs (sometimes failing and getting hit)
      if (isBotMatch && botBombedUntilRef.current > now) {
         if (Math.random() < 0.005) { // Roughly ~30% chance per second to hit a bomb while bombed
            // Bot hit a bomb, we must unreveal one letter from its word!
            const currentBotRevealed = oppRevealedRef.current || [];
            if (currentBotRevealed.length > 0) {
              const unrevealIdx = currentBotRevealed[currentBotRevealed.length - 1];
              socket?.emit("space_war_bot_unreveal_index", { roomId: room.id, index: unrevealIdx });
            }
         }
      }

      // Spawn falling letters for OPPONENT'S WORD (oppWord)
      if (Math.random() < 0.024 * state.slowFactor) {
        let char = '';
        let isFake = false;
        let color = '#fef08a';
        
        if (oppWord) {
           if (state.isJamming && Math.random() < 0.6) {
               char = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
               isFake = true;
               color = '#fef08a';
           } else {
               char = oppWord[Math.floor(Math.random() * oppWord.length)];
           }
        } else {
           char = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
        }

        const baseVy = 50 + Math.random() * 30;
        state.letters.push({
          x: Math.random() * (gw - LETTER_SIZE),
          y: -LETTER_SIZE,
          char,
          baseVy,
          vy: baseVy * state.slowFactor,
          isFake,
          color
        });
      }

      // Move upgrades & check collection
      state.upgrades.forEach(u => {
        u.y += u.vy * dt;
        let collected = false;

        state.lasers.forEach((laser, lIdx) => {
          if (
            laser.x < u.x + u.size &&
            laser.x + LASER_WIDTH > u.x &&
            laser.y < u.y + u.size &&
            laser.y + LASER_HEIGHT > u.y
          ) {
            collected = true;
            state.lasers.splice(lIdx, 1);
          }
        });

        if (
          state.x < u.x + u.size &&
          state.x + ROCKET_WIDTH > u.x &&
          state.y < u.y + u.size &&
          state.y + ROCKET_HEIGHT > u.y
        ) {
          collected = true;
        }

        if (collected && !u.hit) {
          u.hit = true;
          setRocketLevel(prev => Math.min(3, prev + 1));
          state.upgradeEndTime = now + 10000;
          playGameSound("space-war-rocket-level-upgrade");

          for (let i = 0; i < 12; i++) {
             state.particles.push({
               x: u.x + 14,
               y: u.y + 14,
               vx: (Math.random() - 0.5) * 160,
               vy: (Math.random() - 0.5) * 160,
               life: 1,
               color: '#22c55e'
             });
          }
        }
      });
      state.upgrades = state.upgrades.filter(u => !u.hit && u.y < GAME_HEIGHT);

      // Move & process bombs
      state.bombs.forEach(b => {
        b.y += b.vy * dt;
        let exploded = false;

        state.lasers.forEach((laser, lIdx) => {
          if (
            laser.x < b.x + b.size &&
            laser.x + LASER_WIDTH > b.x &&
            laser.y < b.y + b.size &&
            laser.y + LASER_HEIGHT > b.y
          ) {
            exploded = true;
            state.lasers.splice(lIdx, 1);
          }
        });

        if (
          state.x < b.x + b.size &&
          state.x + ROCKET_WIDTH > b.x &&
          state.y < b.y + b.size &&
          state.y + ROCKET_HEIGHT > b.y
        ) {
          exploded = true;
        }

        if (exploded && !b.hit) {
          b.hit = true;
          playGameSound("boomingExplosion");

          // When a bomb is destroyed by the player, unreveal a letter from myRevealed (erasing player's word progress on opponent's screen)
          const currentMyRevealed = myRevealedRef.current || [];
          if (currentMyRevealed.length > 0) {
            const unrevealIdx = currentMyRevealed[currentMyRevealed.length - 1];
            socket?.emit("space_war_unreveal_index", { roomId: room.id, index: unrevealIdx });
            GameEngineService.handleAction("space_war_unreveal_index", { roomId: room.id, index: unrevealIdx, playerId: myId });
          }

          for (let i = 0; i < 20; i++) {
            state.particles.push({
              x: b.x + b.size / 2,
              y: b.y + b.size / 2,
              vx: (Math.random() - 0.5) * 180,
              vy: (Math.random() - 0.5) * 180,
              life: 1,
              color: '#ef4444'
            });
          }
        }
      });

      // Move & process snows
      state.snows.forEach(s => {
        s.y += s.vy * dt;
        let hit = false;

        state.lasers.forEach((laser, lIdx) => {
          if (
            laser.x < s.x + s.size &&
            laser.x + LASER_WIDTH > s.x &&
            laser.y < s.y + s.size &&
            laser.y + LASER_HEIGHT > s.y
          ) {
            hit = true;
            state.lasers.splice(lIdx, 1);
          }
        });

        if (
          state.x < s.x + s.size &&
          state.x + ROCKET_WIDTH > s.x &&
          state.y < s.y + s.size &&
          state.y + ROCKET_HEIGHT > s.y
        ) {
          hit = true;
        }

        if (hit && !s.hit) {
          s.hit = true;
          playGameSound("pop");

          // Freeze player
          state.isFrozen = true;
          state.frozenEndTime = Date.now() + 3000;
          state.frozenRotate = 0;
          state.frozenRotateDir = Math.random() > 0.5 ? 1 : -1;

          for (let i = 0; i < 20; i++) {
            state.particles.push({
              x: s.x + s.size / 2,
              y: s.y + s.size / 2,
              vx: (Math.random() - 0.5) * 180,
              vy: (Math.random() - 0.5) * 180,
              life: 1,
              color: '#7dd3fc'
            });
          }
        }
      });

      // Move letters & handle collisions
      let hitAny = false;
      state.letters.forEach(letter => {
        // Dynamic slow factor application to existing letters
        letter.y += (letter.baseVy || 80) * state.slowFactor * dt;

        let wasDestroyed = false;

        // 1. Collision with lasers
        state.lasers.forEach((laser, lIdx) => {
          if (
            !letter.hit &&
            laser.x < letter.x + LETTER_SIZE &&
            laser.x + LASER_WIDTH > letter.x &&
            laser.y < letter.y + LETTER_SIZE &&
            laser.y + LASER_HEIGHT > letter.y
          ) {
             wasDestroyed = true;
             state.lasers.splice(lIdx, 1);
          }
        });

        // 2. Collision with Rocket Body (Destroys letter immediately)
        if (
          !letter.hit &&
          state.x < letter.x + LETTER_SIZE &&
          state.x + ROCKET_WIDTH > letter.x &&
          state.y < letter.y + LETTER_SIZE &&
          state.y + ROCKET_HEIGHT > letter.y
        ) {
           wasDestroyed = true;
        }

        if (wasDestroyed && !letter.hit) {
           letter.hit = true;
           hitAny = true;
           if (!letter.isFake) {
             setScore(s => s + 10);
             setPowerups(prev => ({
                speed: Math.min(100, prev.speed + 12),
                slow: Math.min(100, prev.slow + 10),
                bomb: Math.min(100, prev.bomb + 8),
                jam: Math.min(100, prev.jam + 12),
                freeze: Math.min(100, prev.freeze + 10)
             }));
           }

           for (let i = 0; i < 8; i++) {
              state.particles.push({
                x: letter.x + LETTER_SIZE / 2,
                y: letter.y + LETTER_SIZE / 2,
                vx: (Math.random() - 0.5) * 140,
                vy: (Math.random() - 0.5) * 140,
                life: 1,
                color: letter.color || '#a855f7'
              });
           }
        }

        // 3. Letter missed and passed BELOW the rocket body!
        if (!letter.hit && !letter.passed && letter.y >= state.y + ROCKET_HEIGHT - 10) {
          letter.passed = true;
          if (!letter.isFake && oppWord?.includes(letter.char)) {
            // Find an index of this letter in oppWord that is not yet revealed
            const matchIndices: number[] = [];
            for (let i = 0; i < oppWord.length; i++) {
              if (oppWord[i] === letter.char && !oppRevealed.includes(i)) {
                matchIndices.push(i);
              }
            }
            if (matchIndices.length > 0) {
              const revealIdx = matchIndices[0];
              socket?.emit("space_war_reveal_index", { roomId: room.id, index: revealIdx });
              GameEngineService.handleAction("space_war_reveal_index", { roomId: room.id, index: revealIdx, playerId: myId });
              playGameSound("pop");
            }
          }
        }
      });

      if (hitAny) playGameSound("hammer");

      state.upgrades = state.upgrades.filter(u => !u.hit && u.y < gh);
      state.bombs = state.bombs.filter(b => !b.hit && b.y < gh);
      state.snows = state.snows.filter(s => !s.hit && s.y < gh);
      state.letters = state.letters.filter(l => !l.hit && l.y < gh);

      // Particles
      state.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 2.5;
      });
      state.particles = state.particles.filter(p => p.life > 0);

      // Render Frame
      ctx.clearRect(0, 0, gw, gh);

      // Render lasers
      ctx.fillStyle = '#60a5fa';
      state.lasers.forEach(l => {
        ctx.fillRect(l.x, l.y, LASER_WIDTH, LASER_HEIGHT);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#60a5fa';
      });
      ctx.shadowBlur = 0;

      // Render upgrades (🚀)
      state.upgrades.forEach(u => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#22c55e';
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(u.x + 14, u.y + 14, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#86efac';
        ctx.stroke();

        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚀', u.x + 14, u.y + 14);
      });
      ctx.shadowBlur = 0;

      // Render bombs (💣)
      state.bombs.forEach(b => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(b.x + 14, b.y + 14, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fca5a5';
        ctx.stroke();

        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', b.x + 14, b.y + 14);
      });
      ctx.shadowBlur = 0;

      // Render snows (🧊)
      state.snows.forEach(s => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#38bdf8';
        ctx.fillStyle = '#0369a1';
        ctx.beginPath();
        ctx.arc(s.x + 14, s.y + 14, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#bae6fd';
        ctx.stroke();

        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧊', s.x + 14, s.y + 14);
      });
      ctx.shadowBlur = 0;

      // Render letters
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      state.letters.forEach(l => {
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#eab308';
        ctx.fillStyle = l.color;
        ctx.fillText(l.char, l.x + LETTER_SIZE / 2, l.y + LETTER_SIZE / 2);
      });
      ctx.shadowBlur = 0;

      // Render particles
      state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

    } catch(err) { 
      console.error('Error in updateGame:', err); 
    }

    requestRef.current = requestAnimationFrame(updateGame);
  }, [room?.gameState, rocketLevel, myWord, playSound, room?.id, socket, freezeCountdown, isBotMatch, myRevealed]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [updateGame]);

  // Global Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key ? e.key.toLowerCase() : '';
      const code = e.code;
      gameStateRef.current.keys[e.key] = true;
      if (code) gameStateRef.current.keys[code] = true;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code) || 
          ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'q', 'w', 'e', 'r', 't', 'ض', 'ص', 'ث', 'ق', 'ف'].includes(key)) {
         e.preventDefault();
      }
      if (e.key === ' ' || e.key === 'Spacebar' || code === 'Space') {
         gameStateRef.current.keys['Shoot'] = true;
      }
      if (code === 'KeyQ' || key === 'q' || key === 'ض') usePowerupRef.current('jam');
      if (code === 'KeyW' || key === 'w' || key === 'ص') usePowerupRef.current('bomb');
      if (code === 'KeyE' || key === 'e' || key === 'ث') usePowerupRef.current('slow');
      if (code === 'KeyR' || key === 'r' || key === 'ق') usePowerupRef.current('speed');
      if (code === 'KeyT' || key === 't' || key === 'ف') usePowerupRef.current('freeze');
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key] = false;
      if (e.code) gameStateRef.current.keys[e.code] = false;
      if (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space') {
         gameStateRef.current.keys['Shoot'] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Joystick handlers
  const updateKnobDOM = () => {
     if (!joystickKnobRef.current) return;
     const state = gameStateRef.current;
     let knobX = 50;
     let knobY = 50;
     if (state.joystick.active && state.joystick.originX !== 0) {
       const dx = state.joystick.currentX - state.joystick.originX;
       const dy = state.joystick.currentY - state.joystick.originY;
       knobX = 50 + (dx / 35) * 40;
       knobY = 50 + (dy / 35) * 40;
     }
     joystickKnobRef.current.style.left = `${knobX}%`;
     joystickKnobRef.current.style.top = `${knobY}%`;
  };

  const handleJoystickPointerDown = (e: React.PointerEvent) => {
     try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
     const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
     const state = gameStateRef.current;
     state.joystick.active = true;
     state.joystick.originX = rect.left + rect.width / 2;
     state.joystick.originY = rect.top + rect.height / 2;
     state.joystick.currentX = e.clientX;
     state.joystick.currentY = e.clientY;
     updateKnobDOM();
  };

  const handleJoystickPointerMove = (e: React.PointerEvent) => {
     const state = gameStateRef.current;
     if (state.joystick.active) {
        let dx = e.clientX - state.joystick.originX;
        let dy = e.clientY - state.joystick.originY;
        const maxDist = 35;
        const dist = Math.hypot(dx, dy);
        
        if (dist > maxDist) {
           dx = (dx / dist) * maxDist;
           dy = (dy / dist) * maxDist;
        }

        state.joystick.currentX = state.joystick.originX + dx;
        state.joystick.currentY = state.joystick.originY + dy;
        updateKnobDOM();
     }
  };

  const handleJoystickPointerUp = (e: React.PointerEvent) => {
     try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
     const state = gameStateRef.current;
     state.joystick.active = false;
     state.joystick.currentX = state.joystick.originX;
     state.joystick.currentY = state.joystick.originY;
     state.vx = 0;
     state.vy = 0;
     updateKnobDOM();
  };

  const getRocketSrc = () => {
    if (isFrozenState) {
      if (rocketLevel === 3) return isPlayer1 ? "/rockets/blue-rocket-snow-lvl-3.png" : "/rockets/red-rocket-snow-lvl-3.png";
      if (rocketLevel === 2) return isPlayer1 ? "/rockets/blue-rocket-snow-lvl-2.png" : "/rockets/red-rocket-snow-lvl-2.png";
      return isPlayer1 ? "/rockets/blue-rocket-snow-lvl-1.png" : "/rockets/red-rocket-snow-lvl-1.png";
    }
    if (rocketLevel === 3) {
      return isPlayer1 ? "/rockets/blue-rocket-lvl-3.gif" : "/rockets/red-rocket-lvl-3.gif";
    }
    if (rocketLevel === 2) {
      return isPlayer1 ? "/rockets/blue-rocket-lvl-2.gif" : "/rockets/red-rocket-lvl-2.gif";
    }
    return isPlayer1 ? "/rockets/blue-rocket-lvl-1.gif" : "/rockets/red-rocket-lvl-1.gif";
  };

  // Game Finished Screen
  const prevGameState = useRef<string | undefined>(room?.gameState);
  useEffect(() => {
    if (room?.gameState !== prevGameState.current) {
      if (room?.gameState === 'space_war_finished') {
        const isWinner = room.spaceWar?.winnerId === myId;
        const isDraw = room.spaceWar?.winnerId === null;
        if (isDraw) {
          if (playSound) playSound("draw");
        } else if (isWinner) {
          if (playSound) playSound("win");
        } else {
          if (playSound) playSound("lose");
        }
      }
      prevGameState.current = room?.gameState;
    }
  }, [room?.gameState, room?.spaceWar?.winnerId, myId, playSound]);

  if (room?.gameState === 'space_war_finished') {
     const isWinner = room.spaceWar?.winnerId === myId;
     const isDraw = room.spaceWar?.winnerId === null;

     return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-[#0a0a2a] rounded-2xl border-4 border-indigo-900 text-white min-h-[70vh] text-center" dir="rtl">
           {renderSpaceWarRewardBar && renderSpaceWarRewardBar()}

           <div className="bg-indigo-950/80 border-2 border-indigo-500/80 p-2 rounded-3xl max-w-md w-full my-auto space-y-4">
              <h2 className="text-xl mb-2 font-black text-yellow-300 drop-shadow">انتهت المعركة الفضائية!</h2>
              
              <p className={`text-[16px] mb-2 font-black py-1 px-2 rounded-2xl border ${
                isDraw 
                  ? 'bg-amber-900/60 border-amber-400 text-amber-300' 
                  : isWinner 
                    ? 'bg-emerald-900/60 border-emerald-400 text-emerald-300' 
                    : 'bg-rose-900/60 border-rose-400 text-rose-300'
              }`}>
                 {isDraw ? '🤝 انتهت المباراة بالتعادل!' : isWinner ? '🏆 لقد فزت بالمعركة!' : '😢 للأسف خسرت المعركة!'}
              </p>

              {/* Match Summary Details */}
              <div className="bg-indigo-900/50 border border-indigo-700/50 rounded-2xl p-1 mb-1 space-y-3 text-right">
                 <div className="flex justify-between items-center text-sm border-b border-indigo-800/60 pb-2">
                    <span className="text-indigo-300 font-bold">اللاعب:</span>
                    <span className="font-black text-white">{myPlayerObj?.name || "أنت"}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-indigo-800/60 pb-2">
                    <span className="text-indigo-300 font-bold">المنافس:</span>
                    <span className="font-black text-white">{oppPlayerObj?.name || "المنافس"}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-indigo-800/60 pb-2">
                    <span className="text-indigo-300 font-bold">كلمتك:</span>
                    <span className="font-black text-emerald-300 tracking-widest">{myWord || "—"}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-indigo-800/60 pb-2">
                    <span className="text-indigo-300 font-bold">كلمة المنافس:</span>
                    <span className="font-black text-amber-300 tracking-widest">{oppWord || "—"}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-1">
                    <span className="text-indigo-300 font-bold">نقاط المباراة:</span>
                    <span className="font-black text-emerald-400">{isWinner ? "+10 نقاط 🏆" : "+0 نقاط"}</span>
                 </div>
              </div>

              <GameEndControls
                 room={room}
                 socket={socket}
                 myId={myId}
                 playerSerial={playerSerial}
                 isRematchRequestedByMe={room.spaceWar?.rematchRequestedBy?.includes(myId)}
                 isRematchRequestedByOpponent={room.spaceWar?.rematchRequestedBy?.includes(oppPlayerObj?.id)}
                 onChangeGame={() => {}}
                 onRematch={() => {
                    socket?.emit("bot_event", { roomId: room.id, type: "play_again", gameType: "space_war" });
                    socket?.emit("request_space_war_rematch", { roomId: room.id });
                    GameEngineService.handleAction("request_space_war_rematch", { roomId: room.id, playerId: myId });
                 }}
                 onLeaveGame={handleLeaveGame}
                 playSound={playSound}
                 className="pt-2"
              />
           </div>
        </div>
     );
  }

  // Calculate joystick knob position
  let knobX = 50;
  let knobY = 50;
  const state = gameStateRef.current;
  if (state.joystick.active && state.joystick.originX !== 0) {
     const dx = state.joystick.currentX - state.joystick.originX;
     const dy = state.joystick.currentY - state.joystick.originY;
     knobX = 50 + (dx / 35) * 40;
     knobY = 50 + (dy / 35) * 40;
  }

  const isReady = room?.spaceWar?.readyPlayers?.includes(myId);

  return (
    <React.Fragment>
      <div id="spacewar-container" className="w-full h-[80dvh] min-h-[450px] max-h-[800px] max-w-[500px] mx-auto bg-[#0a0a2a] relative overflow-hidden flex flex-col select-none touch-none rounded-2xl shadow-2xl border-4 border-indigo-900" style={{ touchAction: 'none' }}>
      
      {/* SETUP / INSTRUCTIONS */}
      {room?.gameState === 'space_war_setup' && (
        <div className="absolute inset-0 bg-[#07071a]/95 z-40 flex flex-col items-center justify-center p-2 overflow-y-auto text-white text-right" dir="rtl">

          <div className="w-full max-w-md">
            
            <div className="bg-indigo-950/80 p-0.5 space-y-1">
              <div className="flex items-center gap-2 text-yellow-400 font-black text-sm">
                <Sparkles className="w-4 h-4" />
                <span>طريقة اللعب وكيفية الفوز:</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                حروف كلمة المنافس تسقط في شاشتك! مهمتك التحكم بسفينتك وإطلاق النار لتدمير جميع الحروف قبل أن تصل إلى الأسفل. إذا مرت الحروف ووصلت للأسفل ستكتمل كلمة المنافس فوق وتخسر المباراة!
              </p>
            </div>

            <div className="bg-indigo-950/80 p-0.5 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
                <ShieldPlus className="w-4 h-4" />
                <span>وسائل المساعدة والترقيات:</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-200 font-bold">
                <div className="bg-indigo-900/50 p-1 flex items-center gap-1.5">
                  <div>
                    <div className="text-cyan-300">تجميد الوقت ⏱️</div>
                    <div className="text-[10px] text-slate-300 font-normal">يبطئ سقوط الحروف لمدة 10 ثوانٍ!</div>
                  </div>
                </div>
                <div className="bg-indigo-900/50 p-1 flex items-center gap-1.5">
                  <div>
                    <div className="text-green-300">ترقية الصاروخ 🚀</div>
                    <div className="text-[10px] text-slate-300 font-normal">تسقط من السماء لتطوير الصاروخ!</div>
                  </div>
                </div>
                <div className="bg-indigo-900/50 p-1 flex items-center gap-1.5">
                  <div>
                    <div className="text-yellow-300">ليزر تلقائي ⚡</div>
                    <div className="text-[10px] text-slate-300 font-normal">تزودك بسرعة طلقات الليزر!</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-950/80 p-0.5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <Swords className="w-4 h-4" />
                <span>قدرات التشويش والقنابل:</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-3 gap-2 text-[11px] text-slate-200 font-semibold">
                <div className="flex items-center gap-1.5 bg-indigo-900/40 p-1">
                  <Bomb className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-[10px]">القنابل تمسح الحروف</span>
                </div>
                <div className="flex items-center gap-1.5 bg-indigo-900/40 p-1">
                  <WifiOff className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-[10px]">التشويش يزيد عدد الحروف</span>
                </div>
                <div className="flex items-center gap-1.5 bg-indigo-900/40 p-1">
                  <Box className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="cyan" />
                  <span className="text-[10px]">تجميد صاروخ المنافس</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-950/80 p-0.5 space-y-1.5">
              <div className="flex items-center gap-2 text-pink-400 font-black text-xs md:text-sm">
                <Gamepad2 className="w-4 h-4" />
                <span>أدوات التحكم (موبايل و كمبيوتر):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-200 font-semibold">
                <div className="flex flex-wrap gap-1 bg-indigo-900/40 p-1.5 rounded-xl border border-indigo-700/40 space-y-0.5">
                  <div className="text-amber-300 font-bold">📱 الموبايل:</div>
                  <div>🕹️ <span className="text-indigo-300 font-bold">عصا التحكم</span> للتحريك</div>
                  <div>🎯 <span className="text-red-300 font-bold">زر الإطلاق</span> للإطلاق</div>
                </div>
                <div className="bg-indigo-900/40 p-1.5 rounded-xl border border-indigo-700/40 space-y-1">
                  <div className="text-amber-300 font-bold">💻 الكمبيوتر (الكيبورد):</div>
                  <div className="flex items-center gap-1">
                    <span>⌨️ الحركة:</span>
                    <span className="bg-slate-800 px-1 py-0.5 rounded border-[0.5px] flex items-center justify-center border-slate-600 font-mono text-[9px] text-yellow-300">← ↑ → ↓</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🚀 الإطلاق:</span>
                    <span className="bg-slate-800 px-1 py-0.5 rounded border-[0.5px] flex items-center justify-center border-slate-600 font-mono text-[9px] text-red-300">Space (المسافة)</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[9px] pt-0.5">
                    <span className="bg-purple-950 border-[0.5px] flex items-center justify-center border-purple-500 px-1 rounded font-bold text-purple-200">Q: تشويش</span>
                    <span className="bg-red-950 border-[0.5px] flex items-center justify-center border-red-500 px-1 rounded font-bold text-red-200">W: قنابل</span>
                    <span className="bg-cyan-950 border-[0.5px] flex items-center justify-center border-cyan-500 px-1 rounded font-bold text-cyan-200">E: تبطيء</span>
                    <span className="bg-sky-950 border-[0.5px] flex items-center justify-center border-sky-400 px-1 rounded font-bold text-sky-200">T: تجميد</span>
                    <span className="bg-yellow-950 border-[0.5px] flex items-center justify-center border-yellow-500 px-1 rounded font-bold text-yellow-200">R: سريع</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="w-full max-w-md mb-1 md:mb-2 pb-1">
            <button
              onClick={() => {
                if (playSound) playSound("clickOpen");
                socket?.emit("space_war_ready", { roomId: room.id });
                GameEngineService.handleAction("space_war_ready", { roomId: room.id, playerId: myId });
              }}
              disabled={isReady}
              className={`w-full py-3.5 px-6 font-black rounded-2xl shadow-xl transition-all duration-200 text-base flex items-center justify-center gap-2 ${
                isReady
                  ? "bg-slate-700 text-slate-300 border-2 border-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white border-2 border-indigo-400 shadow-indigo-500/30"
              }`}
            >
              {isReady ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>في انتظار جاهزية المنافس... ⏳</span>
                </>
              ) : (
                <>
                  <span>🚀 جاهز للقتال! ابدأ المعركة</span>
                </>
              )}
            </button>
          </div>
        </div>  
      )}
      
      {/* Words Status Top Header */}
      <div className="absolute top-1 left-0 w-full flex flex-col items-center z-10 pointer-events-none px-2">
         <div className="bg-black/50 border-2 border-indigo-500/80 p-1 px-1 flex items-center justify-between pointer-events-auto w-full max-w-[440px] gap-0.5" dir="rtl">
            <div className="flex items-center gap-1 font-black text-amber-300 text-xs sm:text-sm shrink-0">
              <span className="sm:inline">كلمة المنافس:</span>
            </div>

            <div className="flex gap-1 flex-wrap justify-center py-0.5" spellCheck={false}>
              {oppWord?.split('').map((char: string, idx: number) => {
                const isRevealed = oppRevealed.includes(idx);
                return (
                  <div 
                    key={idx} 
                    className={`w-6 h-7 sm:w-7 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm border shadow-inner transition-all ${
                      isRevealed 
                        ? 'bg-amber-900/90 border-amber-400 text-yellow-300 scale-105 animate-pulse' 
                        : 'bg-indigo-950/80 border-indigo-700 text-indigo-400'
                    }`}
                  >
                    {isRevealed ? char : "_"}
                  </div>
                );
              })}
            </div>

            {/* 2-Minute Match Countdown Timer */}
            <div className="flex items-center gap-1 bg-indigo-950 border border-indigo-700/80 px-2 py-0.5 rounded-xl text-xs font-black text-cyan-300 shadow shrink-0">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{formatTime(matchTimeLeft)}</span>
            </div>

         </div>

         {/* Time Freeze Indicator Banner */}
         {freezeCountdown > 0 && (
           <div className="mt-1.5 bg-cyan-950/90 border border-cyan-400 text-cyan-200 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg animate-pulse pointer-events-auto">
             <Snowflake className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
             <span>تجميد الوقت متفعل! تباطؤ سقوط الحروف ({freezeCountdown}ث)</span>
           </div>
         )}

         {/* Speed Boost Indicator Banner */}
         {speedCountdown > 0 && (
           <div className="mt-1.5 bg-yellow-950/90 border border-yellow-400 text-yellow-200 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg animate-pulse pointer-events-auto">
             <Zap className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
             <span>سرعة الطلقات الفائقة متفعلة! ⚡ ({speedCountdown}ث)</span>
           </div>
         )}

         {/* Bot Status Banner */}
         {botStatusText && (
           <div className="mt-1.5 bg-amber-950/90 border border-amber-400 text-amber-200 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg animate-pulse pointer-events-auto">
             <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
             <span>{botStatusText}</span>
           </div>
         )}
      </div>

      {/* Game Play Canvas Wrapper */}
      <div 
        ref={gamePlayContainerRef}
        className="relative w-full flex-1 bg-[url('/space-bg.jpg')] bg-cover bg-center overflow-hidden min-h-0 select-none"
      >
        {/* Icy Glow Overlay during Time Freeze */}
        {freezeCountdown > 0 && (
          <div className="absolute inset-0 pointer-events-none z-10 animate-pulse border-2 border-cyan-400/50" />
        )}
        
        {bombWarning && (
          <div className="absolute inset-0 pointer-events-none z-10 flex justify-between overflow-hidden">
            <div className="w-4 h-full bg-red-600/60 blur-md animate-pulse shadow-[0_0_20px_10px_rgba(220,38,38,0.7)]"></div>
            <div className="w-4 h-full bg-red-600/60 blur-md animate-pulse shadow-[0_0_20px_10px_rgba(220,38,38,0.7)]"></div>
          </div>
        )}

        {freezeWarning && (
          <div className="absolute inset-0 pointer-events-none z-10 flex justify-between overflow-hidden">
            <div className="w-4 h-full bg-cyan-400/70 blur-md animate-pulse shadow-[0_0_20px_10px_rgba(56,189,248,0.8)]"></div>
            <div className="w-4 h-full bg-cyan-400/70 blur-md animate-pulse shadow-[0_0_20px_10px_rgba(56,189,248,0.8)]"></div>
          </div>
        )}

        {/* Canvas */}
        <canvas
           ref={canvasRef}
           width={GAME_WIDTH}
           height={GAME_HEIGHT}
           className="w-full h-full block"
        />
        
        {/* DOM Rocket */}
        <img
           ref={rocketRef}
           src={getRocketSrc()}
           alt="Rocket"
           className="absolute z-10 pointer-events-none transition-none object-contain"
           style={{
              width: `${(ROCKET_WIDTH / GAME_WIDTH) * 100}%`,
              height: `${(ROCKET_HEIGHT / GAME_HEIGHT) * 100}%`,
              left: `${((GAME_WIDTH / 2 - ROCKET_WIDTH / 2) / GAME_WIDTH) * 100}%`,
              top: `${((GAME_HEIGHT - ROCKET_HEIGHT - 30) / GAME_HEIGHT) * 100}%`,
           }}
        />
      </div>

      {/* Sleek Controls & Helpers Bar */}
      <div className="bg-slate-950 border-t-2 border-indigo-900 px-3 py-2 flex items-center justify-between gap-2 shrink-0 z-20">
         
         {/* Left: Fire Button */}
         <button
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); gameStateRef.current.keys['Shoot'] = true; }}
            onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); gameStateRef.current.keys['Shoot'] = false; }}
            onPointerCancel={(e) => { e.preventDefault(); e.stopPropagation(); gameStateRef.current.keys['Shoot'] = false; }}
            onPointerLeave={(e) => { e.preventDefault(); e.stopPropagation(); gameStateRef.current.keys['Shoot'] = false; }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); gameStateRef.current.keys['Shoot'] = true; }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); gameStateRef.current.keys['Shoot'] = false; }}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 border-2 border-red-300 shadow-[0_0_15px_rgba(225,29,72,0.6)] flex items-center justify-center active:scale-90 transition-transform select-none touch-none shrink-0"
         >
            <Target className="w-8 h-8 text-white pointer-events-none drop-shadow" />
         </button>

         {/* Center: Power-up Helpers Bar (Q - W - E - T - R) */}
         <div className="flex items-center gap-1 md:gap-1.5 bg-indigo-950/60 p-1.5 rounded-2xl border border-indigo-800/70 select-none touch-none" dir="ltr">
            
            {/* Q: Jamming */}
            <div 
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); usePowerup('jam'); }}
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); usePowerup('jam'); }}
              className={`relative group cursor-pointer select-none touch-none ${isFrozenState ? 'opacity-50 pointer-events-none' : ''}`}
            >
               {isFrozenState && <div className="absolute inset-0 bg-sky-200/50 rounded-full z-10 pointer-events-none"></div>}
               <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border ${powerups.jam >= 100 ? 'bg-purple-500 border-purple-200 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'bg-gray-800 border-gray-700'}`}>
                  <WifiOff className={`w-4 h-4 ${powerups.jam >= 100 ? 'text-white' : 'text-gray-500'}`} />
               </div>
               <span className="absolute -top-1.5 -right-1 bg-purple-950/90 border-[0.5px] border-purple-400/20 text-purple-200 text-[8px] font-normal px-1 rounded-full pointer-events-none">Q</span>
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-1 bg-gray-900 rounded-full overflow-hidden pointer-events-none">
                  <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${powerups.jam}%` }} dir="rtl"></div>
               </div>
            </div>

            {/* W: Bomb */}
            <div 
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); usePowerup('bomb'); }}
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); usePowerup('bomb'); }}
              className={`relative group cursor-pointer select-none touch-none ${isFrozenState ? 'opacity-50 pointer-events-none' : ''}`}
            >
               {isFrozenState && <div className="absolute inset-0 bg-sky-200/50 rounded-full z-10 pointer-events-none"></div>}
               <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border ${powerups.bomb >= 100 ? 'bg-red-500 border-red-200 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-gray-800 border-gray-700'}`}>
                  <Bomb className={`w-4 h-4 ${powerups.bomb >= 100 ? 'text-white' : 'text-gray-500'}`} />
               </div>
               <span className="absolute -top-1.5 -right-1 bg-red-950/90 border-[0.5px] border-red-400/20 text-red-200 text-[8px] font-normal px-1 rounded-full pointer-events-none">W</span>
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-1 bg-gray-900 rounded-full overflow-hidden pointer-events-none">
                  <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${powerups.bomb}%` }} dir="rtl"></div>
               </div>
            </div>

            {/* E: Time Freeze Helper */}
            <div 
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); usePowerup('slow'); }}
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); usePowerup('slow'); }}
              className={`relative group cursor-pointer select-none touch-none ${isFrozenState ? 'opacity-50 pointer-events-none' : ''}`}
            >
               {isFrozenState && <div className="absolute inset-0 bg-sky-200/50 rounded-full z-10 pointer-events-none"></div>}
               <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border ${powerups.slow >= 100 ? 'bg-cyan-400 border-cyan-200 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-gray-800 border-gray-700'}`}>
                  <Snowflake className={`w-4 h-4 ${powerups.slow >= 100 ? 'text-slate-950' : 'text-gray-500'}`} />
               </div>
               <span className="absolute -top-1.5 -right-1 bg-cyan-950/90 border-[0.5px] border-cyan-400/20 text-cyan-200 text-[8px] font-normal px-1 rounded-full pointer-events-none">E</span>
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-1 bg-gray-900 rounded-full overflow-hidden pointer-events-none">
                  <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${powerups.slow}%` }} dir="rtl"></div>
               </div>
            </div>

            {/* R: Fast Fire Speed */}
            <div 
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); usePowerup('speed'); }}
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); usePowerup('speed'); }}
              className={`relative group cursor-pointer select-none touch-none ${isFrozenState ? 'opacity-50 pointer-events-none' : ''}`}
            >
               {isFrozenState && <div className="absolute inset-0 bg-sky-200/50 rounded-full z-10 pointer-events-none"></div>}
               <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border ${powerups.speed >= 100 ? 'bg-yellow-400 border-yellow-200 animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'bg-gray-800 border-gray-700'}`}>
                  <Zap className={`w-4 h-4 ${powerups.speed >= 100 ? 'text-slate-950' : 'text-gray-500'}`} />
               </div>
               <span className="absolute -top-1.5 -right-1 bg-yellow-950/90 border-[0.5px] border-yellow-400/20 text-yellow-200 text-[8px] font-normal px-1 rounded-full pointer-events-none">R</span>
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-1 bg-gray-900 rounded-full overflow-hidden pointer-events-none">
                  <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${powerups.speed}%` }} dir="rtl"></div>
               </div>
            </div>

            {/* T: Freeze Ship Helper */}
            <div 
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); usePowerup('freeze'); }}
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); usePowerup('freeze'); }}
              className={`relative group cursor-pointer select-none touch-none ${isFrozenState ? 'opacity-50 pointer-events-none' : ''}`}
            >
               {isFrozenState && <div className="absolute inset-0 bg-sky-200/50 rounded-full z-10 pointer-events-none"></div>}
               <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border ${powerups.freeze >= 100 ? 'bg-sky-400 border-sky-200 animate-pulse shadow-[0_0_10px_rgba(56,189,248,0.8)]' : 'bg-gray-800 border-gray-700'}`}>
                  <Box className={`w-4 h-4 ${powerups.freeze >= 100 ? 'text-slate-950' : 'text-gray-500'}`} />
               </div>
               <span className="absolute -top-1.5 -right-1 bg-sky-950/90 border-[0.5px] border-sky-400/20 text-sky-200 text-[8px] font-normal px-1 rounded-full pointer-events-none">T</span>
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-1 bg-gray-900 rounded-full overflow-hidden pointer-events-none">
                  <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${powerups.freeze}%` }} dir="rtl"></div>
               </div>
            </div>
            
         </div>

         {/* Right: Circular Virtual Joystick */}
         <div 
            onPointerDown={handleJoystickPointerDown}
            onPointerMove={handleJoystickPointerMove}
            onPointerUp={handleJoystickPointerUp}
            onPointerCancel={handleJoystickPointerUp}
            className="w-16 h-16 md:w-18 md:h-18 bg-indigo-950/80 border-2 border-indigo-500/60 rounded-full relative touch-none select-none flex items-center justify-center shadow-inner shrink-0"
         >
            <div className="absolute top-1 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-indigo-400/60 pointer-events-none"></div>
            <div className="absolute bottom-1 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-indigo-400/60 pointer-events-none"></div>
            <div className="absolute left-1 border-t-[4px] border-b-[4px] border-r-[6px] border-transparent border-r-indigo-400/60 pointer-events-none"></div>
            <div className="absolute right-1 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent border-l-indigo-400/60 pointer-events-none"></div>

            <div 
              ref={joystickKnobRef}
              className="absolute w-8 h-8 bg-purple-500 border-2 border-indigo-200 rounded-full pointer-events-none transition-none"
              style={{
                left: `${knobX}%`,
                top: `${knobY}%`,
                transform: 'translate(-50%, -50%)'
              }}
            ></div>
         </div>

      </div>
      </div>

      {room?.gameState === 'space_war_setup' && CategoryPageAd && (
        <div className="w-full flex justify-center flex-shrink-0 mt-2">
          <CategoryPageAd isAdmin={isAdmin} isPro={hasProPackage} />
        </div>
      )}
    </React.Fragment>
  );
}
