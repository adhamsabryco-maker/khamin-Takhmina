import React, { useState, useEffect, useRef, useMemo } from "react";
import { Play, RotateCcw, Award, Volume2, VolumeX, AlertCircle, Info, ArrowLeft, ArrowRight, Zap, CheckCircle2, ShieldAlert, Trophy, Compass, Sparkles, Eraser } from "lucide-react";
import { GameEndControls } from "./components/GameEndControls";
import { GameEngineService } from "./services/gameEngineService";

interface BeachRaceGameProps {
  room: any;
  socket: any;
  playerSerial: string;
  isAdmin?: boolean;
  hasProPackage?: boolean;
  CategoryPageAd?: any;
  renderRewardBar?: any;
  playSound?: (type: string) => void;
  stopSound?: () => void;
  handleLeaveGame: () => void;
  showAlert?: (msg: string) => void;
  showConfirm?: (msg: string, onConfirm: () => void) => void;
  showAd?: any;
}

const ALL_ARABIC_LETTERS = [
  "أ", "إ", "آ", "ا", "ء", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", 
  "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", 
  "ه", "و", "ي", "ة", "ى", "ؤ", "ئ"
];

export default function BeachRaceGame({
  room,
  socket,
  playerSerial,
  isAdmin,
  hasProPackage,
  CategoryPageAd,
  renderRewardBar,
  playSound,
  handleLeaveGame,
  showAlert,
  showConfirm,
  showAd,
}: BeachRaceGameProps) {
  const me = useMemo(() => {
    return room?.players?.find((p: any) => p.serial === playerSerial || p.id === socket?.id) || room?.players?.[0];
  }, [room, playerSerial, socket?.id]);

  const opp = useMemo(() => {
    return room?.players?.find((p: any) => p.id !== me?.id);
  }, [room, me]);

  // Game state references & variables
  const isPlaying = room?.gameState === "beach_race_playing";

  const [isLocalFinished, setIsLocalFinished] = useState<boolean>(false);
  const [finishWinnerId, setFinishWinnerId] = useState<string | null>(null);
  const isFinished = room?.gameState === "beach_race_finished" || isLocalFinished;
  const isGameActive = isPlaying && !isFinished;

  const isOpponentInAd = React.useMemo(() => {
    if (!room?.adPausedPlayersArray || room.adPausedPlayersArray.length === 0) return false;
    return room.adPausedPlayersArray.some((id: string) => {
      if (id === socket?.id || id === me?.id) return false;
      const p = room.players?.find((pl: any) => pl.id === id || pl.socketId === id);
      return p && !p.isBot;
    });
  }, [room?.adPausedPlayersArray, room?.players, socket?.id, me?.id]);

  // Local Runner State & UI controls
  const [distance, setDistance] = useState<number>(0);
  const [lane, setLane] = useState<number>(1); // 0: Left, 1: Center, 2: Right
  const [collectedLetters, setCollectedLetters] = useState<string[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentCheckpointStage, setCurrentCheckpointStage] = useState<number>(1);
  const [guessInput, setGuessInput] = useState<string>("");
  const [wrongGuessMsg, setWrongGuessMsg] = useState<string>("");
  const [isPausedAtCheckpoint, setIsPausedAtCheckpoint] = useState<boolean>(false);

  // Carrots & Flying Particles State
  const [carrotsCollected, setCarrotsCollected] = useState<number>(0);
  const [flyingCarrots, setFlyingCarrots] = useState<Array<{ id: number; startTime: number; duration: number; progress: number; hit: boolean }>>([]);
  const [carrotBoxPulse, setCarrotBoxPulse] = useState<boolean>(false);

  // Custom audio player using pooled instances for mobile browser stability
  const customAudioCacheRef = useRef<{ [src: string]: HTMLAudioElement[] }>({});

  const playCustomAudio = (src: string, volume = 1.0) => {
    try {
      if (!customAudioCacheRef.current[src]) {
        customAudioCacheRef.current[src] = [];
      }
      const pool = customAudioCacheRef.current[src];
      let audio = pool.find((a) => a.paused || a.ended);
      if (!audio) {
        if (pool.length < 5) {
          audio = new Audio(src);
          pool.push(audio);
        } else {
          audio = pool[0]; // reuse first if max pool size reached
        }
      }
      audio.volume = volume;
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (e) {}
  };

  // Trigger 10-carrot celebration milestone animation & sound
  const trigger10CarrotMilestone = () => {
    playCustomAudio("/sounds/rabbit-cartoon-success-voice.mp3", 0.9);

    const now = Date.now();
    const particles = [];
    for (let i = 0; i < 10; i++) {
      particles.push({
        id: now + i + Math.random(),
        startTime: now + i * 85,
        duration: 550,
        progress: 0,
        hit: false,
      });
    }
    setFlyingCarrots((prev) => [...prev, ...particles]);
  };

  // Flying Carrots Animation Loop
  useEffect(() => {
    if (flyingCarrots.length === 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      setFlyingCarrots((prev) => {
        const next = prev.map((p) => {
          if (p.hit) return p;
          if (now < p.startTime) return p;

          const elapsed = now - p.startTime;
          const progress = Math.min(1, elapsed / p.duration);

          if (progress >= 1 && !p.hit) {
            playCustomAudio("/sounds/pop.mp3", 0.6);
            setCarrotBoxPulse(true);
            setTimeout(() => setCarrotBoxPulse(false), 150);
            return { ...p, progress: 1, hit: true };
          }

          return { ...p, progress };
        });

        return next.filter((p) => !(p.hit && now > p.startTime + p.duration + 120));
      });
    }, 16);

    return () => clearInterval(timer);
  }, [flyingCarrots]);

  // Track completed checkpoints to avoid re-triggering modal on same distance
  const [passedCheckpoints, setPassedCheckpoints] = useState<{ [stage: number]: boolean }>({ 1: false, 2: false, 3: false });

  // Power-Up States & Timers
  const speedBoostUntilRef = useRef<number>(0);
  const magnetUntilRef = useRef<number>(0);
  const lastPowerupTimeRef = useRef<number>(0);

  // 7-Minute Main Race Timer (420 seconds)
  const [matchTimeLeft, setMatchTimeLeft] = useState<number>(420);
  // 1-Minute Checkpoint Guessing Timer (60 seconds)
  const [checkpointTimeLeft, setCheckpointTimeLeft] = useState<number>(60);

  // Match counter for showing ads after every 3 matches
  const matchCountRef = useRef<number>(0);
  const hasHandledFinishForCurrentMatchRef = useRef<boolean>(false);

  useEffect(() => {
    if (room?.gameState === "beach_race_setup" || room?.gameState === "beach_race_playing") {
      setIsLocalFinished(false);
      setFinishWinnerId(null);
      setDistance(0);
      setLane(1);
      laneRef.current = 1;
      isRunningRef.current = false;
      roadOffsetRef.current = 0;
      setShowModal(false);
      setIsPausedAtCheckpoint(false);
      setCurrentCheckpointStage(1);
      setPassedCheckpoints({ 1: false, 2: false, 3: false });
      setCollectedLetters([]);
      setCarrotsCollected(0);
      setFlyingCarrots([]);
      setGuessInput("");
      setWrongGuessMsg("");
      setMatchTimeLeft(420);
      setCheckpointTimeLeft(60);
      setOppRealtimeDistance(0);
      speedBoostUntilRef.current = 0;
      magnetUntilRef.current = 0;
      lastPowerupTimeRef.current = 0;
      itemsRef.current = [];
      hasHandledFinishForCurrentMatchRef.current = false;
    }
  }, [room?.gameState]);

  // Immediately stop controls/movement and close modals when game finishes
  useEffect(() => {
    if (isFinished || !isPlaying) {
      isRunningRef.current = false;
      setShowModal(false);
      setIsPausedAtCheckpoint(false);
    }
  }, [isFinished, isPlaying]);

  // Main Race 10-Minute Timer countdown (pauses during checkpoint modal)
  useEffect(() => {
    if (!isPlaying || isFinished || isPausedAtCheckpoint || showModal) return;

    const timer = setInterval(() => {
      setMatchTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          socket?.emit("beach_race_time_up", { roomId: room.id });
          GameEngineService.handleAction("beach_race_time_up", { roomId: room.id, playerId: me?.id });
          setIsLocalFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isFinished, isPausedAtCheckpoint, showModal, room?.id, socket]);

  // Checkpoint Modal 1-Minute Timer countdown
  useEffect(() => {
    if (!showModal || !isPlaying || isFinished) return;

    setCheckpointTimeLeft(60);

    const timer = setInterval(() => {
      setCheckpointTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time expired inside checkpoint modal!
          if (currentCheckpointStage === 1 || currentCheckpointStage === 2) {
            // Stages 1 & 2: Auto-resume race
            setShowModal(false);
            setIsPausedAtCheckpoint(false);
            socket?.emit("beach_race_resume_runner", { roomId: room?.id });
            GameEngineService.handleAction("beach_race_resume_runner", { roomId: room?.id, playerId: me?.id });
          } else {
            // Stage 3: Game ends in loss
            setShowModal(false);
            socket?.emit("beach_race_time_up", { roomId: room.id });
            GameEngineService.handleAction("beach_race_time_up", { roomId: room.id, playerId: me?.id });
            setIsLocalFinished(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showModal, isPlaying, isFinished, currentCheckpointStage, room?.id, socket]);

  // Configuration caches
  const [configData, setConfigData] = useState<any>(null);
  const [questionTextMap, setQuestionTextMap] = useState<{ [id: string]: string }>({});
  const [questionCategoryMap, setQuestionCategoryMap] = useState<{ [id: string]: string }>({});

  // Canvas / Animation refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Road items (Letters, Obstacles, Speed Boost ⚡, Magnet 🧲)
  const itemsRef = useRef<Array<{
    id: number;
    lane: number;
    y: number; // 0 (horizon) to 1 (bottom)
    type: "letter" | "obstacle" | "speed" | "magnet";
    value: string; // letter char, obstacle type, or powerup icon
    collected?: boolean;
    variant?: number;
    hitSoundPlayed?: boolean;
  }>>([]);
  const nextItemIdRef = useRef<number>(1);
  const isRunningRef = useRef<boolean>(false);

  // Persistent animation state refs (prevent canvas reset on state updates)
  const roadOffsetRef = useRef<number>(0);
  const charXPosRef = useRef<number | null>(null);
  const laneRef = useRef<number>(lane);

  // Synchronize laneRef with state
  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  // Image assets refs
  const roadImgsRef = useRef<HTMLImageElement[]>([]);
  const treeImgsRef = useRef<HTMLImageElement[]>([]);
  const rockImgsRef = useRef<HTMLImageElement[]>([]);
  const obstacleImgsRef = useRef<HTMLImageElement[]>([]);
  const charImgRef = useRef<HTMLImageElement | null>(null);
  const rabbitRunImgsRef = useRef<HTMLImageElement[]>([]);
  const rabbitIdleImgRef = useRef<HTMLImageElement | null>(null);
  const seaLeftImgsRef = useRef<HTMLImageElement[]>([]);
  const seaRightImgsRef = useRef<HTMLImageElement[]>([]);
  const seaImgRef = useRef<HTMLImageElement | null>(null);
  const skyImgRef = useRef<HTMLImageElement | null>(null);

  // Flying Birds in Sky state ref
  const birdsRef = useRef<Array<{
    x: number;
    y: number;
    speed: number;
    direction: number; // 1: left-to-right, -1: right-to-left
    wingPhase: number;
    scale: number;
  }>>([]);
  const nextBirdSpawnTimeRef = useRef<number>(0);

  // Target word from room state
  const targetWord = room?.beachRace?.targetWord || "باندا";
  const cleanTargetLength = useMemo(() => {
    return (targetWord || "").replace(/\s+/g, "").length;
  }, [targetWord]);
  const questionIds: string[] = room?.beachRace?.questionIds || [];

  // Load config.json on mount to index questions by ID
  useEffect(() => {
    fetch("/uploads/config.json")
      .then((res) => res.json())
      .then((data) => {
        setConfigData(data);
        const map: { [id: string]: string } = {};
        const catMap: { [id: string]: string } = {};
        function indexQuickChat(nodes: any[], category: string = "") {
          if (!nodes || !Array.isArray(nodes)) return;
          for (const node of nodes) {
            let currentCategory = category;
            if (!category && node.text) {
              currentCategory = node.text;
            }
            if (node.id && node.text) {
              map[node.id] = node.text;
              if (currentCategory) {
                catMap[node.id] = currentCategory;
              }
            }
            if (node.children) {
              indexQuickChat(node.children, currentCategory);
            }
          }
        }
        if (data.quickChat) {
          indexQuickChat(data.quickChat);
        }
        setQuestionTextMap(map);
        setQuestionCategoryMap(catMap);
      })
      .catch((err) => console.error("Error loading config.json:", err));
  }, []);

  // Preload all beach environment image variations
  useEffect(() => {
    // Roads (road1, road2, road3)
    roadImgsRef.current = ["road111-1.svg", "road222-2.svg", "road333-3.svg"].map((f) => {
      const img = new Image();
      img.src = `/beach-environment/${f}`;
      return img;
    });

    // Trees (tree1, tree2, tree3, tree4)
    treeImgsRef.current = ["tree11-1.svg", "tree22-2.svg", "tree33-3.svg", "tree44-4.svg"].map((f) => {
      const img = new Image();
      img.src = `/beach-environment/${f}`;
      return img;
    });

    // Rocks (rock1, rock2, rock3, rock4)
    rockImgsRef.current = ["rock11-1.svg", "rock22-2.svg", "rock33-3.svg", "rock44-4.svg"].map((f) => {
      const img = new Image();
      img.src = `/beach-environment/${f}`;
      return img;
    });

    // Obstacles (obstacle1, obstacle2)
    obstacleImgsRef.current = ["obstacle11-1.svg", "obstacle22-2.svg"].map((f) => {
      const img = new Image();
      img.src = `/beach-environment/${f}`;
      return img;
    });

    const rabbitIdle = new Image();
    rabbitIdle.src = "/beach-environment/rabbit_idle.png";
    rabbitIdleImgRef.current = rabbitIdle;
    charImgRef.current = rabbitIdle;

    rabbitRunImgsRef.current = ["rabbit_running_01.png", "rabbit_running_02.png", "rabbit_running_03.png", "rabbit_running_04.png"].map((f) => {
      const img = new Image();
      img.src = `/beach-environment/${f}`;
      return img;
    });

    // Sea Left Images (sea_l1.svg, sea_l2.svg, sea_l3.svg)
    seaLeftImgsRef.current = ["sea_l1-11.svg", "sea_l2-22.svg", "sea_l3-33.svg"].map((f) => {
      const img = new Image();
      img.src = `/beach-environment/${f}`;
      return img;
    });

    // Sea Right Images (sea_r1.svg, sea_r2.svg, sea_r3.svg)
    seaRightImgsRef.current = ["sea_r1-11.svg", "sea_r2-22.svg", "sea_r3-33.svg"].map((f) => {
      const img = new Image();
      img.src = `/beach-environment/${f}`;
      return img;
    });

    const sea = new Image();
    sea.src = "/beach-environment/sea-6.svg";
    seaImgRef.current = sea;

    const sky = new Image();
    sky.src = "/beach-environment/sky1-11.svg";
    skyImgRef.current = sky;
  }, []);

  // Handle keyboard inputs for Lane Controls (Left / Right) and Letter Typing inside Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showModal) {
        // Modal typing
        if (e.key === "Backspace") {
          setGuessInput((prev) => prev.slice(0, -1));
        } else if (e.key === "Enter") {
          handleConfirmGuess();
        } else if (e.key.length === 1) {
          // Check if key is in Arabic letters and collected
          const char = e.key;
          const uniqueCollected = Array.from(new Set(collectedLetters));
          if (uniqueCollected.includes(char)) {
            if (guessInput.length < cleanTargetLength) {
              setGuessInput((prev) => prev + char);
            }
          }
        }
        return;
      }

      if (!isGameActive || isPausedAtCheckpoint) return;

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        setLane((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        setLane((prev) => Math.min(2, prev + 1));
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        isRunningRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isGameActive || showModal || isPausedAtCheckpoint) {
        isRunningRef.current = false;
        return;
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        isRunningRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [showModal, isGameActive, isPausedAtCheckpoint, collectedLetters, guessInput, targetWord]);

  // Touch Swipe Handlers for mobile controls
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || showModal || !isGameActive || isPausedAtCheckpoint) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diffX) > 30) {
      if (diffX < 0) {
        // Swipe left
        setLane((prev) => Math.max(0, prev - 1));
      } else {
        // Swipe right
        setLane((prev) => Math.min(2, prev + 1));
      }
    }
    touchStartXRef.current = null;
  };

  // Checkpoints: 333m (33%), 666m (66%), 1000m (100%)
  useEffect(() => {
    if (!isGameActive || showModal) return;

    if (distance >= 333 && !passedCheckpoints[1]) {
      isRunningRef.current = false;
      setPassedCheckpoints((prev) => ({ ...prev, 1: true }));
      setCurrentCheckpointStage(1);
      setIsPausedAtCheckpoint(true);
      setShowModal(true);
      if (playSound) playSound("bell");
      socket?.emit("beach_race_reach_checkpoint", { roomId: room.id, stage: 1 });
      GameEngineService.handleAction("beach_race_reach_checkpoint", { roomId: room.id, stage: 1, playerId: me?.id });
    } else if (distance >= 666 && !passedCheckpoints[2]) {
      isRunningRef.current = false;
      setPassedCheckpoints((prev) => ({ ...prev, 2: true }));
      setCurrentCheckpointStage(2);
      setIsPausedAtCheckpoint(true);
      setShowModal(true);
      if (playSound) playSound("bell");
      socket?.emit("beach_race_reach_checkpoint", { roomId: room.id, stage: 2 });
      GameEngineService.handleAction("beach_race_reach_checkpoint", { roomId: room.id, stage: 2, playerId: me?.id });
    } else if (distance >= 1000 && !passedCheckpoints[3]) {
      isRunningRef.current = false;
      setPassedCheckpoints((prev) => ({ ...prev, 3: true }));
      setCurrentCheckpointStage(3);
      setIsPausedAtCheckpoint(true);
      setShowModal(true);
      if (playSound) playSound("bell");
      socket?.emit("beach_race_reach_checkpoint", { roomId: room.id, stage: 3 });
      GameEngineService.handleAction("beach_race_reach_checkpoint", { roomId: room.id, stage: 3, playerId: me?.id });
    }
  }, [distance, isGameActive, showModal, passedCheckpoints, room.id, socket, playSound]);

  // Main Canvas Render Loop (3D Tilted Top-Down Endless Runner)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Horizon line at y = 46.8% height (to match reference SVG)
      const horizonY = height * 0.468;

      // Current lane & obstacle blockage check (obstacle physically blocks forward progress in current lane)
      const currentLane = laneRef.current;
      const isBlockedByObstacle = itemsRef.current.some(
        (item) => !item.collected && item.type === "obstacle" && item.lane === currentLane && item.y >= 0.84 && item.y <= 0.89
      );

      // 1. Draw Sky (top section with fixed sun, moving clouds & flying birds)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, "#38BDF8");
      skyGrad.addColorStop(0.6, "#7DD3FC");
      skyGrad.addColorStop(1, "#BAE6FD");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY);

      // Fixed Sun in Top-Right Sky
      const sunX = width * 0.82;
      const sunY = horizonY * 0.28;
      const sunR = Math.min(width, horizonY) * 0.14;

      ctx.save();
      // Outer Sun Glow
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(253, 224, 71, 0.25)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 1.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(250, 204, 21, 0.4)";
      ctx.fill();

      // Main Sun Body
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
      sunGrad.addColorStop(0, "#FEF08A");
      sunGrad.addColorStop(0.7, "#FACC15");
      sunGrad.addColorStop(1, "#F59E0B");
      ctx.fillStyle = sunGrad;
      ctx.fill();
      ctx.restore();

      // Moving Clouds Overlay (Right-to-Left)
      if (skyImgRef.current && skyImgRef.current.complete) {
        const cloudX = (width - ((now * 0.015) % width)) % width;
        ctx.drawImage(skyImgRef.current, cloudX - width, 0, width + 1, horizonY);
        ctx.drawImage(skyImgRef.current, cloudX, 0, width + 1, horizonY);
      }

      // Spawn and Draw Flying Birds in Sky at random intervals
      if (now > nextBirdSpawnTimeRef.current) {
        nextBirdSpawnTimeRef.current = now + 12000 + Math.random() * 15000; // Next flock in 12-27 seconds
        const direction = Math.random() < 0.5 ? 1 : -1;
        const count = 3 + Math.floor(Math.random() * 3); // 3 to 5 birds
        const startX = direction === 1 ? -60 : width + 60;
        const baseSpeed = 45 + Math.random() * 25;
        const baseY = (0.12 + Math.random() * 0.45) * horizonY;

        birdsRef.current = [];
        for (let b = 0; b < count; b++) {
          birdsRef.current.push({
            x: startX - direction * (b * 22 + Math.random() * 10),
            y: baseY + (Math.random() * 24 - 12),
            speed: baseSpeed + (Math.random() * 10 - 5),
            direction,
            wingPhase: Math.random() * Math.PI * 2,
            scale: 0.6 + Math.random() * 0.5,
          });
        }
      }

      // Render flying birds
      for (let b = birdsRef.current.length - 1; b >= 0; b--) {
        const bird = birdsRef.current[b];
        bird.x += bird.direction * bird.speed * delta;
        bird.wingPhase += delta * 9;

        if ((bird.direction === 1 && bird.x > width + 100) || (bird.direction === -1 && bird.x < -100)) {
          birdsRef.current.splice(b, 1);
          continue;
        }

        ctx.save();
        ctx.translate(bird.x, bird.y);
        if (bird.direction === -1) ctx.scale(-1, 1);

        const wingY = Math.sin(bird.wingPhase) * (8 * bird.scale);

        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 2.5 * bird.scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(-16 * bird.scale, wingY);
        ctx.quadraticCurveTo(-8 * bird.scale, -10 * bird.scale + wingY * 0.5, 0, 0);
        ctx.quadraticCurveTo(8 * bird.scale, -10 * bird.scale + wingY * 0.5, 16 * bird.scale, wingY);
        ctx.stroke();

        ctx.restore();
      }

      // 2 & 3. Draw 3x3 Perspective Environment Grid (3 Left Sea, 3 Center Road, 3 Right Sea)
      const roadTopLeft = width * 0.42;
      const roadTopRight = width * 0.58;
      const roadBottomLeft = -width * 0.2;
      const roadBottomRight = width * 1.2;
      const roadOffset = roadOffsetRef.current;

      // Draw quad tile with perspective clip and background fill (using horizontal slices for true 3D perspective projection)
      const drawQuadTile = (
        img: HTMLImageElement | undefined,
        fallbackColor: string,
        xTopLeft: number,
        yTop: number,
        xTopRight: number,
        xBotLeft: number,
        yBot: number,
        xBotRight: number
      ) => {
        if (yBot <= yTop) return;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xTopLeft, yTop);
        ctx.lineTo(xTopRight, yTop);
        ctx.lineTo(xBotRight, yBot);
        ctx.lineTo(xBotLeft, yBot);
        ctx.closePath();
        ctx.fillStyle = fallbackColor;
        ctx.fill();

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.clip();
          const slices = 16;
          const totalH = yBot - yTop;
          const sliceH = totalH / slices;
          const imgH = img.naturalHeight || img.height || 400;
          const imgW = img.naturalWidth || img.width || 600;
          const imgSliceH = imgH / slices;

          for (let s = 0; s < slices; s++) {
            const p0 = s / slices;
            const sy = p0 * imgH;
            const dy = yTop + p0 * totalH;

            const xL = xTopLeft + p0 * (xBotLeft - xTopLeft);
            const xR = xTopRight + p0 * (xBotRight - xTopRight);
            const dw = xR - xL;

            if (dw > 0) {
              ctx.drawImage(
                img,
                0,
                sy,
                imgW,
                imgSliceH,
                xL - 0.5,
                dy,
                dw + 1,
                sliceH + 0.6
              );
            }
          }
        }
        ctx.restore();
      };

      // 3x3 Grid Vertical Scroll Cycle
      const scrollFactor = (roadOffset / 200) % 3;

      for (let i = 0; i < 3; i++) {
        let zStart = (i + scrollFactor) % 3;
        if (zStart < 0) zStart += 3;

        const intervals: Array<[number, number]> = [];
        if (zStart + 1 > 3) {
          intervals.push([zStart, 3]);
          intervals.push([0, zStart + 1 - 3]);
        } else {
          intervals.push([zStart, zStart + 1]);
        }

        for (const [za, zb] of intervals) {
          if (zb - za < 0.001) continue;

          const pa = za / 3;
          const pb = zb / 3;

          const ya = horizonY + pa * (height - horizonY);
          const yb = horizonY + pb * (height - horizonY);

          const xRoadL_a = roadTopLeft + pa * (roadBottomLeft - roadTopLeft);
          const xRoadR_a = roadTopRight + pa * (roadBottomRight - roadTopRight);

          const xRoadL_b = roadTopLeft + pb * (roadBottomLeft - roadTopLeft);
          const xRoadR_b = roadTopRight + pb * (roadBottomRight - roadTopRight);

          // فتحنا العرض فوق عند الأفق عشان يبدأ من برة الشاشة أو على حدودها بالظبط
          const seaTopLeft = -width * 0.10;   // بالسالب عشان يخرج برة الشاشة من الشمال فوق
          const seaTopRight = width * 1.10;   // أكتر من 1 عشان يخرج برة الشاشة من اليمين فوق

          // زودنا الاسترتش تحت جداً عشان نضمن قفل أي فراغ تماماً ونزيد التمدد لبرة
          const seaBottomLeft = -width * 1.2; // ضاعفنا التمدد لبرة الشاشة من الشمال تحت
          const seaBottomRight = width * 2.2; // ضاعفنا التمدد لبرة الشاشة من اليمين تحت

          // حساب الإحداثيات المائلة للبحر عند الشريحة المحددة (za و zb)
          const xSeaL_a = seaTopLeft + pa * (seaBottomLeft - seaTopLeft);
          const xSeaR_a = seaTopRight + pa * (seaBottomRight - seaTopRight);
          const xSeaL_b = seaTopLeft + pb * (seaBottomLeft - seaTopLeft);
          const xSeaR_b = seaTopRight + pb * (seaBottomRight - seaTopRight);

          // Column 0: Left Sea (يبدأ من طرف البحر المائل وينتهي عند حافة الطريق المائلة)
          const leftImg = seaLeftImgsRef.current[i % Math.max(1, seaLeftImgsRef.current.length)];
          drawQuadTile(
            leftImg,
            "#00BFFF",
            xSeaL_a, ya, xRoadL_a, // فوق: من خط البحر الشمال لخط الطريق الشمال
            xSeaL_b, yb, xRoadL_b  // تحت: بيفتحوا سوا لبرة الشاشة
          );

          // Column 1: Center Road (fixed X bounds: roadBottomLeft to roadBottomRight)
          const roadImg = roadImgsRef.current[i % Math.max(1, roadImgsRef.current.length)];
          drawQuadTile(
            roadImg,
            "#EED9B2",
            xRoadL_a, ya, xRoadR_a,
            xRoadL_b, yb, xRoadR_b
          );

          // Column 2: Right Sea (يبدأ من حافة الطريق المائلة وينتهي عند طرف البحر المائل)
          const rightImg = seaRightImgsRef.current[i % Math.max(1, seaRightImgsRef.current.length)];
          drawQuadTile(
            rightImg,
            "#00BFFF",
            xRoadR_a, ya, xSeaR_a, // فوق: من خط الطريق اليمين لخط البحر اليمين
            xRoadR_b, yb, xSeaR_b  // تحت: بيفتحوا سوا لبرة الشاشة
          );
        }
      }

      // Helper function for perspective road geometry (Road bounds + Playable lanes + Margins)
      const getRoadGeometryAtDepth = (p: number) => {
        const rxLeft = roadTopLeft + p * (roadBottomLeft - roadTopLeft);
        const rxRight = roadTopRight + p * (roadBottomRight - roadTopRight);
        const totW = rxRight - rxLeft;
        const playL = rxLeft + totW * 0.12;
        const playR = rxRight - totW * 0.12;
        const playW = playR - playL;
        return { rxLeft, rxRight, totW, playL, playR, playW };
      };

      // Power-Up Active Status Check using Date.now() for accurate wall-clock timer countdown
      const nowMs = Date.now();
      const isSpeedBoostActive = nowMs < speedBoostUntilRef.current;
      const isMagnetActive = nowMs < magnetUntilRef.current;
      const speedMultiplier = isSpeedBoostActive ? 1.4 : 1.0;

      // 4. Update & Move Distance when running (and not blocked by obstacle)
      if (isGameActive && !showModal && !isPausedAtCheckpoint && isRunningRef.current && !isBlockedByObstacle) {
        const speed = 8 * speedMultiplier; // meters per sec (+40% speed boost when active)
        setDistance((prev) => {
          const nextDist = prev + speed * delta;
          // Emit progress to server & GameEngineService
          socket?.emit("beach_race_update_progress", {
            roomId: room.id,
            distance: Math.min(1000, nextDist),
            collectedLetters,
          });
          GameEngineService.handleAction("beach_race_update_progress", {
            roomId: room.id,
            distance: Math.min(1000, nextDist),
            collectedLetters,
          });
          return Math.min(1000, nextDist);
        });

        // Continuous road scroll offset stored in ref (never resets on lane switch!)
        roadOffsetRef.current += speed * delta * 15;

        // Spawn new items (letters, obstacles, speed boost, magnet)
        if (Math.random() < 0.035) {
          let itemType: "letter" | "obstacle" | "speed" | "magnet" = "letter";
          let itemLane = Math.floor(Math.random() * 3);

          // Check powerup spawn eligibility (spaced out by at least 15 seconds)
          const timeSinceLastPowerup = nowMs - lastPowerupTimeRef.current;
          if (timeSinceLastPowerup > 15000 && Math.random() < 0.22) {
            itemType = Math.random() < 0.5 ? "speed" : "magnet";
            lastPowerupTimeRef.current = nowMs;
          } else {
            let isLetter = Math.random() < 0.82; // Slightly reduced obstacle frequency (18% vs 82% letters)
            if (!isLetter) {
              // Check existing obstacles near the horizon (y < 0.28)
              const nearbyObstacles = itemsRef.current.filter(
                (item) => item.type === "obstacle" && item.y < 0.28
              );
              const blockedLanes = new Set(nearbyObstacles.map((o) => o.lane));

              // Ensure at least one lane is ALWAYS completely free of obstacles at any depth row
              if (blockedLanes.size >= 2) {
                // Forced to spawn a letter instead of blocking all 3 lanes
                isLetter = true;
              } else if (blockedLanes.has(itemLane)) {
                // Don't stack obstacles on top of each other in the same lane near horizon
                const availableLanes = [0, 1, 2].filter((l) => !blockedLanes.has(l));
                if (availableLanes.length > 0) {
                  itemLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
                }
              }
            }
            itemType = isLetter ? "letter" : "obstacle";
          }

          let itemValue = "";
          if (itemType === "letter") {
            const cleanTargetLetters = targetWord.replace(/\s+/g, "").split("");
            if (cleanTargetLetters.length > 0 && Math.random() < 0.6) {
              itemValue = cleanTargetLetters[Math.floor(Math.random() * cleanTargetLetters.length)];
            } else {
              itemValue = ALL_ARABIC_LETTERS[Math.floor(Math.random() * ALL_ARABIC_LETTERS.length)];
            }
          } else if (itemType === "speed") {
            itemValue = "⚡";
          } else if (itemType === "magnet") {
            itemValue = "🧲";
          } else {
            itemValue = "obs";
          }

          itemsRef.current.push({
            id: nextItemIdRef.current++,
            lane: itemLane,
            y: 0, // starts at horizon
            type: itemType,
            value: itemValue,
            variant: Math.floor(Math.random() * (obstacleImgsRef.current.length || 1)),
          });
        }
      }

      // 5. Draw Side Scenery (Trees & Rocks cleanly separated outside road margins)
      const numScenery = 5;
      for (let i = 0; i < numScenery; i++) {
        const rawProgress = ((roadOffset * 0.002 + i / numScenery) % 1);
        const progress = rawProgress * rawProgress; // Non-linear perspective depth curve
        const sy = horizonY + progress * (height - horizonY);

        // Perspective scale from horizon to camera
        const scale = 0.12 + progress * 0.88;

        const treeHeight = (height * 0.75) * scale;
        const treeWidth = treeHeight * 0.65;

        // Perspective geometry at depth
        const geom = getRoadGeometryAtDepth(progress);

        // Calculate dynamic tree variation index based on scroll position so both sides rotate through all tree types
        const scrollChunk = Math.floor(roadOffset * 0.002 + i / numScenery);
        const treeIdxLeft = Math.abs((i * 3 + scrollChunk) % Math.max(1, treeImgsRef.current.length));
        const treeIdxRight = Math.abs((i * 3 + scrollChunk + 2) % Math.max(1, treeImgsRef.current.length));

        // Left tree (base trunk anchored on the left outer sand margin)
        const treeImgLeft = treeImgsRef.current[treeIdxLeft] || treeImgsRef.current[0];
        const lx = geom.rxLeft + (treeWidth * 0.10);
        if (treeImgLeft && treeImgLeft.complete) {
          ctx.drawImage(treeImgLeft, lx - (treeWidth * 0.5), sy - treeHeight, treeWidth, treeHeight);
        }

        // Right tree (base trunk anchored on the right outer sand margin)
        const treeImgRight = treeImgsRef.current[treeIdxRight] || treeImgsRef.current[0];
        const rx = geom.rxRight - (treeWidth * 0.10);
        if (treeImgRight && treeImgRight.complete) {
          ctx.drawImage(treeImgRight, rx - (treeWidth * 0.5), sy - treeHeight, treeWidth, treeHeight);
        }

        // Left & Right Rocks
        const rockWidth = treeWidth * 0.42;
        const rockHeight = treeHeight * 0.32;
        const rockImg = rockImgsRef.current[i % rockImgsRef.current.length] || rockImgsRef.current[0];
        const rockLx = geom.rxLeft - (rockWidth * 0.10);
        const rockRx = geom.rxRight - (rockWidth * 0.10);
        if (rockImg && rockImg.complete) {
          if (i % 3 === 0) {
            ctx.drawImage(rockImg, rockLx - (rockWidth * 0.5), (sy - rockHeight) + (rockHeight * 0.8), rockWidth, rockHeight);
          }
          if (i % 3 === 1) {
            ctx.drawImage(rockImg, rockRx - (rockWidth * 0.5), (sy - rockHeight) + (rockHeight * 0.8), rockWidth, rockHeight);
          }
        }
      }

      // 6. Draw Items (Letters, Obstacles & Power-ups strictly inside central playable lanes)
      const charY = height * 0.82; // Character Y position

      for (let i = itemsRef.current.length - 1; i >= 0; i--) {
        const item = itemsRef.current[i];

        if (isGameActive && !showModal && !isPausedAtCheckpoint && isRunningRef.current && !isBlockedByObstacle) {
          item.y += delta * 0.32 * speedMultiplier;

          // Magnet Effect: When player gets close to a letter (y >= 0.50), pull it magnetically toward player's lane!
          if (isMagnetActive && item.type === "letter" && !item.collected && item.y >= 0.70) {
            const laneDiff = currentLane - item.lane;
            if (Math.abs(laneDiff) > 0.01) {
              item.lane += laneDiff * Math.min(1, delta * 7.0);
            }
          }
        }

        if (item.y > 1.1) {
          itemsRef.current.splice(i, 1);
          continue;
        }

        // Perspective depth curve for items
        const itemProgress = item.y * item.y;

        // Perspective geometry at item depth
        const itemY = horizonY + itemProgress * (height - horizonY);
        const itemGeom = getRoadGeometryAtDepth(itemProgress);

        // Calculate item center X in the designated playable lane (0, 1, or 2)
        const laneW = itemGeom.playW / 3;
        const itemX = itemGeom.playL + (item.lane + 0.5) * laneW;

        const itemScale = 0.35 + itemProgress * 0.65;

        // Collision Check with player
        const isInHitZone = item.y >= 0.84 && item.y <= 0.89;
        const isLaneMatch = Math.abs(item.lane - currentLane) < 0.5;

        if (isGameActive && !item.collected && isInHitZone && isLaneMatch) {
          if (item.type === "letter") {
            item.collected = true;
            setCollectedLetters((prev) => [...prev, item.value]);
            setCarrotsCollected((prev) => {
              const nextCount = prev + 1;
              if (nextCount > 0 && nextCount % 10 === 0) {
                setTimeout(() => trigger10CarrotMilestone(), 10);
              }
              return nextCount;
            });
            if (playSound) playSound("handXFill");
          } else if (item.type === "obstacle") {
            if (!item.hitSoundPlayed) {
              item.hitSoundPlayed = true;
              if (playSound) playSound("wrong");
            }
          } else if (item.type === "speed") {
            item.collected = true;
            speedBoostUntilRef.current = Date.now() + 15000; // 15 seconds boost (+40% speed)
            playCustomAudio("/sounds/fast-run-transition.mp3", 0.9);
          } else if (item.type === "magnet") {
            item.collected = true;
            magnetUntilRef.current = Date.now() + 10000; // 10 seconds magnet
            playCustomAudio("/sounds/magnet-game-spell.mp3", 0.9);
          }
        }

        if (!item.collected) {
          if (item.type === "letter") {
            ctx.save();
            ctx.translate(itemX, itemY);
            const scale = itemScale * 1.85;

            // Outer glowing shadow for the carrot
            ctx.shadowColor = "rgba(234, 88, 12, 0.4)";
            ctx.shadowBlur = 10 * scale;

            // 1. Green Leaves at Top
            ctx.fillStyle = "#22C55E";
            ctx.strokeStyle = "#15803D";
            ctx.lineWidth = 2 * scale;

            // Left leaf
            ctx.beginPath();
            ctx.ellipse(-10 * scale, -28 * scale, 6 * scale, 14 * scale, -Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Center leaf
            ctx.beginPath();
            ctx.ellipse(0, -32 * scale, 7 * scale, 16 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Right leaf
            ctx.beginPath();
            ctx.ellipse(10 * scale, -28 * scale, 6 * scale, 14 * scale, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 2. Carrot Body (Cone shape with rounded top shoulders)
            ctx.beginPath();
            ctx.moveTo(-20 * scale, -20 * scale);
            ctx.quadraticCurveTo(0, -26 * scale, 20 * scale, -20 * scale);
            ctx.quadraticCurveTo(18 * scale, 10 * scale, 0, 34 * scale);
            ctx.quadraticCurveTo(-18 * scale, 10 * scale, -20 * scale, -20 * scale);
            ctx.closePath();

            // Orange gradient fill
            const carrotGrad = ctx.createLinearGradient(-15 * scale, -20 * scale, 15 * scale, 30 * scale);
            carrotGrad.addColorStop(0, "#FB923C");
            carrotGrad.addColorStop(0.5, "#F97316");
            carrotGrad.addColorStop(1, "#EA580C");
            ctx.fillStyle = carrotGrad;
            ctx.fill();

            ctx.strokeStyle = "#9A3412";
            ctx.lineWidth = 3 * scale;
            ctx.stroke();

            // 3. Horizontal carrot ridges/texture lines
            ctx.strokeStyle = "#C2410C";
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.moveTo(-10 * scale, -10 * scale);
            ctx.quadraticCurveTo(-5 * scale, -8 * scale, 0, -10 * scale);
            ctx.moveTo(4 * scale, 2 * scale);
            ctx.quadraticCurveTo(10 * scale, 4 * scale, 14 * scale, 2 * scale);
            ctx.moveTo(-12 * scale, 12 * scale);
            ctx.quadraticCurveTo(-6 * scale, 14 * scale, -2 * scale, 12 * scale);
            ctx.stroke();

            // 4. White/Yellow circular badge in center of carrot body for letter
            ctx.beginPath();
            ctx.arc(0, 0, 16 * scale, 0, Math.PI * 2);
            ctx.fillStyle = "#FEF08A";
            ctx.shadowColor = "#F59E0B";
            ctx.shadowBlur = 6 * scale;
            ctx.fill();
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2.5 * scale;
            ctx.stroke();

            // 5. Letter text inside badge
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#1E293B";
            ctx.font = `bold ${24 * scale}px Arial, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.value, 0, 1 * scale);

            ctx.restore();
          } else if (item.type === "speed") {
            // Speed Boost (⚡) glowing orb
            const bubbleRadius = 30 * itemScale;
            ctx.save();
            ctx.beginPath();
            ctx.arc(itemX, itemY, bubbleRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#00F0FF";
            ctx.shadowColor = "#00FFFF";
            ctx.shadowBlur = 16;
            ctx.fill();
            ctx.lineWidth = 3.5 * itemScale;
            ctx.strokeStyle = "#FFFFFF";
            ctx.stroke();

            ctx.font = `${30 * itemScale}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("⚡", itemX, itemY);
            ctx.restore();
          } else if (item.type === "magnet") {
            // Magnet (🧲) glowing orb
            const bubbleRadius = 30 * itemScale;
            ctx.save();
            ctx.beginPath();
            ctx.arc(itemX, itemY, bubbleRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#A855F7";
            ctx.shadowColor = "#EC4899";
            ctx.shadowBlur = 16;
            ctx.fill();
            ctx.lineWidth = 3.5 * itemScale;
            ctx.strokeStyle = "#FFFFFF";
            ctx.stroke();

            ctx.font = `${30 * itemScale}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🧲", itemX, itemY);
            ctx.restore();
          } else {
            // Pick obstacle variation (obstacle1, obstacle2)
            const obstacleSize = 125 * itemScale;
            const obsImg = obstacleImgsRef.current[(item.variant || 0) % obstacleImgsRef.current.length] || obstacleImgsRef.current[0];
            if (obsImg && obsImg.complete) {
              ctx.drawImage(obsImg, itemX - (obstacleSize / 2), itemY - (obstacleSize / 2), obstacleSize, obstacleSize);
            } else {
              ctx.fillStyle = "#FF4500";
              ctx.fillRect(itemX - (obstacleSize / 2), itemY - (obstacleSize / 2), obstacleSize, obstacleSize);
            }
          }
        }
      }

      // 7. Draw Player Character in the 3 playable lanes with smooth transitions
      const charRatio = (charY - horizonY) / (height - horizonY);
      const playerGeom = getRoadGeometryAtDepth(charRatio);
      const playerLaneW = playerGeom.playW / 3;
      const targetCharX = playerGeom.playL + (currentLane + 0.5) * playerLaneW;

      // Smooth interpolation for character movement across lanes
      if (charXPosRef.current === null) {
        charXPosRef.current = targetCharX;
      } else {
        charXPosRef.current += (targetCharX - charXPosRef.current) * Math.min(1, delta * 18);
      }
      
      ctx.save();
      const drawCharX = charXPosRef.current;
      const drawCharY = charY;

      const charWidth = 160;
      const charHeight = 200;

      let curCharImg: HTMLImageElement | null = rabbitIdleImgRef.current;
      const isCharacterRunning = isPlaying && !isPausedAtCheckpoint && isRunningRef.current && !isBlockedByObstacle;

      if (isCharacterRunning && rabbitRunImgsRef.current.length > 0) {
        const frameIndex = Math.floor(roadOffsetRef.current / 12) % rabbitRunImgsRef.current.length;
        curCharImg = rabbitRunImgsRef.current[frameIndex];
      }

      if (curCharImg && curCharImg.complete) {
        ctx.drawImage(curCharImg, drawCharX - (charWidth / 2), drawCharY - (charHeight * 0.28), charWidth, charHeight);
      } else if (charImgRef.current && charImgRef.current.complete) {
        ctx.drawImage(curCharImg, drawCharX - (charWidth / 2), drawCharY - (charHeight * 0.28), charWidth, charHeight);
      } else {
        ctx.fillStyle = "#FF69B4";
        ctx.beginPath();
        ctx.roundRect(drawCharX - 45, drawCharY - 45, 90, 90, 16);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🐰", drawCharX, drawCharY + 8);
      }
      ctx.restore();

      // 8. Draw Active Power-Up Progress Bars directly on Canvas (Bottom centered, thin rectangle capsule, shrinking smoothly every frame)
      const speedRemMs = Math.max(0, speedBoostUntilRef.current - nowMs);
      const magRemMs = Math.max(0, magnetUntilRef.current - nowMs);

      const activePowerups: { remMs: number; totalMs: number; fillStyle: string; strokeStyle: string }[] = [];
      if (speedRemMs > 0) {
        activePowerups.push({ remMs: speedRemMs, totalMs: 15000, fillStyle: "#FACC15", strokeStyle: "rgba(250, 204, 21, 0.9)" });
      }
      if (magRemMs > 0) {
        activePowerups.push({ remMs: magRemMs, totalMs: 10000, fillStyle: "#A855F7", strokeStyle: "rgba(168, 85, 247, 0.9)" });
      }

      if (activePowerups.length > 0) {
        const barW = 240;
        const barH = 10;
        const barR = 5;
        const startX = (width - barW) / 2;
        let startY = height - 42 - (activePowerups.length - 1) * 16;

        for (const p of activePowerups) {
          const ratio = Math.max(0, Math.min(1, p.remMs / p.totalMs));
          const fillW = barW * ratio;

          ctx.save();
          // Dark track capsule
          ctx.beginPath();
          ctx.roundRect(startX, startY, barW, barH, barR);
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = p.strokeStyle;
          ctx.stroke();

          // Smoothly shrinking active filled bar
          if (fillW > 0) {
            ctx.beginPath();
            ctx.roundRect(startX, startY, fillW, barH, barR);
            ctx.fillStyle = p.fillStyle;
            ctx.shadowColor = p.fillStyle;
            ctx.shadowBlur = 8;
            ctx.fill();
          }
          ctx.restore();

          startY += 16;
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isGameActive, isFinished, isPausedAtCheckpoint, collectedLetters, room?.id, socket, playSound]);

  // Actions
  const handleStartGame = () => {
    socket?.emit("start_beach_race", { roomId: room.id, playerId: me?.id });
    GameEngineService.handleAction("start_beach_race", { roomId: room.id, playerId: me?.id });
  };

  const handleResumeRunner = () => {
    setShowModal(false);
    setIsPausedAtCheckpoint(false);
    socket?.emit("beach_race_resume_runner", { roomId: room.id });
    GameEngineService.handleAction("beach_race_resume_runner", { roomId: room.id });
  };

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

  const handleBackspace = () => {
    setGuessInput((prev) => prev.slice(0, -1));
    setWrongGuessMsg("");
  };

  const handleConfirmGuess = () => {
    if (!guessInput.trim()) return;

    setWrongGuessMsg("");

    const playerNorm = normalizeArabic(guessInput);
    const targetNorm = normalizeArabic(targetWord);

    if (playerNorm === targetNorm) {
      if (playSound) playSound("win");
      setShowModal(false);
      setIsPausedAtCheckpoint(false);
      setIsLocalFinished(true);
    } else {
      setWrongGuessMsg("تخمين غير صحيح! حاول مرة أخرى أو استكمل السباق.");
      if (playSound) playSound("wrong");
    }

    socket?.emit("beach_race_submit_guess", {
      roomId: room.id,
      guessWord: guessInput.trim(),
      carrotsCount: carrotsCollected,
    });
    GameEngineService.handleAction("beach_race_submit_guess", {
      roomId: room.id,
      guessWord: guessInput.trim(),
      carrotsCount: carrotsCollected,
    });
  };

  // Close modal automatically if game finishes
  useEffect(() => {
    if (isFinished) {
      setShowModal(false);
      setIsPausedAtCheckpoint(false);
    }
    if (room?.gameState === "beach_race_finished") {
      setShowModal(false);
      setIsPausedAtCheckpoint(false);
      setIsLocalFinished(true);

      if (!hasHandledFinishForCurrentMatchRef.current) {
        hasHandledFinishForCurrentMatchRef.current = true;
        matchCountRef.current += 1;

        if (matchCountRef.current % 3 === 0 && showAd && room?.id && me?.id) {
          showAd(room.id, me.id, () => {}, () => {}, () => {});
        }
      }
    }
  }, [isFinished, room?.gameState, room?.id, me?.id, showAd]);

  // Realtime opponent distance state
  const [oppRealtimeDistance, setOppRealtimeDistance] = useState<number>(0);

  // Socket listener for wrong guess result & game finish & progress
  useEffect(() => {
    const handleWrongGuess = (data: any) => {
      setWrongGuessMsg("تخمين غير صحيح! حاول مرة أخرى أو استكمل السباق.");
      if (playSound) playSound("wrong");
    };
    const handleFinished = (data?: any) => {
      setShowModal(false);
      setIsPausedAtCheckpoint(false);
      setIsLocalFinished(true);
      if (data && data.winnerId !== undefined) {
        setFinishWinnerId(data.winnerId);
      } else if (room?.beachRace?.winnerId !== undefined) {
        setFinishWinnerId(room.beachRace.winnerId);
      }

      if (!hasHandledFinishForCurrentMatchRef.current) {
        hasHandledFinishForCurrentMatchRef.current = true;
        matchCountRef.current += 1;

        // Trigger Google Ad after every 3 matches (match 3, 6, 9...)
        if (matchCountRef.current % 3 === 0 && showAd && room?.id && me?.id) {
          showAd(room.id, me.id, () => {}, () => {}, () => {});
        }
      }
    };
    const handleProgressUpdate = (data: any) => {
      if (opp && data.playerId === opp.id) {
        setOppRealtimeDistance(data.distance);
      }
    };

    if (socket) {
      socket.on("beach_race_wrong_guess", handleWrongGuess);
      socket.on("beach_race_finished", handleFinished);
      socket.on("beach_race_progress_updated", handleProgressUpdate);
    }
    GameEngineService.on("beach_race_wrong_guess", handleWrongGuess);
    GameEngineService.on("beach_race_finished", handleFinished);
    GameEngineService.on("beach_race_progress_updated", handleProgressUpdate);

    return () => {
      if (socket) {
        socket.off("beach_race_wrong_guess", handleWrongGuess);
        socket.off("beach_race_finished", handleFinished);
        socket.off("beach_race_progress_updated", handleProgressUpdate);
      }
      GameEngineService.off("beach_race_wrong_guess", handleWrongGuess);
      GameEngineService.off("beach_race_finished", handleFinished);
      GameEngineService.off("beach_race_progress_updated", handleProgressUpdate);
    };
  }, [socket, playSound, opp, room?.id, me?.id, showAd]);

  // Sync initial distance on mount or room update if oppRealtimeDistance is 0
  useEffect(() => {
    if (opp && oppRealtimeDistance === 0) {
      const oppProg = room?.beachRace?.playersProgress?.[opp.id];
      if (oppProg?.distance) {
        setOppRealtimeDistance(oppProg.distance);
      }
    }
  }, [opp, room, oppRealtimeDistance]);

  // Opponent Distance Calculation for Left Progress Bar
  const oppDistance = oppRealtimeDistance;

  // Unique Collected Letters
  const uniqueCollectedLetters = useMemo(() => {
    return Array.from(new Set(collectedLetters));
  }, [collectedLetters]);

  // Category of the target word based on the first question ID
  const categoryName = useMemo(() => {
    if (!questionIds || questionIds.length === 0) return "";
    return questionCategoryMap[questionIds[0]] || "";
  }, [questionIds, questionCategoryMap]);

  // Helper to check if a keyboard letter is available directly or via normalized equivalent
  const isLetterAvailable = (letter: string) => {
    if (uniqueCollectedLetters.includes(letter)) return true;
    const normLetter = normalizeArabic(letter);
    if (!normLetter) return false;
    return uniqueCollectedLetters.some((c) => normalizeArabic(c) === normLetter);
  };

  // Prepare formatted questions replacing (?) with (.) for all questionIds from the start
  const formattedQuestions = useMemo(() => {
    if (!questionIds || questionIds.length === 0) return ["لا توجد أسئلة متوفرة."];
    const questions = questionIds.map((id) => {
      const qText = questionTextMap[id];
      if (!qText) return "";
      return qText.replace(/؟/g, ".");
    }).filter(Boolean);
    return questions.length > 0 ? questions : ["جاري تحميل التلميحات..."];
  }, [questionIds, questionTextMap]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {renderRewardBar ? renderRewardBar() : null}
      <div className="relative w-full h-[70vh] md:h-[80vh] bg-slate-900 overflow-hidden shadow-2xl border-4 border-amber-500/40 flex flex-col justify-between font-sans select-none dir-rtl">
        {/* Top Header / Stats Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-1 md:p-2 flex flex-wrap items-center justify-center gap-1.5">

          {/* Carrots Counter Box */}
          <div
            id="carrot-counter-box"
            className={`bg-orange-500/25 backdrop-blur-md border border-orange-400/60 flex gap-1.5 items-center justify-center px-3 py-0.5 rounded-2xl text-center transition-all duration-150 ${
              carrotBoxPulse ? "scale-125 border-amber-300 bg-orange-400/60" : "scale-100"
            }`}
          >
            <span className="text-base md:text-lg font-black text-orange-300">
              {carrotsCollected} 🥕
            </span>
          </div>

          {/* Distance Indicator */}
          <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/50 flex gap-2 items-center justify-center px-3 py-0.5 rounded-2xl text-center">
            <span className="text-base md:text-lg font-black text-amber-300">المسافة {Math.floor(distance).toString().padStart(4, "0")}م</span>
          </div>

          {/* Match 10-Min Timer Indicator */}
          <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/50 flex gap-1.5 items-center justify-center px-3 py-0.5 rounded-2xl text-center">
            <span className="text-base md:text-lg font-black text-amber-300 dir-ltr">
              {Math.floor(matchTimeLeft / 60)}:{(matchTimeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Flying Carrots Animation Overlay Particles */}
        {flyingCarrots.map((p) => {
          const now = Date.now();
          if (now < p.startTime || p.hit) return null;

          const t = p.progress;
          const easeT = 1 - Math.pow(1 - t, 3);
          const startX = 50; // %
          const startY = 82; // %
          const targetX = 73; // % (Top Right where Carrot Counter Box is)
          const targetY = 3.5;  // %
          const arc = Math.sin(t * Math.PI) * 25;

          const curX = startX + (targetX - startX) * easeT;
          const curY = startY + (targetY - startY) * easeT - arc;
          const scale = 0.8 + Math.sin(t * Math.PI) * 0.5;

          return (
            <div
              key={p.id}
              className="absolute z-50 pointer-events-none text-2xl filter select-none"
              style={{
                left: `${curX}%`,
                top: `${curY}%`,
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${t * 360}deg)`,
              }}
            >
              🥕
            </div>
          );
        })}

      {/* Left Vertical Progress Track (0% to 100% Finish Line 🏁) */}
      <div className="absolute bg-black/50 rounded-full py-2 left-2 top-20 bottom-35 z-20 w-7 md:w-8 flex flex-col items-center justify-between">
        {/* Finish Line Flag */}
        <span className="text-sm transform hover:scale-125 transition-transform cursor-pointer" title="خط النهاية 🏁">
          🏁
        </span>

        {/* Vertical Track Line */}
        <div className="relative w-1.5 flex-1 bg-gray-400 rounded-full my-2 overflow-visible">
          {/* Checkpoint 3 tick (1000m / 100%) */}
          <div className="absolute top-0 -left-1.5 w-4 h-1 bg-amber-300 rounded" title="مرحلة 3" />
          {/* Checkpoint 2 tick (666m / 66%) */}
          <div className="absolute top-[33%] -left-1.5 w-4 h-1 bg-amber-300 rounded" title="مرحلة 2" />
          {/* Checkpoint 1 tick (333m / 33%) */}
          <div className="absolute top-[66%] -left-1.5 w-4 h-1 bg-amber-300 rounded" title="مرحلة 1" />

          {/* Red Circle = Player 1 (Me) */}
          <div
            className="absolute -left-2.5 w-6 h-6 bg-red-500 Battery-border-2 border-white rounded-full flex items-center justify-center transition-all duration-300 transform -translate-y-1/2"
            style={{ top: `${100 - (distance / 1000) * 100}%` }}
            title="موقعي"
          >
            <span className="text-[9px] font-black text-white">أنا</span>
          </div>

          {/* Blue Circle = Player 2 (Opponent) */}
          {opp && (
            <div
              className="absolute -left-2.5 w-6 h-6 bg-blue-500 Battery-border-2 border-white rounded-full flex items-center justify-center transition-all duration-300 transform -translate-y-1/2 opacity-90"
              style={{ top: `${100 - (oppDistance / 1000) * 100}%` }}
              title={opp.name || "المنافس"}
            >
              <span className="text-[9px] font-black text-white">خصم</span>
            </div>
          )}
        </div>

      </div>

      {/* Main 3D Canvas Runner Area */}
      <div className="relative w-full h-full max-w-md max-h-[80vh] flex items-center justify-center overflow-hidden mx-auto border-4 border-amber-500">
        <canvas ref={canvasRef} width={1024} height={1024} className="w-full h-full object-cover" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />

        {/* Finished Screen Overlay */}
        {isFinished && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-40 flex flex-col items-center justify-center p-6 text-center text-white space-y-6">
            <img src="/beach-environment/rabbit-end-screen.png" className="w-20 h-20 md:w-25 md:h-25 mb-2 object-contain inline" />
            <h2 className="text-xl md:text-2xl mb-2 font-black text-amber-300">
              {(() => {
                const effectiveWinnerId = finishWinnerId !== null ? finishWinnerId : room?.beachRace?.winnerId;
                return !effectiveWinnerId
                  ? "⏰ انتهى الوقت!"
                  : effectiveWinnerId === me?.id
                  ? "🏆 مبروك! لقد فزت بالسباق!"
                  : "💔 للاسف فاز المنافس!";
              })()}
            </h2>
            <p className="flex flex-col text-sm gap-1 mb-2 text-amber-100">
              الكلمة الصحيحة كانت: <span className="font-black text-amber-300 text-xl">{targetWord}</span>
            </p>

            {(finishWinnerId !== null ? finishWinnerId : room?.beachRace?.winnerId) === me?.id && (
              <div className="bg-amber-500/20 border border-amber-400/50 rounded-2xl p-2 max-w-sm mb-2 w-full space-y-1 text-xs md:text-sm text-amber-200">
                <div className="font-black text-amber-300 text-sm md:text-base">🎁 تم إضافة النقاط لشريط الهدايا:</div>
                <div className="flex justify-between items-center px-2">
                  <span>نقاط الفوز الأساسية:</span>
                  <span className="font-bold text-green-400">+10 نقاط</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span>الجزر ({carrotsCollected} 🥕):</span>
                  <span className="font-bold text-orange-400">+{Math.floor(carrotsCollected / 10)} نقاط</span>
                </div>
                <div className="border-t border-amber-500/30 pt-1 font-black text-amber-300 flex justify-between items-center px-2 text-sm">
                  <span>المجموع الكلي:</span>
                  <span className="text-amber-300 text-base">+{10 + Math.floor(carrotsCollected / 10)} نقطة</span>
                </div>
              </div>
            )}

            {/* Unified Game End Controls */}
            <GameEndControls
              room={room}
              socket={socket}
              myId={me?.id}
              playerSerial={playerSerial}
              isRematchRequestedByMe={room?.beachRace?.rematchRequestedBy?.includes(me?.id)}
              isRematchRequestedByOpponent={room?.beachRace?.rematchRequestedBy?.includes(opp?.id)}
              onChangeGame={() => {
                setIsLocalFinished(false);
              }}
              onRematch={() => {
                socket?.emit("request_beach_race_rematch", { roomId: room?.id, playerId: me?.id });
                GameEngineService.handleAction("request_beach_race_rematch", { roomId: room?.id, playerId: me?.id });
              }}
              onLeaveGame={handleLeaveGame}
              playSound={playSound}
              className="mt-2"
            />
          </div>
        )}

        {/* Waiting / Lobby Screen */}
        {room?.gameState === "beach_race_setup" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#4A2C11] backdrop-blur-md shadow-sm w-full h-full text-center rounded-xl">
            <img src="/beach-environment/rabbit-setup-screen.png" className="w-20 h-20 md:w-25 md:h-25 mb-2 object-contain inline" />
            <h2 className="text-2xl md:text-3xl font-black text-amber-600 mb-2 md:mb-4 home-title-stroke-sm">سباق التخمين</h2>
            
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-2 w-full text-right shadow-sm max-w-sm">
              <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2 text-lg">
                <Info className="w-5 h-5" /> طريقة اللعب:
              </h3>
              <ul className="text-sm md:text-base text-amber-700 space-y-2 list-disc list-inside pr-2 font-semibold">
                <li>تسابق لتجميع الحروف وتفادي العوائق.</li>
                <li>السباق مقسم لـ 3 مراحل (نقاط توقف).</li>
                <li>عند كل مرحلة، حاول تخمين الكلمة باستخدام الحروف المجمعة.</li>
                <li>الأسرع في تخمين الكلمة هو الفائز!</li>
              </ul>
            </div>

            <div className="w-full max-w-sm mt-2">
              <button
                onClick={() => {
                  if (playSound) playSound("clickOpen");
                  socket?.emit("start_beach_race", { roomId: room.id, playerId: me?.id });
                  GameEngineService.handleAction("start_beach_race", { roomId: room.id, playerId: me?.id });
                }}
                disabled={room?.beachRace?.readyPlayers?.includes(me?.id)}
                className={`w-full py-4 rounded-2xl font-black text-xl text-white shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-transparent transition-all flex items-center justify-center gap-3 ${
                  room?.beachRace?.readyPlayers?.includes(me?.id)
                    ? "bg-amber-400 opacity-80 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:translate-y-1.5"
                }`}
              >
                {room?.beachRace?.readyPlayers?.includes(me?.id) ? (
                  <span className="animate-pulse">⏳ في انتظار الخصم...</span>
                ) : room?.beachRace?.readyPlayers?.includes(opp?.id) ? (
                  <span className="animate-pulse">🐇 الخصم جاهز! ابدأ السباق</span>
                ) : (
                  <span>🏁 ابدأ سباق التخمين</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Controls below the canvas */}
      {isGameActive && !isPausedAtCheckpoint && !showModal && (
        <div className="w-full max-w-md mt-1 flex items-center justify-between px-4 py-2 bg-slate-800/90 backdrop-blur-md rounded-2xl border-2 border-amber-500/50 shadow-2xl select-none touch-none" dir="ltr">
          {/* Direction Arrows */}
          <div className="flex gap-4" dir="ltr">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                if (isGameActive && !showModal && !isPausedAtCheckpoint) {
                  setLane((prev) => Math.max(0, prev - 1));
                }
              }}
              className="w-14 h-14 bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 font-black rounded-full border-2 border-amber-300 flex items-center justify-center shadow-lg transition-all cursor-pointer select-none touch-none"
              title="تحريك يسار"
            >
              <ArrowLeft className="w-8 h-8 pointer-events-none" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                if (isGameActive && !showModal && !isPausedAtCheckpoint) {
                  setLane((prev) => Math.min(2, prev + 1));
                }
              }}
              className="w-14 h-14 bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 font-black rounded-full border-2 border-amber-300 flex items-center justify-center shadow-lg transition-all cursor-pointer select-none touch-none"
              title="تحريك يمين"
            >
              <ArrowRight className="w-8 h-8 pointer-events-none" />
            </button>
          </div>

          {/* Run Button */}
          <div>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                if (isGameActive && !showModal && !isPausedAtCheckpoint) {
                  isRunningRef.current = true;
                }
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                isRunningRef.current = false;
              }}
              onPointerLeave={() => { isRunningRef.current = false; }}
              onPointerCancel={() => { isRunningRef.current = false; }}
              className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 active:scale-95 text-white font-black rounded-full border-2 border-green-300 flex items-center justify-center shadow-lg select-none touch-none cursor-pointer"
            >
             <span className="flex text-[25px] items-center justify-center text-center pointer-events-none">🐇</span>
            </button>
          </div>
        </div>
      )}

      {/* Checkpoint Guessing Modal Window */}
      {showModal && !isFinished && (
        <div className="fixed inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-800 border-2 border-amber-400/80 p-1 md:p-2 max-w-sm md:max-w-md w-full shadow-2xl space-y-3 text-white animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-500/30 mb-1 pb-0.5">
              <div className="flex items-center gap-1">
                🚩
                <h2 className="text-lg md:text-xl font-black text-amber-300">
                  مرحلة {currentCheckpointStage} من 3
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/50 flex items-center gap-1">
                  ⏳ المتبقي: {checkpointTimeLeft}ث
                </span>
              </div>
            </div>

            {/* Timer Notice */}
            {currentCheckpointStage === 3 ? (
              <p className="text-[11px] font-bold text-red-300 text-center bg-red-500/10 p-1.5 rounded mb-1 border border-red-500/30">
                ⚠️ المرحلة الثالثة والأخيرة: عند انتهاء الوقت ستنتهي المباراة بالخسارة!
              </p>
            ) : (
              <p className="text-[10px] md:text-[11px] font-bold text-amber-200/90 text-center bg-amber-500/10 p-1.5 rounded mb-1 border border-amber-500/30">
                ℹ️ عند انتهاء الوقت المحدد (دقيقة واحدة) سيستكمل السباق تلقائياً.
              </p>
            )}

            {/* Questions Section (with replaces ? with .) */}
            <div className="bg-slate-900/90 mb-0.5 p-1 border border-slate-700 space-y-1">
              <span className="text-[10px] font-black text-amber-400 block">
                تلميحات الكلمة المطلوبة {categoryName ? `(${categoryName})` : ""}:
              </span>
              <ul className="space-y-1 max-h-20 overflow-y-auto pr-1">
                {formattedQuestions.map((q, idx) => (
                  <li key={idx} className="text-xs md:text-sm font-bold text-slate-200 flex items-center gap-1">
                    <span className="text-amber-400 text-[10px]">🔹</span> {q}
                  </li>
                ))}
              </ul>
            </div>

            {/* Target Word Input Boxes */}
            <div className="space-y-1 mb-0.5">
              <div className="flex h-6 items-center justify-between">
                <span className="text-[10px] font-black text-amber-400 block">اكتب تخمين الكلمة:</span>
                {guessInput.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30 transition-colors cursor-pointer"
                  >
                    <Eraser className="w-3 h-3" /> مسح ⌫
                  </button>
                )}
              </div>
              <div className="flex items-center justify-center gap-1.5" dir="rtl">
                {Array.from({ length: cleanTargetLength }).map((_, idx) => {
                  const char = guessInput[idx] || "";
                  return (
                    <div
                      key={idx}
                      className={`w-8 h-10 md:w-10 md:h-12 rounded-lg border-2 flex items-center justify-center text-lg md:text-xl font-black uppercase transition-all ${
                        char
                          ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-sm"
                          : "border-slate-600 bg-slate-900/80 text-slate-500"
                      }`}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Virtual Arabic Keyboard (Only collected letters enabled) */}
            <div className="space-y-1 mb-0.5">
              <span className="text-[10px] font-black text-amber-300 block">الحروف التي جمعتها خلال السباق:</span>
              <div className="grid grid-cols-10 gap-0.5" dir="rtl">
                {ALL_ARABIC_LETTERS.map((letter) => {
                  const isAvailable = isLetterAvailable(letter);
                  return (
                    <button
                      key={letter}
                      disabled={!isAvailable}
                      onClick={() => {
                        if (guessInput.length < cleanTargetLength) {
                          setGuessInput((prev) => prev + letter);
                          setWrongGuessMsg("");
                        }
                      }}
                      className={`h-7 md:h-8 rounded text-[11px] md:text-xs font-black transition-all ${
                        isAvailable
                          ? "bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 shadow-sm cursor-pointer"
                          : "bg-slate-700 opacity-25 cursor-not-allowed text-slate-400"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

            </div>

            {wrongGuessMsg && (
              <p className="text-xs font-bold text-red-400 text-center animate-pulse m-0 py-0.5 bg-red-500/10 rounded border border-red-500/30">{wrongGuessMsg}</p>
            )}

            {/* Modal Buttons */}
            <div className="flex flex-col md:flex-row items-center gap-2 pt-1">
              <button
                onClick={handleConfirmGuess}
                disabled={guessInput.trim().length === 0}
                className={`w-full py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-40 font-black text-sm rounded-xl shadow-lg transition-transform active:scale-95 text-white flex items-center justify-center gap-1.5 cursor-pointer ${currentCheckpointStage < 3 ? 'md:w-1/2' : ''}`}
              >
                <CheckCircle2 className="w-4 h-4" /> تأكيد التخمين
              </button>
              {currentCheckpointStage < 3 && (
                <button
                  onClick={handleResumeRunner}
                  className="w-full md:w-1/2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 font-black text-sm rounded-xl transition-transform active:scale-95 text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                 استكمال لتجميع حروف 🐇
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
