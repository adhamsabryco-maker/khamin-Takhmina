import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload,
  Trash2,
  Image as ImageIcon,
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
  MessageSquareOff,
  Info,
  Star,
  Zap,
  Lock,
  Camera,
  Check,
  Settings,
  Crown,
  AlertTriangle,
  Type,
  Eye,
  Shield,
  Search,
  UserMinus,
  UserPlus,
  RefreshCw,
  Smile,
  Loader2,
  Plus,
  ShoppingCart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminCustomization } from './components/AdminCustomization';
import { AvatarDisplay } from './components/AvatarDisplay';
import { LevelUpModal } from './components/LevelUpModal';
import { useAvatarConfig } from './contexts/AvatarContext';
import { STATIC_ASSETS } from './constants';
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
  level?: number;
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
  // Boys
  { id: 'avatar-free-boy-01.png', level: 1, gender: 'boy' },
  { id: 'avatar-free-boy-02.png', level: 1, gender: 'boy' },
  { id: 'avatar-free-boy-03.png', level: 1, gender: 'boy' },
  { id: 'avatar-free-boy-04.png', level: 1, gender: 'boy' },
  { id: 'avatar-lvl-boy-10.png', level: 10, gender: 'boy' },
  { id: 'avatar-lvl-boy-20.png', level: 20, gender: 'boy' },
  { id: 'avatar-lvl-boy-30.png', level: 30, gender: 'boy' },
  { id: 'avatar-lvl-boy-40.png', level: 40, gender: 'boy' },
  // Girls
  { id: 'avatar-free-girl-01.png', level: 1, gender: 'girl' },
  { id: 'avatar-free-girl-02.png', level: 1, gender: 'girl' },
  { id: 'avatar-free-girl-03.png', level: 1, gender: 'girl' },
  { id: 'avatar-free-girl-04.png', level: 1, gender: 'girl' },
  { id: 'avatar-lvl-girl-10.png', level: 10, gender: 'girl' },
  { id: 'avatar-lvl-girl-20.png', level: 20, gender: 'girl' },
  { id: 'avatar-lvl-girl-30.png', level: 30, gender: 'girl' },
  { id: 'avatar-lvl-girl-40.png', level: 40, gender: 'girl' },
];

const APP_VERSION = '1.1.1'; // Version for cache clearing



const EMOTES = ['😂', '😡', '👍', '👎', '🤔', '🤯', '🎉', '💔'];

const enterFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
  }
};

