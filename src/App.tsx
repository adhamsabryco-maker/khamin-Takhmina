import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Trophy, 
  Timer, 
  Hammer, 
  Sparkles, 
  Gamepad2,
  ChevronRight,
  HelpCircle,
  Snowflake,
  MessageSquare,
  Send,
  X,
  Home,
  Flag,
  Ban,
  Info,
  Brain,
  Star,
  Zap,
  Lock,
  Upload,
  Camera,
  Check,
  Settings,
  Crown,
  AlertTriangle,
  Trash2,
  Type,
  Eye,
  Shield,
  Search,
  UserMinus,
  UserPlus,
  RefreshCw,
  Smile,
  LogOut,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Cropper from 'react-easy-crop';

// Audio URLs
const SOUNDS = {
  hammer: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  lose: 'https://assets.mixkit.co/active_storage/sfx/1433/1433-preview.mp3',
  countdown: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  correct: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
};

// Types
interface Player {
  id: string;
  name: string;
  age: number; // Added for player privacy and child protection
  avatar: string;
  score: number;
  targetImage: { name: string; image: string } | null;
  isMuted: boolean;
  hasGuessed: boolean;
  selectedCategory: string | null;
  hintCount: number;
  quickGuessUsed: boolean;
  wordLengthUsed?: boolean;
  timeFreezeUsed?: boolean;
  spyLensUsed?: boolean;
  reported: boolean; // Added for player reporting feature
  xp: number;
  streak: number;
  serial?: string;
  wins?: number;
  reports?: number;
  reportedBy?: any[];
  banCount?: number;
  isPermanentBan?: number;
}

interface Room {
  id: string;
  players: Player[];
  gameState: 'waiting' | 'discussion' | 'guessing' | 'finished';
  timer: number;
  category: string;
  isPaused: boolean;
  pausingPlayerId: string | null;
  quickGuessTimer: number;
  isFrozen?: boolean;
  freezeTimer?: number;
}

const AVATARS = [
  { emoji: '🦁', level: 1 },
  { emoji: '🦊', level: 1 },
  { emoji: '🐼', level: 1 },
  { emoji: '🐨', level: 1 },
  { emoji: '🐯', level: 10 },
  { emoji: '🐸', level: 20 },
  { emoji: '🐙', level: 30 },
  { emoji: '🦄', level: 40 },
];

const APP_VERSION = '1.1.1'; // Version for cache clearing

const CATEGORIES = [
  { id: 'people', name: 'اشخاص', icon: '👥' },
  { id: 'food', name: 'أكلات', icon: '🍕' },
  { id: 'animals', name: 'حيوانات', icon: '🐘' },
  { id: 'objects', name: 'جماد', icon: '📦' },
  { id: 'birds', name: 'طيور', icon: '🦜' },
  { id: 'plants', name: 'نبات', icon: '🌿' },

];

const EMOTES = ['😂', '😡', '👍', '👎', '🤔', '🤯', '🎉', '💔'];

const enterFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
  }
};

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('khamin_player_name') || '');
  const playerNameRef = useRef(playerName);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);

  const [playerAge, setPlayerAge] = useState(() => {
    const storedAge = localStorage.getItem('khamin_player_age');
    return storedAge ? parseInt(storedAge) : '';
  });
  const [playerId] = useState(() => {
    let id = localStorage.getItem('khamin_player_id');
    if (!id) {
      id = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('khamin_player_id', id);
    }
    return id;
  });

  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('khamin_xp') || '0'));
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('khamin_streak') || '0'));
  const [wins, setWins] = useState(() => parseInt(localStorage.getItem('khamin_wins') || '0'));
  const [playerSerial, setPlayerSerial] = useState(() => localStorage.getItem('khamin_player_serial') || '');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [customAvatar, setCustomAvatar] = useState(() => localStorage.getItem('khamin_custom_avatar') || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminPlayers, setAdminPlayers] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 200;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      200,
      200
    );

    return canvas.toDataURL('image/jpeg', 0.7);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    try {
      if (imageSrc && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        setCustomAvatar(croppedImage);
        setAvatar(croppedImage);
        localStorage.setItem('khamin_custom_avatar', croppedImage);
        setShowCropper(false);
        setImageSrc(null); // Clear image source after save
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderAvatarContent = (avatarStr: string) => {
    if (avatarStr && avatarStr.startsWith('data:image')) {
      return <img src={avatarStr} className="w-full h-full object-cover rounded-full" alt="Avatar" />;
    }
    return avatarStr;
  };

  // Cache clearing logic
  useEffect(() => {
    const lastVersion = localStorage.getItem('khamin_app_version');
    if (lastVersion && lastVersion !== APP_VERSION) {
      localStorage.clear();
      localStorage.setItem('khamin_app_version', APP_VERSION);
      window.location.reload();
    } else if (!lastVersion) {
      localStorage.setItem('khamin_app_version', APP_VERSION);
    }
  }, []);

  const getLevel = (xp: number) => Math.min(50, Math.floor(Math.sqrt(xp / 50)) + 1);
  const getXpProgress = (xp: number) => {
    const level = getLevel(xp);
    if (level >= 50) return 100;
    const currentLevelXp = 50 * Math.pow(level - 1, 2);
    const nextLevelXp = 50 * Math.pow(level, 2);
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.min(100, Math.max(0, progress));
  };
  const getXpForNextLevel = (level: number) => Math.pow(level, 2) * 50;
  const getXpForCurrentLevel = (level: number) => Math.pow(level - 1, 2) * 50;
  const getQuickGuessWaitTime = (level: number) => {
    // Level 1: 150s wait, Level 50: 3s wait (decreases 3s per level)
    return Math.max(3, 150 - (level - 1) * 3);
  };

  const getQuickGuessThreshold = (level: number) => {
    // The threshold is when the game timer (300s) reaches (300 - waitTime)
    // Level 1: 300 - 150 = 150s remaining
    // Level 10: 300 - 123 = 177s remaining
    return 300 - getQuickGuessWaitTime(level);
  };

  const getAvatarStyle = (level: number) => {
    if (level >= 50) return 'bg-red-50 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)]';
    if (level >= 40) return 'bg-purple-50 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)]';
    if (level >= 30) return 'bg-emerald-50 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]';
    if (level >= 20) return 'bg-yellow-50 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]';
    if (level >= 10) return 'bg-gray-100 border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.5)]';
    return 'bg-orange-100 border-orange-300 shadow-inner';
  };

  const renderStars = (level: number, type: 'linear' | 'circular' = 'circular') => {
    const starsCount = Math.floor(level / 10);
    if (starsCount === 0) return null;
    
    if (type === 'linear') {
      return (
        <div className="flex justify-center gap-0.5 mt-1">
          {Array.from({ length: starsCount }).map((_, i) => (
            <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
          ))}
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-10 pointer-events-none animate-[spin_10s_linear_infinite]">
        {Array.from({ length: starsCount }).map((_, i) => {
          const angle = (i * 360) / starsCount;
          return (
            <div 
              key={i} 
              className="absolute inset-0 flex items-start justify-center"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div className="-mt-2">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 drop-shadow-md" style={{ transform: `rotate(-${angle}deg)` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    localStorage.setItem('khamin_xp', xp.toString());
    localStorage.setItem('khamin_streak', streak.toString());
  }, [xp, streak]);

  const [avatar, setAvatar] = useState(() => localStorage.getItem('khamin_player_avatar') || AVATARS[0].emoji);

  useEffect(() => {
    localStorage.setItem('khamin_player_avatar', avatar);
    if (socket) {
      socket.emit('update_avatar', { avatar });
    }
  }, [avatar, socket]);

  useEffect(() => {
    localStorage.setItem('khamin_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('khamin_player_age', playerAge.toString());
  }, [playerAge]);

  const [roomId, setRoomId] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const roomRef = useRef<Room | null>(null);
  useEffect(() => { roomRef.current = room; }, [room]);

  const [joined, setJoined] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [banUntil, setBanUntil] = useState<number | null>(null);
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [reports, setReports] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [searchTimeLeft, setSearchTimeLeft] = useState(120);
  const [matchResponseTimeLeft, setMatchResponseTimeLeft] = useState(30);
  const [proposedMatch, setProposedMatch] = useState<{ matchId: string, opponent: { name: string, avatar: string, age: number, level?: number } } | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [error, setError] = useState('');
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Matchmaking timeout and timer
  useEffect(() => {
    // Only start timer if searching AND timer isn't already running (or was paused)
    if (isSearching && !proposedMatch) {
      // If we just started searching (timer at 60), or if we are resuming search
      // We should NOT reset to 60 if we are just coming back from a proposed match rejection
      // BUT, the current logic resets it every time `proposedMatch` becomes null.
      
      // To fix this, we need to track if the timer is "active" separately, or just not reset it here.
      // However, `useEffect` runs when dependencies change.
      // If we remove `setSearchTimeLeft(60)` from here, we need to set it when STARTING search.
      
      if (!searchIntervalRef.current) {
         searchIntervalRef.current = setInterval(() => {
          setSearchTimeLeft(prev => {
            if (prev <= 1) {
              // Timeout logic moved inside interval to access current state
              setIsSearching(false);
              setJoined(false);
              setProposedMatch(null);
              setHasResponded(false);
              socket?.emit('leave_matchmaking');
              setError('لم يتم العثور على منافس حالياً. يرجى المحاولة في وقت لاحق.');
              setTimeout(() => setError(''), 5000);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      // Pause timer when match is proposed, but don't reset it
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
    }

    return () => {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
    };
  }, [isSearching, proposedMatch, socket]);

  // Match response timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (proposedMatch) {
      interval = setInterval(() => {
        setMatchResponseTimeLeft((prev) => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            // Auto-reject if not responded or just clear if already accepted
            if (!hasResponded) {
              socket?.emit('respond_to_match', { matchId: proposedMatch.matchId, response: 'reject' });
            }
            setProposedMatch(null);
            setHasResponded(false);
            // Return to home page
            setJoined(false);
            setIsSearching(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [proposedMatch, hasResponded, socket]);

  // Reset timer ONLY when starting a fresh search
  useEffect(() => {
    if (isSearching) {
       // We only want to reset if this is a NEW search session.
       // But how do we distinguish "new search" from "returning from rejection"?
       // We can check if searchTimeLeft is 0 or 60? No.
       // Let's move the reset to the `handleRandomMatch` function.
    }
  }, [isSearching]);

  // Global Fullscreen trigger on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const [guess, setGuess] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showEmotes, setShowEmotes] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ id: string; senderId: string; text: string; playerName: string; avatar: string }[]>([]);
  const [bubbles, setBubbles] = useState<{ id: string; senderId: string; text: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      const parent = chatEndRef.current.parentElement;
      if (parent) {
        parent.scrollTop = parent.scrollHeight;
      }
    }
  }, [chatHistory]);
  const [spyLensImage, setSpyLensImage] = useState<string | null>(null);
  const [showHammer, setShowHammer] = useState<string | null>(null);
  const [funnyFilter, setFunnyFilter] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<{ [key: string]: number }>({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [isOpponentBlocked, setIsOpponentBlocked] = useState(false);
  const [isMutedByOpponent, setIsMutedByOpponent] = useState(false);
  const isOpponentBlockedRef = useRef(isOpponentBlocked);
  useEffect(() => { isOpponentBlockedRef.current = isOpponentBlocked; }, [isOpponentBlocked]);
  
  const audioRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      audioRef.current[key] = new Audio(url);
    });
  }, []);

  const playSound = useCallback((key: keyof typeof SOUNDS) => {
    const sound = audioRef.current[key];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }, []);

  const clearPlayerData = () => {
    localStorage.removeItem('khamin_player_serial');
    localStorage.removeItem('khamin_player_name');
    localStorage.removeItem('khamin_player_age');
    localStorage.removeItem('khamin_player_avatar');
    localStorage.removeItem('khamin_custom_avatar');
    localStorage.removeItem('khamin_xp');
    localStorage.removeItem('khamin_wins');
    localStorage.removeItem('khamin_streak');
    setPlayerSerial('');
    setPlayerName('');
    setPlayerAge('');
    setCustomAvatar('');
    setXp(0);
    setWins(0);
    setStreak(0);
    setReports(0);
    setIsPermanentBan(false);
    setBanUntil(0);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { user } = event.data;
        if (user.isAdmin) {
          setIsAdmin(true);
          socket?.emit('admin_set_admin_status', { 
            serial: playerSerial, 
            isAdmin: true, 
            email: user.email 
          }, (res: any) => {
            if (res.success) {
              setShowAdminDashboard(true);
              setShowSettingsModal(false);
              // Fetch admin data
              socket?.emit('admin_get_players', (players: any) => setAdminPlayers(players));
              socket?.emit('admin_get_reports', (reports: any) => setAdminReports(reports));
            }
          });
        } else {
          setError('عذراً، هذا الحساب لا يملك صلاحيات الإدارة.');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [socket, playerSerial]);

  const handleAdminLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'google_auth', 'width=500,height=600');
    } catch (err) {
      setError('فشل الاتصال بخدمة جوجل.');
    }
  };

  const connectSocket = useCallback(() => {
    console.log('Initializing socket connection to:', window.location.origin);
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected successfully! ID:', newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      
      const serial = localStorage.getItem('khamin_player_serial');
      if (serial) {
        newSocket.emit('set_player_serial_for_socket', serial);
        // Fetch actual server data
        newSocket.emit('get_player_data', serial, (data: any) => {
          if (data) {
            setXp(data.xp);
            setWins(data.wins || 0);
            setReports(data.reports || 0);
            if (data.isPermanentBan) {
              setIsPermanentBan(true);
            } else if (data.banUntil && data.banUntil > Date.now()) {
              setBanUntil(data.banUntil);
            }
            localStorage.setItem('khamin_xp', data.xp.toString());
            localStorage.setItem('khamin_wins', (data.wins || 0).toString());
          } else {
            clearPlayerData();
            setShowWelcomeModal(true);
          }
        });
      } else {
        setShowWelcomeModal(true);
      }

      newSocket.emit('get_top_players', (players: any[]) => {
        setTopPlayers(players);
      });
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError('فشل الاتصال بالخادم. يرجى التأكد من اتصالك بالإنترنت.');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('online_count', (count) => {
      setOnlineCount(count);
    });

    newSocket.on('player_data_update', (data: any) => {
      if (data.reports !== undefined) setReports(data.reports);
      if (data.xp !== undefined) {
        setXp(data.xp);
        localStorage.setItem('khamin_xp', data.xp.toString());
      }
      if (data.wins !== undefined) {
        setWins(data.wins);
        localStorage.setItem('khamin_wins', data.wins.toString());
      }
      if (data.name !== undefined) {
        setPlayerName(data.name);
        localStorage.setItem('khamin_player_name', data.name);
      }
      if (data.banUntil !== undefined) setBanUntil(data.banUntil);
      if (data.isPermanentBan !== undefined) setIsPermanentBan(data.isPermanentBan);
    });

    newSocket.on('top_players_update', (players: any[]) => {
      setTopPlayers(players);
    });

    newSocket.on('opponent_muted_you', (isMuted: boolean) => {
      setIsMutedByOpponent(isMuted);
    });

    newSocket.on('room_update', (updatedRoom: Room) => {
      if (updatedRoom.gameState === 'waiting' && roomRef.current?.gameState === 'finished') {
        setChatHistory([]);
      }
      
      if (roomRef.current?.players.length === 1 && updatedRoom.players.length === 2) {
        const newPlayer = updatedRoom.players.find(p => p.id !== newSocket.id);
        if (newPlayer) {
          setError(`انضم اللاعب ${newPlayer.name} إلى الغرفة! 🎮`);
          setTimeout(() => setError(''), 3000);
        }
      }

      setRoom(updatedRoom);
      setJoined(true);
    });

    newSocket.on('timer_update', (timer: number) => {
      setRoom(prev => prev ? { ...prev, timer } : null);
    });

    newSocket.on('chat_bubble', ({ senderId, text }) => {
      if (senderId !== newSocket.id && isOpponentBlockedRef.current) return;
      const sender = roomRef.current?.players.find((p: any) => p.id === senderId);
      const msgId = Math.random().toString(36).substr(2, 9);
      
      setChatHistory(prev => {
        if (prev.some(m => m.id === msgId)) return prev;
        return [...prev, { 
          id: msgId, 
          senderId, 
          text, 
          playerName: sender?.name || (senderId === newSocket.id ? playerNameRef.current : 'منافس'),
          avatar: sender?.avatar || '👤'
        }];
      });
    });

    newSocket.on('guess_result', ({ playerId, correct }) => {
      if (!correct) {
        playSound('hammer');
        setShowHammer(playerId);
        setFunnyFilter(playerId);
        setTimeout(() => {
          setShowHammer(null);
          setFunnyFilter(null);
        }, 2000);
      } else {
        playSound('correct');
      }
    });

    newSocket.on('game_finished', ({ room, winnerId, updates }) => {
      setRoom(room);
      const isWinner = winnerId === newSocket.id;
      if (isWinner) {
        playSound('win');
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        playSound('lose');
      }

      if (updates && updates[newSocket.id]) {
        const myUpdate = updates[newSocket.id];
        setXp(prev => {
          const oldLevel = getLevel(prev);
          const newXp = prev + myUpdate.xp;
          const newLevel = getLevel(newXp);
          if (newLevel > oldLevel) {
            setShowLevelUp(newLevel);
            playSound('win');
          }
          localStorage.setItem('khamin_xp', newXp.toString());
          return newXp;
        });
        setStreak(myUpdate.streak);
        localStorage.setItem('khamin_streak', myUpdate.streak.toString());
        if (myUpdate.wins !== undefined) {
          setWins(myUpdate.wins);
          localStorage.setItem('khamin_wins', myUpdate.wins.toString());
        }
      }
    });

    newSocket.on('emote_received', ({ senderId, emote }) => {
      if (senderId !== newSocket.id && isOpponentBlockedRef.current) return;
      const id = Math.random().toString(36).substr(2, 9);
      setBubbles(prev => {
        if (prev.some(b => b.id === id)) return prev;
        return [...prev, { id, senderId, text: emote }];
      });
      setTimeout(() => {
        setBubbles(prev => prev.filter(b => b.id !== id));
      }, 4000);
    });

    newSocket.on('waiting_for_match', () => {
      setIsSearching(true);
      setJoined(true);
      setProposedMatch(null);
    });

    newSocket.on('match_proposed', (data) => {
      setProposedMatch(data);
      setHasResponded(false);
      setMatchResponseTimeLeft(30);
    });

    newSocket.on('match_rejected', () => {
      setProposedMatch(null);
      setHasResponded(false);
    });

    newSocket.on('random_match_found', ({ roomId }) => {
      setRoomId(roomId);
      setIsSearching(false);
      setJoined(true);
      setProposedMatch(null);
      setHasResponded(false);
    });

    newSocket.on('game_started', () => {
      setChatHistory([]);
    });

    newSocket.on('quick_guess_started', ({ playerId }) => {
      playSound('countdown');
    });

    newSocket.on('quick_guess_timer_update', (timer: number) => {
      setRoom(prev => prev ? { ...prev, quickGuessTimer: timer } : null);
    });

    newSocket.on('quick_guess_timeout', () => {
      setGuess('');
    });

    newSocket.on('hint_received', ({ hint }) => {
      setHint(hint);
      setTimeout(() => setHint(null), 10000);
    });

    newSocket.on('word_length_result', ({ length }) => {
      setHint(`الكلمة تتكون من ${length} حروف`);
      setTimeout(() => setHint(null), 5000);
    });

    newSocket.on('freeze_started', ({ playerId }) => {
      playSound('countdown');
    });

    newSocket.on('freeze_timer_update', (timer) => {
      setRoom(prev => prev ? { ...prev, freezeTimer: timer, isFrozen: true } : null);
    });

    newSocket.on('freeze_ended', () => {
      setRoom(prev => prev ? { ...prev, isFrozen: false, freezeTimer: 0 } : null);
    });

    newSocket.on('spy_lens_active', ({ image }) => {
      setSpyLensImage(image);
      setTimeout(() => setSpyLensImage(null), 5000);
    });

    newSocket.on('game_stopped', ({ reason }) => {
      setError(reason);
      setRoom(null);
      setJoined(false);
      setGuess('');
      setHint(null);
      setChatHistory([]);
      setRoomId(prev => prev.startsWith('random_') ? '' : prev);
      setIsOpponentBlocked(false);
      setTimeout(() => setError(''), 5000);
    });

    newSocket.on('opponent_left_lobby', () => {
      setRoom(null);
      setJoined(false);
      setGuess('');
      setHint(null);
      setChatHistory([]);
      setRoomId(prev => prev.startsWith('random_') ? '' : prev);
      setIsOpponentBlocked(false);
      setError('غادر المنافس الغرفة');
      setTimeout(() => setError(''), 3000);
    });

    newSocket.on('error', (msg) => setError(msg));

    newSocket.on('auth_error', () => {
      clearPlayerData();
      setShowWelcomeModal(true);
      setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
    });

    newSocket.on('banned_status', ({ banUntil, isPermanent }) => {
      if (isPermanent) {
        setIsPermanentBan(true);
      } else {
        setBanUntil(banUntil);
      }
      setIsSearching(false);
      setJoined(false);
    });

    return newSocket;
  }, []);

  useEffect(() => {
    const newSocket = connectSocket();
    return () => {
      newSocket.disconnect();
    };
  }, [connectSocket]);

  // Separate effect for countdown sound to avoid re-binding socket listeners
  useEffect(() => {
    if (room?.timer && room.timer <= 10 && room.timer > 0 && room.gameState === 'guessing') {
      playSound('countdown');
    }
  }, [room?.timer, room?.gameState, playSound]);

  // Cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          if (next[key] > 0) {
            next[key] -= 1;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = () => {
    if (!playerSerial) {
      setShowWelcomeModal(true);
      return;
    }
    if (!playerName.trim() || !playerAge || playerAge < 0) {
      setError('حقل مفقود! يرجى إدخال اسمك وعمرك أولاً');
      return;
    }
    if (!roomId.trim()) {
      setError('حقل مفقود! يرجى إدخال كود الغرفة');
      return;
    }
    if (playerAge <= 12) {
      setError('عذراً، يجب أن يكون عمرك 13 عاماً أو أكثر للعب.');
      return;
    }
    setError('');
    
    localStorage.setItem('khamin_player_name', playerName);
    localStorage.setItem('khamin_player_age', playerAge.toString());
    socket?.emit('join_room', { roomId, playerName, avatar, age: playerAge, xp, streak, wins, serial: playerSerial });
    setIsOpponentBlocked(false);
  };

  const handleRandomMatch = () => {
    if (!playerSerial) {
      setShowWelcomeModal(true);
      return;
    }
    if (!playerName.trim() || !playerAge || playerAge < 0) {
      setError('حقل مفقود! يرجى إدخال اسمك وعمرك أولاً');
      return;
    }
    if (playerAge <= 12) {
      setError('عذراً، يجب أن يكون عمرك 13 عاماً أو أكثر للعب.');
      return;
    }
    setError('');
    
    localStorage.setItem('khamin_player_name', playerName);
    localStorage.setItem('khamin_player_age', playerAge.toString());
    
    // Reset search timer for new search
    setSearchTimeLeft(120);
    
    socket?.emit('find_random_match', { playerId, playerName, avatar, age: playerAge, xp, streak, wins, serial: playerSerial });
    setIsOpponentBlocked(false);
  };

  const handleRegister = () => {
    if (!playerName.trim() || !playerAge) {
      setError('يرجى إدخال اسمك وعمرك أولاً');
      return;
    }
    socket?.emit('register_player', { name: playerName, avatar, xp }, ({ serial, name }: { serial: string, name: string }) => {
      if (serial) {
        setPlayerSerial(serial);
        setPlayerName(name); // Update with filtered name
        localStorage.setItem('khamin_player_serial', serial);
        localStorage.setItem('khamin_player_name', name);
        localStorage.setItem('khamin_player_age', playerAge.toString());
        localStorage.setItem('khamin_player_avatar', avatar);
        localStorage.setItem('khamin_wins', '0');
        setShowWelcomeModal(false);
        setError('');
      } else {
        setError('فشل التسجيل. يرجى المحاولة مرة أخرى.');
      }
    });
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    socket?.emit('submit_guess', { roomId, guess });
    setGuess('');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket?.emit('send_chat', { roomId, text: chatInput });
    setChatInput('');
  };

  const handleQuickGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    socket?.emit('submit_quick_guess', { roomId: room!.id, guess });
    setGuess('');
  };

  const handleProfileUpdate = () => {
    if (!socket) return;

    // 1. Emit the update to the server with the persistent serial
    socket.emit('update_profile', 
      { 
        playerSerial: playerSerial,
        playerName: playerName, // Fixed: was 'name', server expects 'playerName'
        age: playerAge, 
        avatar: avatar 
      }, 
      ({ topPlayers, name }: { topPlayers: any[], name: string }) => {
        // 2. In the callback, update with the authoritative list from the server
        if (topPlayers) {
          setTopPlayers(topPlayers);
        }
        if (name) {
          setPlayerName(name);
          localStorage.setItem('khamin_player_name', name);
        }
      }
    );

    // Update local storage
    localStorage.setItem('khamin_player_name', playerName);
    localStorage.setItem('khamin_player_avatar', avatar);

    // 3. Close the modal
    setShowSettingsModal(false);
  };

  const handleDeleteAccount = () => {
    socket?.emit('delete_account', { playerSerial }, (response: any) => {
      if (response.success) {
        clearPlayerData();
        setJoined(false);
        setIsSearching(false);
        setRoom(null);
        setShowSettingsModal(false);
        setShowDeleteConfirm(false);
        
        // Ensure state is cleared before showing welcome modal
        setTimeout(() => {
          setShowWelcomeModal(true);
        }, 100);
      } else {
        setError('فشل مسح الحساب. حاول مرة أخرى.');
        setShowDeleteConfirm(false);
      }
    });
  };

  const handleReportPlayer = (reason: string) => {
    if (opponent && socket && room) {
      socket.emit('report_player', { roomId: room.id, reportedPlayerId: opponent.id, reason }, (res: any) => {
        if (res && res.success) {
          setError('تم إرسال بلاغك بنجاح. شكراً لك!');
        } else {
          setError(res?.message || 'لقد قمت بالإبلاغ عن هذا اللاعب بالفعل.');
        }
        setTimeout(() => setError(''), 5000);
      });
      setShowReportModal(false);
    }
  };

  const handleStartGame = () => {
    socket?.emit('start_game_request', { roomId });
  };

  const handleLeaveGame = () => {
    const isGameActive = room?.gameState === 'guessing' || room?.gameState === 'discussion';
    
    // Only show confirmation if the game is active (playing)
    if (isGameActive) {
      if (!window.confirm('هل تريد حقاً مغادرة اللعبة والعودة للرئيسية؟')) {
        return;
      }
    }
    
    socket?.emit('leave_room', { roomId });
    setRoom(null);
    setJoined(false);
    setGuess('');
    setHint(null);
    setChatHistory([]); // Clear chat
    setIsOpponentBlocked(false);
    if (roomId.startsWith('random_')) setRoomId('');
  };

  const useCard = (type: 'quick_guess' | 'hint') => {
    if (cooldowns[type] > 0) return;
    socket?.emit('use_card', { roomId, cardType: type });
    
    // Hint has 150s cooldown (2.5m)
    if (type === 'hint') {
      setCooldowns(prev => ({ ...prev, [type]: 150 }));
    }
  };

  const me = room?.players.find(p => p.id === socket?.id);
  const opponent = room?.players.find(p => p.id !== socket?.id);

  const consensusReached = room?.players.length === 2 && 
                          room.players[0].selectedCategory === room.players[1].selectedCategory &&
                          room.players[0].selectedCategory !== null;

  if (isPermanentBan || (banUntil && banUntil > Date.now())) {
    const isPermanent = isPermanentBan;
    const remainingHours = banUntil ? Math.floor((banUntil - Date.now()) / (1000 * 60 * 60)) : 0;
    const remainingMinutes = banUntil ? Math.floor(((banUntil - Date.now()) % (1000 * 60 * 60)) / (1000 * 60)) : 0;
    
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-900 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-white rounded-[32px] p-8 max-w-md w-full text-center shadow-2xl border-4 ${isPermanent ? 'border-black' : 'border-red-500'}`}
        >
          <div className={`w-24 h-24 ${isPermanent ? 'bg-gray-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {isPermanent ? <Trash2 className="w-12 h-12 text-black" /> : <Lock className="w-12 h-12 text-red-500" />}
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-4">
            {isPermanent ? 'تم حظرك نهائياً' : 'تم حظر حسابك'}
          </h1>
          <p className="text-gray-600 font-bold mb-6 text-lg">
            {isPermanent 
              ? 'لقد تم حظرك من اللعب نهائياً بسبب تكرار المخالفات (5 مرات حظر مؤقت). لا يمكنك اللعب بهذا الحساب مرة أخرى.'
              : 'لقد تلقيت أكثر من 10 إبلاغات من لاعبين آخرين، لذلك تم منعك من اللعب مؤقتاً لمدة 24 ساعة.'}
          </p>
          
          {!isPermanent ? (
            <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-100">
              <p className="text-red-600 font-black text-sm mb-2">الوقت المتبقي لفك الحظر:</p>
              <div className="text-4xl font-black text-red-500 font-mono" dir="ltr">
                {remainingHours}h {remainingMinutes}m
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-100">
                <p className="text-gray-600 font-black text-sm">
                  يمكنك مسح هذا الحساب والبدء من جديد بحساب جديد تماماً.
                </p>
              </div>
              <button 
                onClick={() => {
                  const serial = localStorage.getItem('khamin_player_serial');
                  if (serial && socket) {
                    socket.emit('delete_account', { playerSerial: serial }, (res: any) => {
                      if (res.success) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    });
                  }
                }}
                className="w-full btn-game bg-black text-white py-4 text-xl flex items-center justify-center gap-3 hover:bg-gray-800 transition-all"
              >
                <Trash2 className="w-6 h-6" />
                مسح الحساب والبدء من جديد
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (!joined) {
    return (
      <>
        <div className="min-h-screen w-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8"
        >
          {/* Top Header */}
          <div className="flex justify-between items-start mb-6 md:mb-10">
            {/* Right: Logo & Name */}
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-4 py-2 md:py-3 rounded-full shadow-md border-2 border-white/50">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] rounded-xl flex items-center justify-center shadow-md transform rotate-3">
                <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-lg md:text-xl font-black text-[#FF6B6B] drop-shadow-sm leading-none">خمن تخمينة</h1>
              </div>
            </div>

            {/* Left: RPG Style Avatar & Level Bar */}
            <div className="flex items-center gap-3 md:gap-4 bg-white/90 backdrop-blur-sm p-2 md:p-3 pr-4 md:pr-6 rounded-full shadow-md border-2 border-white/50 flex-row-reverse">
              <div className="relative shrink-0">
                {renderStars(getLevel(xp))}
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl border-4 overflow-hidden ${getAvatarStyle(getLevel(xp))}`}>
                  {renderAvatarContent(avatar)}
                </div>
              </div>
              <div className="flex flex-col justify-center min-w-[100px] md:min-w-[140px]">
                <div className="text-xs md:text-sm font-black text-[#2D3436] mb-1 truncate text-right">{playerName || 'لاعب جديد'}</div>
                <div className="flex justify-between items-center mb-1 md:mb-2 flex-row-reverse">
                  <span className="text-[10px] md:text-xs font-black text-gray-600">Level {getLevel(xp)}</span>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSettingsModal(true); }} 
                      className="text-gray-400 hover:text-purple-500 transition-colors relative z-[100] cursor-pointer p-1 -m-1"
                    >
                      <Settings className="w-4 md:w-5 h-4 md:h-5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLevelInfo(true); }} 
                      className="text-gray-400 hover:text-[#FF6B6B] transition-colors relative z-[100] cursor-pointer p-1 -m-1"
                    >
                      <Info className="w-4 md:w-5 h-4 md:h-5" />
                    </button>
                  </div>
                </div>
                {/* Level Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 shadow-inner overflow-hidden mb-1 md:mb-2" dir="ltr">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (getLevel(xp) / 50) * 100)}%` }}
                  ></div>
                </div>
                {/* XP Bar */}
                <div className="w-full bg-gray-100 rounded-full h-4 md:h-5 shadow-inner overflow-hidden relative border border-gray-200" dir="ltr">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-full transition-all duration-500" 
                    style={{ width: `${(xp / getXpForNextLevel(getLevel(xp))) * 100}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] md:text-[10px] font-black text-orange-900 drop-shadow-sm">
                      {xp} / {getXpForNextLevel(getLevel(xp))} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-game p-6 md:p-10">

          <div className="space-y-4 md:space-y-10">
            {/* Top Players Section */}
            <div className="flex flex-col gap-4">
              {/* Header Box */}
              <div className="px-2">
                <div className="flex items-center justify-between flex-row-reverse">
                  <h2 className="text-lg md:text-xl font-black text-[#2D3436] flex items-center gap-2">
                    أبطال التخمين
                  </h2>
                  <span className="text-xs md:text-sm font-bold text-orange-500">المتصدرون حالياً</span>
                </div>
              </div>

              {/* Separator */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-gray-200 dashed"></div></div>
              </div>

              {/* Podium Box */}
              <div className="bg-gray-50/30 rounded-[40px] border-2 border-gray-100/50 p-4 md:p-6 pt-12 md:pt-16 mt-8 md:mt-12">
                <div className="flex items-end justify-center gap-2 md:gap-4">
                  {/* Rank 2 */}
                  {topPlayers[1] && (
                    <div key={`${topPlayers[1].serial || 'unknown'}-rank-2`} className="flex flex-col items-center flex-1 z-10">
                      <div className="relative mb-2 flex flex-col items-center">
                        {renderStars(topPlayers[1].level)}
                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl border-4 bg-white ${getAvatarStyle(topPlayers[1].level)}`}>
                          {renderAvatarContent(topPlayers[1].avatar)}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-gray-200 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-sm z-20">2</div>
                      </div>
                      <div className="text-[10px] md:text-xs font-black text-[#2D3436] truncate w-full text-center max-w-[80px] md:max-w-[100px]">{topPlayers[1].name}</div>
                      <div className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1 mb-1">
                        Lvl {topPlayers[1].level}
                      </div>
                      <div className="w-full bg-gray-200 h-16 md:h-20 rounded-t-xl mt-1 shadow-inner border-t-4 border-gray-300"></div>
                    </div>
                  )}

                  {/* Rank 1 */}
                  {topPlayers[0] && (
                    <div key={`${topPlayers[0].serial || 'unknown'}-rank-1`} className="flex flex-col items-center flex-1 z-20 -mt-8 md:-mt-12">
                      <div className="relative mb-2 flex flex-col items-center scale-110 md:scale-125">
                        <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 drop-shadow-md z-30" />
                        {renderStars(topPlayers[0].level)}
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl border-4 bg-white ${getAvatarStyle(topPlayers[0].level)}`}>
                          {renderAvatarContent(topPlayers[0].avatar)}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow-md z-30 animate-bounce">1</div>
                      </div>
                      <div className="text-xs md:text-sm font-black text-[#2D3436] truncate w-full text-center mt-2 max-w-[90px] md:max-w-[120px]">{topPlayers[0].name}</div>
                      <div className="text-[10px] font-bold text-gray-500 bg-yellow-100 px-3 py-1 rounded-full mt-1 mb-1">
                        Lvl {topPlayers[0].level}
                      </div>
                      <div className="w-full bg-gradient-to-b from-yellow-100 to-yellow-50 h-24 md:h-32 rounded-t-xl mt-1 shadow-inner border-t-4 border-yellow-300"></div>
                    </div>
                  )}

                  {/* Rank 3 */}
                  {topPlayers[2] && (
                    <div key={`${topPlayers[2].serial || 'unknown'}-rank-3`} className="flex flex-col items-center flex-1 z-10">
                      <div className="relative mb-2 flex flex-col items-center">
                        {renderStars(topPlayers[2].level)}
                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl border-4 bg-white ${getAvatarStyle(topPlayers[2].level)}`}>
                          {renderAvatarContent(topPlayers[2].avatar)}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-orange-200 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-sm z-20">3</div>
                      </div>
                      <div className="text-[10px] md:text-xs font-black text-[#2D3436] truncate w-full text-center max-w-[80px] md:max-w-[100px]">{topPlayers[2].name}</div>
                      <div className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1 mb-1">
                        Lvl {topPlayers[2].level}
                      </div>
                      <div className="w-full bg-gray-200 h-12 md:h-16 rounded-t-xl mt-1 shadow-inner border-t-4 border-gray-300"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 md:pt-6 border-t-2 border-gray-100 space-y-3 md:space-y-4">
              <div>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-100 border-2 border-red-200 p-2 md:p-4 mb-2 md:mb-4 text-red-600 text-xs md:text-sm font-black rounded-2xl text-center shadow-sm"
                  >
                    {error}
                  </motion.div>
                )}
                <label className="block text-base md:text-lg font-black text-[#2D3436] mb-1 md:mb-2 px-1">دخول بكود غرفة</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="كود الغرفة..."
                    className="input-game flex-1 py-2 md:py-4"
                    maxLength={6}
                  />
                  <button 
                    onClick={handleJoin}
                    className="btn-game btn-secondary px-4 md:px-6 py-2 md:py-3 text-base md:text-lg"
                  >
                    دخول
                  </button>
                </div>
              </div>

              <div className="relative py-1 md:py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-gray-200 dashed"></div></div>
                <div className="relative flex justify-center text-[10px] md:text-xs uppercase"><span className="bg-white px-3 text-gray-400 font-black">أو</span></div>
              </div>

              <button 
                onClick={handleRandomMatch}
                className="w-full btn-game btn-primary py-3 md:py-4 text-lg md:text-xl gap-2 md:gap-3"
              >
                <Users className="w-5 h-5 md:w-6 md:h-6" />
                بحث عن منافس عشوائي
              </button>

              {deferredPrompt && (
                <button 
                  onClick={() => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult: any) => {
                      if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                      } else {
                        console.log('User dismissed the install prompt');
                      }
                      setDeferredPrompt(null);
                    });
                  }}
                  className="w-full btn-game py-4 text-xl gap-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 shadow-lg shadow-green-200"
                >
                  <Download className="w-6 h-6" />
                  تحميل اللعبة
                </button>
              )}
            </div>
          </div>
          </div>

          {/* Level Info Modal */}
          <AnimatePresence>
            {showLevelInfo && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
                onClick={() => setShowLevelInfo(false)}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="card-game p-8 max-w-md w-full relative overflow-hidden text-right"
                  onClick={e => e.stopPropagation()}
                >
                  <button 
                    onClick={() => setShowLevelInfo(false)}
                    className="absolute top-4 left-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-orange-500 fill-orange-500" />
                    </div>
                    <h2 className="text-2xl font-black text-[#2D3436]">نظام المستويات (Levels)</h2>
                  </div>
                  
                  <div className="space-y-4 text-gray-600 font-bold max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <p>كلما فزت في مباريات أكثر، كلما حصلت على XP وارتفع مستواك!</p>
                    
                    <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-100">
                      <h3 className="text-lg font-black text-orange-600 mb-2 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        ميزة التخمين السريع
                      </h3>
                      <p className="text-sm leading-relaxed">
                        ميزة التخمين السريع تتيح لك محاولة تخمين الصورة قبل انتهاء الوقت.
                        كلما ارتفع مستواك، كلما تم تفعيل هذه الميزة بشكل أسرع في المباراة (يقل وقت الانتظار بمقدار 3 ثوانٍ لكل مستوى، مما يمنحك أفضلية!).
                      </p>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li className="flex justify-between items-center bg-white p-2 rounded-lg">
                          <span>المستوى 1</span>
                          <span className="text-orange-500">بعد 2:30 دقيقة (150 ثانية)</span>
                        </li>
                        <li className="flex justify-between items-center bg-white p-2 rounded-lg">
                          <span>المستوى 25</span>
                          <span className="text-orange-500">بعد 1:18 دقيقة (78 ثانية)</span>
                        </li>
                        <li className="flex justify-between items-center bg-white p-2 rounded-lg">
                          <span>المستوى 50 (الحد الأقصى)</span>
                          <span className="text-orange-500 font-black">بعد 0:03 ثوانٍ (تقريباً من البداية!)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
                      <h3 className="text-lg font-black text-blue-600 mb-2 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        جوائز المستويات
                      </h3>
                      <p className="text-sm leading-relaxed mb-3">
                        احصل على إطارات مميزة ونجوم ذهبية تزين صورتك الشخصية كلما تقدمت في المستويات!
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-3 bg-white p-2 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.5)] flex items-center justify-center relative">
                            <div className="absolute -top-2 flex"><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /></div>
                            <span className="text-xs">🦁</span>
                          </div>
                          <span className="flex-1">المستوى 10</span>
                          <span className="text-blue-500">إطار فضي + نجمة</span>
                        </li>
                        <li className="flex items-center gap-3 bg-white p-2 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-yellow-50 border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] flex items-center justify-center relative">
                            <div className="absolute -top-2 flex gap-0.5"><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /></div>
                            <span className="text-xs">🦁</span>
                          </div>
                          <span className="flex-1">المستوى 20</span>
                          <span className="text-blue-500">إطار ذهبي + نجمتين</span>
                        </li>
                        <li className="flex items-center gap-3 bg-white p-2 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)] flex items-center justify-center relative">
                            <div className="absolute -top-2 flex gap-0.5"><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /></div>
                            <span className="text-xs">🦁</span>
                          </div>
                          <span className="flex-1">المستوى 30</span>
                          <span className="text-blue-500">إطار زمردي + 3 نجوم</span>
                        </li>
                        <li className="flex items-center gap-3 bg-white p-2 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-purple-50 border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] flex items-center justify-center relative">
                            <div className="absolute -top-2 flex gap-0.5"><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /></div>
                            <span className="text-xs">🦁</span>
                          </div>
                          <span className="flex-1">المستوى 40</span>
                          <span className="text-blue-500">إطار أسطوري + 4 نجوم</span>
                        </li>
                        <li className="flex items-center gap-3 bg-white p-2 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-red-50 border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)] flex items-center justify-center relative">
                            <div className="absolute -top-2 flex gap-0.5"><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /></div>
                            <span className="text-xs">🦁</span>
                          </div>
                          <span className="flex-1">المستوى 50</span>
                          <span className="text-blue-500 font-black">إطار ناري + 5 نجوم!</span>
                        </li>
                      </ul>
                    </div>
                    
                    <p className="text-sm text-center text-gray-400 mt-4">استمر في اللعب لتصل إلى أعلى مستوى وتتفوق على أصدقائك!</p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {showCropper && imageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[6000] flex flex-col items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md aspect-square bg-black rounded-3xl overflow-hidden mb-8 shadow-2xl border-4 border-white/20">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="w-full max-w-md space-y-6">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <label className="block text-white text-center text-sm font-black mb-3">تكبير / تصغير</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCropSave}
                  className="flex-1 btn-game btn-success py-4 text-xl flex items-center justify-center gap-2"
                >
                  <Check className="w-6 h-6" />
                  حفظ الصورة
                </button>
                <button
                  onClick={() => { setShowCropper(false); setImageSrc(null); }}
                  className="flex-1 btn-game bg-white/10 border-white/20 text-white hover:bg-white/20 py-4 text-xl"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="card-game p-4 md:p-8 w-full max-w-md space-y-4 md:space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                  <Brain className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#2D3436]">أهلاً بك في خمن تخمينة!</h2>
                <p className="text-gray-500 font-bold text-sm md:text-base">يرجى إكمال بياناتك للبدء</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-600 mb-1 text-right">اسم اللاعب</label>
                  <input 
                    type="text" 
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="ادخل اسمك..."
                    className="input-game"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-600 mb-1 text-right">عمر اللاعب</label>
                  <input 
                    type="number" 
                    value={playerAge}
                    onChange={(e) => setPlayerAge(parseInt(e.target.value) || '')}
                    placeholder="ادخل عمرك..."
                    className="input-game"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-600 mb-3 text-right">اختر أفاتار البداية</label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATARS.slice(0, 4).map((av, index) => (
                      <button
                        key={`welcome-avatar-${av.emoji}-${index}`}
                        onClick={() => setAvatar(av.emoji)}
                        className={`w-full aspect-square rounded-xl flex items-center justify-center text-2xl border-2 transition-all ${avatar === av.emoji ? 'bg-orange-100 border-orange-400 scale-105' : 'bg-gray-50 border-gray-200'}`}
                      >
                        {av.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleRegister}
                className="w-full btn-game btn-primary py-4 text-xl"
              >
                حفظ البيانات والبدء
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings / Profile Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="card-game p-8 w-full max-w-md space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center flex-row-reverse">
                <h2 className="text-2xl font-black text-[#2D3436]">ملف اللاعب</h2>
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-6">
                {/* Stats Section */}
                <div className="bg-gray-100 p-4 rounded-2xl border-2 border-gray-200 space-y-4">
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="relative">
                      {renderStars(getLevel(xp))}
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-4 overflow-hidden ${getAvatarStyle(getLevel(xp))}`}>
                        {renderAvatarContent(avatar)}
                      </div>
                    </div>
                    <div className="text-right flex-1">
                      <div className="font-black text-lg text-[#2D3436]">{playerName}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 flex-row-reverse">
                        <span className="text-xs font-black text-gray-600">Level {getLevel(xp)}</span>
                        <span className="text-[10px] font-bold text-gray-400">{xp} / {getXpForNextLevel(getLevel(xp))} XP</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden" dir="ltr">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (getLevel(xp) / 50) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    {renderStars(getLevel(xp), 'linear')}
                  </div>
                </div>

                {/* Edit Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-1 text-right">الاسم</label>
                    <input 
                      type="text" 
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="input-game"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-1 text-right">العمر</label>
                    <input 
                      type="number" 
                      value={playerAge}
                      onChange={(e) => setPlayerAge(parseInt(e.target.value) || '')}
                      className="input-game"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-3 text-right">تغيير الأفاتار</label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATARS.map((av, index) => {
                        const isLocked = getLevel(xp) < av.level;
                        return (
                          <button
                            key={`settings-avatar-${av.emoji}-${index}`}
                            onClick={() => !isLocked && setAvatar(av.emoji)}
                            disabled={isLocked}
                            className={`relative aspect-square rounded-xl flex items-center justify-center text-2xl border-2 transition-all ${avatar === av.emoji ? 'bg-orange-100 border-orange-400 scale-105' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'} ${isLocked ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                          >
                            {av.emoji}
                            {isLocked && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
                                <Lock className="w-4 h-4 text-white" />
                                <span className="text-[9px] font-bold text-white mt-1">Lvl {av.level}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Avatar in Settings */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2 flex-row-reverse">
                      <span className="text-xs font-black text-gray-500">أفاتار مخصص</span>
                      <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs font-black">
                        <Star className="w-3.5 h-3.5 fill-purple-600" />
                        Level 50
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <label className={`relative flex-1 flex flex-col items-center justify-center p-2 rounded-xl border-2 border-dashed transition-all cursor-pointer ${getLevel(xp) >= 50 ? 'border-purple-400 bg-purple-100 hover:bg-purple-200' : 'border-gray-300 bg-gray-100 cursor-not-allowed'}`}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          disabled={getLevel(xp) < 50}
                          onChange={handleFileChange}
                        />
                        {getLevel(xp) >= 50 ? (
                          <>
                            <Upload className="w-4 h-4 text-purple-500" />
                            <span className="text-[10px] font-black text-purple-600">تحميل</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 text-gray-500 mb-1" />
                            <span className="text-[10px] font-black text-gray-500">مغلق</span>
                          </>
                        )}
                      </label>
                      {customAvatar && (
                        <button
                          onClick={() => setAvatar(customAvatar)}
                          className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 ${avatar === customAvatar ? 'border-purple-500' : 'border-gray-200'}`}
                        >
                          <img src={customAvatar} className="w-full h-full object-cover" alt="Custom" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-black text-gray-600 text-right">الإنجازات</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`p-2 rounded-xl border flex flex-col items-center transition-all ${wins > 0 ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100 opacity-40'}`}>
                      <Trophy className={`w-5 h-5 ${wins > 0 ? 'text-orange-400' : 'text-gray-400'}`} />
                      <span className={`text-[8px] font-black mt-1 ${wins > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                        {wins} فوز
                      </span>
                    </div>
                    <div className={`p-2 rounded-xl border flex flex-col items-center transition-all ${streak >= 5 ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100 opacity-40'}`}>
                      <Zap className={`w-5 h-5 ${streak >= 5 ? 'text-blue-400' : 'text-gray-400'}`} />
                      <span className={`text-[8px] font-black mt-1 ${streak >= 5 ? 'text-blue-600' : 'text-gray-600'}`}>سلسلة {streak}</span>
                    </div>
                    <div className={`p-2 rounded-xl border flex flex-col items-center transition-all ${getLevel(xp) >= 10 ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100 opacity-40'}`}>
                      <Star className={`w-5 h-5 ${getLevel(xp) >= 10 ? 'text-purple-400' : 'text-gray-400'}`} />
                      <span className={`text-[8px] font-black mt-1 ${getLevel(xp) >= 10 ? 'text-purple-600' : 'text-gray-600'}`}>مستوى {getLevel(xp)}</span>
                    </div>
                  </div>
                </div>

                {/* Reports Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <label className="text-sm font-black text-gray-600">حالة الحساب</label>
                    <span className="text-[10px] font-black text-gray-400">10 إبلاغات = حظر 24 ساعة</span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100">
                    <div className="flex items-center justify-between mb-2 flex-row-reverse">
                      <div className="flex items-center gap-2">
                        <Flag className={`w-4 h-4 ${reports > 0 ? 'text-red-500' : 'text-gray-400'}`} fill={reports > 0 ? "currentColor" : "none"} />
                        <span className="text-xs font-black text-gray-700">عدد الإبلاغات: {reports}</span>
                      </div>
                      <span className="text-[10px] font-black text-red-500">
                        متبقي {Math.max(0, 10 - reports)} للحظر
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(reports / 10) * 100}%` }}
                        className={`h-full ${reports >= 7 ? 'bg-red-500' : reports >= 4 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleProfileUpdate}
                className="w-full btn-game btn-primary py-3 text-lg"
              >
                حفظ التعديلات
              </button>

              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-sm font-black text-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح الحساب نهائياً
                </button>
              </div>

              {/* Admin Access Button */}
              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={isAdmin ? () => { setShowAdminDashboard(true); setShowSettingsModal(false); } : handleAdminLogin}
                  className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all ${isAdmin ? 'bg-purple-100 text-purple-600 border-2 border-purple-200' : 'bg-gray-50 text-gray-400 border-2 border-gray-100 hover:bg-gray-100'}`}
                >
                  <Shield className="w-4 h-4" />
                  {isAdmin ? 'فتح لوحة الإدارة' : 'دخول الإدارة (للمديرين فقط)'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Admin Dashboard Modal */}
        <AnimatePresence>
          {showAdminDashboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[6000] flex items-center justify-center p-4 overflow-hidden"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[40px] w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border-4 border-purple-100"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">لوحة تحكم المدير</h2>
                      <p className="text-xs font-bold text-purple-600">إدارة اللاعبين والبلاغات</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        socket?.emit('admin_get_players', (players: any) => setAdminPlayers(players));
                        socket?.emit('admin_get_reports', (reports: any) => setAdminReports(reports));
                      }}
                      className="p-3 bg-white rounded-xl border-2 border-gray-100 text-gray-400 hover:text-purple-600 hover:border-purple-100 transition-all"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setShowAdminDashboard(false)}
                      className="p-3 bg-white rounded-xl border-2 border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                  {/* Sidebar - Reports */}
                  <div className="w-80 border-l border-gray-100 bg-gray-50/30 overflow-y-auto p-4 space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider flex items-center gap-2 px-2">
                      <AlertTriangle className="w-4 h-4" />
                      آخر البلاغات
                    </h3>
                    <div className="space-y-3">
                      {adminReports.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 font-bold text-sm">لا توجد بلاغات حالياً</div>
                      ) : (
                        adminReports.map((report, index) => (
                          <div key={`admin-report-${report.id}-${index}`} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-black text-gray-400">{new Date(report.timestamp).toLocaleString('ar-EG')}</span>
                              <div className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-black">بلاغ</div>
                            </div>
                            <div className="text-xs font-bold text-gray-700">
                              <span className="text-purple-600">{report.reporterName}</span> أبلغ عن <span className="text-red-500">{report.reportedName}</span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg text-[10px] text-gray-500 font-medium italic">
                              "{report.reason}"
                            </div>
                            <button 
                              onClick={() => setAdminSearchQuery(report.reportedSerial)}
                              className="w-full py-1.5 bg-gray-100 hover:bg-purple-100 hover:text-purple-600 rounded-lg text-[10px] font-black transition-colors"
                            >
                              فحص اللاعب
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Main Area - Players Management */}
                  <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {/* Search Bar */}
                    <div className="p-6 border-b border-gray-50">
                      <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type="text"
                          placeholder="ابحث عن لاعب بالاسم أو الرقم التسلسلي..."
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                          className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-purple-400 focus:bg-white transition-all font-bold"
                        />
                      </div>
                    </div>

                    {/* Players List */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {adminPlayers
                          .filter(p => p.name.includes(adminSearchQuery) || p.serial.includes(adminSearchQuery))
                          .map((p, index) => (
                            <div key={`admin-player-${p.serial}-${index}`} className="bg-white border-2 border-gray-100 rounded-3xl p-5 hover:border-purple-200 transition-all group">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl border-2 border-white shadow-sm overflow-hidden">
                                  {p.avatar.startsWith('data:') ? <img src={p.avatar} className="w-full h-full object-cover" /> : p.avatar}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-black text-gray-900">{p.name}</h4>
                                    {p.isAdmin && <Shield className="w-3 h-3 text-purple-500" />}
                                  </div>
                                  <div className="text-[10px] font-bold text-gray-400">ID: {p.serial}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-black text-purple-600">Lvl {getLevel(p.xp)}</div>
                                  <div className="text-[10px] font-bold text-gray-400">{p.xp} XP</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 p-2 rounded-xl text-center">
                                  <div className="text-[10px] font-bold text-gray-400">الفوز</div>
                                  <div className="text-sm font-black text-gray-700">{p.wins || 0}</div>
                                </div>
                                <div className="bg-red-50 p-2 rounded-xl text-center">
                                  <div className="text-[10px] font-bold text-red-400">البلاغات</div>
                                  <div className="text-sm font-black text-red-600">{p.reports || 0}</div>
                                </div>
                              </div>

                              <div className="mt-4 flex gap-2">
                                <button 
                                  onClick={() => {
                                    const newXP = prompt('ادخل الـ XP الجديد:', p.xp.toString());
                                    if (newXP !== null) {
                                      socket?.emit('admin_update_player', { serial: p.serial, updates: { xp: parseInt(newXP) } }, (res: any) => {
                                        if (res.success) socket.emit('admin_get_players', (players: any) => setAdminPlayers(players));
                                      });
                                    }
                                  }}
                                  className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black hover:bg-purple-600 hover:text-white transition-all"
                                >
                                  تعديل XP
                                </button>
                                <button 
                                  onClick={() => {
                                    if (window.confirm('هل أنت متأكد من حظر هذا اللاعب لمدة 24 ساعة؟')) {
                                      const banUntil = Date.now() + (24 * 60 * 60 * 1000);
                                      socket?.emit('admin_update_player', { serial: p.serial, updates: { banUntil, reports: 0 } }, (res: any) => {
                                        if (res.success) socket.emit('admin_get_players', (players: any) => setAdminPlayers(players));
                                      });
                                    }
                                  }}
                                  className="flex-1 py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black hover:bg-orange-600 hover:text-white transition-all"
                                >
                                  حظر 24س
                                </button>
                                <button 
                                  onClick={() => {
                                    if (window.confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟')) {
                                      socket?.emit('admin_delete_player', p.serial, (res: any) => {
                                        if (res.success) socket.emit('admin_get_players', (players: any) => setAdminPlayers(players));
                                      });
                                    }
                                  }}
                                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border-4 border-red-100 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900">هل أنت متأكد؟</h3>
                  <p className="text-gray-500 font-bold leading-relaxed">
                    سيتم مسح جميع بياناتك، مستواك، ومرات فوزك نهائياً من النظام. لا يمكن التراجع عن هذا الإجراء.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleDeleteAccount}
                    className="w-full btn-game btn-danger py-4 text-xl"
                  >
                    نعم، امسح حسابي
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full btn-game btn-secondary py-3 text-lg bg-gray-100 border-gray-200 text-gray-600"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>

      {/* Floating Controls (Bottom Right) */}
      <div className="fixed bottom-2 right-2 md:bottom-6 md:right-6 flex flex-col gap-2 md:gap-3 z-[300]">
        {/* Exit Button - Always shown */}
        <button 
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.error(err));
            } else {
              window.close();
            }
          }}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.1)] border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all"
          title="خروج"
        >
          <LogOut className="w-7 h-7 md:w-8 md:h-8" />
        </button>
      </div>
      </>
    );
  }

  if (isSearching) {
    return (
      <>
      <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md card-game p-6 md:p-12 text-center space-y-4 md:space-y-8 relative overflow-hidden">
          {proposedMatch ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 md:space-y-6"
            >
              <h2 className="text-2xl md:text-3xl font-black text-[#2D3436]">تم العثور على منافس!</h2>
              <div className="flex flex-col items-center p-4 md:p-6 bg-orange-50 rounded-3xl border-4 border-orange-100 relative">
                <div className="relative mb-2 md:mb-4">
                  {proposedMatch.opponent.level && renderStars(proposedMatch.opponent.level)}
                  <div className={`text-6xl md:text-8xl drop-shadow-md animate-bounce w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center border-4 overflow-hidden ${proposedMatch.opponent.level ? getAvatarStyle(proposedMatch.opponent.level) : 'bg-orange-100 border-orange-300'}`}>
                    {renderAvatarContent(proposedMatch.opponent.avatar)}
                  </div>
                  {proposedMatch.opponent.level && (
                    <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-[#FF6B6B] text-white text-[10px] md:text-sm font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full border-2 border-white shadow-sm whitespace-nowrap">
                      Lvl {proposedMatch.opponent.level}
                    </div>
                  )}
                </div>
                <div className="font-black text-2xl md:text-3xl text-[#2D3436] mt-1 md:mt-2">{proposedMatch.opponent.name}</div>
                <div className="text-base md:text-lg font-bold text-gray-500">({proposedMatch.opponent.age} سنة)</div>
              </div>
              <div className="flex flex-col gap-2 md:gap-3">
                {!hasResponded ? (
                  <>
                    <div className="text-xl md:text-2xl font-black text-orange-500 mb-2 md:mb-4 font-mono">
                      {matchResponseTimeLeft}s
                    </div>
                    <button 
                      onClick={() => { setHasResponded(true); socket?.emit('respond_to_match', { matchId: proposedMatch.matchId, response: 'accept' }); }}
                      className="w-full btn-game btn-success py-3 md:py-4 text-lg md:text-xl mb-1 md:mb-3"
                    >
                      قبول
                    </button>
                    <div className="flex gap-2 md:gap-3 mb-2 md:mb-4">
                      <button 
                        onClick={() => { setHasResponded(true); socket?.emit('respond_to_match', { matchId: proposedMatch.matchId, response: 'reject' }); }}
                        className="flex-1 btn-game btn-secondary bg-gray-200 border-gray-300 text-gray-600 hover:bg-gray-300 py-2 md:py-3"
                      >
                        رفض
                      </button>
                      <button 
                        onClick={() => { setHasResponded(true); socket?.emit('respond_to_match', { matchId: proposedMatch.matchId, response: 'block' }); }}
                        className="flex-1 btn-game btn-danger py-2 md:py-3 text-xs md:text-sm flex items-center justify-center gap-1"
                      >
                        <Ban className="w-4 h-4" />
                        حظر
                      </button>
                    </div>
                    <button 
                      onClick={() => { 
                        setHasResponded(true); 
                        socket?.emit('respond_to_match', { matchId: proposedMatch.matchId, response: 'reject' }); 
                        setProposedMatch(null);
                        setIsSearching(false);
                        setJoined(false);
                      }}
                      className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
                    >
                      إلغاء والعودة للرئيسية
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="text-2xl font-black text-orange-500 font-mono">
                      {matchResponseTimeLeft}s
                    </div>
                    <p className="text-lg font-black text-orange-500 animate-pulse bg-orange-100 py-4 rounded-2xl border-2 border-orange-200">في انتظار رد المنافس...</p>
                    <button 
                      onClick={() => { 
                        setHasResponded(true); 
                        socket?.emit('respond_to_match', { matchId: proposedMatch.matchId, response: 'reject' }); 
                        setProposedMatch(null);
                        setIsSearching(false);
                        setJoined(false);
                      }}
                      className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
                    >
                      إلغاء والعودة للرئيسية
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              <div className="relative inline-block">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-orange-100 rounded-full flex items-center justify-center animate-bounce border-4 border-orange-200">
                  <Users className="w-12 h-12 md:w-16 md:h-16 text-orange-500" />
                </div>
                <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 bg-green-400 rounded-full border-4 border-white animate-ping"></div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <h2 className="text-2xl md:text-4xl font-black text-[#2D3436]">جاري البحث...</h2>
                <p className="text-sm md:text-lg font-bold text-gray-500">نبحث لك عن منافس قوي الآن</p>
                <div className="text-4xl md:text-6xl font-black text-orange-500 font-mono tracking-widest drop-shadow-sm">{searchTimeLeft}s</div>
                <div className="text-[10px] md:text-sm font-black text-gray-500 mt-2 md:mt-4 bg-gray-100 inline-block px-4 md:px-6 py-1 md:py-2 rounded-full border-2 border-gray-200">المتواجدون الآن: {onlineCount}</div>
              </div>
              <button 
                onClick={() => { setJoined(false); setIsSearching(false); setProposedMatch(null); setHasResponded(false); socket?.emit('leave_matchmaking'); }}
                className="text-base md:text-lg font-black text-gray-400 hover:text-red-500 transition-colors border-b-2 border-transparent hover:border-red-500"
              >
                إلغاء البحث
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating Controls (Bottom Right) */}
      <div className="fixed bottom-2 right-2 md:bottom-6 md:right-6 flex flex-col gap-2 md:gap-3 z-[300]">
        {/* Exit Button - Always shown */}
        <button 
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.error(err));
            } else {
              window.close();
            }
          }}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.1)] border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all"
          title="خروج"
        >
          <LogOut className="w-7 h-7 md:w-8 md:h-8" />
        </button>
      </div>
      </>
    );
  }

  if (!room) return <div className="min-h-screen w-full flex items-center justify-center text-[#2D3436] font-black text-2xl animate-pulse">جاري التحميل... 🚀</div>;

  return (
    <div className="min-h-screen w-full font-sans flex flex-col relative overflow-y-auto">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md p-4 flex justify-between items-center z-50 sticky top-0 shadow-sm border-b-4 border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] rounded-lg flex items-center justify-center shadow-sm transform rotate-3">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="font-black text-xl text-[#FF6B6B] tracking-tight drop-shadow-sm">خمن تخمينة</div>
        </div>
        
        <div className="flex items-center gap-4">
          {room.gameState !== 'waiting' && (
            <div className={`flex items-center justify-center min-w-[90px] gap-2 px-4 py-2 rounded-full text-lg font-black transition-colors border-2 ${room.isFrozen ? 'bg-cyan-100 text-cyan-600 border-cyan-200 animate-pulse' : room.timer <= 10 && room.gameState === 'guessing' ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {room.isFrozen ? <Snowflake className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
              {room.isFrozen ? (
                <span>{room.freezeTimer}s</span>
              ) : (
                <span>{Math.max(0, Math.floor(room.timer / 60))}:{(Math.max(0, room.timer % 60)).toString().padStart(2, '0')}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-black border-2 border-blue-200">
            <Users className="w-4 h-4" />
            <span>{room.players.length}/2</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-between py-2 px-2 max-w-md mx-auto w-full">
        {/* Opponent (Top) */}
        <div className="relative flex flex-col items-center w-full">
          {opponent && (
            <>
              <div className="relative">
                {opponent.xp !== undefined && renderStars(getLevel(opponent.xp))}
                <div className={`relative w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl md:text-5xl border-4 transition-transform ${opponent.xp !== undefined ? getAvatarStyle(getLevel(opponent.xp)) : 'bg-white border-white shadow-[0_4px_0_rgba(0,0,0,0.1)]'} ${funnyFilter === opponent.id ? 'animate-shake' : ''}`}>
                  {renderAvatarContent(opponent.avatar)}
                  {showHammer === opponent.id && (
                    <motion.div 
                      initial={{ rotate: -45, y: -60, x: -20, opacity: 0 }}
                      animate={{ rotate: 45, y: -30, x: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                      <Hammer className="w-20 h-20 text-[#2D3436] fill-[#FF9F43] drop-shadow-lg" />
                    </motion.div>
                  )}
                </div>
                {opponent.xp !== undefined && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FF6B6B] text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm whitespace-nowrap z-10">
                    Lvl {getLevel(opponent.xp)}
                  </div>
                )}
                <AnimatePresence>
                  {bubbles.filter(b => b.senderId === opponent.id).map(bubble => (
                    <motion.div
                      key={`opponent-bubble-${bubble.id}`}
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      className="absolute -right-12 -top-4 bg-white px-3 py-2 rounded-2xl rounded-bl-none shadow-lg border-2 border-gray-100 text-2xl z-50 pointer-events-none"
                    >
                      {bubble.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="mt-3 font-black text-base flex items-center gap-2 text-[#2D3436] bg-white/80 px-4 py-1 rounded-full shadow-sm backdrop-blur-sm">
                {opponent.name}
                <button 
                  onClick={() => setShowReportModal(true)}
                  className={`${opponent.reports && opponent.reports > 0 ? 'text-red-500' : 'text-gray-400'} hover:bg-red-50 p-1.5 rounded-full transition-all`}
                  title={opponent.reports && opponent.reports > 0 ? `هذا اللاعب لديه ${opponent.reports} إبلاغات` : "الإبلاغ عن هذا اللاعب"}
                >
                  <Flag 
                    className={`w-4 h-4 ${opponent.reports && opponent.reports > 0 ? 'animate-pulse' : ''}`} 
                    fill={opponent.reports && opponent.reports > 0 ? "currentColor" : "none"}
                  />
                </button>
                <button 
                  onClick={() => {
                    const newBlockedState = !isOpponentBlocked;
                    setIsOpponentBlocked(newBlockedState);
                    socket?.emit('toggle_mute_opponent', { roomId, isMuted: newBlockedState });
                  }}
                  className={`${isOpponentBlocked ? 'text-red-500 bg-red-100' : 'text-gray-400 hover:bg-gray-100'} p-1.5 rounded-full transition-all`}
                  title={isOpponentBlocked ? "إلغاء الحظر" : "حظر اللاعب (كتم الصوت والدردشة)"}
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
              {opponent.age && <div className="text-xs text-gray-500 font-bold mt-1">({opponent.age} سنة)</div>}
            </>
          )}
        </div>

        {/* Center Content: Image or Waiting UI */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl relative my-2 min-h-0 overflow-hidden">
          {room.gameState === 'waiting' ? (
            <div className="w-full card-game p-4 md:p-8 text-center space-y-4 md:space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <div 
                  className="h-full bg-orange-500 transition-all duration-1000" 
                  style={{ width: `${(room.timer / 60) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-orange-500">بانتظار المنافس...</h2>
                <div className={`text-xl font-black font-mono px-3 py-1 rounded-lg ${room.isFrozen ? 'text-cyan-500 bg-cyan-50 animate-pulse' : 'text-red-500 bg-gray-100'}`}>
                  {room.isFrozen ? (
                    <div className="flex items-center gap-1">
                      <Snowflake className="w-4 h-4" />
                      {room.freezeTimer}s
                    </div>
                  ) : (
                    `${room.timer}s`
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-lg font-black text-[#2D3436] uppercase tracking-wide">اختر فئة التخمين</p>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => {
                    const isMyChoice = me?.selectedCategory === cat.id;
                    const isOpponentChoice = opponent?.selectedCategory === cat.id;
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => socket?.emit('select_category', { roomId, category: cat.id })}
                        className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-b-4 active:border-b-0 active:translate-y-1 relative
                          ${isMyChoice ? 'bg-orange-100 text-orange-600 border-orange-300 scale-105' : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200 hover:text-gray-700'}
                          ${isOpponentChoice && !isMyChoice ? 'hint-glow' : ''}
                        `}
                      >
                        <span className="text-4xl">{cat.icon}</span>
                        <span className="text-sm font-black">{cat.name}</span>
                        {isOpponentChoice && !isMyChoice && (
                          <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-bounce z-10">
                            اقتراح!
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* WhatsApp Style Chat Box */}
                <div className="w-full bg-[#E5DDD5] rounded-2xl border-4 border-white shadow-inner overflow-hidden flex flex-col h-64 mt-6 relative">
                  {isMutedByOpponent && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white">
                      <Lock className="w-12 h-12 mb-2 text-red-400" />
                      <span className="font-black text-lg text-center px-4">تم حظر الدردشة من قبل المنافس</span>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-400 font-bold text-sm italic">
                        ابدأ الدردشة مع منافسك...
                      </div>
                    ) : (
                      chatHistory.map((msg, index) => (
                        <div key={`waiting-chat-${msg.id}-${index}`} className={`flex ${msg.senderId === socket?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-2 px-3 rounded-xl text-sm font-bold shadow-sm relative ${msg.senderId === socket?.id ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                            <div className={`text-[9px] mb-0.5 ${msg.senderId === socket?.id ? 'text-green-600' : 'text-blue-600'}`}>
                              {msg.playerName}
                            </div>
                            <div className="leading-tight">{msg.text}</div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendChat} className="p-2 bg-[#F0F0F0] flex gap-2 border-t border-gray-200 relative">
                    <button type="submit" disabled={isMutedByOpponent} className="bg-[#128C7E] text-white p-3 rounded-full shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                      <Send className="w-5 h-5" />
                    </button>
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="اكتب رسالة..."
                      className="flex-1 bg-white border-none rounded-full px-4 py-2 text-base outline-none shadow-sm font-bold disabled:bg-gray-200 disabled:cursor-not-allowed"
                      maxLength={25}
                      disabled={isMutedByOpponent}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowEmotes(!showEmotes)}
                      className="bg-white text-gray-500 p-3 rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    {showEmotes && (
                      <div className="absolute bottom-full left-2 mb-2 bg-white p-2 rounded-2xl shadow-xl border border-gray-200 grid grid-cols-4 gap-2 w-48 z-50">
                        {EMOTES.map(emote => (
                          <button
                            key={emote}
                            type="button"
                            onClick={() => {
                              socket?.emit('send_emote', { roomId: room!.id, emote });
                              setShowEmotes(false);
                            }}
                            className="text-2xl hover:scale-125 transition-transform p-1"
                          >
                            {emote}
                          </button>
                        ))}
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {consensusReached ? (
                <motion.button 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  onClick={handleStartGame}
                  className="w-full btn-game btn-success py-4 text-xl"
                >
                  ابدأ اللعبة الآن! 🚀
                </motion.button>
              ) : (
                <div className="text-sm font-black text-orange-500 bg-orange-100 py-3 rounded-xl animate-pulse border-2 border-orange-200">
                  {room.players.length < 2 ? 'بانتظار دخول لاعب آخر...' : 'اتفقوا على نفس الفئة للبدء!'}
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full flex flex-col items-center">
              {/* Quick Guess Overlay for the one guessing */}
              <AnimatePresence>
                {room.isPaused && room.pausingPlayerId === me?.id && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  >
                    <div className="w-full max-w-md card-game p-8 text-center relative">
                      <div className="text-8xl font-black text-red-500 mb-4 drop-shadow-md">{room.quickGuessTimer}</div>
                      <h3 className="text-3xl font-black text-[#2D3436] mb-6">تخمين سريع!</h3>
                      <form onSubmit={handleQuickGuess} className="flex flex-col gap-3">
                        <input 
                          autoFocus
                          type="text" 
                          value={guess}
                          onChange={(e) => setGuess(e.target.value)}
                          placeholder="ما هي الصورة؟"
                          className="input-game text-center text-2xl"
                        />
                        <button className="btn-game btn-primary py-4 text-xl">إرسال</button>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            if (getLevel(xp) >= 20) {
                              socket?.emit('cancel_quick_guess', { roomId });
                            }
                          }}
                          disabled={getLevel(xp) < 20}
                          className={`btn-game py-3 text-lg flex items-center justify-center gap-2 ${getLevel(xp) >= 20 ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                          {getLevel(xp) < 20 && <Lock className="w-4 h-4" />}
                          {getLevel(xp) < 20 ? 'تراجع (Lvl 20)' : 'تراجع'}
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Guess Message for the opponent */}
              <AnimatePresence>
                {room.isPaused && room.pausingPlayerId !== me?.id && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  >
                    <div className="bg-red-500 text-white p-8 rounded-[32px] shadow-xl shadow-red-500/30 text-center animate-pulse border-b-8 border-red-700 w-full max-w-md">
                      <h3 className="text-3xl font-black">المنافس يقوم بالتخمين الآن!</h3>
                      <p className="font-bold mt-2 opacity-90 text-xl">انتظر {room.quickGuessTimer} ثوانٍ...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The Image I need to see (Opponent's Target) - Hidden in guessing phase or paused */}
              <AnimatePresence>
                {room.gameState === 'discussion' && !room.isPaused && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative z-10 flex flex-col items-center w-full"
                  >
                    <div className="w-full max-w-[10rem] md:max-w-[14rem] aspect-square bg-white p-2 rounded-[24px] shadow-[0_8px_20px_rgba(0,0,0,0.15)] overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-300 border-2 border-white flex items-center justify-center">
                      <img 
                        src={opponent?.targetImage?.image} 
                        className={`w-full h-full object-cover rounded-xl ${funnyFilter === opponent?.id ? 'invert sepia hue-rotate-90 scale-110' : ''}`}
                        alt="Target"
                      />
                    </div>
                    {/* Target name label */}
                    <div className="mt-3 bg-white px-4 py-1.5 rounded-full font-black text-sm md:text-base text-[#2D3436] shadow-[0_4px_0_rgba(0,0,0,0.05)] border-2 border-gray-100">
                      {opponent?.targetImage?.name}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

      {/* Guess Input moves to center in guessing phase */}
              <AnimatePresence>
                {room.gameState === 'guessing' && !room.isPaused && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-[150] w-full max-w-md px-2 flex flex-col items-center mt-2"
                  >
                    <form onSubmit={handleGuess} className="w-full flex flex-col gap-2 card-game p-3 md:p-4 guess-glow border-orange-200">
                      <div className="text-center font-black text-orange-500 animate-pulse mb-1 text-xl md:text-2xl">
                        أسرع! خمن الآن ({room.isFrozen ? room.freezeTimer : room.timer}s)
                      </div>
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          type="text" 
                          value={guess}
                          onChange={(e) => setGuess(e.target.value)}
                          placeholder="ما هي الصورة؟"
                          className="input-game flex-1 py-2"
                        />
                        <button className="btn-game btn-primary px-6 text-base md:text-lg">إرسال</button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gameplay Chat Box - Moved to Center */}
              {room.gameState !== 'waiting' && room.gameState !== 'finished' && room.gameState !== 'guessing' && (
                <div className="w-full bg-[#E5DDD5] rounded-2xl border-4 border-white shadow-inner overflow-hidden flex flex-col h-56 md:h-64 mt-2 z-20 relative">
                  {isMutedByOpponent && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white">
                      <Lock className="w-12 h-12 mb-2 text-red-400" />
                      <span className="font-black text-lg text-center px-4">تم حظر الدردشة من قبل المنافس</span>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-400 font-bold text-sm italic">
                        دردشة سريعة...
                      </div>
                    ) : (
                      chatHistory.map((msg, index) => (
                        <div key={`game-chat-${msg.id}-${index}`} className={`flex ${msg.senderId === socket?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-1.5 px-2.5 rounded-xl text-xs font-bold shadow-sm relative ${msg.senderId === socket?.id ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                            <div className={`text-[9px] mb-0.5 ${msg.senderId === socket?.id ? 'text-green-600' : 'text-blue-600'}`}>
                              {msg.playerName}
                            </div>
                            <div className="leading-tight">{msg.text}</div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendChat} className="p-1.5 bg-[#F0F0F0] flex gap-2 border-t border-gray-200 relative">
                    <button type="submit" disabled={isMutedByOpponent} className="bg-[#128C7E] text-white p-3 rounded-full shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                      <Send className="w-5 h-5" />
                    </button>
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="دردشة..."
                      className="flex-1 bg-white border-none rounded-full px-3 py-1.5 text-base outline-none shadow-sm font-bold disabled:bg-gray-200 disabled:cursor-not-allowed"
                      maxLength={25}
                      disabled={isMutedByOpponent}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowEmotes(!showEmotes)}
                      className="bg-white text-gray-500 p-2 rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    {showEmotes && (
                      <div className="absolute bottom-full left-2 mb-2 bg-white p-2 rounded-2xl shadow-xl border border-gray-200 grid grid-cols-4 gap-2 w-48 z-50">
                        {EMOTES.map(emote => (
                          <button
                            key={emote}
                            type="button"
                            onClick={() => {
                              socket?.emit('send_emote', { roomId: room!.id, emote });
                              setShowEmotes(false);
                            }}
                            className="text-2xl hover:scale-125 transition-transform p-1"
                          >
                            {emote}
                          </button>
                        ))}
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Player (Bottom) */}
        <div className="relative flex flex-col items-center">
          {me && (
            <>
              <div className="relative">
                {renderStars(getLevel(xp))}
                <div className={`relative w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl md:text-5xl border-4 transition-transform ${getAvatarStyle(getLevel(xp))} ${funnyFilter === me.id ? 'animate-shake' : ''}`}>
                  {renderAvatarContent(me.avatar)}
                  {showHammer === me.id && (
                    <motion.div 
                      initial={{ rotate: -45, y: -60, x: -20, opacity: 0 }}
                      animate={{ rotate: 45, y: -30, x: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                      <Hammer className="w-20 h-20 text-[#2D3436] fill-[#FF9F43] drop-shadow-lg" />
                    </motion.div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FF6B6B] text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm whitespace-nowrap z-10">
                  Lvl {getLevel(xp)}
                </div>
                <AnimatePresence>
                  {bubbles.filter(b => b.senderId === me.id).map(bubble => (
                    <motion.div
                      key={`me-bubble-${bubble.id}`}
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      className="absolute -right-12 -top-4 bg-white px-3 py-2 rounded-2xl rounded-bl-none shadow-lg border-2 border-gray-100 text-2xl z-50 pointer-events-none"
                    >
                      {bubble.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="mt-3 font-black text-lg text-[#2D3436] bg-white/80 px-4 py-1 rounded-full shadow-sm backdrop-blur-sm flex items-center gap-2">
                {me.name}
                {reports > 0 && (
                  <Flag className="w-4 h-4 text-red-500" fill="currentColor" title={`لديك ${reports} إبلاغات`} />
                )}
              </div>
              {me.age && <div className="text-xs text-gray-500 font-bold mt-1">({me.age} سنة)</div>}
              

            </>
          )}
        </div>
      </main>

      {/* Floating Controls (Bottom Right) */}
      <div className="fixed bottom-2 right-2 md:bottom-6 md:right-6 flex flex-col gap-2 md:gap-3 z-[300]">
        {/* Exit Button - Always shown */}
        <button 
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.error(err));
            } else {
              window.close();
            }
          }}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.1)] border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all"
          title="خروج"
        >
          <LogOut className="w-7 h-7 md:w-8 md:h-8" />
        </button>

        {/* Home Button - Shown whenever joined a room */}
        {room && room.gameState !== 'finished' && (
          <button 
            onClick={handleLeaveGame}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white text-gray-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.1)] border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all"
            title="الرئيسية"
          >
            <Home className="w-7 h-7 md:w-8 md:h-8" />
          </button>
        )}

        {/* Mic Button - Only when opponent is present */}
        {(opponent || (room && room.players.length > 1)) && (
          <>
          </>
        )}
      </div>

      {/* Chat Input Popup Removed */}

      {/* Spy Lens Overlay */}
      <AnimatePresence>
        {spyLensImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none"
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-[32px] overflow-hidden border-4 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.5)]">
              <img 
                src={spyLensImage} 
                className="w-full h-full object-cover blur-md scale-110" // Reduced blur
                alt="Spy View"
              />
              <div className="absolute inset-0 flex items-center justify-center text-white/50 font-black text-4xl rotate-12">
                سري للغاية
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Cards (Bottom Left) - Vertical Stack */}
      {room.gameState !== 'waiting' && (
        <div className="fixed bottom-2 left-2 md:bottom-6 md:left-6 flex flex-col-reverse gap-2 md:gap-3 z-[200]">
          {[
            { 
              id: 'quick_guess', 
              name: 'تخمين سريع', 
              icon: Sparkles, 
              color: 'text-yellow-500', 
              bg: 'bg-white', 
              disabled: room.timer > getQuickGuessThreshold(getLevel(me?.xp || xp)) || me?.quickGuessUsed,
              level: 1 
            },
            { 
              id: 'hint', 
              name: 'نصيحة', 
              icon: HelpCircle, 
              color: 'text-blue-500', 
              bg: 'bg-white', 
              disabled: me?.hintCount >= 2,
              level: 1
            },
            { 
              id: 'word_length', 
              name: 'كاشف الحروف', 
              icon: Type, 
              color: 'text-green-500', 
              bg: 'bg-white', 
              disabled: me?.wordLengthUsed,
              level: 20
            },
            { 
              id: 'time_freeze', 
              name: 'تجميد الوقت', 
              icon: Snowflake, 
              color: 'text-cyan-500', 
              bg: 'bg-white', 
              disabled: me?.timeFreezeUsed || room.isFrozen,
              level: 30
            },
            { 
              id: 'spy_lens', 
              name: 'الجاسوس', 
              icon: Eye, 
              color: 'text-purple-500', 
              bg: 'bg-white', 
              disabled: me?.spyLensUsed,
              level: 50
            }
          ].map((card) => {
            const isLocked = getLevel(me?.xp || xp) < card.level;
            
            // Calculate dynamic cooldown for quick_guess based on room.timer
            let cardCooldown = cooldowns[card.id] || 0;
            if (card.id === 'quick_guess') {
              const threshold = getQuickGuessThreshold(getLevel(me?.xp || xp));
              cardCooldown = Math.max(0, room.timer - threshold);
            }

            // Only disable other cards during quick guess if they are specifically quick guess, or if game is finished
            const isCardDisabled = isLocked || card.disabled || cardCooldown > 0 || room.gameState === 'finished' || (room.isPaused && card.id === 'quick_guess');
            return (
              <button 
                key={card.id}
                onClick={() => !isLocked && useCard(card.id as any)}
                disabled={isCardDisabled}
                className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full ${card.bg} flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.1)] border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-80 disabled:grayscale disabled:cursor-not-allowed group`}
                title={card.name}
              >
                {isLocked ? (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Lock className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-black">Lvl {card.level}</span>
                  </div>
                ) : (
                  <card.icon className={`w-7 h-7 md:w-8 md:h-8 ${card.color}`} />
                )}
                
                {cardCooldown > 0 && !isLocked && (
                  <div className="absolute inset-0 bg-gray-900/80 rounded-full flex items-center justify-center text-white text-xs font-black backdrop-blur-[1px]">
                    {cardCooldown}s
                  </div>
                )}
                
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {card.name}
                  {isLocked && <span className="block text-red-300 text-[10px]">مطلوب مستوى {card.level}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Hint Display */}
      <AnimatePresence>
        {hint && (
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed bottom-28 left-6 z-[250] bg-blue-500 text-white px-8 py-6 rounded-[32px] shadow-[0_8px_0_rgba(0,0,0,0.2)] font-black text-lg border-4 border-blue-400"
          >
            {hint}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full font-black shadow-[0_8px_0_rgba(0,0,0,0.2)] z-[500] flex items-center gap-4 border-4 ${error.includes('انضم') ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}
          >
            {error}
            <button onClick={() => setError('')} className="bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors">X</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finished Screen Overlay */}
      <AnimatePresence>
        {room.gameState === 'finished' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="card-game p-4 md:p-8 text-center max-w-md w-full relative overflow-hidden"
            >
              {room.winnerId === me?.id ? (
                <div className="mb-4 md:mb-6 relative z-10">
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 border-4 border-yellow-200 animate-bounce">
                    <Trophy className="w-8 h-8 md:w-12 md:h-12 text-yellow-500" />
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-green-500 mb-1 md:mb-2 drop-shadow-sm">مبروك! لقد فزت</h2>
                  <p className="text-gray-400 font-black text-sm md:text-lg">أداء رائع يا بطل! 🏆</p>
                </div>
              ) : (
                <div className="mb-4 md:mb-6 relative z-10">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4 animate-pulse">😢</div>
                  <h2 className="text-2xl md:text-4xl font-black text-red-500 mb-1 md:mb-2 drop-shadow-sm">للأسف! لقد خسرت</h2>
                  <p className="text-gray-400 font-black text-sm md:text-lg">حظ أوفر في المرة القادمة</p>
                </div>
              )}
              
              <div className="flex flex-col items-center mb-4 md:mb-6 bg-gray-100 p-3 md:p-4 rounded-[24px] border-4 border-gray-200">
                <div className="text-[10px] md:text-xs font-black uppercase text-gray-400 mb-2 md:mb-3 tracking-wider">الصورة التي كان يجب تخمينها</div>
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-white shadow-md mb-2 md:mb-3 border-4 border-white">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white shadow-md mb-2 md:mb-3 border-4 border-white">
                    <img src={me?.targetImage?.image} className="w-full h-full object-cover" alt={me?.targetImage?.name} />
                  </div>
                </div>
                <div className="font-black text-xl md:text-2xl text-[#2D3436]">{me?.targetImage?.name}</div>
              </div>

              <div className="flex flex-col gap-2 md:gap-3">
                <button 
                  onClick={() => socket?.emit('play_again', { roomId })}
                  className="w-full btn-game btn-success py-3 md:py-4 text-lg md:text-xl"
                >
                  لعب مرة أخرى مع نفس اللاعب
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full btn-game btn-primary py-3 md:py-4 text-lg md:text-xl"
                >
                  الذهاب للصفحة الرئيسية
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && opponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999]"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card-game p-8 w-full max-w-md text-center"
            >
              <h3 className="text-3xl font-black text-[#2D3436] mb-8">الإبلاغ عن {opponent.name}</h3>
              <div className="space-y-4 mb-8">
                <button 
                  onClick={() => handleReportPlayer('محتوى مسيء في الشات')}
                  className="w-full btn-game btn-danger bg-red-100 border-red-200 text-red-500 hover:bg-red-200 py-4 text-lg"
                >
                  محتوى مسيء في الشات
                </button>
                <button 
                  onClick={() => handleReportPlayer('سلوك غير لائق')}
                  className="w-full btn-game btn-danger bg-red-100 border-red-200 text-red-500 hover:bg-red-200 py-4 text-lg"
                >
                  سلوك غير لائق
                </button>
                <button 
                  onClick={() => handleReportPlayer('استخدام الغش')}
                  className="w-full btn-game btn-danger bg-red-100 border-red-200 text-red-500 hover:bg-red-200 py-4 text-lg"
                >
                  استخدام الغش
                </button>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-lg font-black text-gray-400 hover:text-gray-600 transition-colors"
              >
                إلغاء
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Level Up Overlay */}
      <AnimatePresence>
        {showLevelUp !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setShowLevelUp(null)}
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="card-game p-6 md:p-10 text-center max-w-sm w-full relative overflow-hidden border-4 border-yellow-400 bg-gradient-to-br from-white to-yellow-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
              <div className="mb-4 md:mb-6 relative">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-pulse">
                  <Star className="w-10 h-10 md:w-12 md:h-12 text-white fill-current" />
                </div>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 md:px-4 py-0.5 md:py-1 rounded-full border-2 border-yellow-400 font-black text-xs md:text-base text-yellow-600 shadow-sm"
                >
                  LEVEL UP!
                </motion.div>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black text-[#2D3436] mb-1 md:mb-2">المستوى {showLevelUp}</h2>
              <p className="text-sm md:text-base text-gray-500 font-bold mb-6 md:mb-8">لقد ارتقيت لمستوى جديد! استمر في الفوز لفتح المزيد من القدرات.</p>
              
              <button 
                onClick={() => setShowLevelUp(null)}
                className="w-full btn-game btn-primary py-3 md:py-4 text-lg md:text-xl shadow-[0_6px_0_#D97706]"
              >
                رائع!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Indicator */}
      <AnimatePresence>
        {(!isConnected || isConnecting || connectionError) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-4 z-[6000] flex items-center gap-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl border-2 border-orange-100 shadow-xl"
          >
            {isConnecting ? (
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            ) : isConnected ? (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            ) : (
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            )}
            <span className="text-sm font-black text-[#2D3436]">
              {isConnecting ? 'جاري الاتصال...' : isConnected ? 'متصل' : 'غير متصل'}
            </span>
            {!isConnected && !isConnecting && (
              <button 
                onClick={() => connectSocket()}
                className="bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                إعادة المحاولة
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