export default function App() {
  const { customConfig, refreshConfig } = useAvatarConfig();
  const appVersion = customConfig.version || '1.0.0';

  useEffect(() => {
    if (customConfig.version) {
      const version = customConfig.version;
      
      // Update icon
      const iconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (iconLink) iconLink.href = `/icon.svg?v=${version}`;
      
      const appleIconLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (appleIconLink) appleIconLink.href = `/icon.svg?v=${version}`;
      
      // Update manifest
      const manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (manifestLink) manifestLink.href = `/manifest.json?v=${version}`;
    }
  }, [customConfig.version]);

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
  const [gender, setGender] = useState<'boy' | 'girl'>(() => (localStorage.getItem('khamin_player_gender') as 'boy' | 'girl') || 'boy');
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
  const [tokens, setTokens] = useState(() => parseInt(localStorage.getItem('khamin_tokens') || '0'));
  const [playerSerial, setPlayerSerial] = useState(() => localStorage.getItem('khamin_player_serial') || '');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topPlayers, setTopPlayers] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('khamin_top_players');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [customAvatar, setCustomAvatar] = useState(() => localStorage.getItem('khamin_custom_avatar') || '');
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('khamin_is_admin') === 'true');
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminPlayers, setAdminPlayers] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem('khamin_admin_email') || '');
  const [adminTab, setAdminTab] = useState<'players' | 'images' | 'customization' | 'shop'>('players');
  const [adminImages, setAdminImages] = useState<any[]>([]);

  const [newImage, setNewImage] = useState({ category: 'animals', name: '', data: '' });
  const [newCategory, setNewCategory] = useState({ id: '', name: '', icon: '' });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [adminImageSearchQuery, setAdminImageSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  // Sound Settings
  const [sfxVolume, setSfxVolume] = useState(() => parseFloat(localStorage.getItem('khamin_sfx_volume') || '1'));
  const [musicVolume, setMusicVolume] = useState(() => parseFloat(localStorage.getItem('khamin_music_volume') || '0.5'));


  useEffect(() => {
    localStorage.setItem('khamin_sfx_volume', sfxVolume.toString());
  }, [sfxVolume]);

  useEffect(() => {
    localStorage.setItem('khamin_music_volume', musicVolume.toString());
  }, [musicVolume]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      if (!url.startsWith('data:')) {
        image.setAttribute('crossOrigin', 'anonymous');
      }
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string | null> => {
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

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
    } catch (e) {
      console.error('Error creating cropped image:', e);
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError('يرجى اختيار ملف صورة صالح');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)');
        return;
      }

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
        if (croppedImage) {
          setCustomAvatar(croppedImage);
          setAvatar(croppedImage);
          localStorage.setItem('khamin_custom_avatar', croppedImage);
          setShowCropper(false);
          setImageSrc(null); // Clear image source after save
        } else {
          setError('حدث خطأ أثناء معالجة الصورة');
        }
      }
    } catch (e) {
      console.error(e);
      setError('حدث خطأ غير متوقع');
    }
  };

  const renderAvatarContent = (avatarStr: string, level: number = 1, hideExtras: boolean = false) => {
    return <AvatarDisplay avatar={avatarStr} level={level} customConfig={customConfig} className="w-full h-full" hideExtras={hideExtras} />;
  };

  const truncateName = (name: string, limit: number = 12) => {
    if (!name) return '';
    return name.length > limit ? name.substring(0, limit) + '...' : name;
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

  const getLevel = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;
  const getXpProgress = (xp: number) => {
    const level = getLevel(xp);
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
    // The threshold is when the game timer (600s) reaches (600 - waitTime)
    // Level 1: 600 - 150 = 450s remaining
    // Level 10: 600 - 123 = 477s remaining
    return 600 - getQuickGuessWaitTime(level);
  };

  const renderStars = (level: number) => {
    const starsCount = Math.floor(level / 10);
    if (starsCount === 0) return null;
    
    const getMilestoneLevel = (lvl: number) => {
      if (lvl >= 50) return 50;
      if (lvl >= 40) return 40;
      if (lvl >= 30) return 30;
      if (lvl >= 20) return 20;
      if (lvl >= 10) return 10;
      return 1;
    };
    const milestoneLevel = getMilestoneLevel(level);

    const customStar = customConfig.stars?.[milestoneLevel];
    const staticStar = STATIC_ASSETS.stars[milestoneLevel as keyof typeof STATIC_ASSETS.stars];
    const displayStar = customStar ? `/uploads/${customStar}` : (staticStar ? `/assets/${staticStar}` : null);

    return (
      <div className="flex justify-center gap-1 mt-1">
        {Array.from({ length: starsCount }).map((_, i) => (
          displayStar ? (
            <img key={i} src={displayStar} className="w-4 h-4 object-contain drop-shadow-sm" alt="Star" />
          ) : (
            <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
          )
        ))}
      </div>
    );
  };

  useEffect(() => {
    localStorage.setItem('khamin_xp', xp.toString());
    localStorage.setItem('khamin_streak', streak.toString());
  }, [xp, streak]);

  const [avatar, setAvatar] = useState(() => localStorage.getItem('khamin_player_avatar') || AVATARS[0].id);

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
  const [categories, setCategories] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [proposedMatch, setProposedMatch] = useState<{ matchId: string, opponent: { name: string, avatar: string, age: number, level?: number } } | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [opponentAccepted, setOpponentAccepted] = useState(false);
  const [matchResponseTimeLeft, setMatchResponseTimeLeft] = useState<number | null>(null);
  const [searchTimeLeft, setSearchTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [hasSeenLevelInfo, setHasSeenLevelInfo] = useState(() => {
    return localStorage.getItem('khamin_seen_level_info') === 'true';
  });
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('khamin_install_dismissed')) {
        setShowInstallModal(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        setShowInstallModal(false);
        setDeferredPrompt(null);
      });
    }
  };

  const handleCloseInstallModal = () => {
    setShowInstallModal(false);
    localStorage.setItem('khamin_install_dismissed', 'true');
  };
  
  const toggleSettings = () => {
    setShowSettingsModal(!showSettingsModal);
    setShowLevelInfo(false);
    setShowAdminDashboard(false);
    setShowReportModal(false);
    setShowShopModal(false);
  };

  const toggleShop = () => {
    setShowShopModal(!showShopModal);
    setShowSettingsModal(false);
    setShowLevelInfo(false);
    setShowAdminDashboard(false);
    setShowReportModal(false);
  };

  const toggleLevelInfo = () => {
    if (!hasSeenLevelInfo) {
      setHasSeenLevelInfo(true);
      localStorage.setItem('khamin_seen_level_info', 'true');
    }
    setShowLevelInfo(!showLevelInfo);
    setShowSettingsModal(false);
    setShowAdminDashboard(false);
    setShowReportModal(false);
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (room?.gameState === 'discussion' || room?.gameState === 'guessing') {
        socket?.emit('intentional_leave', { roomId });
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [room?.gameState, roomId, socket]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  // Matchmaking timeout
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching && !proposedMatch && searchTimeLeft !== null && searchTimeLeft > 0) {
      interval = setInterval(() => {
        setSearchTimeLeft(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    } else if (isSearching && !proposedMatch && searchTimeLeft === 0) {
      setIsSearching(false);
      setJoined(false);
      socket?.emit('leave_matchmaking');
      setError('لم يتم العثور على منافس حالياً. يرجى المحاولة في وقت لاحق.');
      setTimeout(() => setError(''), 5000);
      setSearchTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [isSearching, proposedMatch, searchTimeLeft, socket]);

  // Match response timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (proposedMatch && matchResponseTimeLeft !== null && matchResponseTimeLeft > 0) {
      interval = setInterval(() => {
        setMatchResponseTimeLeft(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    } else if (matchResponseTimeLeft === 0 && !hasResponded) {
      setHasResponded(true);
      socket?.emit('respond_to_match', { matchId: proposedMatch?.matchId, response: 'reject' });
      setProposedMatch(null);
      setMatchResponseTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [proposedMatch, matchResponseTimeLeft, hasResponded, socket]);

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
  const [useToken, setUseToken] = useState(false);
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
      sound.volume = sfxVolume;
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }, [sfxVolume]);

  const clearPlayerData = () => {
    localStorage.removeItem('khamin_player_serial');
    localStorage.removeItem('khamin_player_name');
    localStorage.removeItem('khamin_player_age');
    localStorage.removeItem('khamin_player_avatar');
    localStorage.removeItem('khamin_custom_avatar');
    localStorage.removeItem('khamin_xp');
    localStorage.removeItem('khamin_wins');
    localStorage.removeItem('khamin_streak');
    localStorage.removeItem('khamin_is_admin');
    localStorage.removeItem('khamin_admin_email');
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
    const processAuthSuccess = (userData: any) => {
      console.log('Processing Auth Success:', userData);
      if (userData.isAdmin) {
        console.log('User is admin, attempting to set status...');
        if (!socket) {
          console.error('Socket not connected');
          setError('خطأ في الاتصال بالخادم. حاول مرة أخرى.');
          return;
        }
        
        setIsAdmin(true);
        setAdminEmail(userData.email);
        localStorage.setItem('khamin_is_admin', 'true');
        localStorage.setItem('khamin_admin_email', userData.email);
        socket.emit('admin_set_admin_status', { 
          serial: playerSerial, 
          isAdmin: true, 
          email: userData.email,
          adminToken: userData.adminToken
        }, (res: any) => {
          console.log('Admin status set response:', res);
          if (res.success) {
            setShowAdminDashboard(true);
            setShowSettingsModal(false);
          } else {
            console.error('Failed to set admin status:', res.error);
            setError('فشل في تحديث صلاحيات الإدارة: ' + (res.error || 'خطأ غير معروف'));
          }
        });
      } else {
        console.log('User is not admin');
        setError('عذراً، هذا الحساب لا يملك صلاحيات الإدارة.');
      }
    };

    // Check URL parameters for direct redirect auth
    const checkUrlParams = () => {
      if (!socket) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin_auth') === 'success') {
        const user = {
          email: params.get('email'),
          adminToken: params.get('adminToken'),
          isAdmin: params.get('isAdmin') === 'true'
        };
        console.log('Google Auth Success found in URL params:', user);
        
        if (socket.connected) {
          processAuthSuccess(user);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          socket.once('connect', () => {
            processAuthSuccess(user);
            window.history.replaceState({}, document.title, window.location.pathname);
          });
        }
      }
    };
    checkUrlParams();

    return () => {
      // Cleanup if needed
    };
  }, [socket, playerSerial]);

  const handleAdminLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      // Redirect the current window to Google Auth
      window.location.href = url;
    } catch (err) {
      setError('فشل الاتصال بخدمة جوجل.');
    }
  };

  const fetchAdminImages = async () => {
    try {
      const res = await fetch('/api/admin/images');
      const data = await res.json();
      if (Array.isArray(data)) setAdminImages(data);
    } catch (error) {
      console.error("Fetch images failed", error);
    }
  };

  useEffect(() => {
    if (showAdminDashboard && socket) {
      socket.emit('admin_get_players', (players: any) => {
        if (Array.isArray(players)) setAdminPlayers(players);
      });
      socket.emit('admin_get_reports', (reports: any) => {
        if (Array.isArray(reports)) setAdminReports(reports);
      });
      fetchAdminImages();
    }
  }, [showAdminDashboard, socket]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Fetch categories failed", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.icon) return;
    setIsAddingCategory(true);
    try {
      const id = newCategory.name.toLowerCase().replace(/\s+/g, '_');
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newCategory.name, icon: newCategory.icon })
      });
      if (response.ok) {
        setNewCategory({ id: '', name: '', icon: '' });
        fetchCategories();
        alert('تم إضافة الفئة بنجاح');
      } else {
        alert('فشل إضافة الفئة');
      }
    } catch (error) {
      console.error("Add category failed", error);
      alert('حدث خطأ أثناء الإضافة');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة وجميع الصور المرتبطة بها؟')) return;
    try {
      const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchCategories();
        fetchAdminImages();
      } else {
        alert('فشل حذف الفئة');
      }
    } catch (error) {
      console.error("Delete category failed", error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const handleImageUpload = async () => {
    if (!newImage.name || !newImage.data) return;
    setIsUploading(true);
    try {
      const response = await fetch('/api/admin/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newImage, addedBy: adminEmail })
      });
      if (response.ok) {
        setNewImage({ ...newImage, name: '', data: '' });
        fetchAdminImages();
        alert('تم رفع الصورة بنجاح');
      } else {
        alert('فشل رفع الصورة');
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert('حدث خطأ أثناء الرفع');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    try {
      const response = await fetch(`/api/admin/images/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchAdminImages();
      } else {
        alert('فشل حذف الصورة');
      }
    } catch (error) {
      console.error("Delete failed", error);
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

    newSocket.on('config_updated', () => {
      refreshConfig();
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully! ID:', newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      
      const serial = localStorage.getItem('khamin_player_serial');
      if (serial) {
        newSocket.emit('set_player_serial_for_socket', serial);
        const isAdmin = localStorage.getItem('khamin_is_admin') === 'true';
        const adminEmail = localStorage.getItem('khamin_admin_email');
        if (isAdmin) {
          newSocket.emit('admin_set_admin_status', { serial, isAdmin: true, email: adminEmail });
        }
        // Fetch actual server data
        newSocket.emit('get_player_data', serial, (data: any) => {
          if (data) {
            setXp(data.xp);
            setWins(data.wins || 0);
            setReports(data.reports || 0);
            setTokens(data.tokens || 0);
            if (data.isPermanentBan) {
              setIsPermanentBan(true);
              newSocket.disconnect();
            } else if (data.banUntil && data.banUntil > Date.now()) {
              setBanUntil(data.banUntil);
              newSocket.disconnect();
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
        localStorage.setItem('khamin_top_players', JSON.stringify(players));
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
      if (data.tokens !== undefined) {
        setTokens(data.tokens);
        localStorage.setItem('khamin_tokens', data.tokens.toString());
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
      localStorage.setItem('khamin_top_players', JSON.stringify(players));
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
      
      // Add to bubbles
      setBubbles(prev => {
        if (prev.some(b => b.id === id)) return prev;
        return [...prev, { id, senderId, text: emote }];
      });
      setTimeout(() => {
        setBubbles(prev => prev.filter(b => b.id !== id));
      }, 4000);

      // Add to chat history
      const sender = roomRef.current?.players.find((p: any) => p.id === senderId);
      setChatHistory(prev => [...prev, { 
        id, 
        senderId, 
        text: emote, 
        playerName: sender?.name || (senderId === newSocket.id ? playerNameRef.current : 'منافس'),
        avatar: sender?.avatar || '👤'
      }]);
    });

    newSocket.on('waiting_for_match', () => {
      setIsSearching(true);
      setJoined(true);
      setProposedMatch(null);
      setSearchTimeLeft(120);
    });

    newSocket.on('match_proposed', (data) => {
      setProposedMatch(data);
      setHasResponded(false);
      setOpponentAccepted(false);
      setMatchResponseTimeLeft(10);
    });

    newSocket.on('opponent_accepted', () => {
      setOpponentAccepted(true);
    });

    newSocket.on('match_rejected', () => {
      setProposedMatch(null);
      setHasResponded(false);
      setOpponentAccepted(false);
      setMatchResponseTimeLeft(null);
    });

    newSocket.on('random_match_found', ({ roomId }) => {
      setRoomId(roomId);
      setIsSearching(false);
      setJoined(true);
      setProposedMatch(null);
      setHasResponded(false);
      setOpponentAccepted(false);
      setMatchResponseTimeLeft(null);
      setSearchTimeLeft(null);
    });

    newSocket.on('game_started', () => {
      setChatHistory([]);
      setCooldowns({});
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
      newSocket.disconnect();
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
    
    socket?.emit('find_random_match', { playerId, playerName, avatar, age: playerAge, xp, streak, wins, serial: playerSerial, useToken });
    setIsOpponentBlocked(false);
  };

  const handleRegister = () => {
    if (!playerName.trim() || !playerAge) {
      setError('يرجى إدخال اسمك وعمرك أولاً');
      return;
    }
    socket?.emit('register_player', { name: playerName, avatar, xp, gender }, ({ serial, name }: { serial: string, name: string }) => {
      if (serial) {
        setPlayerSerial(serial);
        setPlayerName(name); // Update with filtered name
        localStorage.setItem('khamin_player_serial', serial);
        localStorage.setItem('khamin_player_name', name);
        localStorage.setItem('khamin_player_age', playerAge.toString());
        localStorage.setItem('khamin_player_gender', gender);
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
        avatar: avatar,
        gender: gender
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
    localStorage.setItem('khamin_player_gender', gender);

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
      socket?.emit('intentional_leave', { roomId });
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

  const renderModals = () => (
    <>
      {/* Shop Modal */}
      <AnimatePresence>
        {showShopModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[5000] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowShopModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-center relative shrink-0">
                <button 
                  onClick={() => setShowShopModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/30">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">المتجر</h2>
                <p className="text-purple-100 text-sm font-bold">احصل على Tokens للعب مع المحترفين!</p>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="flex items-center justify-between bg-purple-50 p-4 rounded-2xl border-2 border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Zap className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500">رصيدك الحالي</div>
                      <div className="text-lg font-black text-purple-700">{tokens} Tokens</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-gray-800 mb-2">باقات الـ Tokens</h3>
                  
                  {/* Package 1 */}
                  <div className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-purple-200 transition-colors bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl font-black text-purple-600">
                        1
                      </div>
                      <div>
                        <div className="font-black text-gray-800">1 Token</div>
                        <div className="text-xs font-bold text-gray-500">مباراة واحدة مع مستوى 40+</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert('سيتم تفعيل الدفع قريباً!')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-black text-sm transition-colors shadow-md shadow-purple-200"
                    >
                      10 ج.م
                    </button>
                  </div>

                  {/* Package 2 */}
                  <div className="flex items-center justify-between p-4 border-2 border-purple-400 rounded-2xl bg-purple-50 relative">
                    <div className="absolute -top-3 left-4 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
                      الأكثر مبيعاً
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center text-2xl font-black text-purple-700">
                        5
                      </div>
                      <div>
                        <div className="font-black text-gray-800">5 Tokens</div>
                        <div className="text-xs font-bold text-gray-500">5 مباريات + 1 مجاناً</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert('سيتم تفعيل الدفع قريباً!')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-black text-sm transition-colors shadow-md shadow-purple-200"
                    >
                      40 ج.م
                    </button>
                  </div>

                  {/* Package 3 */}
                  <div className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-purple-200 transition-colors bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl font-black text-purple-600">
                        10
                      </div>
                      <div>
                        <div className="font-black text-gray-800">10 Tokens</div>
                        <div className="text-xs font-bold text-gray-500">10 مباريات + 3 مجاناً</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert('سيتم تفعيل الدفع قريباً!')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-black text-sm transition-colors shadow-md shadow-purple-200"
                    >
                      70 ج.م
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Info Modal */}
      <AnimatePresence>
        {showLevelInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4"
            onClick={() => setShowLevelInfo(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card-game p-4 max-w-md w-full relative overflow-hidden text-right"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowLevelInfo(false)}
                className="absolute top-4 left-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-500 fill-orange-500" />
                </div>
                <h2 className="text-2xl font-black text-[#2D3436]">نظام المستويات (Levels)</h2>
              </div>
              
              <div className="space-y-2 text-gray-600 font-bold max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p>كلما فزت في مباريات أكثر، كلما حصلت على XP وارتفع مستواك!</p>
                
                <div className="bg-orange-50 p-3 rounded-2xl border-2 border-orange-100">
                  <h3 className="text-lg font-black text-orange-600 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      ميزة التخمين السريع
                    </div>
                    <span className="text-xs bg-orange-200 text-orange-700 px-2 py-1 rounded-full">تفتح في المستوى 1</span>
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

                {/* Hint */}
                <div className="bg-blue-50 p-3 rounded-2xl border-2 border-blue-100">
                  <h3 className="text-lg font-black text-blue-600 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      النصيحة
                    </div>
                    <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full">تفتح في المستوى 10</span>
                  </h3>
                  <p className="text-sm leading-relaxed">
                    تلميح عن اسم الصورة بأول حرف وثاني حرف لمساعدتك في التخمين. يمكنك استخدامها مرتين في كل مباراة.
                  </p>
                </div>

                {/* Letter Revealer */}
                <div className="bg-green-50 p-3 rounded-2xl border-2 border-green-100">
                  <h3 className="text-lg font-black text-green-600 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="w-5 h-5" />
                      كاشف الحروف
                    </div>
                    <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full">يفتح في المستوى 20</span>
                  </h3>
                  <p className="text-sm leading-relaxed">
                    يكشف لك عن عدد حروف الكلمة المطلوبة لتسهيل عملية التخمين وتضييق نطاق الاحتمالات.
                  </p>
                </div>

                {/* Time Freeze */}
                <div className="bg-cyan-50 p-3 rounded-2xl border-2 border-cyan-100">
                  <h3 className="text-lg font-black text-cyan-600 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Snowflake className="w-5 h-5" />
                      تجميد الوقت
                    </div>
                    <span className="text-xs bg-cyan-200 text-cyan-700 px-2 py-1 rounded-full">يفتح في المستوى 30</span>
                  </h3>
                  <p className="text-sm leading-relaxed">
                    يقوم بتجميد وقت المباراة لمدة 60 ثانية، مما يمنحك وقتاً إضافياً للتفكير والبحث دون أن ينقص الوقت الأصلي.
                  </p>
                </div>

                {/* Spy */}
                <div className="bg-purple-50 p-3 rounded-2xl border-2 border-purple-100">
                  <h3 className="text-lg font-black text-purple-600 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      الجاسوس
                    </div>
                    <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">يفتح في المستوى 50</span>
                  </h3>
                  <p className="text-sm leading-relaxed">
                    يتيح لك رؤية صورة منافسك، مما يعطيك أفضلية استراتيجية كبيرة جداً!
                  </p>
                </div>

                <div className="bg-indigo-50 p-3 rounded-2xl border-2 border-indigo-100">
                  <h3 className="text-lg font-black text-indigo-600 mb-2 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    جوائز المستويات
                  </h3>
                  <p className="text-sm leading-relaxed mb-3">
                    احصل على إطارات مميزة ونجوم ذهبية تزين صورتك الشخصية كلما تقدمت في المستويات!
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-3 bg-white p-2 rounded-lg">
                      <div className="w-10 h-10">
                        {renderAvatarContent(avatar, 10)}
                      </div>
                      <span className="flex-1">المستوى 10</span>
                      <span className="text-blue-500">إطار فضي + نجمة</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white p-2 rounded-lg">
                      <div className="w-10 h-10">
                        {renderAvatarContent(avatar, 20)}
                      </div>
                      <span className="flex-1">المستوى 20</span>
                      <span className="text-blue-500">إطار ذهبي + نجمتين</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white p-2 rounded-lg">
                      <div className="w-10 h-10">
                        {renderAvatarContent(avatar, 30)}
                      </div>
                      <span className="flex-1">المستوى 30</span>
                      <span className="text-blue-500">إطار زمردي + 3 نجوم</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white p-2 rounded-lg">
                      <div className="w-10 h-10">
                        {renderAvatarContent(avatar, 40)}
                      </div>
                      <span className="flex-1">المستوى 40</span>
                      <span className="text-blue-500">إطار أسطوري + 4 نجوم</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white p-2 rounded-lg">
                      <div className="w-10 h-10">
                        {renderAvatarContent(avatar, 50)}
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

      {/* Settings / Profile Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[5000] flex items-center justify-center p-4"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="card-game p-4 w-full max-w-md space-y-4 overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center flex-row-reverse">
                <h2 className="text-2xl font-black text-[#2D3436]">ملف اللاعب</h2>
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-4">
                {/* Stats Section */}
                <div className="bg-gray-100 p-3 rounded-2xl border-2 border-gray-200 space-y-4">
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="relative w-16 h-16">
                      {renderAvatarContent(avatar, getLevel(xp))}
                    </div>
                    <div className="text-right flex-1">
                      <div className="font-black text-lg text-[#2D3436]">{playerName}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 flex-row-reverse">
                        <span className="text-xs font-black text-gray-600">Level {getLevel(xp)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2" dir="ltr">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (getLevel(xp) / 50) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-5 shadow-inner overflow-hidden relative border border-gray-200" dir="ltr">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-orange-500 h-full transition-all duration-500" 
                          style={{ width: `${getXpProgress(xp)}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-black text-orange-900 drop-shadow-sm flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {xp} / {getXpForNextLevel(getLevel(xp))} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    {renderStars(getLevel(xp))}
                  </div>
                </div>

                {/* Edit Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-1 text-right">الاسم</label>
                    <input 
                      type="text" 
                      value={playerName}
                      onChange={(e) => {
                        const name = e.target.value;
                        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
                        if (!emojiRegex.test(name)) {
                          setPlayerName(name.slice(0, 15));
                        }
                      }}
                      className="input-game"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-1 text-right">العمر</label>
                    <input 
                      type="number" 
                      value={playerAge}
                      onChange={(e) => {
                        const convertArabicNumbers = (str: string) => {
                          // تحويل الأرقام العربية (٠-٩) والأرقام الفارسية (۰-۹)
                          return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
                                    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
                        };
                        const val = convertArabicNumbers(e.target.value);
                        if (val === '') setPlayerAge('');
                        else {
                          const num = parseInt(val);
                          if (!isNaN(num) && num >= 0 && num <= 80) setPlayerAge(num);
                        }
                      }}
                      className="input-game"
                      max={80}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-1 text-right">الجنس</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGender('boy')}
                        className={`flex-1 py-2 rounded-xl font-black transition-all ${gender === 'boy' ? 'bg-blue-100 text-blue-600 border-2 border-blue-200' : 'bg-gray-50 text-gray-400 border-2 border-gray-100'}`}
                      >
                        ولد 👦
                      </button>
                      <button
                        onClick={() => setGender('girl')}
                        className={`flex-1 py-2 rounded-xl font-black transition-all ${gender === 'girl' ? 'bg-pink-100 text-pink-600 border-2 border-pink-200' : 'bg-gray-50 text-gray-400 border-2 border-gray-100'}`}
                      >
                        بنت 👧
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-3 text-right">تغيير الأفاتار</label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATARS.filter(av => av.gender === gender).map((av, index) => {
                        const isLocked = getLevel(xp) < av.level;
                        return (
                          <button
                            key={`settings-avatar-${av.id}-${index}`}
                            onClick={() => !isLocked && setAvatar(av.id)}
                            disabled={isLocked}
                            className={`relative aspect-square rounded-xl flex items-center justify-center border-2 transition-all overflow-hidden ${avatar === av.id ? 'bg-orange-100 border-orange-400 scale-105' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'} ${isLocked ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                          >
                            <div className="w-full h-full p-1">
                              {renderAvatarContent(av.id, 1)}
                            </div>
                            {isLocked && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl z-20">
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
                  <div className="pt-2 border-t border-gray-100">
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

                  {/* Sound Settings */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <h3 className="text-sm font-black text-gray-600 text-right mb-2">الصوت</h3>
                    
                    {/* SFX Volume */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                          <Zap className="w-3 h-3 text-orange-500" />
                          المؤثرات
                        </label>
                        <span className="text-[10px] font-bold text-gray-400">{Math.round(sfxVolume * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSfxVolume(0)} className="text-gray-400 hover:text-gray-600">
                          {sfxVolume === 0 ? <div className="w-4 h-4 relative"><div className="absolute w-full h-0.5 bg-current rotate-45 top-1/2"></div><div className="w-3 h-3 border-2 border-current rounded-full"></div></div> : <div className="w-4 h-4 border-2 border-current rounded-full"></div>}
                        </button>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.1" 
                          value={sfxVolume} 
                          onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>
                    </div>

                    {/* Music Volume */}
                    <div className="space-y-2 opacity-60">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                          <span className="text-purple-500">🎵</span>
                          الموسيقى
                        </label>
                        <span className="text-[10px] font-bold text-gray-400">{Math.round(musicVolume * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setMusicVolume(0)} className="text-gray-400 hover:text-gray-600">
                           {musicVolume === 0 ? <div className="w-4 h-4 relative"><div className="absolute w-full h-0.5 bg-current rotate-45 top-1/2"></div><div className="w-3 h-3 border-2 border-current rounded-full"></div></div> : <div className="w-4 h-4 border-2 border-current rounded-full"></div>}
                        </button>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.1" 
                          value={musicVolume} 
                          onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          disabled
                        />
                      </div>
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
                  <div className="bg-gray-50 rounded-2xl p-3 border-2 border-gray-100">
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
                className="w-full btn-game btn-primary py-2 text-lg"
              >
                حفظ التعديلات
              </button>

              <div className="pt-2 border-t border-gray-100">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-sm font-black text-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح الحساب نهائياً
                </button>
              </div>



              {/* Admin Access Button */}
              <div className="pt-2 border-t border-gray-100">
                <button 
                  onClick={isAdmin ? () => { setShowAdminDashboard(true); setShowSettingsModal(false); } : handleAdminLogin}
                  className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all ${isAdmin ? 'bg-purple-100 text-purple-600 border-2 border-purple-200' : 'bg-gray-50 text-gray-400 border-2 border-gray-100 hover:bg-gray-100'}`}
                >
                  <Shield className="w-4 h-4" />
                  {isAdmin ? 'فتح لوحة الإدارة' : 'دخول الإدارة (للمديرين فقط)'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Welcome Modal */}
        <AnimatePresence>
          {showWelcomeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="card-game p-4 w-full max-w-sm space-y-3 my-auto"
              >
                <div className="text-center space-y-2">
                  <img src="/icon-3.png" alt="Logo" className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 object-contain" />
                  <h2 className="text-xl md:text-2xl font-black text-[#2D3436]">أهلاً بك في خمن تخمينة!</h2>
                  <p className="text-gray-500 font-bold text-sm md:text-base">يرجى إكمال بياناتك للبدء</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-1 text-right">اسم اللاعب</label>
                    <input 
                      type="text" 
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value.slice(0, 15))}
                      placeholder="ادخل اسمك..."
                      className="input-game"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-1 text-right">عمر اللاعب</label>
                    <input 
                      type="text" 
                      value={playerAge}
                      onChange={(e) => {
                        const convertArabicNumbers = (str: string) => {
                          return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
                                    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
                        };
                        const val = convertArabicNumbers(e.target.value);
                        if (val === '') setPlayerAge('');
                        else {
                          const num = parseInt(val);
                          if (!isNaN(num) && num <= 80) setPlayerAge(num);
                        }
                      }}
                      placeholder="ادخل عمرك..."
                      className="input-game"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-1 text-right">الجنس</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGender('boy')}
                        className={`flex-1 py-3 rounded-xl font-black transition-all ${gender === 'boy' ? 'bg-blue-100 text-blue-600 border-2 border-blue-200' : 'bg-gray-50 text-gray-400 border-2 border-gray-100'}`}
                      >
                        ولد 👦
                      </button>
                      <button
                        onClick={() => setGender('girl')}
                        className={`flex-1 py-3 rounded-xl font-black transition-all ${gender === 'girl' ? 'bg-pink-100 text-pink-600 border-2 border-pink-200' : 'bg-gray-50 text-gray-400 border-2 border-gray-100'}`}
                      >
                        بنت 👧
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-600 mb-3 text-right">اختر أفاتار البداية</label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATARS.filter(av => av.gender === gender).slice(0, 4).map((av, index) => (
                        <button
                          key={`welcome-avatar-${av.id}-${index}`}
                          onClick={() => setAvatar(av.id)}
                          className={`w-full aspect-square rounded-xl flex items-center justify-center border-2 transition-all overflow-hidden ${avatar === av.id ? 'bg-orange-100 border-orange-400 scale-105' : 'bg-gray-50 border-gray-200'}`}
                        >
                          <div className="w-full h-full p-1">
                            {renderAvatarContent(av.id, 1)}
                          </div>
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

        {/* Admin Dashboard */}
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
                      <div className="flex gap-2 mt-1">
                        <button 
                          onClick={() => setAdminTab('players')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'players' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
                        >
                          اللاعبين والبلاغات
                        </button>
                        <button 
                          onClick={() => setAdminTab('images')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'images' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
                        >
                          إدارة الصور
                        </button>
                        <button 
                          onClick={() => setAdminTab('customization')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'customization' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
                        >
                          تخصيص اللعبة
                        </button>
                        <button 
                          onClick={() => setAdminTab('shop')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'shop' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}
                        >
                          المتجر والـ Tokens
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        if (adminTab === 'players') {
                          socket?.emit('admin_get_players', (players: any) => {
                            if (Array.isArray(players)) setAdminPlayers(players);
                          });
                          socket?.emit('admin_get_reports', (reports: any) => {
                            if (Array.isArray(reports)) setAdminReports(reports);
                          });
                        } else {
                          fetchAdminImages();
                        }
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
                  {adminTab === 'shop' ? (
                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                      <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-6 h-6 text-orange-500" />
                            إدارة المتجر والـ Tokens
                          </h3>
                          <p className="text-gray-500 mb-6 font-bold">
                            من هنا يمكنك إدارة باقات الـ Tokens وإرسال Tokens مجانية للاعبين.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Send Tokens Form */}
                            <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                              <h4 className="font-black text-orange-800 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                إرسال Tokens للاعب
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-bold text-orange-600 mb-1">معرف اللاعب (Serial)</label>
                                  <input 
                                    type="text" 
                                    placeholder="مثال: player_12345"
                                    className="w-full p-2 rounded-lg border border-orange-200 focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-orange-600 mb-1">عدد الـ Tokens</label>
                                  <input 
                                    type="number" 
                                    min="1"
                                    defaultValue="5"
                                    className="w-full p-2 rounded-lg border border-orange-200 focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                                <button 
                                  onClick={() => alert('سيتم تفعيل هذه الخاصية قريباً')}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-2 rounded-lg transition-colors"
                                >
                                  إرسال
                                </button>
                              </div>
                            </div>

                            {/* Packages Management */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200">
                              <h4 className="font-black text-gray-800 mb-4">الباقات الحالية</h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                  <div className="font-bold text-sm">باقة 1 Token</div>
                                  <div className="text-orange-600 font-black">10 ج.م</div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                                  <div className="font-bold text-sm">باقة 5 Tokens</div>
                                  <div className="text-orange-600 font-black">40 ج.م</div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                  <div className="font-bold text-sm">باقة 10 Tokens</div>
                                  <div className="text-orange-600 font-black">70 ج.م</div>
                                </div>
                                <button 
                                  onClick={() => alert('سيتم تفعيل تعديل الباقات قريباً')}
                                  className="w-full text-sm text-gray-500 hover:text-orange-600 font-bold py-2 border border-dashed border-gray-300 rounded-lg mt-2 transition-colors"
                                >
                                  + إضافة / تعديل باقة
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : adminTab === 'customization' ? (
                    <AdminCustomization />
                  ) : adminTab === 'players' ? (
                    <>
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
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => setAdminSearchQuery(report.reportedSerial)}
                                    className="flex-1 py-1.5 bg-gray-100 hover:bg-purple-100 hover:text-purple-600 rounded-lg text-[10px] font-black transition-colors"
                                  >
                                    فحص اللاعب
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (window.confirm('هل أنت متأكد من حذف هذا البلاغ؟')) {
                                        socket?.emit('admin_delete_report', report.id, (res: any) => {
                                          if (res.success) {
                                            setAdminReports(prev => prev.filter(r => r.id !== report.id));
                                          }
                                        });
                                      }
                                    }}
                                    className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-black transition-colors"
                                  >
                                    حذف
                                  </button>
                                </div>
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
                          <div className="mt-3 text-sm font-bold text-gray-500 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            إجمالي عدد اللاعبين المسجلين: <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">{adminPlayers.length}</span>
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
                                    <div className="w-14 h-14">
                                      {renderAvatarContent(p.avatar, getLevel(p.xp))}
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

                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                                      <div className="text-[10px] font-bold text-gray-400">الفوز</div>
                                      <div className="text-sm font-black text-gray-700">{p.wins || 0}</div>
                                    </div>
                                    <div className="bg-purple-50 p-2 rounded-xl text-center">
                                      <div className="text-[10px] font-bold text-purple-400">Tokens</div>
                                      <div className="text-sm font-black text-purple-600">{p.tokens || 0}</div>
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
                                            if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                          });
                                        }
                                      }}
                                      className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black hover:bg-purple-600 hover:text-white transition-all"
                                    >
                                      تعديل XP
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const tokensToAdd = prompt('كم عدد الـ Tokens التي تريد إضافتها؟', '1');
                                        if (tokensToAdd !== null && !isNaN(parseInt(tokensToAdd))) {
                                          const currentTokens = p.tokens || 0;
                                          socket?.emit('admin_update_player', { serial: p.serial, updates: { tokens: currentTokens + parseInt(tokensToAdd) } }, (res: any) => {
                                            if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                          });
                                        }
                                      }}
                                      className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                      إعطاء Tokens
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (window.confirm('هل أنت متأكد من حظر هذا اللاعب لمدة 24 ساعة؟')) {
                                          const banUntil = Date.now() + (24 * 60 * 60 * 1000);
                                          socket?.emit('admin_update_player', { serial: p.serial, updates: { banUntil, reports: 0 } }, (res: any) => {
                                            if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                          });
                                        }
                                      }}
                                      className="flex-1 py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black hover:bg-orange-600 hover:text-white transition-all"
                                    >
                                      حظر 24س
                                    </button>
                                    {p.banUntil > Date.now() && (
                                      <button 
                                        onClick={() => {
                                          if (window.confirm('هل أنت متأكد من إلغاء حظر هذا اللاعب؟')) {
                                            socket?.emit('admin_update_player', { serial: p.serial, updates: { banUntil: 0 } }, (res: any) => {
                                              if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                            });
                                          }
                                        }}
                                        className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black hover:bg-green-600 hover:text-white transition-all"
                                      >
                                        إلغاء الحظر
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => {
                                        if (window.confirm('هل أنت متأكد من حظر هذا اللاعب نهائياً؟')) {
                                          socket?.emit('admin_update_player', { serial: p.serial, updates: { isPermanentBan: 1, reports: 0 } }, (res: any) => {
                                            if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                          });
                                        }
                                      }}
                                      className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all"
                                    >
                                      حظر نهائي
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (window.confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟')) {
                                          socket?.emit('admin_delete_player', p.serial, (res: any) => {
                                            if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
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
                    </>
                  ) : (
                    /* Images Management Tab */
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Upload Form */}
                        <div className="lg:col-span-1 space-y-6">
                          <div className="bg-white p-6 rounded-3xl border-2 border-purple-100 shadow-sm">
                            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                              <Upload className="w-5 h-5 text-purple-600" />
                              رفع صورة جديدة
                            </h3>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الفئة</label>
                                <select 
                                  value={newImage.category}
                                  onChange={(e) => setNewImage({...newImage, category: e.target.value})}
                                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-700 focus:border-purple-500 outline-none"
                                >
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">اسم الصورة (بالعربي)</label>
                                <input 
                                  type="text" 
                                  value={newImage.name}
                                  onChange={(e) => setNewImage({...newImage, name: e.target.value})}
                                  placeholder="مثال: أسد"
                                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-700 focus:border-purple-500 outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الصورة</label>
                                <div className="relative group cursor-pointer">
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setNewImage({...newImage, data: reader.result as string});
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  />
                                  <div className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${newImage.data ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-gray-50 group-hover:border-purple-300'}`}>
                                    {newImage.data ? (
                                      <img src={newImage.data} alt="Preview" className="h-full w-full object-contain p-2" />
                                    ) : (
                                      <>
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-400">اضغط لاختيار صورة</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button 
                                onClick={handleImageUpload}
                                disabled={isUploading || !newImage.name || !newImage.data}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-black hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                              >
                                {isUploading ? (
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Upload className="w-5 h-5" />
                                    رفع الصورة
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Category Management */}
                          <div className="bg-white p-6 rounded-3xl border-2 border-purple-100 shadow-sm">
                            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                              <Plus className="w-5 h-5 text-purple-600" />
                              إدارة الفئات
                            </h3>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">اسم الفئة</label>
                                <input 
                                  type="text" 
                                  value={newCategory.name}
                                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                                  placeholder="مثال: سيارات"
                                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-700 focus:border-purple-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">أيقونة الفئة (إيموجي)</label>
                                <input 
                                  type="text" 
                                  value={newCategory.icon}
                                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                                  placeholder="مثال: 🚗"
                                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-700 focus:border-purple-500 outline-none"
                                />
                              </div>
                              <button 
                                onClick={handleAddCategory}
                                disabled={isAddingCategory || !newCategory.name || !newCategory.icon}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-black hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                              >
                                {isAddingCategory ? (
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="w-5 h-5" />
                                    إضافة الفئة
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="mt-6 space-y-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">الفئات الحالية</label>
                              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                {categories.map(cat => (
                                  <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{cat.icon}</span>
                                      <span className="font-bold text-sm text-gray-700">{cat.name}</span>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteCategory(cat.id)}
                                      className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Images List */}
                        <div className="lg:col-span-2 space-y-6">
                          <div className="bg-white p-6 rounded-3xl border-2 border-purple-100 shadow-sm min-h-[500px] flex flex-col">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-purple-600" />
                                الصور المرفوعة ({adminImages.length})
                              </h3>
                              <div className="relative w-full md:w-64">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input 
                                  type="text"
                                  placeholder="ابحث عن صورة..."
                                  value={adminImageSearchQuery}
                                  onChange={(e) => setAdminImageSearchQuery(e.target.value)}
                                  className="w-full pr-10 pl-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-400 focus:bg-white transition-all font-bold text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                              {categories.map(category => {
                                const categoryImages = adminImages.filter(img => 
                                  img.category === category.id && 
                                  img.name.toLowerCase().includes(adminImageSearchQuery.toLowerCase())
                                );

                                if (categoryImages.length === 0) return null;

                                return (
                                  <div key={category.id} className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-md font-bold text-gray-700 border-b-2 border-gray-100 pb-2">
                                      <span className="text-2xl">{category.icon}</span>
                                      {category.name}
                                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full mr-auto">
                                        {categoryImages.length} صور
                                      </span>
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                      {categoryImages.map((img) => (
                                        <div key={img.id} className="bg-gray-50 rounded-xl border-2 border-gray-100 overflow-hidden flex flex-col">
                                          <img src={img.data || `https://picsum.photos/seed/${img.name}/200/200`} alt={img.name} className="w-full aspect-square object-cover" />
                                          <div className="p-3 flex items-center justify-between gap-2 bg-white border-t border-gray-100">
                                            <span className="text-gray-700 font-bold text-sm truncate" title={img.name}>{img.name}</span>
                                            <button 
                                              onClick={() => handleDeleteImage(img.id)}
                                              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
                                              title="حذف الصورة"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}

                              {adminImages.length === 0 && (
                                <div className="text-center py-12 text-gray-400 font-bold">
                                  لا توجد صور مرفوعة حالياً
                                </div>
                              )}
                              {adminImages.length > 0 && categories.every(cat => 
                                adminImages.filter(img => img.category === cat.id && img.name.toLowerCase().includes(adminImageSearchQuery.toLowerCase())).length === 0
                              ) && (
                                <div className="text-center py-12 text-gray-400 font-bold">
                                  لا توجد نتائج للبحث
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
              onClick={() => setShowReportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="card-game p-4 w-full max-w-md text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-3xl font-black text-[#2D3436] mb-4">الإبلاغ عن {opponent.name}</h3>
                <div className="space-y-4 mb-4">
                  <button 
                    onClick={() => handleReportPlayer('محتوى مسيء في الشات')}
                    className="w-full btn-game btn-danger bg-red-100 border-red-200 text-red-500 hover:bg-red-200 py-2 text-lg"
                  >
                    محتوى مسيء في الشات
                  </button>
                  <button 
                    onClick={() => handleReportPlayer('سلوك غير لائق')}
                    className="w-full btn-game btn-danger bg-red-100 border-red-200 text-red-500 hover:bg-red-200 py-2 text-lg"
                  >
                    سلوك غير لائق
                  </button>
                  <button 
                    onClick={() => handleReportPlayer('استخدام الغش')}
                    className="w-full btn-game btn-danger bg-red-100 border-red-200 text-red-500 hover:bg-red-200 py-2 text-lg"
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
      </AnimatePresence>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {showCropper && imageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[6000] flex flex-col items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md aspect-square bg-black rounded-3xl overflow-hidden mb-4 shadow-2xl border-4 border-white/20">
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
    </>
  );

  if (isPermanentBan || (banUntil && banUntil > Date.now())) {
    const isPermanent = isPermanentBan;
    const remainingHours = banUntil ? Math.floor((banUntil - Date.now()) / (1000 * 60 * 60)) : 0;
    const remainingMinutes = banUntil ? Math.floor(((banUntil - Date.now()) % (1000 * 60 * 60)) / (1000 * 60)) : 0;
    
    return (
      <>
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
                  if (serial) {
                    if (socket && socket.connected) {
                      socket.emit('delete_account', { playerSerial: serial }, (res: any) => {
                        localStorage.clear();
                        window.location.reload();
                      });
                    } else {
                      localStorage.clear();
                      window.location.reload();
                    }
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
        {renderModals()}
      </div>
      </>
    );
  }

  if (isSearching) {
    return (
      <>
      <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-y-auto pt-24">
          {/* Fixed Header */}
          <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md px-3 md:px-6 flex justify-between items-center z-[2000] shadow-sm border-b-4 border-gray-100 h-14 md:h-16">
            <div className="flex-1 flex items-center gap-2 md:gap-3">
              <img src="/icon-3.png" alt="Logo" className="w-9 h-9 md:w-10 md:h-10 object-contain" />
              <div className="font-black text-lg md:text-xl text-[#FF6B6B] tracking-tight drop-shadow-sm hidden sm:block">خمن تخمينة</div>
            </div>
            
            <div className="flex-1 flex items-center justify-end gap-1.5 md:gap-3">
              {/* Home Button (Cancels Search) */}
              <button 
                onClick={() => {
                  setJoined(false); 
                  setIsSearching(false); 
                  setProposedMatch(null); 
                  setHasResponded(false); 
                  socket?.emit('leave_matchmaking');
                }}
                className="w-9 h-9 md:w-10 md:h-10 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 transition-colors"
                title="الرئيسية"
              >
                <Home className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Info Button */}
              <button 
                onClick={toggleLevelInfo}
                className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors relative"
                title="معلومات المستوى"
              >
                <Info className="w-4 h-4 md:w-5 md:h-5" />
                {!hasSeenLevelInfo && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>

              {/* Shop Button */}
              <button 
                onClick={toggleShop}
                className="w-9 h-9 md:w-10 md:h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center hover:bg-orange-100 hover:text-orange-600 transition-colors"
                title="المتجر"
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Settings Button */}
              <button 
                onClick={toggleSettings}
                className="w-9 h-9 md:w-10 md:h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors"
                title="الإعدادات"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </header>

        <div className="w-full max-w-md card-game p-3 md:p-6 text-center space-y-3 md:space-y-6 relative overflow-hidden">
          {proposedMatch ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 md:space-y-6"
            >
              <h2 className="text-2xl md:text-3xl font-black text-[#2D3436]">تم العثور على منافس!</h2>
              <div className="flex flex-col items-center p-4 md:p-6 bg-orange-50 rounded-3xl border-4 border-orange-100 relative">
                <div className="relative mb-2 md:mb-4 w-24 h-24 md:w-32 md:h-32">
                  {renderAvatarContent(proposedMatch.opponent.avatar, proposedMatch.opponent.level || getLevel(proposedMatch.opponent.xp || 0))}
                </div>
                <div className="text-xl md:text-2xl font-black text-[#2D3436] mb-1">{proposedMatch.opponent.name}</div>
                <div className="text-sm md:text-base font-bold text-gray-500">Level {proposedMatch.opponent.level || getLevel(proposedMatch.opponent.xp || 0)}</div>
                {matchResponseTimeLeft !== null && (
                  <div className="mt-4 text-orange-500 font-bold text-lg flex items-center gap-2">
                    <Timer className="w-5 h-5" />
                    <span>{matchResponseTimeLeft} ثانية</span>
                  </div>
                )}
              </div>
              
              {!hasResponded ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3 md:gap-4">
                    <button 
                      onClick={() => {
                        setHasResponded(true);
                        socket?.emit('respond_to_match', { matchId: proposedMatch.matchId, response: 'accept' });
                      }}
                      className="flex-1 btn-game btn-primary py-3 md:py-4 text-lg md:text-xl animate-pulse"
                    >
                      قبول التحدي! ⚔️
                    </button>
                    <button 
                      onClick={() => {
                        setHasResponded(true);
                        socket?.emit('respond_to_match', { matchId: proposedMatch.matchId, response: 'reject' });
                        setProposedMatch(null);
                      }}
                      className="flex-1 btn-game btn-secondary py-3 md:py-4 text-lg md:text-xl bg-gray-100 text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                    >
                      رفض
                    </button>
                  </div>
                  {opponentAccepted && (
                    <div className="text-green-600 font-bold bg-green-50 p-2 rounded-lg border border-green-200 animate-pulse">
                      المنافس وافق على التحدي! بانتظارك...
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-gray-500 font-bold animate-pulse">
                    جاري انتظار رد المنافس...
                  </div>
                  {opponentAccepted && (
                    <div className="text-green-600 font-bold bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                      المنافس وافق! جاري بدء اللعبة...
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 animate-pulse"></div>
                <Loader2 className="w-16 h-16 md:w-24 md:h-24 text-blue-500 animate-spin mx-auto relative z-10" />
              </div>
              <div className="space-y-2 md:space-y-3 relative z-10">
                <h2 className="text-2xl md:text-3xl font-black text-[#2D3436]">جاري البحث عن منافس...</h2>
                <p className="text-base md:text-lg text-gray-500 font-bold">يتم البحث عن لاعبين بمستوى قريب منك</p>
                {searchTimeLeft !== null && (
                  <div className="flex justify-center items-center gap-2 text-blue-500 font-bold text-lg mt-2">
                    <Timer className="w-5 h-5" />
                    <span dir="ltr">{Math.floor(searchTimeLeft / 60)}:{(searchTimeLeft % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
                <div className="flex flex-col items-center gap-2 mt-2">
                  <div className="text-sm font-black text-blue-500 bg-blue-50 inline-block px-3 py-1 rounded-full">
                    عدد المتصلين: {onlineCount}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 md:pt-8 relative z-10">
                <button 
                  onClick={() => {
                    setIsSearching(false);
                    setJoined(false);
                    socket?.emit('leave_matchmaking');
                  }}
                  className="px-8 py-3 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all shadow-lg hover:shadow-red-500/30 text-sm md:text-base"
                >
                  إلغاء البحث
                </button>
              </div>
            </>
          )}
        </div>

        {renderModals()}
      </div>
      </>
    );
  }

  if (!joined) {
    return (
      <>
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md px-3 md:px-6 flex justify-between items-center z-[2000] shadow-sm border-b-4 border-gray-100 h-14 md:h-16">
          <div className="flex-1 flex items-center gap-2 md:gap-3">
            <img src="/icon-3.png" alt="Logo" className="w-9 h-9 md:w-10 md:h-10 object-contain" />
            <div className="font-black text-lg md:text-xl text-[#FF6B6B] tracking-tight drop-shadow-sm block">خمن تخمينة</div>
          </div>
          
          <div className="flex-1 flex items-center justify-end gap-1.5 md:gap-3">
            {/* Info Button */}
            <button 
              onClick={toggleLevelInfo}
              className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors relative"
              title="معلومات المستوى"
            >
              <Info className="w-4 h-4 md:w-5 md:h-5" />
              {!hasSeenLevelInfo && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>

            {/* Shop Button */}
            <button 
              onClick={toggleShop}
              className="w-9 h-9 md:w-10 md:h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center hover:bg-orange-100 hover:text-orange-600 transition-colors"
              title="المتجر"
            >
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Settings Button */}
            <button 
              onClick={toggleSettings}
              className="w-9 h-9 md:w-10 md:h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors"
              title="الإعدادات"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </header>

        <div className="min-h-screen w-full flex items-center justify-center p-4 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-2"
        >

          {/* Profile Card */}
          <div className="flex items-center gap-3 md:gap-4 bg-white/90 backdrop-blur-sm p-3 md:p-4 rounded-3xl shadow-md border-2 border-white/50 flex-row-reverse mb-6 md:mb-10 w-full">
              <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20">
                {renderAvatarContent(avatar, getLevel(xp))}
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1 flex-row-reverse">
                  <div className="text-sm md:text-base font-black text-[#2D3436] truncate text-right">{playerName || 'لاعب جديد'}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100 flex items-center gap-1">
                      {tokens} <span className="text-[10px] text-purple-400">Tokens</span>
                    </span>
                    <span className="text-xs md:text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Level {getLevel(xp)}</span>
                  </div>
                </div>
                
                {/* Level Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 shadow-inner overflow-hidden mb-2" dir="ltr">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (getLevel(xp) / 50) * 100)}%` }}
                  ></div>
                </div>
                
                {/* XP Bar */}
                <div className="w-full bg-gray-100 rounded-full h-5 md:h-6 shadow-inner overflow-hidden relative border border-gray-200" dir="ltr">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-full transition-all duration-500" 
                    style={{ width: `${getXpProgress(xp)}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] md:text-xs font-black text-orange-900 drop-shadow-sm flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {xp} / {getXpForNextLevel(getLevel(xp))} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>

          <div className="card-game p-3 md:p-5">

          <div className="space-y-4 md:space-y-6">
            {/* Top Players Section */}
            <div className="flex flex-col gap-2">
              
              {/* Podium Box with Integrated Header */}
              <div className="bg-gray-50/30 rounded-[32px] border-2 border-gray-100/50 px-3 md:px-5 pb-2 pt-4 mt-2 relative">
                {/* Integrated Header */}
                <div className="flex items-center justify-between flex-row-reverse mb-8 pb-2">
                  <h2 className="text-sm md:text-base font-black text-[#2D3436] flex items-center gap-2">
                    أبطال التخمين
                  </h2>
                  <span className="text-[10px] md:text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">المتصدرون حالياً</span>
                </div>
                <div className="flex items-end justify-center gap-2 md:gap-4">
                  {/* Rank 2 */}
                  {topPlayers[1] && (
                    <div key={`${topPlayers[1].serial || 'unknown'}-rank-2`} className="flex flex-col items-center flex-1 z-10">
                      <div className="relative mb-2 flex flex-col items-center">
                        <div className="w-14 h-14 md:w-16 md:h-16">
                          {renderAvatarContent(topPlayers[1].avatar, topPlayers[1].level || getLevel(topPlayers[1].xp || 0))}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-gray-200 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-sm z-[60]">2</div>
                      </div>
                      <div className="text-[10px] md:text-xs font-black text-[#2D3436] truncate w-full text-center max-w-[80px] md:max-w-[100px]">{truncateName(topPlayers[1].name)}</div>
                      <div className="flex flex-col items-center gap-0.5 mt-1 mb-1">
                        <div className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          Lvl {topPlayers[1].level || getLevel(topPlayers[1].xp || 0)}
                        </div>
                        <div className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5" />
                          {topPlayers[1].wins || 0} فوز
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 h-16 md:h-20 rounded-t-xl mt-1 shadow-inner border-t-4 border-gray-300"></div>
                    </div>
                  )}

                  {/* Rank 1 */}
                  {topPlayers[0] && (
                    <div key={`${topPlayers[0].serial || 'unknown'}-rank-1`} className="flex flex-col items-center flex-1 z-20 -mt-8 md:-mt-12">
                      <div className="relative mb-2 flex flex-col items-center scale-110 md:scale-125">
                        <Crown className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 drop-shadow-md z-[60]" />
                        <div className="w-16 h-16 md:w-20 md:h-20">
                          {renderAvatarContent(topPlayers[0].avatar, topPlayers[0].level || getLevel(topPlayers[0].xp || 0))}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow-md z-[60] animate-bounce">1</div>
                      </div>
                      <div className="text-xs md:text-sm font-black text-[#2D3436] truncate w-full text-center mt-2 max-w-[90px] md:max-w-[120px]">{truncateName(topPlayers[0].name)}</div>
                      <div className="flex flex-col items-center gap-1 mt-1 mb-1">
                        <div className="text-[10px] font-bold text-gray-500 bg-yellow-100 px-3 py-1 rounded-full">
                          Lvl {topPlayers[0].level || getLevel(topPlayers[0].xp || 0)}
                        </div>
                        <div className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {topPlayers[0].wins || 0} فوز
                        </div>
                      </div>
                      <div className="w-full bg-gradient-to-b from-yellow-100 to-yellow-50 h-24 md:h-32 rounded-t-xl mt-1 shadow-inner border-t-4 border-yellow-300"></div>
                    </div>
                  )}

                  {/* Rank 3 */}
                  {topPlayers[2] && (
                    <div key={`${topPlayers[2].serial || 'unknown'}-rank-3`} className="flex flex-col items-center flex-1 z-10">
                      <div className="relative mb-2 flex flex-col items-center">
                        <div className="w-14 h-14 md:w-16 md:h-16">
                          {renderAvatarContent(topPlayers[2].avatar, topPlayers[2].level || getLevel(topPlayers[2].xp || 0))}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-orange-200 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-sm z-[60]">3</div>
                      </div>
                      <div className="text-[10px] md:text-xs font-black text-[#2D3436] truncate w-full text-center max-w-[80px] md:max-w-[100px]">{truncateName(topPlayers[2].name)}</div>
                      <div className="flex flex-col items-center gap-0.5 mt-1 mb-1">
                        <div className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          Lvl {topPlayers[2].level || getLevel(topPlayers[2].xp || 0)}
                        </div>
                        <div className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5" />
                          {topPlayers[2].wins || 0} فوز
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 h-12 md:h-16 rounded-t-xl mt-1 shadow-inner border-t-4 border-gray-300"></div>
                    </div>
                  )}
                </div>

                {/* Player Rank Info */}
                {(() => {
                  const myRankIndex = topPlayers.findIndex(p => p.serial === playerSerial);
                  if (myRankIndex > 2) {
                    return (
                      <div className="mt-2 md:mt-3 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-full py-1.5 px-4 md:py-2 md:px-6 text-center shadow-sm mx-auto w-fit">
                        <p className="text-orange-700 font-bold text-xs md:text-sm">
                          ترتيبك الحالي في ابطال التخمين {myRankIndex + 1} 💪
                        </p>
                      </div>
                    );
                  } else if (myRankIndex === -1) {
                    return (
                      <div className="mt-2 md:mt-3 bg-white border border-gray-200 rounded-full py-1 px-3 md:py-1.5 md:px-4 text-center shadow-sm mx-auto w-fit">
                        <p className="text-gray-500 font-bold text-[10px] md:text-[11px]">
                          لست ضمن أفضل 100 لاعب حتى الآن. استمر في اللعب!
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
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
                    onChange={(e) => {
                      // Normalize Arabic numbers to English
                      const val = e.target.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
                      setRoomId(val);
                    }}
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

              <div className="flex items-center gap-3 mb-4 bg-purple-50 p-3 rounded-xl border-2 border-purple-100">
                <input 
                  type="checkbox" 
                  id="useToken" 
                  checked={useToken} 
                  onChange={(e) => setUseToken(e.target.checked)}
                  disabled={tokens <= 0}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="useToken" className="flex-1 flex items-center justify-between cursor-pointer select-none">
                  <span className={`font-bold ${tokens > 0 ? 'text-purple-900' : 'text-gray-400'}`}>
                    استخدام Token للعب مع مستوى 40+
                  </span>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg shadow-sm border border-purple-100">
                    <span className="font-black text-purple-600">{tokens}</span>
                    <span className="text-xs text-gray-500 font-bold">Tokens</span>
                  </div>
                </label>
              </div>

              <button 
                onClick={handleRandomMatch}
                className="w-full btn-game btn-primary py-3 md:py-4 text-lg md:text-xl gap-2 md:gap-3 cursor-pointer touch-manipulation"
              >
                <Users className="w-5 h-5 md:w-6 md:h-6" />
                بحث عشوائي
              </button>
            </div>
          </div>
        </div>
        </motion.div>
      </div>

      {renderModals()}
      </>
    );
  }

  if (!room) {
    if (isSearching) return null; // Handled by isSearching block
    if (!joined) return null; // Handled by !joined block
    return <div className="min-h-screen w-full flex items-center justify-center text-[#2D3436] font-black text-2xl animate-pulse">جاري التحميل... 🚀</div>;
  }

  return (
    <div className="min-h-screen w-full font-sans flex flex-col relative overflow-y-auto pt-16 md:pt-20">
      {/* Install Modal */}
      {showInstallModal && deferredPrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-4 border-orange-500">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🎮</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">خمن تخمينة</h2>
            <p className="text-gray-600 mb-6 font-medium">
              لعبة خمن تخمينة هي لعبة جماعية أونلاين لشخصين مع مؤثرات تفاعلية وكروت مساعدة
            </p>
            <button 
              onClick={handleInstallClick}
              className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl text-lg hover:bg-orange-600 transition-colors mb-3"
            >
              تثبيت اللعبة
            </button>
            <button 
              onClick={handleCloseInstallModal}
              className="w-full py-2 text-gray-400 font-bold hover:text-gray-600"
            >
              ليس الآن
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md px-3 md:px-6 flex justify-between items-center z-[2000] shadow-sm border-b-4 border-gray-100 h-14 md:h-16">
        <div className="flex-1 flex items-center gap-2 md:gap-3">
          <img src="/icon-3.png" alt="Logo" className="w-9 h-9 md:w-10 md:h-10 object-contain" />
          <div className="font-black text-lg md:text-xl text-[#FF6B6B] tracking-tight drop-shadow-sm hidden sm:block">خمن تخمينة</div>
        </div>
        
        {/* Game Info (Center) */}
        <div className="flex-shrink-0 flex items-center gap-1.5 md:gap-2 mx-2">
           {room.gameState !== 'waiting' && (
            <div className={`flex items-center justify-center min-w-[70px] md:min-w-[80px] gap-1 md:gap-1.5 px-2 md:px-3 py-1 rounded-full text-sm md:text-base font-black transition-colors border-2 ${room.isFrozen ? 'bg-cyan-100 text-cyan-600 border-cyan-200 animate-pulse' : room.timer <= 10 && room.gameState === 'guessing' ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {room.isFrozen ? <Snowflake className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Timer className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              {room.isFrozen ? (
                <span className="text-xs md:text-sm">{room.freezeTimer}s</span>
              ) : (
                <span className="text-sm md:text-base">{Math.max(0, Math.floor(room.timer / 60))}:{(Math.max(0, room.timer % 60)).toString().padStart(2, '0')}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 bg-blue-100 text-blue-600 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-black border-2 border-blue-200">
            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>{room.players.length}/2</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-1.5 md:gap-3">
          {/* Home Button (Leave Game) */}
          <button 
            onClick={handleLeaveGame}
            className="w-12 h-12 md:w-10 md:h-10 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer touch-manipulation"
            title="الرئيسية"
          >
            <Home className="w-6 h-6 md:w-5 md:h-5" />
          </button>

          {/* Info Button */}
          <button 
            onClick={toggleLevelInfo}
            className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors relative"
            title="معلومات المستوى"
          >
            <Info className="w-4 h-4 md:w-5 md:h-5" />
            {!hasSeenLevelInfo && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </button>

          {/* Shop Button */}
          <button 
            onClick={toggleShop}
            className="w-9 h-9 md:w-10 md:h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center hover:bg-orange-100 hover:text-orange-600 transition-colors"
            title="المتجر"
          >
            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Settings Button */}
          <button 
            onClick={toggleSettings}
            className="w-9 h-9 md:w-10 md:h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors"
            title="الإعدادات"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </header>


      <main className="flex-1 relative flex flex-col items-center justify-between py-2 px-2 max-w-md mx-auto w-full">
        {/* Opponent (Top) */}
        <div className="relative flex flex-col items-center justify-center w-full flex-1">
          {opponent && (
            <>
              <div className="relative w-16 h-16 md:w-24 md:h-24">
                {renderAvatarContent(opponent.avatar, opponent.level || getLevel(opponent.xp || 0), false)}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm z-20 whitespace-nowrap">
                  Lvl {opponent.level || getLevel(opponent.xp || 0)}
                </div>
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
              <div className="mt-1 font-black text-base flex items-center gap-2 text-[#2D3436] bg-white/80 px-4 py-1 rounded-full shadow-sm backdrop-blur-sm">
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
                  <MessageSquareOff className="w-4 h-4" />
                </button>
              </div>
              {opponent.age && <div className="text-xs text-gray-500 font-bold mt-1">({opponent.age} سنة)</div>}
            </>
          )}
        </div>

        {/* Center Content: Image or Waiting UI */}
        <div className="flex-[2] flex flex-col items-center justify-center w-full max-w-2xl relative my-0.5 min-h-0 overflow-hidden">
          {room.gameState === 'waiting' ? (
            <div className="w-full card-game p-3 md:p-6 text-center space-y-3 md:space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <div 
                  className="h-full bg-orange-500 transition-all duration-1000" 
                  style={{ width: `${(room.timer / 60) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center bg-white/50 p-3 rounded-2xl border border-orange-100 shadow-sm">
                <h2 className={`text-lg md:text-xl font-black text-orange-600 ${room.players.length < 2 ? 'animate-pulse' : ''}`}>
                  {room.players.length < 2 ? 'بانتظار المنافس...' : 'اتفقوا على فئة التخمين للبدء!'}
                </h2>
                <div className={`text-lg font-black font-mono px-3 py-1 rounded-lg ${room.isFrozen ? 'text-cyan-500 bg-cyan-50 animate-pulse' : 'text-red-500 bg-gray-100'}`}>
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
                <div className="grid grid-cols-4 gap-2">
                  {categories.map(cat => {
                    const isMyChoice = me?.selectedCategory === cat.id;
                    const isOpponentChoice = opponent?.selectedCategory === cat.id;
                    const isAgreed = isMyChoice && isOpponentChoice;
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => socket?.emit('select_category', { roomId, category: cat.id })}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all border-b-4 active:border-b-0 active:translate-y-1 relative
                          ${isAgreed ? 'bg-green-100 text-green-600 border-green-400 scale-105 ring-2 ring-green-400 ring-offset-2' : isMyChoice ? 'bg-orange-100 text-orange-600 border-orange-300 scale-105' : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200 hover:text-gray-700'}
                          ${isOpponentChoice && !isMyChoice ? 'hint-glow' : ''}
                        `}
                      >
                        <span className="text-2xl md:text-3xl">{cat.icon}</span>
                        <span className="text-[10px] md:text-xs font-black truncate w-full">{cat.name}</span>
                        {isOpponentChoice && !isMyChoice && (
                          <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-bounce z-10">
                            اقتراح!
                          </div>
                        )}
                        {isAgreed && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-bounce z-10">
                            متفق عليه!
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* WhatsApp Style Chat Box - Hidden when consensus reached or waiting for opponent */}
                {!consensusReached && room.players.length >= 2 && (
                  <div className="w-full bg-[#E5DDD5] rounded-2xl border-4 border-white shadow-inner overflow-hidden flex flex-col h-48 mt-4 relative">
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
                          <div key={`waiting-chat-${msg.id}-${index}`} className={`flex ${msg.senderId === socket?.id ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-2 px-3 rounded-xl text-sm font-bold shadow-sm relative ${msg.senderId === socket?.id ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                              <div className={`text-[9px] mb-0.5 ${msg.senderId === socket?.id ? 'text-green-600 text-right' : 'text-blue-600 text-left'}`}>
                                {msg.playerName}
                              </div>
                              <div className={`leading-tight ${msg.senderId === socket?.id ? 'text-right' : 'text-left'}`}>{msg.text}</div>
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
                        placeholder="اسأل المنافس وخمن الاجابة..."
                        className="flex-1 bg-white border-none rounded-full px-4 py-2 text-base outline-none shadow-sm font-bold disabled:bg-gray-200 disabled:cursor-not-allowed"
                        maxLength={200}
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
                )}
              </div>

              {consensusReached && (
                <motion.button 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  onClick={handleStartGame}
                  className="w-full btn-game btn-success py-4 text-xl"
                >
                  ابدأ اللعبة الآن! 🚀
                </motion.button>
              )}
            </div>
          ) : (
            <div className="relative w-full flex flex-col items-center">
              {/* Quick Guess Overlay for the one guessing */}
              {room.isPaused && room.pausingPlayerId === me?.id && (
                <div 
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
                </div>
              )}

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
                    <div className="relative w-full max-w-[13rem] md:max-w-[16rem] aspect-square bg-white p-1.5 rounded-[24px] shadow-[0_8px_20px_rgba(0,0,0,0.15)] overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-300 border-2 border-white flex items-center justify-center mb-4 md:mb-0">
                      <img 
                        src={opponent?.targetImage?.image} 
                        className={`w-full h-full object-cover rounded-xl ${funnyFilter === opponent?.id ? 'invert sepia hue-rotate-90 scale-110' : ''}`}
                        alt="Target"
                      />
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-0.5 rounded-full font-black text-xs md:text-sm text-[#2D3436] shadow-sm border border-gray-200 backdrop-blur-sm z-10 whitespace-nowrap">
                        {opponent?.targetImage?.name}
                      </div>
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
                    className="relative z-[150] w-full max-w-md px-2 flex flex-col items-center mt-1"
                  >
                    <form onSubmit={handleGuess} className="w-full flex flex-col gap-2 card-game p-2 md:p-4 guess-glow border-orange-200">
                      <div className="text-center font-black text-orange-500 animate-pulse mb-0.5 text-lg md:text-2xl">
                        أسرع! خمن الآن ({room.isFrozen ? room.freezeTimer : room.timer}s)
                      </div>
                      <div className="flex flex-col gap-2">
                        <input 
                          autoFocus
                          type="text" 
                          value={guess}
                          onChange={(e) => setGuess(e.target.value)}
                          placeholder="ما هي الصورة؟"
                          className="input-game flex-1 py-2 text-center"
                        />
                        <button className="btn-game btn-primary w-full py-2.5 text-base md:text-lg">إرسال</button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gameplay Chat Box - Moved to Center */}
              {room.gameState !== 'waiting' && room.gameState !== 'finished' && room.gameState !== 'guessing' && (
                <div className="w-[80%] md:w-full bg-[#E5DDD5] rounded-2xl border-4 border-white shadow-inner overflow-hidden flex flex-col h-48 md:h-64 mt-4 z-20 relative">
                  {isMutedByOpponent && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white">
                      <Lock className="w-12 h-12 mb-2 text-red-400" />
                      <span className="font-black text-lg text-center px-4">تم حظر الدردشة من قبل المنافس</span>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-400 font-bold text-sm italic">
                        اسأل المنافس وخمن الاجابة...
                      </div>
                    ) : (
                      chatHistory.map((msg, index) => (
                        <div key={`game-chat-${msg.id}-${index}`} className={`flex ${msg.senderId === socket?.id ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] p-1.5 px-2.5 rounded-xl text-xs font-bold shadow-sm relative ${msg.senderId === socket?.id ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                            <div className={`text-[9px] mb-0.5 ${msg.senderId === socket?.id ? 'text-green-600 text-right' : 'text-blue-600 text-left'}`}>
                              {msg.playerName}
                            </div>
                            <div className={`leading-tight ${msg.senderId === socket?.id ? 'text-right' : 'text-left'}`}>{msg.text}</div>
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
                      className="bg-white text-gray-500 p-2 rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all w-10 h-10 flex items-center justify-center"
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
        <div className="relative flex flex-col items-center justify-center flex-1">
          {me && (
            <>
              <div className="relative w-16 h-16 md:w-24 md:h-24">
                {renderAvatarContent(me.avatar, getLevel(xp), false)}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm z-20 whitespace-nowrap">
                  Lvl {getLevel(xp)}
                </div>
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
              <div className="mt-1 font-black text-lg text-[#2D3436] bg-white/80 px-4 py-1 rounded-full shadow-sm backdrop-blur-sm flex items-center gap-2">
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
        <div className="fixed bottom-20 left-2 md:bottom-6 md:left-6 flex flex-col-reverse gap-2 md:gap-3 z-[200]">
          {[
            { 
              id: 'quick_guess', 
              name: 'تخمين سريع', 
              icon: Sparkles, 
              color: 'text-yellow-500', 
              bg: 'bg-white', 
              disabled: room.timer > getQuickGuessThreshold(getLevel(me?.xp || xp)) || me?.quickGuessUsed,
              level: 1,
              hide: room.gameState === 'guessing'
            },
            { 
              id: 'hint', 
              name: 'نصيحة', 
              icon: HelpCircle, 
              color: 'text-blue-500', 
              bg: 'bg-white', 
              disabled: me?.hintCount >= 2,
              level: 10
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
          ].filter(card => !card.hide).map((card) => {
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
                className={`relative w-10 h-10 md:w-16 md:h-16 rounded-full ${card.bg} flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.1)] border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-80 disabled:grayscale disabled:cursor-not-allowed group`}
                title={card.name}
              >
                {isLocked ? (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Lock className="w-4 h-4 md:w-5 md:h-5 mb-0.5" />
                    <span className="text-[8px] md:text-[9px] font-black">Lvl {card.level}</span>
                  </div>
                ) : (
                  <card.icon className={`w-5 h-5 md:w-8 md:h-8 ${card.color}`} />
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[3000] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="relative max-w-xs w-full bg-white rounded-[32px] shadow-2xl p-4 text-center border-4 border-white"
            >
              {room.winnerId === me?.id ? (
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-white shadow-xl animate-bounce">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 mb-1">مبروك! فزت</h2>
                  <p className="text-gray-500 font-bold text-xs">أداء أسطوري يا بطل! 🏆</p>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-white shadow-xl">
                    <span className="text-3xl">😢</span>
                  </div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 mb-1">للأسف! خسرت</h2>
                  <p className="text-gray-500 font-bold text-xs">حظ أوفر في المرة القادمة</p>
                </div>
              )}
              
              <div className="flex flex-col items-center mb-4 bg-gray-50 p-1 rounded-[24px] border-2 border-gray-100">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white shadow-inner border-4 border-white">
                  <img src={me?.targetImage?.image} className="w-full h-full object-cover" alt={me?.targetImage?.name} />
                </div>
                <div className="font-black text-lg text-gray-800 mt-1">{me?.targetImage?.name}</div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => socket?.emit('play_again', { roomId })}
                  className="w-full btn-game btn-success py-3 text-base"
                >
                  العب تاني مع المنافس
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full btn-game btn-primary py-3 text-base"
                >
                  الرئيسية
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Overlay */}
      <AnimatePresence>
        {showLevelUp !== null && (
          <LevelUpModal 
            level={showLevelUp} 
            avatar={avatar} 
            customConfig={customConfig} 
            onClose={() => setShowLevelUp(null)} 
          />
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
      {renderModals()}
    </div>
  );
}
