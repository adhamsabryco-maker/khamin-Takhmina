import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence, animate } from 'motion/react';
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
  ChevronLeft,
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
  ShoppingCart,
  Hash,
  Copy,
  Volume2,
  VolumeX,
  Music,
  Tv
} from 'lucide-react';

const XPAnimatedCounter = ({ finalXP }: { finalXP: number }) => {
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    const controls = animate(0, finalXP, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (value) => setDisplayXP(Math.round(value))
    });
    return () => controls.stop();
  }, [finalXP]);

  return <span className="flex items-center justify-center gap-2" dir="ltr">XP: <span className="text-yellow-400">{displayXP}</span></span>;
};
import confetti from 'canvas-confetti';
import { AdminCustomization } from './components/AdminCustomization';
import { AdminLogin } from './components/AdminLogin';
import { AvatarDisplay } from './components/AvatarDisplay';
import { LevelUpModal } from './components/LevelUpModal';
import { MatchIntro } from './components/MatchIntro';
import { useAvatarConfig } from './contexts/AvatarContext';
import { STATIC_ASSETS } from './constants';
import Cropper from 'react-easy-crop';

// Audio URLs
const SOUNDS = {
  hammer: '/sounds/hammer.mp3',
  win: '/sounds/win.mp3',
  lose: '/sounds/lose.mp3',
  countdown: '/sounds/countdown.mp3',
  correct: '/sounds/correct.mp3',
  message: '/sounds/message.mp3',
  clickOpen: '/sounds/click-open.mp3',
  clickClose: '/sounds/click-close.mp3',
  tick: '/sounds/tick.mp3',
  lobbyBackground: '/sounds/lobby-background-music.mp3',
  gameBackground: '/sounds/start-game-background-music.mp3',
};

interface ThemeConfig {
  bgBodyStart: string;
  bgBodyEnd: string;
  textMain: string;
  textLight: string;
  borderGame: string;
  bgBox: string;
  bgCard: string;
  
  // Buttons
  btnPrimaryBgStart: string;
  btnPrimaryBgEnd: string;
  btnPrimaryBorder: string;
  btnPrimaryHover: string;
  
  btnSecondaryBgStart: string;
  btnSecondaryBgEnd: string;
  btnSecondaryBorder: string;
  btnSecondaryHover: string;

  btnDangerBgStart: string;
  btnDangerBgEnd: string;
  btnDangerBorder: string;
  btnDangerHover: string;

  // Accents
  accentOrange: string;
  accentPurple: string;
  accentBlue: string;
  accentGreen: string;
  
  // Shop & Token
  shopHeaderStart: string;
  shopHeaderEnd: string;
  shopTokenText: string;
  shopInfoTitle: string;
  shopWarningTitle: string;
  shopModalBg: string;

  // Text Shades
  textMuted: string;
  textLightAccent: string;
  textSoft: string;

  // Ranks (Bar Charts)
  rank1BgStart: string;
  rank1BgEnd: string;
  rank1Border: string;

  rank2BgStart: string;
  rank2BgEnd: string;
  rank2Border: string;

  rank3BgStart: string;
  rank3BgEnd: string;
  rank3Border: string;

  // Success Button
  btnSuccessBgStart: string;
  btnSuccessBgEnd: string;
  btnSuccessBorder: string;
  btnSuccessHover: string;

  // Modal
  modalBg: string;
  levelBarBg: string;
  levelBarFill: string;
  xpBarBg: string;
  xpBarFill: string;
  xpBarText: string;
  xpBarTextActive: string;
  reportBarBg: string;
  reportBarLow: string;
  reportBarMedium: string;
  reportBarHigh: string;
}

const DEFAULT_THEME: ThemeConfig = {
  bgBodyStart: '#FFD700',
  bgBodyEnd: '#FF8C00',
  textMain: '#000000',
  textLight: '#FFFFFF',
  borderGame: '#000000',
  bgBox: '#FFFFFF',
  bgCard: '#FFFFFF',
  
  btnPrimaryBgStart: '#FF3366',
  btnPrimaryBgEnd: '#FF0033',
  btnPrimaryBorder: '#000000',
  btnPrimaryHover: '#FF3366',
  
  btnSecondaryBgStart: '#00FFFF',
  btnSecondaryBgEnd: '#00CCCC',
  btnSecondaryBorder: '#000000',
  btnSecondaryHover: '#00FFFF',

  btnSuccessBgStart: '#00FF00',
  btnSuccessBgEnd: '#00CC00',
  btnSuccessBorder: '#000000',
  btnSuccessHover: '#00FF00',

  btnDangerBgStart: '#FFFF00',
  btnDangerBgEnd: '#CCCC00',
  btnDangerBorder: '#000000',
  btnDangerHover: '#FFFF00',

  accentOrange: '#FF3300',
  accentPurple: '#9900FF',
  accentBlue: '#0066FF',
  accentGreen: '#00AA00',

  shopHeaderStart: '#9900FF',
  shopHeaderEnd: '#6600CC',
  shopTokenText: '#000000',
  shopInfoTitle: '#000000',
  shopWarningTitle: '#FF0000',
  shopModalBg: '#FFFFFF',

  textMuted: '#333333',
  textLightAccent: '#666666',
  textSoft: '#999999',

  rank1BgStart: '#FFD700',
  rank1BgEnd: '#FFD700',
  rank1Border: '#000000',

  rank2BgStart: '#C0C0C0',
  rank2BgEnd: '#C0C0C0',
  rank2Border: '#000000',

  rank3BgStart: '#CD7F32',
  rank3BgEnd: '#CD7F32',
  rank3Border: '#000000',
  
  modalBg: '#FFFFFF',
  levelBarBg: '#FFFFFF',
  levelBarFill: '#0066FF',
  xpBarBg: '#FFFFFF',
  xpBarFill: '#FF6600',
  xpBarText: '#000000',
  xpBarTextActive: '#FFFFFF',
  reportBarBg: '#FFFFFF',
  reportBarLow: '#00FF00',
  reportBarMedium: '#FF6600',
  reportBarHigh: '#FF0000',
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
  lastGuess?: string;
  xp: number;
  level?: number;
  streak: number;
  serial?: string;
  wins?: number;
  reports?: number;
  reportedBy?: any[];
  banCount?: number;
  isPermanentBan?: number;
  ownedHelpers?: { [key: string]: number };
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

const POWER_UP_UNLOCKS = [10, 20, 30, 40, 50];
const AVATAR_UNLOCKS = [10, 20, 30, 40, 50];

const DAILY_QUEST_REWARDS = [50, 100, 150, 250, 300, 400, 500];
const HELPER_ITEMS = [
  { id: 'word_length', name: 'كاشف الحروف', icon: '📝' },
  { id: 'word_count', name: 'عدد الكلمات', icon: '🔢' },
  { id: 'time_freeze', name: 'تجميد الوقت', icon: '❄️' },
  { id: 'hint', name: 'تلميح', icon: '💡' },
  { id: 'spy_lens', name: 'الجاسوس', icon: '👁️' }
];

const enterFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
  }
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl rounded-tl-none shadow-sm w-fit border border-gray-100">
    <span className="text-[10px] font-bold text-accent-blue mr-1">المنافس يكتب</span>
    <div className="flex gap-0.5">
      <span className="w-1 h-1 bg-accent-blue rounded-full typing-dot"></span>
      <span className="w-1 h-1 bg-accent-blue rounded-full typing-dot"></span>
      <span className="w-1 h-1 bg-accent-blue rounded-full typing-dot"></span>
    </div>
  </div>
);

const isSameDay = (d1: number, d2: number) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getUTCFullYear() === date2.getUTCFullYear() &&
         date1.getUTCMonth() === date2.getUTCMonth() &&
         date1.getUTCDate() === date2.getUTCDate();
};

const isSameWeek = (d1: number, d2: number) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const firstDayOfWeek = new Date(date1.setDate(date1.getDate() - date1.getDay()));
  const firstDayOfWeek2 = new Date(date2.setDate(date2.getDate() - date2.getDay()));
  return firstDayOfWeek.getFullYear() === firstDayOfWeek2.getFullYear() &&
         firstDayOfWeek.getMonth() === firstDayOfWeek2.getMonth() &&
         firstDayOfWeek.getDate() === firstDayOfWeek2.getDate();
};

export default function App() {
  const { customConfig, refreshConfig } = useAvatarConfig();
  const appVersion = customConfig.version || '1.1.1';

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/api/version');
        const data = await response.json();
        if (data.version && appVersion !== '1.1.1' && data.version !== appVersion) {
          console.log('New version detected, will update on next navigation');
          setNeedsUpdate(true);
        }
      } catch (e) {
        console.error('Failed to check version', e);
      }
    };
    checkVersion();
  }, [appVersion]);

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
  const [showTokenInfoModal, setShowTokenInfoModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);

  const toggleTokenInfo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showTokenInfoModal) {
      playSound('clickClose');
    } else {
      playSound('clickOpen');
    }
    setShowTokenInfoModal(!showTokenInfoModal);
  };

  const [showAdModal, setShowAdModal] = useState(false);
  const [showAdConfirmation, setShowAdConfirmation] = useState(false);
  const [readyPowerUps, setReadyPowerUps] = useState<string[]>([]);
  console.log('App rendering, showAdModal:', showAdModal);
  const [adStatus, setAdStatus] = useState({ adsWatched: 0, maxAds: 5, canWatch: false, loading: true });
  const [adTimer, setAdTimer] = useState(0);

  useEffect(() => {
    if (socket && isConnected && playerSerial) {
      socket.emit('check_ad_status', { serial: playerSerial });

      socket.on('ad_status', (status) => {
        setAdStatus({ ...status, loading: false });
      });

      socket.on('ad_success', (data) => {
        setTokens(data.tokens);
        localStorage.setItem('khamin_tokens', data.tokens.toString());
        setAdStatus(prev => ({ ...prev, adsWatched: data.adsWatched, canWatch: data.adsWatched < data.maxAds }));
        setShowAdModal(false);
        playSound('win');
        showAlert('تمت إضافة الـ Token بنجاح! 🎉', 'نجاح');
      });

      socket.on('ad_error', (msg) => {
        setShowAdModal(false);
        showAlert(msg, 'تنبيه');
      });

      return () => {
        socket.off('ad_status');
        socket.off('ad_success');
        socket.off('ad_error');
      };
    }
  }, [socket, isConnected, playerSerial]);

  const claimAdReward = () => {
    if (adTimer > 0) return;
    
    if (activePowerUp) {
      // Add to ready power-ups so the user can use it manually
      if (!readyPowerUps.includes(activePowerUp)) {
        setReadyPowerUps(prev => [...prev, activePowerUp]);
      }
      setActivePowerUp(null);
    } else {
      // Original token reward logic
      socket?.emit('watch_ad_request', { serial: playerSerial });
    }
    
    if (roomId) {
      socket?.emit('ad_ended', { roomId });
    }
    
    setShowAdModal(false);
  };

  useEffect(() => {
    if (showAdModal && adTimer === 0) {
      claimAdReward();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAdModal, adTimer]);

  const [proPackageExpiry, setProPackageExpiry] = useState<number | null>(() => {
    const saved = localStorage.getItem('khamin_pro_package_expiry');
    if (saved) return parseInt(saved);
    if (localStorage.getItem('khamin_pro_package') === 'true') {
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('khamin_pro_package_expiry', expiry.toString());
      localStorage.removeItem('khamin_pro_package');
      return expiry;
    }
    return null;
  });
  const hasProPackage = proPackageExpiry !== null && proPackageExpiry > Date.now();
  const proPackageDaysLeft = hasProPackage ? Math.ceil((proPackageExpiry! - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [showMatchIntro, setShowMatchIntro] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
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
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin_auth') === 'success') {
      const isAdminParam = params.get('isAdmin') === 'true';
      setIsAdmin(isAdminParam);
      localStorage.setItem('khamin_is_admin', isAdminParam.toString());
      if (isAdminParam) {
        localStorage.setItem('khamin_admin_email', params.get('email') || '');
        localStorage.setItem('khamin_admin_token', params.get('adminToken') || '');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (socket && isConnected && isAdmin) {
      const adminToken = localStorage.getItem('khamin_admin_token');
      const adminEmail = localStorage.getItem('khamin_admin_email');
      socket.emit('admin_set_admin_status', { 
        serial: playerSerial, 
        isAdmin: true, 
        email: adminEmail, 
        adminToken 
      }, (res: any) => {
        if (res?.success) {
          if (Array.isArray(res.players)) setAdminPlayers(res.players);
          if (Array.isArray(res.reports)) setAdminReports(res.reports);
        }
      });
    }
  }, [socket, isConnected, isAdmin, playerSerial]);
  const [adminPlayers, setAdminPlayers] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem('khamin_admin_email') || '');
  const [adminTab, setAdminTab] = useState<'players' | 'images' | 'customization' | 'shop' | 'colors'>('players');
  const [adminImages, setAdminImages] = useState<any[]>([]);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('khamin_theme_config');
    if (saved) {
      try {
        return { ...DEFAULT_THEME, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_THEME;
      }
    }
    return DEFAULT_THEME;
  });
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    if (currentPath === '/admin') {
      if (isAdmin) {
        setShowAdminDashboard(true);
        setShowAdminLogin(false);
      } else {
        setShowAdminDashboard(false);
        setShowAdminLogin(true);
      }
    } else {
      setShowAdminDashboard(false);
      setShowAdminLogin(false);
    }
  }, [currentPath, isAdmin]);

  useEffect(() => {
    localStorage.setItem('khamin_theme_config', JSON.stringify(themeConfig));
    const root = document.documentElement;
    root.style.setProperty('--bg-body-start', themeConfig.bgBodyStart);
    root.style.setProperty('--bg-body-end', themeConfig.bgBodyEnd);
    root.style.setProperty('--text-main', themeConfig.textMain);
    root.style.setProperty('--text-light', themeConfig.textLight);
    root.style.setProperty('--border-game', themeConfig.borderGame);
    root.style.setProperty('--bg-box', themeConfig.bgBox);
    root.style.setProperty('--bg-card', themeConfig.bgCard);
    
    // Primary Button
    root.style.setProperty('--btn-primary-bg-start', themeConfig.btnPrimaryBgStart);
    root.style.setProperty('--btn-primary-bg-end', themeConfig.btnPrimaryBgEnd);
    root.style.setProperty('--btn-primary-border', themeConfig.btnPrimaryBorder);
    root.style.setProperty('--btn-primary-hover', themeConfig.btnPrimaryHover);
    
    // Secondary Button
    root.style.setProperty('--btn-secondary-bg-start', themeConfig.btnSecondaryBgStart);
    root.style.setProperty('--btn-secondary-bg-end', themeConfig.btnSecondaryBgEnd);
    root.style.setProperty('--btn-secondary-border', themeConfig.btnSecondaryBorder);
    root.style.setProperty('--btn-secondary-hover', themeConfig.btnSecondaryHover);

    // Success Button
    root.style.setProperty('--btn-success-bg-start', themeConfig.btnSuccessBgStart);
    root.style.setProperty('--btn-success-bg-end', themeConfig.btnSuccessBgEnd);
    root.style.setProperty('--btn-success-border', themeConfig.btnSuccessBorder);
    root.style.setProperty('--btn-success-hover', themeConfig.btnSuccessHover);

    // Modal
    root.style.setProperty('--bg-modal', themeConfig.modalBg);

    // Progress Bars
    root.style.setProperty('--level-bar-bg', themeConfig.levelBarBg);
    root.style.setProperty('--level-bar-fill', themeConfig.levelBarFill);
    root.style.setProperty('--xp-bar-bg', themeConfig.xpBarBg);
    root.style.setProperty('--xp-bar-fill', themeConfig.xpBarFill);
    root.style.setProperty('--xp-bar-text', themeConfig.xpBarText);
    root.style.setProperty('--xp-bar-text-active', themeConfig.xpBarTextActive);
    root.style.setProperty('--report-bar-bg', themeConfig.reportBarBg);
    root.style.setProperty('--report-bar-low', themeConfig.reportBarLow);
    root.style.setProperty('--report-bar-medium', themeConfig.reportBarMedium);
    root.style.setProperty('--report-bar-high', themeConfig.reportBarHigh);

    // Danger Button
    root.style.setProperty('--btn-danger-bg-start', themeConfig.btnDangerBgStart);
    root.style.setProperty('--btn-danger-bg-end', themeConfig.btnDangerBgEnd);
    root.style.setProperty('--btn-danger-border', themeConfig.btnDangerBorder);
    root.style.setProperty('--btn-danger-hover', themeConfig.btnDangerHover);

    // Accents
    root.style.setProperty('--color-accent-orange', themeConfig.accentOrange);
    root.style.setProperty('--color-accent-purple', themeConfig.accentPurple);
    root.style.setProperty('--color-accent-blue', themeConfig.accentBlue);
    root.style.setProperty('--color-accent-green', themeConfig.accentGreen);
    
    // Also set these for backgrounds and borders if needed by CSS classes
    // Note: The CSS classes .bg-accent-orange use var(--color-accent-orange) directly, 
    // so we don't need separate variables unless we want different shades.
    
    // Text Shades
    root.style.setProperty('--text-muted', themeConfig.textMuted);
    root.style.setProperty('--text-light-accent', themeConfig.textLightAccent);
    root.style.setProperty('--text-soft', themeConfig.textSoft);

    // Ranks
    root.style.setProperty('--rank-1-bg-start', themeConfig.rank1BgStart);
    root.style.setProperty('--rank-1-bg-end', themeConfig.rank1BgEnd);
    root.style.setProperty('--rank-1-border', themeConfig.rank1Border);

    root.style.setProperty('--rank-2-bg-start', themeConfig.rank2BgStart);
    root.style.setProperty('--rank-2-bg-end', themeConfig.rank2BgEnd);
    root.style.setProperty('--rank-2-border', themeConfig.rank2Border);

    root.style.setProperty('--rank-3-bg-start', themeConfig.rank3BgStart);
    root.style.setProperty('--rank-3-bg-end', themeConfig.rank3BgEnd);
    root.style.setProperty('--rank-3-border', themeConfig.rank3Border);

    root.style.setProperty('--shop-header-start', themeConfig.shopHeaderStart);
    root.style.setProperty('--shop-header-end', themeConfig.shopHeaderEnd);
    root.style.setProperty('--shop-token-text', themeConfig.shopTokenText);
    root.style.setProperty('--shop-info-title', themeConfig.shopInfoTitle);
    root.style.setProperty('--shop-warning-title', themeConfig.shopWarningTitle);
    root.style.setProperty('--shop-modal-bg', themeConfig.shopModalBg);
  }, [themeConfig]);

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
  const [isSfxMuted, setIsSfxMuted] = useState(() => localStorage.getItem('khamin_sfx_muted') === 'true');
  const [isMusicMuted, setIsMusicMuted] = useState(() => localStorage.getItem('khamin_music_muted') === 'true');

  useEffect(() => {
    localStorage.setItem('khamin_sfx_volume', sfxVolume.toString());
  }, [sfxVolume]);

  useEffect(() => {
    localStorage.setItem('khamin_music_volume', musicVolume.toString());
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem('khamin_sfx_muted', isSfxMuted.toString());
  }, [isSfxMuted]);

  useEffect(() => {
    localStorage.setItem('khamin_music_muted', isMusicMuted.toString());
  }, [isMusicMuted]);

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
  const sortPlayers = (players: any[]) => {
    return [...players].sort((a, b) => {
      const levelA = a.level || getLevel(a.xp || 0);
      const levelB = b.level || getLevel(b.xp || 0);
      if (levelB !== levelA) return levelB - levelA;
      
      const xpA = a.xp || 0;
      const xpB = b.xp || 0;
      if (xpB !== xpA) return xpB - xpA;
      
      const winsA = a.wins || 0;
      const winsB = b.wins || 0;
      if (winsB !== winsA) return winsB - winsA;
      
      const streakA = a.streak || 0;
      const streakB = b.streak || 0;
      return streakB - streakA;
    });
  };
  const getXpProgress = (xp: number) => {
    const level = getLevel(xp);
    const currentLevelXp = getXpForCurrentLevel(level);
    const nextLevelXp = getXpForNextLevel(level);
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
  const isIntentionalLeaveRef = useRef(false);
  useEffect(() => { roomRef.current = room; }, [room]);

  const [joined, setJoined] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('جاري التحقق من التحديثات...');
  const [gameVersion, setGameVersion] = useState(localStorage.getItem('khamin_game_version') || '1.1.1');
  const [isSearching, setIsSearching] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [copied, setCopied] = useState(false);
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
  const [customAlert, setCustomAlert] = useState<{ show: boolean, message: string, title?: string }>({ show: false, message: '' });
  const [customConfirm, setCustomConfirm] = useState<{ show: boolean, message: string, title?: string, onConfirm: () => void }>({ show: false, message: '', onConfirm: () => {} });
  const [customPrompt, setCustomPrompt] = useState<{ show: boolean, message: string, defaultValue?: string, title?: string, onConfirm: (value: string) => void }>({ show: false, message: '', onConfirm: () => {} });
  const [hasSeenLevelInfo, setHasSeenLevelInfo] = useState(() => {
    return localStorage.getItem('khamin_seen_level_info') === 'true';
  });
  const [lastSeenPowerUpLevel, setLastSeenPowerUpLevel] = useState(() => {
    const saved = localStorage.getItem('khamin_last_seen_powerup_level');
    if (saved) return parseInt(saved);
    return 1;
  });
  const [lastSeenAvatarLevel, setLastSeenAvatarLevel] = useState(() => {
    const saved = localStorage.getItem('khamin_last_seen_avatar_level');
    if (saved) return parseInt(saved);
    return 1;
  });
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [showDailyQuestModal, setShowDailyQuestModal] = useState(false);
  const [dailyQuestStreak, setDailyQuestStreak] = useState(() => {
    const saved = localStorage.getItem('khamin_daily_streak');
    return saved ? parseInt(saved) : 1;
  });
  const [lastDailyClaim, setLastDailyClaim] = useState(() => {
    const saved = localStorage.getItem('khamin_last_daily_claim');
    return saved ? parseInt(saved) : 0;
  });
  const [hasSeenDailyToday, setHasSeenDailyToday] = useState(false);
  const [ownedHelpers, setOwnedHelpers] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem('khamin_owned_helpers');
    return saved ? JSON.parse(saved) : {};
  });
  const [dailyQuestRewardInfo, setDailyQuestRewardInfo] = useState<{ xp: number, helper?: string, tokens?: number } | null>(null);
  const [isChestOpening, setIsChestOpening] = useState(false);
  const [isCycling, setIsCycling] = useState(false);
  const [cyclingReward, setCyclingReward] = useState<any>(null);
  const [chestReward, setChestReward] = useState<any>(null);
  const [pendingDailyReward, setPendingDailyReward] = useState<any>(null);
  const [isNewDayNotification, setIsNewDayNotification] = useState(false);
  const [appOpenDate] = useState(Date.now());
  const [tokensEarnedThisWeek, setTokensEarnedThisWeek] = useState(0);
  const [lastTokenEarnedDay, setLastTokenEarnedDay] = useState(0);
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

  useEffect(() => {
    localStorage.setItem('khamin_owned_helpers', JSON.stringify(ownedHelpers));
  }, [ownedHelpers]);

  useEffect(() => {
    const savedTokensEarned = localStorage.getItem('khamin_tokens_earned_this_week');
    if (savedTokensEarned) setTokensEarnedThisWeek(parseInt(savedTokensEarned));
    const savedLastTokenDay = localStorage.getItem('khamin_last_token_earned_day');
    if (savedLastTokenDay) setLastTokenEarnedDay(parseInt(savedLastTokenDay));
  }, []);

  useEffect(() => {
    const checkDay = () => {
      const now = Date.now();
      if (lastDailyClaim !== 0 && !isSameDay(now, lastDailyClaim) && !isSameDay(now, appOpenDate)) {
         setIsNewDayNotification(true);
      }
    };
    const interval = setInterval(checkDay, 60000);
    return () => clearInterval(interval);
  }, [lastDailyClaim, appOpenDate]);

  useEffect(() => {
    if (!joined && !hasSeenDailyToday && playerSerial) {
      const now = Date.now();
      const lastClaim = lastDailyClaim;
      
      const isSameDay = (d1: number, d2: number) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return date1.getUTCFullYear() === date2.getUTCFullYear() &&
               date1.getUTCMonth() === date2.getUTCMonth() &&
               date1.getUTCDate() === date2.getUTCDate();
      };

      if (lastClaim === 0) {
        setOwnedHelpers({});
        localStorage.setItem('khamin_owned_helpers', '{}');
        setShowDailyQuestModal(true);
        setHasSeenDailyToday(true);
      } else if (!isSameDay(now, lastClaim)) {
        const lastDate = new Date(lastClaim);
        const todayDate = new Date(now);
        
        // Normalize to start of day for comparison
        const lastDayStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
        const todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (todayStart - lastDayStart > oneDay) {
          // Missed a day, reset streak
          setDailyQuestStreak(1);
          localStorage.setItem('khamin_daily_streak', '1');
        }
        
        // Clear ownedHelpers because it's a new day
        setOwnedHelpers({});
        localStorage.setItem('khamin_owned_helpers', '{}');

        setShowDailyQuestModal(true);
        setHasSeenDailyToday(true);
      }
    }
  }, [joined, lastDailyClaim, hasSeenDailyToday, playerSerial]);

  const handleClaimDailyQuest = () => {
    setIsChestOpening(true);
    setPendingDailyReward(null); // Reset pending reward
    playSound('clickOpen');
    if (socket) {
      socket.emit('claim_daily_quest', { serial: playerSerial, isPro: hasProPackage });
    }
  };

  const startCycling = () => {
    if (!pendingDailyReward || isCycling) return;
    setIsCycling(true);
    playSound('chestOpen');
    
    // Cycle animation
    let cycleCount = 0;
    const interval = setInterval(() => {
      const randomItem = HELPER_ITEMS[Math.floor(Math.random() * HELPER_ITEMS.length)];
      setCyclingReward(randomItem);
      cycleCount++;
      if (cycleCount >= 40) {
        clearInterval(interval);
        setCyclingReward(pendingDailyReward.helperReward);
        setChestReward({ 
          xp: pendingDailyReward.xpReward, 
          helper: pendingDailyReward.helperReward, 
          tokens: pendingDailyReward.tokenReward 
        });
        setIsCycling(false);
        
        // Apply rewards locally for immediate UI update
        setXp(pendingDailyReward.newXp);
        setTokens(pendingDailyReward.newTokens);
        setOwnedHelpers(pendingDailyReward.newOwnedHelpers);
        setDailyQuestStreak(pendingDailyReward.newStreak);
        setLastDailyClaim(pendingDailyReward.newLastClaim);
        
        // Sync local storage
        localStorage.setItem('khamin_daily_streak', pendingDailyReward.newStreak.toString());
        localStorage.setItem('khamin_last_daily_claim', pendingDailyReward.newLastClaim.toString());
        localStorage.setItem('khamin_owned_helpers', JSON.stringify(pendingDailyReward.newOwnedHelpers));
        
        setPendingDailyReward(null);
      }
    }, 50);
  };

  const toggleDailyQuests = () => {
    if (showDailyQuestModal) {
      playSound('clickClose');
      setShowDailyQuestModal(false);
    } else {
      playSound('clickOpen');
      closeAllModals();
      setShowDailyQuestModal(true);
      setIsNewDayNotification(false);
    }
  };
  
  const closeAllModals = () => {
    if (showSettingsModal) {
      const currentLevel = getLevel(xp);
      setLastSeenAvatarLevel(currentLevel);
      localStorage.setItem('khamin_last_seen_avatar_level', currentLevel.toString());
    }
    if (showLevelInfo) {
      const currentLevel = getLevel(xp);
      setLastSeenPowerUpLevel(currentLevel);
      localStorage.setItem('khamin_last_seen_powerup_level', currentLevel.toString());
    }
    setShowSettingsModal(false);
    setShowLevelInfo(false);
    setShowAdminDashboard(false);
    setShowReportModal(false);
    setShowShopModal(false);
  };

  const toggleSettings = () => {
    if (showSettingsModal) {
      playSound('clickClose');
      closeAllModals();
    } else {
      playSound('clickOpen');
      closeAllModals();
      setShowSettingsModal(true);
    }
  };

  const toggleShop = () => {
    if (showShopModal) {
      playSound('clickClose');
      closeAllModals();
    } else {
      playSound('clickOpen');
      closeAllModals();
      setShowShopModal(true);
    }
  };

  const toggleLevelInfo = () => {
    if (showLevelInfo) {
      playSound('clickClose');
      closeAllModals();
    } else {
      playSound('clickOpen');
      closeAllModals();
      if (!hasSeenLevelInfo) {
        setHasSeenLevelInfo(true);
        localStorage.setItem('khamin_seen_level_info', 'true');
      }
      setShowLevelInfo(true);
    }
  };

  const showAlert = (message: string, title: string = 'تنبيه') => {
    setCustomAlert({ show: true, message, title });
    playSound('notification');
  };

  const showConfirm = (message: string, onConfirm: () => void, title: string = 'تأكيد') => {
    setCustomConfirm({ show: true, message, title, onConfirm });
    playSound('clickOpen');
  };

  const showPrompt = (message: string, defaultValue: string = '', onConfirm: (value: string) => void, title: string = 'إدخال') => {
    setCustomPrompt({ show: true, message, defaultValue, title, onConfirm });
    playSound('clickOpen');
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isIntentionalLeaveRef.current) return;
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
      setRoomId(prev => prev.startsWith('random_') ? '' : prev);
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
  const [isOpponentTyping, setIsOpponentTyping] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);

  // Typing logic
  useEffect(() => {
    if (!socket || !roomId) return;
    
    if (chatInput.trim().length > 0) {
      socket.emit('typing', { roomId });
      
      const timeout = setTimeout(() => {
        socket.emit('stop_typing', { roomId });
      }, 3000);
      
      return () => clearTimeout(timeout);
    } else {
      socket.emit('stop_typing', { roomId });
    }
  }, [chatInput, socket, roomId]);

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
  }, [chatHistory, isOpponentTyping]);
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
  const lobbyMusicRef = useRef<HTMLAudioElement | null>(null);
  const gameMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      if (key === 'lobbyBackground') {
        lobbyMusicRef.current = new Audio(url);
        lobbyMusicRef.current.loop = true;
      } else if (key === 'gameBackground') {
        gameMusicRef.current = new Audio(url);
        gameMusicRef.current.loop = true;
      } else {
        audioRef.current[key] = new Audio(url);
      }
    });
  }, []);

  useEffect(() => {
    const isGameActive = room?.gameState === 'guessing' || room?.gameState === 'discussion';
    
    const activeMusic = isGameActive ? gameMusicRef.current : lobbyMusicRef.current;
    const inactiveMusic = isGameActive ? lobbyMusicRef.current : gameMusicRef.current;

    if (inactiveMusic) {
      inactiveMusic.pause();
    }

    if (activeMusic) {
      activeMusic.volume = isMusicMuted ? 0 : musicVolume;
      if (!isMusicMuted && musicVolume > 0) {
        activeMusic.play().catch(() => {
          // Auto-play might be blocked, we'll try again on first interaction
          const playOnInteraction = () => {
            activeMusic?.play().catch(() => {});
            window.removeEventListener('click', playOnInteraction);
          };
          window.addEventListener('click', playOnInteraction);
        });
      } else {
        activeMusic.pause();
      }
    }
  }, [musicVolume, isMusicMuted, room?.gameState]);

  const playSound = useCallback((key: keyof typeof SOUNDS, volumeOverride?: number) => {
    if (isSfxMuted) return;
    const sound = audioRef.current[key];
    if (sound) {
      sound.volume = volumeOverride !== undefined ? volumeOverride * sfxVolume : sfxVolume;
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }, [sfxVolume, isSfxMuted]);

  const stopSound = useCallback((key: keyof typeof SOUNDS) => {
    const sound = audioRef.current[key];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }, []);

  const clearPlayerData = () => {
    // Clear all localStorage items related to the game
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('khamin_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear caches if any exist
    if ('caches' in window) {
      caches.keys().then(names => {
        for (let name of names) {
          caches.delete(name);
        }
      });
    }

    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Reset all state variables
    setPlayerSerial('');
    setPlayerName('');
    setPlayerAge('');
    setCustomAvatar('');
    setXp(0);
    setWins(0);
    setStreak(0);
    setReports(0);
    setTokens(0);
    setOwnedHelpers({});
    setProPackageExpiry(null);
    setDailyQuestStreak(1);
    setLastDailyClaim(0);
    setTokensEarnedThisWeek(0);
    setLastTokenEarnedDay(0);
    setIsPermanentBan(false);
    setBanUntil(0);
    setIsAdmin(false);
    setAdminEmail('');
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
            closeAllModals();
            setShowAdminDashboard(true);
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

    // Check URL parameters for direct redirect auth and prizes
    const checkUrlParams = () => {
      if (!socket) return;
      const params = new URLSearchParams(window.location.search);
      
      // Handle Admin Auth
      if (params.get('admin_auth') === 'success') {
        const user = {
          email: params.get('email'),
          adminToken: params.get('adminToken'),
          isAdmin: params.get('isAdmin') === 'true'
        };
        console.log('Google Auth Success found in URL params:', user);
        
        if (socket.connected) {
          processAuthSuccess(user);
          // Clean URL but keep other params for now
          const url = new URL(window.location.href);
          url.searchParams.delete('admin_auth');
          url.searchParams.delete('email');
          url.searchParams.delete('adminToken');
          url.searchParams.delete('isAdmin');
          window.history.replaceState({}, document.title, url.toString());
        } else {
          socket.once('connect', () => {
            processAuthSuccess(user);
            const url = new URL(window.location.href);
            url.searchParams.delete('admin_auth');
            url.searchParams.delete('email');
            url.searchParams.delete('adminToken');
            url.searchParams.delete('isAdmin');
            window.history.replaceState({}, document.title, url.toString());
          });
        }
      }

      // Handle Prize Serial
      const serialParam = params.get('serial');
      const helperParam = params.get('helper');
      if (serialParam && helperParam) {
        console.log('Found prize serial in URL:', serialParam, helperParam);
        
        // If we don't have a serial yet, use this one
        if (!playerSerial) {
          setPlayerSerial(serialParam);
          localStorage.setItem('khamin_player_serial', serialParam);
        }

        const claimPrize = () => {
          socket.emit('claim_serial_prize', { serial: serialParam, helperId: helperParam }, (res: any) => {
            if (res.success) {
              console.log('Prize claimed successfully:', helperParam);
              setReadyPowerUps(prev => [...prev, helperParam]);
              showAlert(`مبروك! حصلت على مساعدة "${HELPER_ITEMS.find(h => h.id === helperParam)?.name || helperParam}" مجانية لهذه المباراة! 🎁`, 'هدية');
            } else {
              console.log('Prize claim failed:', res.error);
              if (res.error) setError(res.error);
            }
          });
        };

        if (socket.connected) {
          claimPrize();
        } else {
          socket.once('connect', claimPrize);
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
        showAlert('تم إضافة الفئة بنجاح', 'نجاح');
      } else {
        showAlert('فشل إضافة الفئة', 'خطأ');
      }
    } catch (error) {
      console.error("Add category failed", error);
      showAlert('حدث خطأ أثناء الإضافة', 'خطأ');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    showConfirm('هل أنت متأكد من حذف هذه الفئة وجميع الصور المرتبطة بها؟', async () => {
      try {
        const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchCategories();
          fetchAdminImages();
        } else {
          showAlert('فشل حذف الفئة', 'خطأ');
        }
      } catch (error) {
        console.error("Delete category failed", error);
        showAlert('حدث خطأ أثناء الحذف', 'خطأ');
      }
    }, 'حذف الفئة');
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
        showAlert('تم رفع الصورة بنجاح', 'نجاح');
      } else {
        showAlert('فشل رفع الصورة', 'خطأ');
      }
    } catch (error) {
      console.error("Upload failed", error);
      showAlert('حدث خطأ أثناء الرفع', 'خطأ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    showConfirm('هل أنت متأكد من حذف هذه الصورة؟', async () => {
      try {
        const response = await fetch(`/api/admin/images/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchAdminImages();
        } else {
          showAlert('فشل حذف الصورة', 'خطأ');
        }
      } catch (error) {
        console.error("Delete failed", error);
      }
    }, 'حذف الصورة');
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
            localStorage.setItem('khamin_tokens', (data.tokens || 0).toString());
            
            if (data.ownedHelpers) {
              setOwnedHelpers(data.ownedHelpers);
              localStorage.setItem('khamin_owned_helpers', JSON.stringify(data.ownedHelpers));
            }

            if (data.dailyQuestStreak) {
              setDailyQuestStreak(data.dailyQuestStreak);
              localStorage.setItem('khamin_daily_streak', data.dailyQuestStreak.toString());
            }

            if (data.lastDailyClaim) {
              setLastDailyClaim(data.lastDailyClaim);
              localStorage.setItem('khamin_last_daily_claim', data.lastDailyClaim.toString());
            }

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
        setTopPlayers(sortPlayers(players));
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
      if (data.ownedHelpers !== undefined) {
        setOwnedHelpers(data.ownedHelpers);
        localStorage.setItem('khamin_owned_helpers', JSON.stringify(data.ownedHelpers));
      }
      if (data.dailyQuestStreak !== undefined) {
        setDailyQuestStreak(data.dailyQuestStreak);
        localStorage.setItem('khamin_daily_streak', data.dailyQuestStreak.toString());
      }
      if (data.lastDailyClaim !== undefined) {
        setLastDailyClaim(data.lastDailyClaim);
        localStorage.setItem('khamin_last_daily_claim', data.lastDailyClaim.toString());
      }
    });

    newSocket.on('daily_quest_success', (data: any) => {
      setPendingDailyReward(data);
    });

    newSocket.on('daily_quest_error', (msg: string) => {
      setError(msg);
      setIsChestOpening(false);
    });

    newSocket.on('top_players_update', (players: any[]) => {
      setTopPlayers(sortPlayers(players));
      localStorage.setItem('khamin_top_players', JSON.stringify(players));
    });

    newSocket.on('opponent_muted_you', (isMuted: boolean) => {
      setIsMutedByOpponent(isMuted);
    });

    newSocket.on('helper_used', ({ playerId, helperId }) => {
      const player = roomRef.current?.players.find((p: any) => p.id === playerId);
      if (player) {
        const helper = HELPER_ITEMS.find(h => h.id === helperId);
        setError(`استخدم ${player.name} مساعدة: ${helper?.name || helperId} 🎁`);
        setTimeout(() => setError(''), 3000);
      }
    });

    newSocket.on('helper_effect', ({ helperId, data }) => {
      if (data.message) {
        showAlert(data.message, 'مساعدة المهام');
      }
      
      if (helperId === 'reveal_letter' && data.letter) {
        setHint(`المساعدة: الحرف التالي هو "${data.letter}"`);
      }
    });

    newSocket.on('room_update', (updatedRoom: Room) => {
      if (updatedRoom.gameState !== roomRef.current?.gameState) {
        setChatHistory([]);
        setChatInput('');
      }
      
      if (roomRef.current?.players.length === 1 && updatedRoom.players.length === 2) {
        const newPlayer = updatedRoom.players.find(p => p.id !== newSocket.id);
        if (newPlayer) {
          setError(`انضم اللاعب ${newPlayer.name} إلى الغرفة! 🎮`);
          setTimeout(() => setError(''), 3000);
        }
      }

      if (roomRef.current?.players.length === 2 && updatedRoom.players.length === 1) {
        setError('غادر المنافس الغرفة!');
        setTimeout(() => setError(''), 3000);
      }

      setRoom(updatedRoom);
      setJoined(true);

      // Sync my data from server
      const me = updatedRoom.players.find(p => p.id === newSocket.id);
      if (me && me.ownedHelpers) {
        setOwnedHelpers(me.ownedHelpers);
        localStorage.setItem('khamin_owned_helpers', JSON.stringify(me.ownedHelpers));
      }
    });

    newSocket.on('theme_updated', (newTheme: ThemeConfig) => {
      console.log('Theme updated from server:', newTheme);
      setThemeConfig(newTheme);
    });

    newSocket.on('timer_update', (timer: number) => {
      setRoom(prev => prev ? { ...prev, timer } : null);
    });

    newSocket.on('chat_bubble', ({ senderId, text }) => {
      if (senderId !== newSocket.id && isOpponentBlockedRef.current) return;
      const sender = roomRef.current?.players.find((p: any) => p.id === senderId);
      const msgId = Math.random().toString(36).substr(2, 9);
      
      // Play message sound for incoming messages
      if (senderId !== newSocket.id) {
        playSound('message');
      }

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

    newSocket.on('opponent_typing', () => {
      setIsOpponentTyping(true);
    });

    newSocket.on('opponent_stop_typing', () => {
      setIsOpponentTyping(false);
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
      if (isIntentionalLeaveRef.current) return;
      setRoom(room);
      setCooldowns({});
      setReadyPowerUps([]);
      setActivePowerUp(null);
      setShowAdConfirmation(false);
      setShowAdModal(false);
      setAdTimer(0);
      const isWinner = winnerId === newSocket.id;
      if (isWinner) {
        playSound('win');
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 10001
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
            
            // If it's a milestone level, ensure notifications show up immediately
            // by not updating lastSeen levels yet (they should already be lower)
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
        if (myUpdate.tokens !== undefined) {
          setTokens(myUpdate.tokens);
          localStorage.setItem('khamin_tokens', myUpdate.tokens.toString());
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

    newSocket.on('match_intro_triggered', () => {
      setShowMatchIntro(true);
    });

    newSocket.on('waiting_for_match', () => {
      setIsPrivate(false);
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

    newSocket.on('match_rejected', ({ reason }: { reason?: string } = {}) => {
      setProposedMatch(null);
      setHasResponded(false);
      setOpponentAccepted(false);
      setMatchResponseTimeLeft(null);
      
      let message = 'تم إلغاء التحدي';
      if (reason === 'rejected') message = 'المنافس رفض التحدي ❌';
      if (reason === 'timeout') message = 'انتهى وقت قبول التحدي ⏰';
      if (reason === 'blocked') message = 'المنافس قام بحظرك 🚫';
      if (reason === 'opponent_left') message = 'المنافس غادر البحث 🏃';
      if (reason === 'opponent_disconnected') message = 'انقطع اتصال المنافس 🔌';
      if (reason === 'you_rejected') return; // No message if user rejected themselves

      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    newSocket.on('random_match_found', ({ roomId }) => {
      setRoomId(roomId);
      setIsPrivate(false);
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
      setReadyPowerUps([]);
      setActivePowerUp(null);
      setShowAdConfirmation(false);
      setShowAdModal(false);
      setAdTimer(0);
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

    newSocket.on('word_count_result', ({ count }) => {
      let wordText = 'كلمة واحدة';
      if (count === 2) wordText = 'كلمتين';
      else if (count >= 3 && count <= 10) wordText = `${count} كلمات`;
      else if (count > 10) wordText = `${count} كلمة`;
      
      setHint(`الإجابة تتكون من ${wordText}`);
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
      setTimeout(() => setError(''), 5000);
      setJoined(false);
      setRoom(null);
      setRoomId('');
      setShowMatchIntro(false);
      setIsSearching(false);
      setProposedMatch(null);
      setChatHistory([]);
      setChatInput('');
    });

    newSocket.on('opponent_left_lobby', () => {
      setError('غادر المنافس الغرفة');
      setTimeout(() => setError(''), 5000);
      setJoined(false);
      setRoom(null);
      setRoomId('');
      setShowMatchIntro(false);
      setIsSearching(false);
      setProposedMatch(null);
      setChatHistory([]);
      setChatInput('');
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
      setIsPrivate(false);
      newSocket.disconnect();
    });

    return newSocket;
  }, []);

  // Removed the automatic page reload useEffect that was causing infinite reload loops

  const loadingStarted = useRef(false);
  useEffect(() => {
    if (loadingStarted.current) return;
    loadingStarted.current = true;

    // Real update check and loading process
    const startLoading = async () => {
      try {
        setLoadingStatus('جاري الاتصال بالسيرفر...');
        setLoadingProgress(10);

        // Fetch real config from server
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Failed to fetch config');
        const config = await response.json();
        
        const serverVersion = config.version || '1.1.1';
        setGameVersion(serverVersion);
        setLoadingProgress(50);
        
        // Check if we need to force update (reload)
        const localVersion = localStorage.getItem('khamin_game_version');
        const lastRefreshDate = localStorage.getItem('khamin_last_refresh_date');
        const today = new Date().toDateString();
        const needsDailyRefresh = lastRefreshDate !== today;
        
        // Force a hard refresh if:
        // 1. Version mismatch (always reload to get new version)
        // 2. OR: It's a new day (once a day refresh for freshness)
        if (needsDailyRefresh || (localVersion && localVersion !== serverVersion)) {
          setLoadingStatus('جاري تهيئة الملفات وضمان أحدث نسخة...');
          setLoadingProgress(100);
          localStorage.setItem('khamin_game_version', serverVersion);
          localStorage.setItem('khamin_last_refresh_date', today);
          
          // Unregister all service workers to force fetching new files
          if ('serviceWorker' in navigator) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (let registration of registrations) {
                await registration.unregister();
              }
            } catch (err) {
              console.error('Error unregistering service worker:', err);
            }
          }
          
          // Clear all caches
          if ('caches' in window) {
            try {
              const keys = await caches.keys();
              await Promise.all(keys.map(key => caches.delete(key)));
            } catch (err) {
              console.error('Error clearing caches:', err);
            }
          }

          // Add cache busting query parameter to force browser to fetch new files
          const url = new URL(window.location.href);
          url.searchParams.set('v', Date.now().toString());
          window.location.href = url.toString();
          return;
        }
        localStorage.setItem('khamin_game_version', serverVersion);

        setLoadingProgress(100);
        setLoadingStatus('تم التحديث بنجاح!');
        // Minimal delay just to show 100% briefly
        await new Promise(r => setTimeout(r, 200));
        
        // Remove the version parameter from the URL after loading is complete
        const url = new URL(window.location.href);
        if (url.searchParams.has('v')) {
          url.searchParams.delete('v');
          window.history.replaceState({}, '', url.toString());
        }
        
        setIsAppLoading(false);
      } catch (error) {
        console.error("Loading failed:", error);
        setLoadingStatus('فشل الاتصال بالسيرفر. يرجى التحقق من اتصالك.');
        // Fallback: let them in anyway after a short delay so they aren't stuck
        await new Promise(r => setTimeout(r, 1000));
        
        // Also cleanup URL in fallback
        const url = new URL(window.location.href);
        if (url.searchParams.has('v')) {
          url.searchParams.delete('v');
          window.history.replaceState({}, '', url.toString());
        }
        
        setIsAppLoading(false);
      }
    };

    startLoading();
  }, []);

  useEffect(() => {
    if (isAppLoading) return;
    const newSocket = connectSocket();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isIntentionalLeaveRef.current) return;
      if (roomRef.current && (roomRef.current.gameState === 'guessing' || roomRef.current.gameState === 'discussion')) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        newSocket.emit('intentional_leave', { roomId: roomRef.current.id });
        
        const me = roomRef.current?.players.find((p: any) => p.id === newSocket.id);
        if (me?.useToken) {
          return 'تحذير: إذا انسحبت الآن، ستخسر الـ Token المستخدمة! وتعتبر خاسر. هل تريد حقاً مغادرة اللعبة؟';
        }
        return 'انسحابك من المبارة تعتبر خاسر. هل تريد حقاً مغادرة اللعبة؟';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      newSocket.disconnect();
    };
  }, [isAppLoading, connectSocket]);

  const lastTickTimeRef = useRef<{ [key: string]: number }>({});

  // Separate effect for countdown sound to avoid re-binding socket listeners
  useEffect(() => {
    // Remove the version and prize parameters from the URL after the match ends OR when returning to home
    if (room?.gameState === 'finished' || !room) {
      const url = new URL(window.location.href);
      let changed = false;
      if (url.searchParams.has('v')) {
        url.searchParams.delete('v');
        changed = true;
      }
      if (url.searchParams.has('helper')) {
        url.searchParams.delete('helper');
        changed = true;
      }
      if (url.searchParams.has('serial')) {
        url.searchParams.delete('serial');
        changed = true;
      }
      if (changed) {
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [room?.gameState, room]);

  useEffect(() => {
    if (!room) {
      stopSound('tick');
      return;
    }

    const isTickActive = (room.gameState === 'guessing' && room.timer <= 10 && room.timer > 0);
    
    if (isTickActive) {
      if (lastTickTimeRef.current.gameTimer !== room.timer) {
        playSound('tick', 0.3);
        lastTickTimeRef.current.gameTimer = room.timer;
      }
    } else {
      stopSound('tick');
    }
  }, [room?.timer, room?.gameState, playSound, stopSound]);

  // Quick Guess timer sound
  useEffect(() => {
    if (room?.quickGuessTimer && room.quickGuessTimer > 0) {
      if (lastTickTimeRef.current.quickGuessTimer !== room.quickGuessTimer) {
        playSound('tick', 0.3);
        lastTickTimeRef.current.quickGuessTimer = room.quickGuessTimer;
      }
    } else {
      stopSound('tick');
    }
  }, [room?.quickGuessTimer, playSound, stopSound]);

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
    playSound('clickOpen');
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
    setIsPrivate(true);
    socket?.emit('join_room', { roomId, playerName, avatar, age: playerAge, xp, streak, wins, serial: playerSerial });
    setIsOpponentBlocked(false);
  };

  const handleRandomMatch = () => {
    playSound('clickOpen');
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
    setIsPrivate(false);
    socket?.emit('find_random_match', { playerId, playerName, avatar, age: playerAge, xp, streak, wins, serial: playerSerial, useToken });
    setIsOpponentBlocked(false);
  };

  const handleRegister = () => {
    playSound('clickOpen');
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
        playSound('clickClose');
        setError('');
      } else {
        setError('فشل التسجيل. يرجى المحاولة مرة أخرى.');
      }
    });
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    playSound('clickOpen');
    socket?.emit('submit_guess', { roomId, guess });
    setGuess('');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    playSound('clickOpen');
    socket?.emit('send_chat', { roomId, text: chatInput });
    setChatInput('');
  };

  const handleQuickGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    socket?.emit('submit_quick_guess', { roomId: room!.id, guess });
    setGuess('');
  };

  const handleWatchAd = () => {
    console.log('handleWatchAd called. Current adStatus:', adStatus);
    if (getLevel(xp) < 50) {
      showAlert('يجب أن تصل للمستوى 50 لتتمكن من مشاهدة الإعلانات!', 'تنبيه');
      return;
    }
    if (!adStatus.canWatch) {
      console.log('Cannot watch ad: limit reached or level too low');
      showAlert('انتهت المحاولات لهذا اليوم!', 'تنبيه');
      return;
    }
    
    console.log('Setting showAdModal to true');
    setShowAdModal(true);
    if (roomId) {
      socket?.emit('ad_started', { roomId });
    }
    socket?.emit('start_ad_watch', { serial: playerSerial });
    setAdTimer(15);

    const timer = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
          setTopPlayers(sortPlayers(topPlayers));
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
    closeAllModals();
  };

  const handleDeleteAccount = () => {
    socket?.emit('delete_account', { playerSerial }, (response: any) => {
      if (response.success) {
        clearPlayerData();
        setIsAppLoading(true);
        setLoadingStatus('جاري مسح الحساب وإعادة التهيئة...');
        setLoadingProgress(0);
        
        // Animate progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          setLoadingProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            window.location.reload();
          }
        }, 300);
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
    playSound('clickOpen');
    socket?.emit('request_match_intro', { roomId });
  };

  const handleMatchIntroStart = useCallback(() => {
    socket?.emit('force_start_game', { roomId });
  }, [roomId, socket]);

  const handleMatchIntroComplete = useCallback(() => {
    setShowMatchIntro(false);
  }, []);

  const handleLeaveGame = () => {
    playSound('clickOpen');
    const isGameActive = room?.gameState === 'guessing' || room?.gameState === 'discussion';
    const me = room?.players.find(p => p.id === socket?.id);
    
    // Only show confirmation if the game is active (playing)
    if (isGameActive) {
      let message = 'هل تريد حقاً مغادرة اللعبة والعودة للرئيسية؟';
      if (me?.useToken) {
        message = 'تحذير: إذا انسحبت الآن، ستخسر الـ Token المستخدمة! وتعتبر خاسر. هل تريد حقاً مغادرة اللعبة والعودة للرئيسية؟';
      } else {
        message = 'انسحابك من المبارة تعتبر خاسر. هل تريد حقاً مغادرة اللعبة والعودة للرئيسية؟';
      }
      
      showConfirm(message, () => {
        isIntentionalLeaveRef.current = true;
        socket?.emit('intentional_leave', { roomId });
        socket?.emit('leave_room', { roomId }, () => {
          window.location.reload();
        });
      }, 'تأكيد الخروج');
      return;
    }
    
    isIntentionalLeaveRef.current = true;
    socket?.emit('leave_room', { roomId }, () => {
      window.location.reload();
    });
  };

  const useCard = (type: 'quick_guess' | 'hint' | 'word_length' | 'word_count' | 'time_freeze' | 'spy_lens') => {
    if (cooldowns[type] > 0) return;
    playSound('clickOpen');
    
    const hasFreeUse = (ownedHelpers[type] || 0) > 0;

    // Quick guess doesn't require an ad
    if (type === 'quick_guess' || readyPowerUps.includes(type) || hasProPackage || hasFreeUse) {
      // Actually use the card FIRST so the server sees we still have the free use
      socket?.emit('use_card', { roomId, cardType: type, serial: playerSerial });

      // Remove from ready
      if (type !== 'quick_guess' && readyPowerUps.includes(type)) {
        setReadyPowerUps(prev => prev.filter(p => p !== type));
      }
      
      // Hint has 150s cooldown (2.5m)
      if (type === 'hint') {
        setCooldowns(prev => ({ ...prev, [type]: 150 }));
      }
    } else {
      // Set active power-up and show confirmation modal
      setActivePowerUp(type);
      setShowAdConfirmation(true);
    }
  };

  // Update Ad Modal logic to include confirmation
  // ... (Inside renderModals)
  // I need to update the modal content to show confirmation first, then the ad.
  // Actually, let's add a new state `showAdConfirmation`


  const me = room?.players.find(p => p.id === socket?.id);
  const opponent = room?.players.find(p => p.id !== socket?.id);

  const consensusReached = room?.players.length === 2 && 
                          room.players[0].selectedCategory === room.players[1].selectedCategory &&
                          room.players[0].selectedCategory !== null;

  const isSameDay = (d1: number, d2: number) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
  };

  const renderDailyQuestModal = () => (
    <AnimatePresence>
      {showDailyQuestModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[6000] flex items-center justify-center p-4"
          onClick={() => setShowDailyQuestModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] border-4 border-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center relative shrink-0 bg-accent-yellow border-b-4 border-black">
              <button 
                onClick={() => { playSound('clickClose'); setShowDailyQuestModal(false); }}
                className="absolute top-4 right-4 w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Sparkles className="w-8 h-8 text-accent-blue" />
              </div>
              <h2 className="text-2xl font-black text-black mb-1">المهام اليومية</h2>
              <p className="text-black/60 text-sm font-bold">ادخل كل يوم واستلم هداياك!</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-4 gap-3 mb-6">
                {DAILY_QUEST_REWARDS.map((reward, index) => {
                  const day = index + 1;
                  const isClaimed = day < dailyQuestStreak && lastDailyClaim !== 0;
                  const isCurrent = day === dailyQuestStreak;
                  const canClaim = isCurrent && (lastDailyClaim === 0 || !isSameDay(Date.now(), lastDailyClaim));
                  
                  return (
                    <div 
                      key={day}
                      className={`relative flex flex-col items-center p-2 rounded-2xl border-4 transition-all ${
                        isClaimed ? 'bg-gray-100 border-gray-300 opacity-50' :
                        isCurrent ? 'bg-accent-yellow-light border-accent-yellow scale-105 shadow-lg' :
                        'bg-white border-black'
                      } ${index === 6 ? 'col-span-2' : ''}`}
                    >
                      <div className="text-xs font-black mb-1">اليوم {day}</div>
                      <div className="text-lg mb-1">🎁</div>
                      <div className="text-[10px] font-bold text-accent-blue">{reward} XP</div>
                      {isClaimed && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                          <Check className="w-8 h-8 text-accent-green drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {dailyQuestStreak <= 7 && (
                <button
                  disabled={isChestOpening || (lastDailyClaim !== 0 && isSameDay(Date.now(), lastDailyClaim))}
                  onClick={handleClaimDailyQuest}
                  className={`w-full py-4 rounded-2xl font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all border-4 border-black ${
                    (lastDailyClaim !== 0 && isSameDay(Date.now(), lastDailyClaim))
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-accent-green text-white hover:-translate-y-1 active:translate-y-0'
                  }`}
                >
                  {isChestOpening ? 'جاري الفتح...' : 
                   (lastDailyClaim !== 0 && isSameDay(Date.now(), lastDailyClaim)) ? 'تم الاستلام اليوم' : 'استلم جائزة اليوم! 🎁'}
                </button>
              )}
            </div>

            {/* Chest Opening Animation Overlay */}
            <AnimatePresence>
              {isChestOpening && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md z-[7000] flex flex-col items-center justify-center p-6 text-center"
                >
                  {!chestReward ? (
                    <div className="space-y-6">
                      {!isCycling ? (
                        <motion.div
                          animate={{ 
                            rotate: [0, -10, 10, -10, 10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="text-8xl cursor-pointer"
                          onClick={startCycling}
                        >
                          📦
                        </motion.div>
                      ) : (
                        <div className="text-8xl">
                          {cyclingReward ? cyclingReward.icon : '❓'}
                        </div>
                      )}
                      <h3 className="text-2xl font-black text-white">
                        {isCycling ? 'جاري اختيار الجائزة...' : 'اضغط على الصندوق لفتحه!'}
                      </h3>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="text-8xl mb-4 animate-bounce">✨</div>
                      <h3 className="text-3xl font-black text-white mb-2">مبروك!</h3>
                      <div className="space-y-3">
                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border-2 border-white/30 text-white">
                          <div className="text-xl font-black">+{chestReward.xp} XP</div>
                        </div>
                        {chestReward.helper && chestReward.helper.id !== 'bonus_xp' && (
                          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border-2 border-white/30 text-white flex items-center justify-center gap-3">
                            <span className="text-2xl">{chestReward.helper.icon}</span>
                            <div className="text-xl font-black">{chestReward.helper.name}</div>
                          </div>
                        )}
                        {chestReward.helper && chestReward.helper.id === 'bonus_xp' && (
                          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border-2 border-white/30 text-white flex items-center justify-center gap-3">
                            <span className="text-2xl">⭐</span>
                            <div className="text-xl font-black">تم تحويل الوسيلة إلى 100 XP (Pro)</div>
                          </div>
                        )}
                        {chestReward.tokens > 0 && (
                          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border-2 border-white/30 text-white">
                            <div className="text-xl font-black">+{chestReward.tokens} Tokens</div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setIsChestOpening(false);
                          setChestReward(null);
                          setShowDailyQuestModal(false);
                        }}
                        className="mt-6 px-8 py-3 bg-white text-accent-blue rounded-xl font-black text-lg shadow-lg hover:bg-gray-100 transition-colors"
                      >
                        رائع!
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderModals = () => (
    <>
      {renderDailyQuestModal()}
      {/* Custom Alert Modal */}
      <AnimatePresence>
        {customAlert.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card-game p-6 w-full max-w-sm space-y-4 text-center"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Info className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-black text-main">{customAlert.title}</h2>
              <p className="text-brown-muted font-bold text-lg whitespace-pre-wrap">{customAlert.message}</p>
              <button 
                onClick={() => setCustomAlert({ ...customAlert, show: false })}
                className="w-full btn-game btn-primary py-3 text-lg"
              >
                حسناً
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirm Modal */}
      <AnimatePresence>
        {customConfirm.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card-game p-6 w-full max-w-sm space-y-4 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <HelpCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-main">{customConfirm.title}</h2>
              <p className="text-brown-muted font-bold text-lg whitespace-pre-wrap">{customConfirm.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    customConfirm.onConfirm();
                    setCustomConfirm({ ...customConfirm, show: false });
                  }}
                  className="flex-1 btn-game btn-danger py-3 text-lg"
                >
                  نعم
                </button>
                <button 
                  onClick={() => setCustomConfirm({ ...customConfirm, show: false })}
                  className="flex-1 btn-game btn-primary py-3 text-lg"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Prompt Modal */}
      <AnimatePresence>
        {customPrompt.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card-game p-6 w-full max-w-sm space-y-4 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Info className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-black text-main">{customPrompt.title}</h2>
              <p className="text-brown-muted font-bold text-lg whitespace-pre-wrap">{customPrompt.message}</p>
              <input
                type="text"
                autoFocus
                defaultValue={customPrompt.defaultValue}
                className="input-game w-full text-center"
                id="customPromptInput"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (document.getElementById('customPromptInput') as HTMLInputElement).value;
                    customPrompt.onConfirm(val);
                    setCustomPrompt({ ...customPrompt, show: false });
                  }
                }}
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const val = (document.getElementById('customPromptInput') as HTMLInputElement).value;
                    customPrompt.onConfirm(val);
                    setCustomPrompt({ ...customPrompt, show: false });
                  }}
                  className="flex-1 btn-game btn-success py-3 text-lg"
                >
                  تأكيد
                </button>
                <button 
                  onClick={() => setCustomPrompt({ ...customPrompt, show: false })}
                  className="flex-1 btn-game btn-primary py-3 text-lg"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ad Confirmation Modal */}
      <AnimatePresence>
        {showAdConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 text-white"
          >
            <div className="bg-modal-theme p-8 rounded-[2rem] text-center max-w-sm w-full space-y-6">
              <h2 className="text-2xl font-black text-accent-orange">وسيلة مساعدة</h2>
              <p className="text-brown-dark font-bold">هل تود مشاهدة إعلان لفتح واستخدام وسيلة المساعدة "{activePowerUp ? {quick_guess: 'تخمين سريع', hint: 'نصيحة', word_length: 'كاشف الحروف', word_count: 'عدد الكلمات', time_freeze: 'تجميد الوقت', spy_lens: 'الجاسوس'}[activePowerUp] : ''}"؟</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowAdConfirmation(false);
                    setShowAdModal(true);
                    socket?.emit('start_ad_watch', { serial: playerSerial });
                    setAdTimer(5);
                    
                    // Send message to opponent immediately
                    const powerUpName = {
                      quick_guess: 'تخمين سريع',
                      hint: 'نصيحة',
                      word_length: 'كاشف الحروف',
                      word_count: 'عدد الكلمات',
                      time_freeze: 'تجميد الوقت',
                      spy_lens: 'الجاسوس'
                    }[activePowerUp || ''];
                    
                    socket?.emit('send_chat', { 
                      roomId, 
                      text: `يقوم ${playerName} بمشاهدة إعلان لفتح وسيلة مساعدة "${powerUpName}"، انتظر قليلاً.` 
                    });
                    
                    socket?.emit('ad_started', { roomId });

                    // Start timer
                    const interval = setInterval(() => {
                      setAdTimer(prev => {
                        if (prev <= 1) {
                          clearInterval(interval);
                          return 0;
                        }
                        return prev - 1;
                      });
                    }, 1000);
                  }}
                  className="flex-1 bg-accent-green hover:brightness-110 text-white py-4 rounded-2xl font-black"
                >
                  نعم، شاهد الآن
                </button>
                <button 
                  onClick={() => {
                    setShowAdConfirmation(false);
                    setActivePowerUp(null);
                  }}
                  className="flex-1 bg-gray-500 hover:brightness-110 text-white py-4 rounded-2xl font-black"
                >
                  لا
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mock Ad Modal */}
      <AnimatePresence>
        {showAdModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-4 text-white"
          >
            <div className="absolute top-4 right-4 bg-gray-800 px-4 py-2 rounded-full font-black text-sm">
              {adTimer > 0 ? `إغلاق بعد ${adTimer}s` : 'يمكنك الإغلاق الآن'}
            </div>
            
            <div className="text-center space-y-6 max-w-md">
              <div className="w-24 h-24 bg-gray-800 rounded-3xl flex items-center justify-center mx-auto animate-bounce">
                <span className="text-6xl">📺</span>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-accent-orange">إعلان تجريبي</h2>
                <p className="text-brown-light font-bold">هذا مجرد محاكاة للإعلان. في النسخة النهائية سيظهر هنا إعلان حقيقي من Google.</p>
              </div>

              {adTimer === 0 && (
                <div className="text-accent-green font-black text-xl animate-pulse">
                  جاري استلام المكافأة...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-modal-theme rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="p-6 text-center relative shrink-0" style={{ background: `linear-gradient(to right, var(--shop-header-start), var(--shop-header-end))` }}>
                <button 
                  onClick={() => { playSound('clickClose'); setShowShopModal(false); }}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/30">
                  <ShoppingCart className="w-8 h-8 text-brown-dark" />
                </div>
                <h2 className="text-2xl font-black text-light mb-1">المتجر</h2>
                <p className="text-purple-100 text-sm font-bold">احصل على Tokens للعب مع المحترفين!</p>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="flex items-center justify-between box-game p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Zap className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brown-muted">رصيدك الحالي</div>
                      <div className="text-lg font-black" style={{ color: 'var(--shop-token-text)' }}>{tokens} Tokens</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-brown-dark mb-2">باقات الـ Tokens</h3>

                  {/* Free Ad Reward - Level 50+ Only */}
                  {getLevel(xp) >= 1 && (
                    <div className="flex items-center justify-between p-4 border-2 border-game box-game relative overflow-hidden mb-4">
                      <div className="absolute top-0 right-0 bg-accent-green text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10">
                        مجاناً (Level 50+)
                      </div>
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 bg-accent-green-soft rounded-xl flex items-center justify-center text-2xl animate-pulse">
                          📺
                        </div>
                        <div>
                          <div className="font-black text-brown-dark">شاهد إعلان = 1 Token</div>
                          <div className="text-xs font-bold text-brown-muted">
                            متبقي لك اليوم: <span className="text-accent-green">{5 - adStatus.adsWatched}/5</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => showAlert('سيتم تفعيل الإعلانات قريباً!', 'المتجر')}
                        className={`px-4 py-2 rounded-xl font-black text-sm transition-all shadow-md relative z-10 bg-gray-300 text-brown-muted cursor-not-allowed`}
                      >
                        قريباً
                      </button>
                    </div>
                  )}
                  
                  {/* Package 1 */}
                  <div className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-accent-purple transition-colors box-game">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-accent-purple-soft rounded-xl flex items-center justify-center text-2xl font-black text-accent-purple">
                        1
                      </div>
                      <div>
                        <div className="font-black text-brown-dark">1 Token</div>
                        <div className="text-xs font-bold text-brown-muted">مباراة واحدة مع مستوى 40+</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => showAlert('سيتم تفعيل الدفع قريباً!', 'المتجر')}
                      className="bg-accent-purple hover:brightness-110 text-white px-4 py-2 rounded-xl font-black text-sm transition-colors shadow-md"
                    >
                      10 ج.م
                    </button>
                  </div>

                  {/* Package 2 */}
                  <div className="flex items-center justify-between box-game p-4 relative">
                    <div className="absolute -top-3 left-4 bg-accent-orange text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
                      الأكثر مبيعاً
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-accent-purple-soft rounded-xl flex items-center justify-center text-2xl font-black text-accent-purple">
                        5
                      </div>
                      <div>
                        <div className="font-black text-brown-dark">5 Tokens</div>
                        <div className="text-xs font-bold text-brown-muted">5 مباريات + 1 مجاناً</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => showAlert('سيتم تفعيل الدفع قريباً!', 'المتجر')}
                      className="bg-accent-purple hover:brightness-110 text-white px-4 py-2 rounded-xl font-black text-sm transition-colors shadow-md"
                    >
                      40 ج.م
                    </button>
                  </div>

                  {/* Package 3 */}
                  <div className="flex items-center justify-between p-4 box-game hover:border-accent-purple transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-accent-purple-soft rounded-xl flex items-center justify-center text-2xl font-black text-accent-purple">
                        10
                      </div>
                      <div>
                        <div className="font-black text-brown-dark">10 Tokens</div>
                        <div className="text-xs font-bold text-brown-muted">10 مباريات + 3 مجاناً</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => showAlert('سيتم تفعيل الدفع قريباً!', 'المتجر')}
                      className="bg-accent-purple hover:brightness-110 text-white px-4 py-2 rounded-xl font-black text-sm transition-colors shadow-md"
                    >
                      70 ج.م
                    </button>
                  </div>

                  {/* Ad-free Power-ups Package (Visible to all, locked for 50+) */}
                  <div className="flex items-center justify-between p-4 border-2 border-accent-orange rounded-2xl bg-orange-50 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-accent-orange-soft rounded-xl flex items-center justify-center text-2xl">
                        ⚡
                      </div>
                      <div>
                        <div className="font-black text-brown-dark">باقة المحترفين</div>
                        <div className="text-xs font-bold text-brown-muted">استخدم وسائل المساعدة بدون إعلانات</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
                            setProPackageExpiry(expiry);
                            localStorage.setItem('khamin_pro_package_expiry', expiry.toString());
                            showAlert('تم تفعيل باقة المحترفين للتجربة (30 يوم)!', 'المتجر');
                          }}
                          className="px-3 py-2 rounded-xl font-black text-xs transition-all shadow-md bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                        >
                          تفعيل للتجربة
                        </button>
                      )}
                      <button 
                        onClick={() => showAlert('سيتم تفعيل الدفع قريباً!', 'المتجر')}
                        className={`px-4 py-2 rounded-xl font-black text-sm transition-all shadow-md bg-gray-300 text-brown-muted cursor-not-allowed`}
                      >
                        {hasProPackage ? 'تم الشراء' : 'قريباً'}
                      </button>
                    </div>
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
            onClick={toggleLevelInfo}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card-game p-4 max-w-md w-full relative overflow-hidden text-right"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={toggleLevelInfo}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-brown-muted hover:bg-gray-200 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center justify-center gap-2 mb-4 mt-6">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-accent-orange fill-accent-orange" />
                </div>
                <h2 className="text-xl font-black text-main">نظام المستويات (Levels)</h2>
              </div>
              
              <div className="space-y-2 text-brown-muted font-bold max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p>كلما فزت في مباريات أكثر، كلما حصلت على XP وارتفع مستواك!</p>
                
                <div className="box-game p-3 space-y-4">
                  <h3 className="text-lg font-black text-accent-orange mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      ميزة التخمين السريع
                    </div>
                    <span className="text-xs bg-orange-200 text-accent-orange px-2 py-1 rounded-full">تفتح في المستوى 1</span>
                  </h3>
                  <p className="text-sm leading-relaxed">
                    ميزة التخمين السريع تتيح لك محاولة تخمين الصورة قبل انتهاء الوقت.
                    كلما ارتفع مستواك، كلما تم تفعيل هذه الميزة بشكل أسرع في المباراة (يقل وقت الانتظار بمقدار 3 ثوانٍ لكل مستوى، مما يمنحك أفضلية!).
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex justify-between items-center box-game p-2">
                      <span>المستوى 1</span>
                      <span className="text-accent-orange">بعد 2:30 دقيقة (150 ثانية)</span>
                    </li>
                    <li className="flex justify-between items-center box-game p-2">
                      <span>المستوى 25</span>
                      <span className="text-accent-orange">بعد 1:18 دقيقة (78 ثانية)</span>
                    </li>
                    <li className="flex justify-between items-center box-game p-2">
                      <span>المستوى 50</span>
                      <span className="text-accent-orange font-black">بعد 0:03 ثوانٍ (تقريباً من البداية!)</span>
                    </li>
                  </ul>
                </div>

                {/* Hint */}
                <div className="box-game p-3">
                  <h3 className="text-lg font-black text-accent-blue mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 relative">
                      <HelpCircle className="w-5 h-5" />
                      النصيحة
                      {getLevel(xp) >= 10 && lastSeenPowerUpLevel < 10 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-xs bg-blue-200 text-accent-blue px-2 py-1 rounded-full">تفتح في المستوى 10</span>
                  </h3>
                  <p className="text-sm leading-relaxed">
                    تلميح عن اسم الصورة بأول حرف وثاني حرف لمساعدتك في التخمين. يمكنك استخدامها مرتين في كل مباراة.
                  </p>
                </div>

                {/* Letter Revealer */}
                <div className="box-game p-3">
                  <h3 className="text-lg font-black text-accent-green mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 relative">
                      <Type className="w-5 h-5" />
                      كاشف الحروف
                      {getLevel(xp) >= 20 && lastSeenPowerUpLevel < 20 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-xs bg-green-200 text-accent-green px-2 py-1 rounded-full">يفتح في المستوى 20</span>
                  </h3>
                  <p className="text-sm leading-relaxed">
                    يكشف لك عن عدد حروف الكلمة المطلوبة لتسهيل عملية التخمين وتضييق نطاق الاحتمالات.
                  </p>
                </div>

                {/* Time Freeze */}
                <div className="box-game p-3">
                  <h3 className="text-lg font-black text-cyan-600 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 relative">
                      <Snowflake className="w-5 h-5" />
                      تجميد الوقت
                      {getLevel(xp) >= 30 && lastSeenPowerUpLevel < 30 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-xs bg-cyan-200 text-cyan-700 px-2 py-1 rounded-full">يفتح في المستوى 30</span>
                  </h3>
                  <p className="text-sm leading-relaxed">
                    يقوم بتجميد وقت المباراة لمدة 60 ثانية، مما يمنحك وقتاً إضافياً للتفكير والبحث دون أن ينقص الوقت الأصلي.
                  </p>
                </div>

                {/* Word Count */}
                <div className="box-game p-3">
                  <h3 className="text-lg font-black text-indigo-600 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 relative">
                      <Hash className="w-5 h-5" />
                      عدد الكلمات
                      {getLevel(xp) >= 40 && lastSeenPowerUpLevel < 40 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-1 rounded-full">يفتح في المستوى 40</span>
                  </h3>
                  <p className="text-sm leading-relaxed">
                    يكشف لك عن عدد الكلمات في اسم الصورة المطلوبة، مما يساعدك في معرفة ما إذا كانت الإجابة كلمة واحدة أم أكثر.
                  </p>
                </div>

                {/* Spy */}
                <div className="box-game p-3">
                  <h3 className="text-lg font-black text-accent-purple mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 relative">
                      <Eye className="w-5 h-5" />
                      الجاسوس
                      {getLevel(xp) >= 50 && lastSeenPowerUpLevel < 50 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-xs bg-purple-200 text-accent-purple px-2 py-1 rounded-full">يفتح في المستوى 50</span>
                  </h3>
                  <p className="text-sm leading-relaxed">
                    يتيح لك رؤية صورة منافسك، مما يعطيك أفضلية استراتيجية كبيرة جداً!
                  </p>
                </div>

                <div className="box-game p-3">
                  <h3 className="text-lg font-black text-indigo-600 mb-2 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    جوائز المستويات
                  </h3>
                  <p className="text-sm leading-relaxed mb-3">
                    احصل على إطارات مميزة ونجوم ذهبية تزين صورتك الشخصية كلما تقدمت في المستويات!
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-3 box-game p-2">
                      <div className="w-10 h-10">
                        {renderAvatarContent(avatar, 10)}
                      </div>
                      <span className="flex-1">المستوى 10</span>
                      <span className="text-blue-500">إطار فضي + نجمة</span>
                    </li>
                    <li className="flex items-center gap-3 box-game p-2">
                      <div className="w-10 h-10">
                        {renderAvatarContent(avatar, 20)}
                      </div>
                      <span className="flex-1">المستوى 20</span>
                      <span className="text-blue-500">إطار ذهبي + نجمتين</span>
                    </li>
                    <li className="flex items-center gap-3 box-game p-2">
                      <div className="w-10 h-10">
                        {renderAvatarContent(avatar, 30)}
                      </div>
                      <span className="flex-1">المستوى 30</span>
                      <span className="text-blue-500">إطار زمردي + 3 نجوم</span>
                    </li>
                    <li className="flex items-center gap-3 box-game p-2">
                      <div className="w-10 h-10">
                        {renderAvatarContent(avatar, 40)}
                      </div>
                      <span className="flex-1">المستوى 40</span>
                      <span className="text-blue-500">إطار أسطوري + 4 نجوم</span>
                    </li>
                    <li className="flex items-center gap-3 box-game p-2">
                      <div className="w-10 h-10">
                        {renderAvatarContent(avatar, 50)}
                      </div>
                      <span className="flex-1">المستوى 50</span>
                      <span className="text-blue-500 font-black">إطار ناري + 5 نجوم!</span>
                    </li>
                  </ul>
                </div>
                
                <p className="text-sm text-center text-brown-light mt-4">استمر في اللعب لتصل إلى أعلى مستوى وتتفوق على أصدقائك!</p>
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
            onClick={toggleSettings}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="card-game p-4 w-full max-w-md space-y-4 overflow-y-auto max-h-[90vh] overflow-x-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center flex-row-reverse">
                <h2 className="text-2xl font-black text-main">ملف اللاعب</h2>
                <button onClick={toggleSettings} className="text-brown-light hover:text-red-500"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-4">
                {/* Stats Section */}
                <div className="bg-white p-3 rounded-2xl border-4 border-black space-y-4">
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="relative w-16 h-16">
                      {renderAvatarContent(avatar, getLevel(xp))}
                    </div>
                    <div className="text-right flex-1">
                      <div className="font-black text-lg text-main">{playerName}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 flex-row-reverse">
                        <span className="text-xs font-black text-brown-muted">Level {getLevel(xp)}</span>
                      </div>
                      <div className="w-full bg-[var(--level-bar-bg)] rounded-full h-2 overflow-hidden mb-2" dir="ltr">
                        <div 
                          className="h-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (getLevel(xp) / 50) * 100)}%`, backgroundColor: 'var(--level-bar-fill)' }}
                        ></div>
                      </div>
                      <div className="w-full bg-[var(--xp-bar-bg)] rounded-full h-5 shadow-inner overflow-hidden relative border-2 border-black" dir="ltr">
                        <div 
                          className="h-full transition-all duration-500" 
                          style={{ width: `${getXpProgress(xp)}%`, backgroundColor: 'var(--xp-bar-fill)' }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-black drop-shadow-sm flex items-center gap-1" style={{ color: getXpProgress(xp) >= 100 ? 'var(--xp-bar-text-active)' : 'var(--xp-bar-text)' }}>
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
                    <label className="block text-sm font-black text-brown-muted mb-1 text-right">الاسم</label>
                    <input 
                      type="text" 
                      value={playerName}
                      onChange={(e) => {
                        const name = e.target.value;
                        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
                        const cleanName = name.replace(emojiRegex, '');
                        setPlayerName(cleanName.slice(0, 15));
                      }}
                      className="input-game"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-brown-muted mb-1 text-right">العمر</label>
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
                    <label className="block text-sm font-black text-brown-muted mb-1 text-right">الجنس</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGender('boy')}
                        className={`flex-1 py-2 box-game font-black transition-all ${gender === 'boy' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'text-brown-light opacity-60'}`}
                      >
                        ولد 👦
                      </button>
                      <button
                        onClick={() => setGender('girl')}
                        className={`flex-1 py-2 box-game font-black transition-all ${gender === 'girl' ? 'bg-pink-100 text-pink-600 border-pink-200' : 'text-brown-light opacity-60'}`}
                      >
                        بنت 👧
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-brown-muted mb-3 text-right">تغيير الأفاتار</label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATARS.filter(av => av.gender === gender).map((av, index) => {
                        const isLocked = getLevel(xp) < av.level;
                        return (
                          <button
                            key={`settings-avatar-${av.id}-${index}`}
                            onClick={() => !isLocked && setAvatar(av.id)}
                            disabled={isLocked}
                            className={`relative aspect-square box-game flex items-center justify-center transition-all overflow-hidden ${avatar === av.id ? 'bg-orange-100 border-orange-400 scale-105' : 'hover:bg-gray-200'} ${isLocked ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                          >
                            <div className="w-full h-full p-1">
                              {renderAvatarContent(av.id, 1)}
                            </div>
                            {isLocked ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl z-20">
                                <Lock className="w-4 h-4 text-white" />
                                <span className="text-[9px] font-bold text-white mt-1">Lvl {av.level}</span>
                              </div>
                            ) : (
                              getLevel(xp) >= av.level && lastSeenAvatarLevel < av.level && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse z-30"></span>
                              )
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Avatar in Settings */}
                  <div className="pt-2 border-t border-game">
                    <div className="flex items-center justify-between mb-2 flex-row-reverse relative">
                      <span className="text-xs font-black text-brown-muted">أفاتار مخصص</span>
                      {getLevel(xp) >= 50 && lastSeenAvatarLevel < 50 && (
                        <span className="absolute top-0 right-20 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                      <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs font-black">
                        <Star className="w-3.5 h-3.5 fill-purple-600" />
                        Level 50
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <label className={`relative flex-1 flex flex-col items-center justify-center p-2 rounded-xl border-2 border-dashed transition-all cursor-pointer ${getLevel(xp) >= 50 ? 'border-purple-400 bg-purple-100 hover:bg-purple-200' : 'border-black bg-white cursor-not-allowed'}`}>
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
                            <Lock className="w-5 h-5 text-brown-muted mb-1" />
                            <span className="text-[10px] font-black text-brown-muted">مغلق</span>
                          </>
                        )}
                      </label>
                      {customAvatar && (
                        <button
                          onClick={() => setAvatar(customAvatar)}
                          className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 ${avatar === customAvatar ? 'border-purple-500' : 'border-black'}`}
                        >
                          <img src={customAvatar} className="w-full h-full object-cover" alt="Custom" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Audio Settings */}
                  <div className="pt-4 border-t border-game space-y-4">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <span className="text-sm font-black text-brown-muted">إعدادات الصوت</span>
                    </div>
                    
                    {/* SFX Volume */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <button 
                            onClick={() => setIsSfxMuted(!isSfxMuted)}
                            className={`p-2 rounded-xl border-2 border-black transition-all ${isSfxMuted ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                          >
                            {isSfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <span className="text-xs font-black text-main">المؤثرات الصوتية</span>
                        </div>
                        <span className="text-[10px] font-black text-brown-muted">{Math.round(sfxVolume * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={sfxVolume}
                        onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        dir="ltr"
                      />
                    </div>

                    {/* Music Volume */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <button 
                            onClick={() => setIsMusicMuted(!isMusicMuted)}
                            className={`p-2 rounded-xl border-2 border-black transition-all ${isMusicMuted ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}
                          >
                            {isMusicMuted ? <VolumeX className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                          </button>
                          <span className="text-xs font-black text-main">الموسيقى الخلفية</span>
                        </div>
                        <span className="text-[10px] font-black text-brown-muted">{Math.round(musicVolume * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        dir="ltr"
                      />
                    </div>
                  </div>

                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-black text-brown-muted text-right">الإنجازات</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`p-2 box-game flex flex-col items-center transition-all ${wins > 0 ? 'bg-orange-50' : 'opacity-40'}`}>
                      <Trophy className={`w-5 h-5 ${wins > 0 ? 'text-orange-400' : 'text-brown-light'}`} />
                      <span className={`text-[8px] font-black mt-1 ${wins > 0 ? 'text-orange-600' : 'text-brown-muted'}`}>
                        {wins} فوز
                      </span>
                    </div>
                    <div className={`p-2 box-game flex flex-col items-center transition-all ${streak >= 5 ? 'bg-blue-50' : 'opacity-40'}`}>
                      <Zap className={`w-5 h-5 ${streak >= 5 ? 'text-blue-400' : 'text-brown-light'}`} />
                      <span className={`text-[8px] font-black mt-1 ${streak >= 5 ? 'text-blue-600' : 'text-brown-muted'}`}>سلسلة {streak}</span>
                    </div>
                    <div className={`p-2 box-game flex flex-col items-center transition-all ${getLevel(xp) >= 10 ? 'bg-purple-50' : 'opacity-40'}`}>
                      <Star className={`w-5 h-5 ${getLevel(xp) >= 10 ? 'text-purple-400' : 'text-brown-light'}`} />
                      <span className={`text-[8px] font-black mt-1 ${getLevel(xp) >= 10 ? 'text-purple-600' : 'text-brown-muted'}`}>مستوى {getLevel(xp)}</span>
                    </div>
                  </div>
                </div>

                {/* Reports Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <label className="text-sm font-black text-brown-muted">حالة الحساب</label>
                    <span className="text-[10px] font-black text-brown-light">10 إبلاغات = حظر 24 ساعة</span>
                  </div>
                  <div className="box-game p-3">
                    <div className="flex items-center justify-between mb-2 flex-row-reverse">
                      <div className="flex items-center gap-2">
                        <Flag className={`w-4 h-4 ${reports > 0 ? 'text-red-500' : 'text-brown-light'}`} fill={reports > 0 ? "currentColor" : "none"} />
                        <span className="text-xs font-black text-brown-dark">عدد الإبلاغات: {reports}</span>
                      </div>
                      <span className="text-[10px] font-black text-red-500">
                        متبقي {Math.max(0, 10 - reports)} للحظر
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--report-bar-bg)] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (reports / 10) * 100)}%` }}
                        className="h-full"
                        style={{ 
                          backgroundColor: reports >= 7 ? 'var(--report-bar-high)' : reports >= 4 ? 'var(--report-bar-medium)' : 'var(--report-bar-low)' 
                        }}
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

              <div className="pt-2 border-t border-game">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-sm font-black text-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح الحساب نهائياً
                </button>
              </div>



              {/* Admin Access Button */}
              <div className="pt-2 border-t border-game">
                <button 
                  onClick={isAdmin ? () => { closeAllModals(); setShowAdminDashboard(true); } : handleAdminLogin}
                  className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all ${isAdmin ? 'bg-purple-100 text-purple-600 border-2 border-purple-200' : 'bg-gray-50 text-brown-light border-2 border-gray-100 hover:bg-gray-100'}`}
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
                  <h2 className="text-xl md:text-2xl font-black text-main">أهلاً بك في خمن تخمينة!</h2>
                  <p className="text-brown-muted font-bold text-sm md:text-base">يرجى إكمال بياناتك للبدء</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-brown-muted mb-1 text-right">اسم اللاعب</label>
                    <input 
                      type="text" 
                      value={playerName}
                      onChange={(e) => {
                        const name = e.target.value;
                        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
                        const cleanName = name.replace(emojiRegex, '');
                        setPlayerName(cleanName.slice(0, 15));
                      }}
                      placeholder="ادخل اسمك..."
                      className="input-game"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-brown-muted mb-1 text-right">عمر اللاعب</label>
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
                    <label className="block text-sm font-black text-brown-muted mb-1 text-right">الجنس</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGender('boy')}
                        className={`flex-1 py-3 box-game font-black transition-all ${gender === 'boy' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'text-brown-light opacity-60'}`}
                      >
                        ولد 👦
                      </button>
                      <button
                        onClick={() => setGender('girl')}
                        className={`flex-1 py-3 box-game font-black transition-all ${gender === 'girl' ? 'bg-pink-100 text-pink-600 border-pink-200' : 'text-brown-light opacity-60'}`}
                      >
                        بنت 👧
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-brown-muted mb-3 text-right">اختر أفاتار البداية</label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATARS.filter(av => av.gender === gender).slice(0, 4).map((av, index) => (
                        <button
                          key={`welcome-avatar-${av.id}-${index}`}
                          onClick={() => setAvatar(av.id)}
                          className={`w-full aspect-square box-game flex items-center justify-center transition-all overflow-hidden ${avatar === av.id ? 'bg-orange-100 border-orange-400 scale-105' : ''}`}
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
                  <h3 className="text-2xl font-black text-brown-dark">هل أنت متأكد؟</h3>
                  <p className="text-brown-muted font-bold leading-relaxed">
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
                    className="w-full btn-game btn-secondary py-3 text-lg bg-gray-100 border-gray-200 text-brown-muted"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Login */}
        <AnimatePresence>
          {showAdminLogin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[6000]"
            >
              <AdminLogin onLogin={() => {
                fetch('/api/auth/google/url')
                  .then(res => res.json())
                  .then(data => {
                    window.location.href = data.url;
                  });
              }} />
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
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[6000] flex items-center justify-center p-4 overflow-hidden"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[40px] w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border-4 border-purple-100"
              >
                {/* Header */}
                <div className="p-6 border-b-4 border-black flex items-center justify-between bg-white/90 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-brown-dark">لوحة تحكم المدير</h2>
                      <div className="flex gap-2 mt-1">
                        <button 
                          onClick={() => setAdminTab('players')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'players' ? 'bg-accent-purple text-white' : 'bg-accent-purple-soft text-accent-purple hover:bg-accent-purple-soft'}`}
                        >
                          اللاعبين والبلاغات
                        </button>
                        <button 
                          onClick={() => setAdminTab('images')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'images' ? 'bg-accent-purple text-white' : 'bg-accent-purple-soft text-accent-purple hover:bg-accent-purple-soft'}`}
                        >
                          إدارة الصور
                        </button>
                        <button 
                          onClick={() => setAdminTab('customization')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'customization' ? 'bg-accent-purple text-white' : 'bg-accent-purple-soft text-accent-purple hover:bg-accent-purple-soft'}`}
                        >
                          تخصيص اللعبة
                        </button>
                        <button 
                          onClick={() => setAdminTab('shop')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'shop' ? 'bg-accent-orange text-white' : 'bg-accent-orange-soft text-accent-orange hover:bg-accent-orange-soft'}`}
                        >
                          المتجر والـ Tokens
                        </button>
                        <button 
                          onClick={() => setAdminTab('colors')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'colors' ? 'bg-accent-blue text-white' : 'bg-accent-blue-soft text-accent-blue hover:bg-accent-blue-soft'}`}
                        >
                          ألوان اللعبة
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
                      className="p-3 bg-white rounded-xl border-2 border-gray-100 text-brown-light hover:text-purple-600 hover:border-purple-100 transition-all"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setShowAdminDashboard(false)}
                      className="p-3 bg-white rounded-xl border-2 border-gray-100 text-brown-light hover:text-red-500 hover:border-red-100 transition-all"
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
                        <div className="box-game p-6 shadow-sm">
                          <h3 className="text-xl font-black text-brown-dark mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-6 h-6 text-orange-500" />
                            إدارة المتجر والـ Tokens
                          </h3>
                          <p className="text-brown-muted mb-6 font-bold">
                            من هنا يمكنك إدارة باقات الـ Tokens وإرسال Tokens مجانية للاعبين.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Send Tokens Form */}
                            <div className="box-game p-5">
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
                                  onClick={() => showAlert('سيتم تفعيل هذه الخاصية قريباً', 'قريباً')}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-2 rounded-lg transition-colors"
                                >
                                  إرسال
                                </button>
                              </div>
                            </div>

                            {/* Packages Management */}
                            <div className="box-game p-5">
                              <h4 className="font-black text-brown-dark mb-4">الباقات الحالية</h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 box-game">
                                  <div className="font-bold text-sm">باقة 1 Token</div>
                                  <div className="text-orange-600 font-black">10 ج.م</div>
                                </div>
                                <div className="flex items-center justify-between p-3 box-game bg-orange-50">
                                  <div className="font-bold text-sm">باقة 5 Tokens</div>
                                  <div className="text-orange-600 font-black">40 ج.م</div>
                                </div>
                                <div className="flex items-center justify-between p-3 box-game">
                                  <div className="font-bold text-sm">باقة 10 Tokens</div>
                                  <div className="text-orange-600 font-black">70 ج.م</div>
                                </div>
                                <button 
                                  onClick={() => showAlert('سيتم تفعيل تعديل الباقات قريباً', 'قريباً')}
                                  className="w-full text-sm text-brown-muted hover:text-orange-600 font-bold py-2 border border-dashed border-gray-300 rounded-lg mt-2 transition-colors"
                                >
                                  + إضافة / تعديل باقة
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : adminTab === 'colors' ? (
                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                      <div className="max-w-4xl mx-auto space-y-6">
                        <div className="box-game p-6 shadow-sm">
                          <h3 className="text-xl font-black text-brown-dark mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent-blue-soft flex items-center justify-center">
                              <span className="text-lg">🎨</span>
                            </div>
                            تخصيص ألوان اللعبة
                          </h3>
                          <p className="text-brown-muted mb-6 font-bold">
                            يمكنك تغيير ألوان اللعبة بالكامل من هنا. التغييرات ستظهر فوراً لديك، ولكن يجب حفظها لتظهر للجميع.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Background Colors */}
                            <div className="space-y-4">
                              <h4 className="font-black text-brown-dark border-b pb-2">الخلفيات</h4>
                              
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون الخلفية (بداية التدرج)</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.bgBodyStart}</span>
                                  <input 
                                    type="color" 
                                    value={themeConfig.bgBodyStart}
                                    onChange={(e) => setThemeConfig({...themeConfig, bgBodyStart: e.target.value})}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون الخلفية (نهاية التدرج)</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.bgBodyEnd}</span>
                                  <input 
                                    type="color" 
                                    value={themeConfig.bgBodyEnd}
                                    onChange={(e) => setThemeConfig({...themeConfig, bgBodyEnd: e.target.value})}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون الصناديق (Box)</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.bgBox}</span>
                                  <input 
                                    type="color" 
                                    value={themeConfig.bgBox}
                                    onChange={(e) => setThemeConfig({...themeConfig, bgBox: e.target.value})}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون البطاقات (Card)</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.bgCard}</span>
                                  <input 
                                    type="color" 
                                    value={themeConfig.bgCard}
                                    onChange={(e) => setThemeConfig({...themeConfig, bgCard: e.target.value})}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون النوافذ المنبثقة (Modals)</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.modalBg}</span>
                                  <input 
                                    type="color" 
                                    value={themeConfig.modalBg}
                                    onChange={(e) => setThemeConfig({...themeConfig, modalBg: e.target.value})}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Progress Bars */}
                            <div className="space-y-4">
                              <h4 className="font-black text-brown-dark border-b pb-2">أشرطة التقدم (Progress Bars)</h4>
                              
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">خلفية شريط المستوى</label>
                                <input type="color" value={themeConfig.levelBarBg} onChange={(e) => setThemeConfig({...themeConfig, levelBarBg: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">تعبئة شريط المستوى</label>
                                <input type="color" value={themeConfig.levelBarFill} onChange={(e) => setThemeConfig({...themeConfig, levelBarFill: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">خلفية شريط الـ XP</label>
                                <input type="color" value={themeConfig.xpBarBg} onChange={(e) => setThemeConfig({...themeConfig, xpBarBg: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">تعبئة شريط الـ XP</label>
                                <input type="color" value={themeConfig.xpBarFill} onChange={(e) => setThemeConfig({...themeConfig, xpBarFill: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">نص الـ XP (قبل المليء)</label>
                                <input type="color" value={themeConfig.xpBarText} onChange={(e) => setThemeConfig({...themeConfig, xpBarText: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">نص الـ XP (بعد المليء)</label>
                                <input type="color" value={themeConfig.xpBarTextActive} onChange={(e) => setThemeConfig({...themeConfig, xpBarTextActive: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>
                            </div>

                            {/* Report Bar */}
                            <div className="space-y-4">
                              <h4 className="font-black text-brown-dark border-b pb-2">شريط البلاغات</h4>
                              
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">خلفية شريط البلاغات</label>
                                <input type="color" value={themeConfig.reportBarBg} onChange={(e) => setThemeConfig({...themeConfig, reportBarBg: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون البلاغات (منخفض)</label>
                                <input type="color" value={themeConfig.reportBarLow} onChange={(e) => setThemeConfig({...themeConfig, reportBarLow: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون البلاغات (متوسط)</label>
                                <input type="color" value={themeConfig.reportBarMedium} onChange={(e) => setThemeConfig({...themeConfig, reportBarMedium: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون البلاغات (مرتفع)</label>
                                <input type="color" value={themeConfig.reportBarHigh} onChange={(e) => setThemeConfig({...themeConfig, reportBarHigh: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>
                            </div>

                            {/* Text & Borders */}
                            <div className="space-y-4">
                              <h4 className="font-black text-brown-dark border-b pb-2">النصوص والحدود</h4>
                              
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون النص الرئيسي</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.textMain}</span>
                                  <input 
                                    type="color" 
                                    value={themeConfig.textMain}
                                    onChange={(e) => setThemeConfig({...themeConfig, textMain: e.target.value})}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون النص الفاتح</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.textLight}</span>
                                  <input 
                                    type="color" 
                                    value={themeConfig.textLight}
                                    onChange={(e) => setThemeConfig({...themeConfig, textLight: e.target.value})}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون الحدود (Borders)</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.borderGame}</span>
                                  <input 
                                    type="color" 
                                    value={themeConfig.borderGame}
                                    onChange={(e) => setThemeConfig({...themeConfig, borderGame: e.target.value})}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-4 md:col-span-2">
                              <h4 className="font-black text-brown-dark border-b pb-2">الأزرار</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Primary Button */}
                                <div className="space-y-2">
                                  <h5 className="text-xs font-black text-brown-light">الزر الأساسي (Primary)</h5>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">بداية التدرج</label>
                                    <input type="color" value={themeConfig.btnPrimaryBgStart} onChange={(e) => setThemeConfig({...themeConfig, btnPrimaryBgStart: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">نهاية التدرج</label>
                                    <input type="color" value={themeConfig.btnPrimaryBgEnd} onChange={(e) => setThemeConfig({...themeConfig, btnPrimaryBgEnd: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">الحدود</label>
                                    <input type="color" value={themeConfig.btnPrimaryBorder} onChange={(e) => setThemeConfig({...themeConfig, btnPrimaryBorder: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">عند التحويم (Hover)</label>
                                    <input type="color" value={themeConfig.btnPrimaryHover} onChange={(e) => setThemeConfig({...themeConfig, btnPrimaryHover: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <button className="btn-game btn-primary w-full py-2 mt-2">تجربة الزر</button>
                                </div>

                                {/* Secondary Button */}
                                <div className="space-y-2">
                                  <h5 className="text-xs font-black text-brown-light">الزر الثانوي (Secondary)</h5>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">بداية التدرج</label>
                                    <input type="color" value={themeConfig.btnSecondaryBgStart} onChange={(e) => setThemeConfig({...themeConfig, btnSecondaryBgStart: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">نهاية التدرج</label>
                                    <input type="color" value={themeConfig.btnSecondaryBgEnd} onChange={(e) => setThemeConfig({...themeConfig, btnSecondaryBgEnd: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">الحدود</label>
                                    <input type="color" value={themeConfig.btnSecondaryBorder} onChange={(e) => setThemeConfig({...themeConfig, btnSecondaryBorder: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">عند التحويم (Hover)</label>
                                    <input type="color" value={themeConfig.btnSecondaryHover} onChange={(e) => setThemeConfig({...themeConfig, btnSecondaryHover: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <button className="btn-game btn-secondary w-full py-2 mt-2">تجربة الزر</button>
                                </div>

                                {/* Success Button */}
                                <div className="space-y-2">
                                  <h5 className="text-xs font-black text-brown-light">زر النجاح (Success) - الأخضر</h5>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">بداية التدرج</label>
                                    <input type="color" value={themeConfig.btnSuccessBgStart} onChange={(e) => setThemeConfig({...themeConfig, btnSuccessBgStart: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">نهاية التدرج</label>
                                    <input type="color" value={themeConfig.btnSuccessBgEnd} onChange={(e) => setThemeConfig({...themeConfig, btnSuccessBgEnd: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">الحدود</label>
                                    <input type="color" value={themeConfig.btnSuccessBorder} onChange={(e) => setThemeConfig({...themeConfig, btnSuccessBorder: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">عند التحويم (Hover)</label>
                                    <input type="color" value={themeConfig.btnSuccessHover} onChange={(e) => setThemeConfig({...themeConfig, btnSuccessHover: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <button className="btn-game btn-success w-full py-2 mt-2">تجربة الزر</button>
                                </div>

                                {/* Danger Button */}
                                <div className="space-y-2">
                                  <h5 className="text-xs font-black text-brown-light">زر الخطر (Danger)</h5>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">بداية التدرج</label>
                                    <input type="color" value={themeConfig.btnDangerBgStart} onChange={(e) => setThemeConfig({...themeConfig, btnDangerBgStart: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">نهاية التدرج</label>
                                    <input type="color" value={themeConfig.btnDangerBgEnd} onChange={(e) => setThemeConfig({...themeConfig, btnDangerBgEnd: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">الحدود</label>
                                    <input type="color" value={themeConfig.btnDangerBorder} onChange={(e) => setThemeConfig({...themeConfig, btnDangerBorder: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">عند التحويم (Hover)</label>
                                    <input type="color" value={themeConfig.btnDangerHover} onChange={(e) => setThemeConfig({...themeConfig, btnDangerHover: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <button className="btn-game btn-danger w-full py-2 mt-2">تجربة الزر</button>
                                </div>
                              </div>
                            </div>

                            {/* Accent Colors */}
                            <div className="space-y-4 md:col-span-2">
                              <h4 className="font-black text-brown-dark border-b pb-2">ألوان النصوص المميزة (Accents)</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-accent-orange">البرتقالي</label>
                                  <input type="color" value={themeConfig.accentOrange} onChange={(e) => setThemeConfig({...themeConfig, accentOrange: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-accent-purple">البنفسجي</label>
                                  <input type="color" value={themeConfig.accentPurple} onChange={(e) => setThemeConfig({...themeConfig, accentPurple: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-accent-blue">الأزرق</label>
                                  <input type="color" value={themeConfig.accentBlue} onChange={(e) => setThemeConfig({...themeConfig, accentBlue: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-accent-green">الأخضر</label>
                                  <input type="color" value={themeConfig.accentGreen} onChange={(e) => setThemeConfig({...themeConfig, accentGreen: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                                </div>
                              </div>
                            </div>
                            {/* Text Shades */}
                            <div className="space-y-4 md:col-span-2">
                              <h4 className="font-black text-brown-dark border-b pb-2">درجات النصوص (Text Shades)</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-brown-muted">نص باهت (Muted)</label>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.textMuted}</span>
                                    <input type="color" value={themeConfig.textMuted} onChange={(e) => setThemeConfig({...themeConfig, textMuted: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                                  </div>
                                  <p className="text-xs font-bold" style={{ color: themeConfig.textMuted }}>نص تجريبي باهت</p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-brown-muted">نص فاتح (Light Accent)</label>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.textLightAccent}</span>
                                    <input type="color" value={themeConfig.textLightAccent} onChange={(e) => setThemeConfig({...themeConfig, textLightAccent: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                                  </div>
                                  <p className="text-xs font-bold" style={{ color: themeConfig.textLightAccent }}>نص تجريبي فاتح</p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-brown-muted">نص ناعم (Soft)</label>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{themeConfig.textSoft}</span>
                                    <input type="color" value={themeConfig.textSoft} onChange={(e) => setThemeConfig({...themeConfig, textSoft: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                                  </div>
                                  <p className="text-xs font-bold" style={{ color: themeConfig.textSoft }}>نص تجريبي ناعم</p>
                                </div>
                              </div>
                            </div>

                            {/* Ranks (Bar Charts) */}
                            <div className="space-y-4 md:col-span-2">
                              <h4 className="font-black text-brown-dark border-b pb-2">ألوان المراكز (Leaderboard Bars)</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Rank 1 */}
                                <div className="space-y-2">
                                  <h5 className="text-xs font-black text-brown-light">المركز الأول 🥇</h5>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">بداية التدرج</label>
                                    <input type="color" value={themeConfig.rank1BgStart} onChange={(e) => setThemeConfig({...themeConfig, rank1BgStart: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">نهاية التدرج</label>
                                    <input type="color" value={themeConfig.rank1BgEnd} onChange={(e) => setThemeConfig({...themeConfig, rank1BgEnd: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">الحدود</label>
                                    <input type="color" value={themeConfig.rank1Border} onChange={(e) => setThemeConfig({...themeConfig, rank1Border: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="w-full h-16 rounded-t-xl border-t-4" style={{ background: `linear-gradient(to bottom, ${themeConfig.rank1BgStart}, ${themeConfig.rank1BgEnd})`, borderColor: themeConfig.rank1Border }}></div>
                                </div>

                                {/* Rank 2 */}
                                <div className="space-y-2">
                                  <h5 className="text-xs font-black text-brown-light">المركز الثاني 🥈</h5>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">بداية التدرج</label>
                                    <input type="color" value={themeConfig.rank2BgStart} onChange={(e) => setThemeConfig({...themeConfig, rank2BgStart: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">نهاية التدرج</label>
                                    <input type="color" value={themeConfig.rank2BgEnd} onChange={(e) => setThemeConfig({...themeConfig, rank2BgEnd: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">الحدود</label>
                                    <input type="color" value={themeConfig.rank2Border} onChange={(e) => setThemeConfig({...themeConfig, rank2Border: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="w-full h-12 rounded-t-xl border-t-4" style={{ background: `linear-gradient(to bottom, ${themeConfig.rank2BgStart}, ${themeConfig.rank2BgEnd})`, borderColor: themeConfig.rank2Border }}></div>
                                </div>

                                {/* Rank 3 */}
                                <div className="space-y-2">
                                  <h5 className="text-xs font-black text-brown-light">المركز الثالث 🥉</h5>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">بداية التدرج</label>
                                    <input type="color" value={themeConfig.rank3BgStart} onChange={(e) => setThemeConfig({...themeConfig, rank3BgStart: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">نهاية التدرج</label>
                                    <input type="color" value={themeConfig.rank3BgEnd} onChange={(e) => setThemeConfig({...themeConfig, rank3BgEnd: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-brown-muted">الحدود</label>
                                    <input type="color" value={themeConfig.rank3Border} onChange={(e) => setThemeConfig({...themeConfig, rank3Border: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                                  </div>
                                  <div className="w-full h-8 rounded-t-xl border-t-4" style={{ background: `linear-gradient(to bottom, ${themeConfig.rank3BgStart}, ${themeConfig.rank3BgEnd})`, borderColor: themeConfig.rank3Border }}></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-game">
                            <h3 className="text-lg font-bold mb-4">ألوان المتجر والـ Tokens</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">بداية تدرج المتجر</label>
                                <input type="color" value={themeConfig.shopHeaderStart} onChange={(e) => setThemeConfig({...themeConfig, shopHeaderStart: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">نهاية تدرج المتجر</label>
                                <input type="color" value={themeConfig.shopHeaderEnd} onChange={(e) => setThemeConfig({...themeConfig, shopHeaderEnd: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون نص الـ Token</label>
                                <input type="color" value={themeConfig.shopTokenText} onChange={(e) => setThemeConfig({...themeConfig, shopTokenText: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون عنوان المعلومات</label>
                                <input type="color" value={themeConfig.shopInfoTitle} onChange={(e) => setThemeConfig({...themeConfig, shopInfoTitle: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">لون عنوان التحذير</label>
                                <input type="color" value={themeConfig.shopWarningTitle} onChange={(e) => setThemeConfig({...themeConfig, shopWarningTitle: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-brown-muted">خلفية النوافذ</label>
                                <input type="color" value={themeConfig.shopModalBg} onChange={(e) => setThemeConfig({...themeConfig, shopModalBg: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-game flex justify-end gap-4">
                            <button 
                              onClick={() => {
                                setThemeConfig(DEFAULT_THEME);
                                socket?.emit('admin_save_theme', DEFAULT_THEME);
                                showAlert('تم إعادة تعيين الألوان وحفظها بنجاح!', 'نجاح');
                              }}
                              className="px-6 py-3 rounded-xl font-black text-brown-muted hover:bg-gray-100 transition-colors"
                            >
                              إعادة تعيين للافتراضي
                            </button>
                            <button 
                              onClick={() => {
                                socket?.emit('admin_save_theme', themeConfig);
                                showAlert('تم حفظ الألوان بنجاح! (على السيرفر)', 'نجاح');
                              }}
                              className="px-8 py-3 bg-accent-blue hover:brightness-110 text-white rounded-xl font-black shadow-lg transition-all transform hover:-translate-y-1"
                            >
                              حفظ التغييرات
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : adminTab === 'customization' ? (
                    <AdminCustomization showAlert={showAlert} />
                  ) : adminTab === 'players' ? (
                    <>
                      {/* Sidebar - Reports */}
                      <div className="w-80 border-l border-gray-100 bg-gray-50/30 overflow-y-auto p-4 space-y-4">
                        <h3 className="text-sm font-black text-brown-light uppercase tracking-wider flex items-center gap-2 px-2">
                          <AlertTriangle className="w-4 h-4" />
                          آخر البلاغات
                        </h3>
                        <div className="space-y-3">
                          {adminReports.length === 0 ? (
                            <div className="text-center py-8 text-brown-light font-bold text-sm">لا توجد بلاغات حالياً</div>
                          ) : (
                            adminReports.map((report, index) => (
                              <div key={`admin-report-${report.id}-${index}`} className="box-game p-4 shadow-sm space-y-2">
                                <div className="flex justify-between items-start">
                                  <span className="text-[10px] font-black text-brown-light">{new Date(report.timestamp).toLocaleString('ar-EG')}</span>
                                  <div className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-black">بلاغ</div>
                                </div>
                                <div className="text-xs font-bold text-brown-dark">
                                  <span className="text-purple-600">{report.reporterName}</span> أبلغ عن <span className="text-red-500">{report.reportedName}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg text-[10px] text-brown-muted font-medium italic">
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
                                      showConfirm('هل أنت متأكد من حذف هذا البلاغ؟', () => {
                                        socket?.emit('admin_delete_report', report.id, (res: any) => {
                                          if (res.success) {
                                            setAdminReports(prev => prev.filter(r => r.id !== report.id));
                                          }
                                        });
                                      }, 'حذف البلاغ');
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
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brown-light w-5 h-5" />
                            <input 
                              type="text"
                              placeholder="ابحث عن لاعب بالاسم أو الرقم التسلسلي..."
                              value={adminSearchQuery}
                              onChange={(e) => setAdminSearchQuery(e.target.value)}
                              className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-purple-400 focus:bg-white transition-all font-bold"
                            />
                          </div>
                          <div className="mt-3 text-sm font-bold text-brown-muted flex items-center gap-2">
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
                                <div key={`admin-player-${p.serial}-${index}`} className="box-game p-5 hover:border-purple-200 transition-all group">
                                  <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14">
                                      {renderAvatarContent(p.avatar, getLevel(p.xp))}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-black text-brown-dark">{p.name}</h4>
                                        {p.isAdmin && <Shield className="w-3 h-3 text-purple-500" />}
                                      </div>
                                      <div className="text-[10px] font-bold text-brown-light">ID: {p.serial}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs font-black text-purple-600">Lvl {getLevel(p.xp)}</div>
                                      <div className="text-[10px] font-bold text-brown-light">{p.xp} XP</div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                                      <div className="text-[10px] font-bold text-brown-light">الفوز</div>
                                      <div className="text-sm font-black text-brown-dark">{p.wins || 0}</div>
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
                                        showPrompt('ادخل الـ XP الجديد:', p.xp.toString(), (newXP) => {
                                          if (newXP !== null && newXP.trim() !== '') {
                                            socket?.emit('admin_update_player', { serial: p.serial, updates: { xp: parseInt(newXP) } }, (res: any) => {
                                              if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                            });
                                          }
                                        }, 'تعديل XP');
                                      }}
                                      className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black hover:bg-purple-600 hover:text-white transition-all"
                                    >
                                      تعديل XP
                                    </button>
                                    <button 
                                      onClick={() => {
                                        showPrompt('كم عدد الـ Tokens التي تريد إضافتها؟', '1', (tokensToAdd) => {
                                          if (tokensToAdd !== null && tokensToAdd.trim() !== '' && !isNaN(parseInt(tokensToAdd))) {
                                            const currentTokens = p.tokens || 0;
                                            socket?.emit('admin_update_player', { serial: p.serial, updates: { tokens: currentTokens + parseInt(tokensToAdd) } }, (res: any) => {
                                              if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                            });
                                          }
                                        }, 'إعطاء Tokens');
                                      }}
                                      className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                      إعطاء Tokens
                                    </button>
                                    <button 
                                      onClick={() => {
                                        showConfirm('هل أنت متأكد من حظر هذا اللاعب لمدة 24 ساعة؟', () => {
                                          const banUntil = Date.now() + (24 * 60 * 60 * 1000);
                                          socket?.emit('admin_update_player', { serial: p.serial, updates: { banUntil, reports: 0 } }, (res: any) => {
                                            if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                          });
                                        }, 'حظر مؤقت');
                                      }}
                                      className="flex-1 py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black hover:bg-orange-600 hover:text-white transition-all"
                                    >
                                      حظر 24س
                                    </button>
                                    {p.banUntil > Date.now() && (
                                      <button 
                                        onClick={() => {
                                          showConfirm('هل أنت متأكد من إلغاء حظر هذا اللاعب؟', () => {
                                            socket?.emit('admin_update_player', { serial: p.serial, updates: { banUntil: 0 } }, (res: any) => {
                                              if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                            });
                                          }, 'إلغاء الحظر');
                                        }}
                                        className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black hover:bg-green-600 hover:text-white transition-all"
                                      >
                                        إلغاء الحظر
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => {
                                        showConfirm('هل أنت متأكد من حظر هذا اللاعب نهائياً؟', () => {
                                          socket?.emit('admin_update_player', { serial: p.serial, updates: { isPermanentBan: 1, reports: 0 } }, (res: any) => {
                                            if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                          });
                                        }, 'حظر نهائي');
                                      }}
                                      className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all"
                                    >
                                      حظر نهائي
                                    </button>
                                    <button 
                                      onClick={() => {
                                        showConfirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟', () => {
                                          socket?.emit('admin_delete_player', p.serial, (res: any) => {
                                            if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                          });
                                        }, 'حذف الحساب');
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
                          <div className="box-game p-6 shadow-sm">
                            <h3 className="text-lg font-black text-brown-dark mb-4 flex items-center gap-2">
                              <Upload className="w-5 h-5 text-purple-600" />
                              رفع صورة جديدة
                            </h3>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-brown-dark mb-1">الفئة</label>
                                <select 
                                  value={newImage.category}
                                  onChange={(e) => setNewImage({...newImage, category: e.target.value})}
                                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-brown-dark focus:border-purple-500 outline-none"
                                >
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-bold text-brown-dark mb-1">اسم الصورة (بالعربي)</label>
                                <input 
                                  type="text" 
                                  value={newImage.name}
                                  onChange={(e) => setNewImage({...newImage, name: e.target.value})}
                                  placeholder="مثال: أسد"
                                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-brown-dark focus:border-purple-500 outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-bold text-brown-dark mb-1">الصورة</label>
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
                                        <ImageIcon className="w-8 h-8 text-brown-light" />
                                        <span className="text-xs font-bold text-brown-light">اضغط لاختيار صورة</span>
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
                          <div className="box-game p-6 shadow-sm">
                            <h3 className="text-lg font-black text-brown-dark mb-4 flex items-center gap-2">
                              <Plus className="w-5 h-5 text-purple-600" />
                              إدارة الفئات
                            </h3>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-brown-dark mb-1">اسم الفئة</label>
                                <input 
                                  type="text" 
                                  value={newCategory.name}
                                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                                  placeholder="مثال: سيارات"
                                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-brown-dark focus:border-purple-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-brown-dark mb-1">أيقونة الفئة (إيموجي)</label>
                                <input 
                                  type="text" 
                                  value={newCategory.icon}
                                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                                  placeholder="مثال: 🚗"
                                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-brown-dark focus:border-purple-500 outline-none"
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
                              <label className="block text-sm font-bold text-brown-dark mb-2">الفئات الحالية</label>
                              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                {categories.map(cat => (
                                  <div key={cat.id} className="flex items-center justify-between p-2 box-game">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{cat.icon}</span>
                                      <span className="font-bold text-sm text-brown-dark">{cat.name}</span>
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
                              <h3 className="text-lg font-black text-brown-dark flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-purple-600" />
                                الصور المرفوعة ({adminImages.length})
                              </h3>
                              <div className="relative w-full md:w-64">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-light w-4 h-4" />
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
                                    <h4 className="flex items-center gap-2 text-md font-bold text-brown-dark border-b-2 border-gray-100 pb-2">
                                      <span className="text-2xl">{category.icon}</span>
                                      {category.name}
                                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full mr-auto">
                                        {categoryImages.length} صور
                                      </span>
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                      {categoryImages.map((img) => (
                                        <div key={img.id} className="box-game overflow-hidden flex flex-col">
                                          <img src={img.data || `https://picsum.photos/seed/${img.name}/200/200`} alt={img.name} className="w-full aspect-square object-cover" />
                                          <div className="p-3 flex items-center justify-between gap-2 bg-white border-t border-game">
                                            <span className="text-brown-dark font-bold text-sm truncate" title={img.name}>{img.name}</span>
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
                                <div className="text-center py-12 text-brown-light font-bold">
                                  لا توجد صور مرفوعة حالياً
                                </div>
                              )}
                              {adminImages.length > 0 && categories.every(cat => 
                                adminImages.filter(img => img.category === cat.id && img.name.toLowerCase().includes(adminImageSearchQuery.toLowerCase())).length === 0
                              ) && (
                                <div className="text-center py-12 text-brown-light font-bold">
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
                <h3 className="text-3xl font-black text-main mb-4">الإبلاغ عن {opponent.name}</h3>
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
                  onClick={() => { playSound('clickClose'); setShowReportModal(false); }}
                  className="text-lg font-black text-brown-light hover:text-brown-muted transition-colors"
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
                <label className="block text-black text-center text-sm font-black mb-3">تكبير / تصغير</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer accent-purple-500"
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

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-blue/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-yellow/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col items-center max-w-md w-full">
          {/* Logo Container */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="w-32 h-32 md:w-40 md:h-40 bg-white border-8 border-black rounded-[2rem] flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-accent-yellow/20 animate-pulse"></div>
            <img src="/icon-3.png" alt="Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain relative z-10" />
          </motion.div>

          {/* Game Name */}
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black text-main mb-12 uppercase tracking-tighter text-center"
            style={{ textShadow: '4px 4px 0px #FFF, -1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF' }}
          >
            خمن تخمينة
          </motion.h1>

          {/* Progress Section */}
          <div className="w-full space-y-4">
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm font-black text-black bg-white border-2 border-black px-3 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {loadingStatus}
              </span>
              <span className="text-2xl font-black text-accent-blue">
                {loadingProgress}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-8 w-full bg-gray-100 border-4 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
              <motion.div 
                className="h-full bg-accent-blue relative"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.1 }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-white/20 skew-x-[-20deg] translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
              </motion.div>
            </div>
          </div>

          {/* Footer Info */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-xs font-bold text-gray-400 uppercase tracking-widest"
          >
            v{gameVersion} • All Systems Operational
          </motion.p>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer {
            100% { transform: translateX(200%) skewX(-20deg); }
          }
        `}} />
      </div>
    );
  }

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
          <h1 className="text-3xl font-black text-brown-dark mb-4">
            {isPermanent ? 'تم حظرك نهائياً' : 'تم حظر حسابك'}
          </h1>
          <p className="text-brown-muted font-bold mb-6 text-lg">
            {isPermanent 
              ? 'لقد تم حظرك من اللعب نهائياً بسبب تكرار المخالفات (5 مرات حظر مؤقت). لا يمكنك اللعب بهذا الحساب مرة أخرى.'
              : 'لقد تلقيت أكثر من 10 إبلاغات من لاعبين آخرين، لذلك تم منعك من اللعب مؤقتاً لمدة 24 ساعة.'}
          </p>
          
          {!isPermanent ? (
            <div className="box-game p-6">
              <p className="text-red-600 font-black text-sm mb-2">الوقت المتبقي لفك الحظر:</p>
              <div className="text-4xl font-black text-red-500 font-mono" dir="ltr">
                {remainingHours}h {remainingMinutes}m
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="box-game p-6">
                <p className="text-brown-muted font-black text-sm">
                  يمكنك مسح هذا الحساب والبدء من جديد بحساب جديد تماماً.
                </p>
              </div>
              <button 
                onClick={() => {
                  const serial = localStorage.getItem('khamin_player_serial');
                  if (serial) {
                    const handleReload = () => {
                      clearPlayerData();
                      setIsAppLoading(true);
                      setLoadingStatus('جاري مسح الحساب وإعادة التهيئة...');
                      setLoadingProgress(0);
                      let progress = 0;
                      const interval = setInterval(() => {
                        progress += 20;
                        setLoadingProgress(progress);
                        if (progress >= 100) {
                          clearInterval(interval);
                          window.location.reload();
                        }
                      }, 300);
                    };

                    if (socket && socket.connected) {
                      socket.emit('delete_account', { playerSerial: serial }, (res: any) => {
                        handleReload();
                      });
                    } else {
                      handleReload();
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
          <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md px-3 md:px-6 flex justify-between items-center z-[2000] border-b-4 border-black h-14 md:h-16">
            <div className="flex-1 flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-accent-yellow rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/icon-3.png" alt="Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
              </div>
              <div className="font-black text-lg md:text-xl text-accent-blue tracking-tight hidden sm:block">خمن تخمينة</div>
            </div>
            
            <div className="flex-1 flex items-center justify-end gap-1.5 md:gap-3">
              {/* Home Button (Cancels Search) */}
              <button 
                onClick={() => {
                  socket?.emit('leave_matchmaking');
                  window.location.reload();
                }}
                className="w-9 h-9 md:w-10 md:h-10 bg-gray-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                title="الرئيسية"
              >
                <Home className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Info Button */}
              <button 
                onClick={toggleLevelInfo}
                className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                title="معلومات المستوى"
              >
                <Info className="w-4 h-4 md:w-5 md:h-5" />
                {(POWER_UP_UNLOCKS.some(lvl => getLevel(xp) >= lvl && lastSeenPowerUpLevel < lvl)) && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>

              {/* Shop Button */}
              <button 
                onClick={toggleShop}
                className="w-9 h-9 md:w-10 md:h-10 bg-orange-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-orange-200 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                title="المتجر"
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Settings Button */}
              <button 
                onClick={toggleSettings}
                className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-purple-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                title="الإعدادات"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                {(AVATAR_UNLOCKS.some(lvl => getLevel(xp) >= lvl && lastSeenAvatarLevel < lvl)) && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>
            </div>
          </header>

        <div className="w-full max-w-md card-game p-3 md:p-4 text-center space-y-2 md:space-y-4 relative overflow-hidden">
          {proposedMatch ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-2 md:space-y-4"
            >
              <h2 className="text-2xl md:text-3xl font-black text-main uppercase tracking-tight" style={{ textShadow: '2px 2px 0px #FFF, -1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF' }}>تم العثور على منافس!</h2>
              <div className="flex flex-col items-center p-3 md:p-4 bg-white rounded-3xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
                <div className="relative mb-1 md:mb-2 w-20 h-20 md:w-24 md:h-24">
                  {renderAvatarContent(proposedMatch.opponent.avatar, proposedMatch.opponent.level || getLevel(proposedMatch.opponent.xp || 0))}
                </div>
                <div className="text-xl md:text-2xl font-black text-main mb-1">{proposedMatch.opponent.name}</div>
                <div className="text-sm md:text-base font-bold text-black bg-gray-100 border-2 border-black px-3 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Level {proposedMatch.opponent.level || getLevel(proposedMatch.opponent.xp || 0)}</div>
                {matchResponseTimeLeft !== null && (
                  <div className="mt-2 text-accent-blue font-black text-lg flex items-center gap-2 bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
                        playSound('clickOpen');
                        setHasResponded(true);
                        socket?.emit('respond_to_match', { matchId: proposedMatch.matchId, response: 'accept' });
                      }}
                      className="flex-1 btn-game btn-success py-3 md:py-4 text-lg md:text-xl animate-pulse"
                    >
                      قبول التحدي! ⚔️
                    </button>
                    <button 
                      onClick={() => {
                        playSound('clickOpen');
                        setHasResponded(true);
                        socket?.emit('respond_to_match', { matchId: proposedMatch.matchId, response: 'reject' });
                        setProposedMatch(null);
                      }}
                      className="flex-1 btn-game btn-danger py-3 md:py-4 text-lg md:text-xl"
                    >
                      رفض
                    </button>
                  </div>
                  {opponentAccepted && (
                    <div className="text-black font-black bg-accent-blue p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                      المنافس وافق على التحدي! بانتظارك...
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-black font-black bg-accent-yellow px-4 py-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                    جاري انتظار رد المنافس...
                  </div>
                  {opponentAccepted && (
                    <div className="text-black font-black bg-accent-green px-4 py-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      المنافس وافق! جاري بدء اللعبة...
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <>
              <div className="relative py-3 md:py-4">
                <div className="absolute inset-0 bg-accent-blue blur-3xl opacity-20 animate-pulse"></div>
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto relative z-10 bg-white border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-accent-blue animate-spin" />
                </div>
              </div>
              <div className="space-y-2 md:space-y-3 relative z-10">
                <h2 className="text-2xl md:text-3xl font-black text-main uppercase tracking-tight" style={{ textShadow: '2px 2px 0px #FFF, -1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF' }}>
                  جاري البحث عن منافس...
                </h2>
                <div className="flex justify-center">
                  <p className="text-sm md:text-base text-black font-bold bg-gray-100 border-2 border-black inline-block px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    يتم البحث عن لاعبين بمستوى قريب منك
                  </p>
                </div>
                {searchTimeLeft !== null && (
                  <div className="flex justify-center mt-2">
                    <div className="flex items-center gap-2 text-accent-blue font-black text-xl bg-white border-2 border-black inline-flex px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Timer className="w-6 h-6" />
                      <span dir="ltr">{Math.floor(searchTimeLeft / 60)}:{(searchTimeLeft % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-center mt-2">
                  <div className="text-xs md:text-sm font-black text-black bg-accent-green border-2 border-black inline-block px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    عدد المتصلين: {onlineCount}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 md:pt-4 relative z-10 w-full">
                <button 
                  onClick={() => {
                    setIsSearching(false);
                    setJoined(false);
                    socket?.emit('leave_matchmaking');
                    setRoomId(prev => prev.startsWith('random_') ? '' : prev);
                  }}
                  className="w-full btn-game btn-danger py-3 md:py-4 text-lg md:text-xl"
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
        <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md px-3 md:px-6 flex justify-between items-center z-[2000] border-b-4 border-black h-14 md:h-16">
          <div className="flex-1 flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-accent-yellow rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/icon-3.png" alt="Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
            </div>
            <div className="font-black text-lg md:text-xl text-accent-blue tracking-tight block">خمن تخمينة</div>
          </div>
          
          <div className="flex-1 flex items-center justify-end gap-1.5 md:gap-3">
            {/* Daily Quests Button */}
            <button 
              onClick={toggleDailyQuests}
              className="w-9 h-9 md:w-10 md:h-10 bg-yellow-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-yellow-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="المهام اليومية"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              {isNewDayNotification && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>

            {/* Info Button */}
            <button 
              onClick={toggleLevelInfo}
              className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="معلومات المستوى"
            >
              <Info className="w-4 h-4 md:w-5 md:h-5" />
              {(POWER_UP_UNLOCKS.some(lvl => getLevel(xp) >= lvl && lastSeenPowerUpLevel < lvl)) && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>

            {/* Shop Button */}
            <button 
              onClick={toggleShop}
              className="w-9 h-9 md:w-10 md:h-10 bg-orange-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-orange-200 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="المتجر"
            >
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Settings Button */}
            <button 
              onClick={toggleSettings}
              className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-purple-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="الإعدادات"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
              {(AVATAR_UNLOCKS.some(lvl => getLevel(xp) >= lvl && lastSeenAvatarLevel < lvl)) && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                </span>
              )}
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
          <div className="player-card flex items-center gap-3 md:gap-4 p-3 md:p-4 flex-row-reverse mb-6 md:mb-10 w-full">
              <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20">
                {renderAvatarContent(avatar, getLevel(xp))}
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1 flex-row-reverse">
                  <div className="text-sm md:text-base font-black text-main truncate text-right">{playerName || 'لاعب جديد'}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-black text-accent-blue box-game px-2 py-0.5">Level {getLevel(xp)}</span>
                  </div>
                </div>
                
                {/* Level Bar */}
                <div className="w-full bg-[var(--level-bar-bg)] rounded-full h-2 md:h-3 shadow-inner overflow-hidden mb-2" dir="ltr">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (getLevel(xp) / 50) * 100)}%`, backgroundColor: 'var(--level-bar-fill)' }}
                  ></div>
                </div>
                
                {/* XP Bar */}
                <div className="w-full bg-[var(--xp-bar-bg)] rounded-full h-5 md:h-6 shadow-inner overflow-hidden relative border-2 border-black mb-2" dir="ltr">
                  <div 
                    className="h-full transition-all duration-500" 
                    style={{ width: `${getXpProgress(xp)}%`, backgroundColor: 'var(--xp-bar-fill)' }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] md:text-xs font-black drop-shadow-sm flex items-center gap-1" style={{ color: getXpProgress(xp) >= 100 ? 'var(--xp-bar-text-active)' : 'var(--xp-bar-text)' }}>
                      <Zap className="w-3 h-3" />
                      {xp} / {getXpForNextLevel(getLevel(xp))} XP
                    </span>
                  </div>
                </div>
                
                {/* Tokens and Pro Package */}
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span 
                    className={`text-xs md:text-sm font-black box-game px-2 py-0.5 flex items-center justify-center gap-1 transition-all h-[26px] md:h-[30px] ${
                      hasProPackage 
                        ? 'text-yellow-600' 
                        : 'text-gray-400 opacity-70'
                    }`} 
                    title="باقة المحترفين"
                  >
                    <Zap className={`w-3 h-3 transition-all ${
                      hasProPackage 
                        ? 'fill-yellow-500 text-yellow-500 animate-pulse' 
                        : 'fill-gray-400 text-gray-400'
                    }`} />
                    <span className="text-[10px]" dir="ltr">Day({proPackageDaysLeft})</span>
                  </span>
                  <span className="text-xs md:text-sm font-black text-accent-purple box-game px-2 py-0.5 flex items-center justify-center gap-1 h-[26px] md:h-[30px]">
                    {tokens} <span className="text-[10px] text-accent-purple">Tokens</span>
                  </span>
                </div>
              </div>
            </div>

          <div className="card-game p-3 md:p-5">

          <div className="space-y-4 md:space-y-6">
            {/* Top Players Section */}
            <div className="flex flex-col gap-2">
              
              {/* Podium Box with Integrated Header */}
              <div className="box-game px-3 md:px-5 pb-2 pt-4 mt-2 relative">
                {/* Integrated Header */}
                <div className="flex items-center justify-between flex-row-reverse mb-8 pb-2">
                  <h2 className="text-sm md:text-base font-black text-main flex items-center gap-2">
                    أبطال التخمين
                  </h2>
                  <span className="text-[10px] md:text-xs font-bold text-accent-orange box-game px-2 py-1 rounded-full">المتصدرون حالياً</span>
                </div>
                <div className="flex items-end justify-center gap-2 md:gap-4">
                  {/* Rank 2 */}
                  {topPlayers[1] && (
                    <div key={`${topPlayers[1].serial || 'unknown'}-rank-2`} className="flex flex-col items-center flex-1 z-10">
                      <div className="relative mb-2 flex flex-col items-center">
                        <div className="w-14 h-14 md:w-16 md:h-16">
                          {renderAvatarContent(topPlayers[1].avatar, topPlayers[1].level || getLevel(topPlayers[1].xp || 0))}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-gray-300 text-brown-muted w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-sm z-[60]">2</div>
                      </div>
                      <div className="text-[10px] md:text-xs font-black text-main truncate w-full text-center max-w-[80px] md:max-w-[100px]">{truncateName(topPlayers[1].name)}</div>
                      <div className="flex flex-col items-center gap-0.5 mt-1 mb-1">
                        <div className="text-[9px] font-bold text-brown-muted bg-gray-100 px-2 py-0.5 rounded-full">
                          Lvl {topPlayers[1].level || getLevel(topPlayers[1].xp || 0)}
                        </div>
                        <div className="text-[9px] font-bold text-accent-green bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5" />
                          {topPlayers[1].wins || 0} فوز
                        </div>
                      </div>
                      <div className="w-full rank-2-bar h-16 md:h-20 rounded-t-xl mt-1 shadow-inner border-t-4"></div>
                    </div>
                  )}

                  {/* Rank 1 */}
                  {topPlayers[0] && (
                    <div key={`${topPlayers[0].serial || 'unknown'}-rank-1`} className="flex flex-col items-center flex-1 z-20 -mt-8 md:-mt-12">
                      <div className="relative mb-2 flex flex-col items-center scale-110 md:scale-125">
                        <Crown className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 drop-shadow-md z-[60]" />
                        <div className="fire-glow-effect"></div>
                        <div className="w-16 h-16 md:w-20 md:h-20 relative z-10">
                          {renderAvatarContent(topPlayers[0].avatar, topPlayers[0].level || getLevel(topPlayers[0].xp || 0))}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow-md z-[60] animate-bounce">1</div>
                      </div>
                      <div className="text-xs md:text-sm font-black text-main truncate w-full text-center mt-2 max-w-[90px] md:max-w-[120px]">{truncateName(topPlayers[0].name)}</div>
                      <div className="flex flex-col items-center gap-1 mt-1 mb-1">
                        <div className="text-[10px] font-bold text-brown-muted bg-yellow-100 px-3 py-1 rounded-full">
                          Lvl {topPlayers[0].level || getLevel(topPlayers[0].xp || 0)}
                        </div>
                        <div className="text-[10px] font-bold text-accent-green bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {topPlayers[0].wins || 0} فوز
                        </div>
                      </div>
                      <div className="w-full rank-1-bar h-24 md:h-32 rounded-t-xl mt-1 shadow-inner border-t-4"></div>
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
                      <div className="text-[10px] md:text-xs font-black text-main truncate w-full text-center max-w-[80px] md:max-w-[100px]">{truncateName(topPlayers[2].name)}</div>
                      <div className="flex flex-col items-center gap-0.5 mt-1 mb-1">
                        <div className="text-[9px] font-bold text-brown-muted bg-gray-100 px-2 py-0.5 rounded-full">
                          Lvl {topPlayers[2].level || getLevel(topPlayers[2].xp || 0)}
                        </div>
                        <div className="text-[9px] font-bold text-accent-green bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5" />
                          {topPlayers[2].wins || 0} فوز
                        </div>
                      </div>
                      <div className="w-full rank-3-bar h-12 md:h-16 rounded-t-xl mt-1 shadow-inner border-t-4"></div>
                    </div>
                  )}
                </div>

                {/* Player Rank Info */}
                {(() => {
                  const myRankIndex = topPlayers.findIndex(p => p.serial === playerSerial);
                  if (myRankIndex >= 0) {
                    const isTop3 = myRankIndex <= 2;
                    return (
                      <button 
                        onClick={() => setShowLeaderboardModal(true)}
                        className={`mt-3 w-full group relative overflow-hidden ${isTop3 ? 'bg-yellow-500' : 'bg-orange-500'} rounded-none p-0.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-4 border-black hover:-translate-y-1 transition-all`}
                      >
                        <div className="bg-white rounded-[14px] py-3 px-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-black">
                            <span className="font-bold text-xs md:text-sm">
                              {isTop3 ? 'أنت من أبطال الصدارة!' : 'ترتيبك في أبطال التخمين:'}
                            </span>
                            <span className={`font-black text-lg md:text-xl ${isTop3 ? 'bg-yellow-100 text-yellow-600' : 'bg-orange-100 text-orange-600'} px-2 rounded-lg`}>
                              #{myRankIndex + 1}
                            </span>
                            <span className="text-lg">{isTop3 ? '👑' : '💪'}</span>
                          </div>
                          <div className={`w-10 h-10 ${isTop3 ? 'bg-yellow-100' : 'bg-orange-100'} rounded-full flex items-center justify-center animate-pulse group-hover:bg-opacity-80 transition-colors shrink-0 relative`}>
                            <div className={`absolute inset-0 rounded-full border-2 ${isTop3 ? 'border-yellow-500/50' : 'border-orange-500/50'} animate-ping opacity-50`}></div>
                            <ChevronLeft className={`w-6 h-6 ${isTop3 ? 'text-yellow-600' : 'text-orange-600'}`} />
                          </div>
                        </div>
                      </button>
                    );
                  } else if (myRankIndex === -1 && topPlayers.length > 0) {
                    return (
                      <button 
                        onClick={() => setShowLeaderboardModal(true)}
                        className="mt-3 w-full group box-game hover:border-orange-200 py-3 px-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-brown-muted font-bold text-xs md:text-sm">لست ضمن الـ Top 100..</span>
                          <span className="text-accent-orange font-black text-xs md:text-sm">شد حيلك! 🚀</span>
                        </div>
                        <div className="w-8 h-8 bg-gray-50 group-hover:bg-accent-orange-light rounded-full flex items-center justify-center transition-colors shrink-0">
                           <ChevronLeft className="w-4 h-4 text-brown-light group-hover:text-accent-orange transition-colors animate-pulse" />
                        </div>
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div className="pt-4 md:pt-6 border-t-2 border-game space-y-3 md:space-y-4">
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
                <label className="block text-base md:text-lg font-black text-main mb-1 md:mb-2 px-1">دخول بكود غرفة</label>
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
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-game dashed"></div></div>
                <div className="relative flex justify-center text-[10px] md:text-xs uppercase"><span className="bg-[#FFFFFF] px-3 text-brown-light font-black">أو</span></div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRandomMatch}
                  className="flex-1 btn-game btn-primary py-3 md:py-4 text-lg md:text-xl gap-2 md:gap-3 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-1.5" dir="ltr">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-[#00FF00] animate-pulse" />
                    <span className="text-[#00FF00] text-lg md:text-xl font-black">
                      {onlineCount > 100 ? '100+' : onlineCount}
                    </span>
                  </div>
                  <span>بحث عشوائي</span>
                </button>

                <div className="flex flex-col box-game p-2 h-16">
                  <div className="flex items-center gap-2 flex-1">
                    <input 
                      type="checkbox" 
                      id="useToken" 
                      checked={useToken} 
                      onChange={(e) => setUseToken(e.target.checked)}
                      disabled={tokens <= 0}
                      className="checkbox-game disabled:opacity-50"
                    />
                    <label htmlFor="useToken" className="cursor-pointer select-none flex items-center gap-1">
                      <button onClick={toggleTokenInfo} className="font-black text-accent-purple hover:underline text-sm truncate">Token</button>
                      <span className="font-black text-main text-sm">({tokens})</span>
                    </label>
                  </div>
                  <div className="border-t border-game mt-1 mb-0.5"></div>
                  <div className="w-full text-left" dir="ltr">
                    <span className="text-xs text-main font-black">Level 50+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </div>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[5000] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowLeaderboardModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-modal-theme rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              <div className="bg-orange-500 p-6 text-center relative shrink-0 border-b-4 border-black">
                <button 
                  onClick={() => { playSound('clickClose'); setShowLeaderboardModal(false); }}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-yellow-400">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">أبطال التخمين (Top 100)</h2>
                <p className="text-white/80 text-sm font-bold">أقوى اللاعبين في اللعبة</p>
              </div>

              <div className="overflow-y-auto flex-1 bg-gray-50" dir="rtl">
                {/* Current User Rank (Sticky at top if exists) */}
                {topPlayers.findIndex(p => p.serial === playerSerial) !== -1 && (
                  <div className="sticky top-0 z-[100] px-4 pb-3 pt-0 bg-gray-50/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
                     <div className="bg-purple-600 text-white p-3 rounded-none flex items-center gap-3 border-x-4 border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="font-black text-xl w-8 text-center bg-white/20 rounded-lg py-1">
                        #{topPlayers.findIndex(p => p.serial === playerSerial) + 1}
                      </div>
                      <div className="relative w-10 h-10">
                        {renderAvatarContent(avatar, getLevel(xp), true)}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="font-black truncate">أنت ({playerName})</div>
                        <div className="text-xs text-white/80 font-bold flex items-center gap-2">
                          <span dir="ltr">Lvl {getLevel(xp)}</span>
                          <span>•</span>
                          <span>{wins} فوز</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* List of Players */}
                <div className="p-4 space-y-2">
                  {topPlayers.map((player, index) => {
                    const isMe = player.serial === playerSerial;
                    return (
                      <div 
                        key={player.serial} 
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border-2 transition-transform
                          ${isMe ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-100' : 'bg-white border-gray-100'}
                        `}
                      >
                        <div className={`
                          font-black text-lg w-8 text-center rounded-lg py-1
                          ${index === 0 ? 'text-yellow-500 bg-yellow-50' : 
                            index === 1 ? 'text-brown-light bg-gray-50' : 
                            index === 2 ? 'text-accent-orange bg-accent-orange-light' : 'text-brown-light'}
                        `}>
                          {index + 1}
                        </div>
                        
                        <div className="relative w-10 h-10">
                          {renderAvatarContent(player.avatar, player.level, true)}
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                          <div className={`font-black truncate ${isMe ? 'text-purple-700' : 'text-brown-dark'}`}>
                            {player.name} {isMe && '(أنت)'}
                          </div>
                          <div className="text-xs text-brown-muted font-bold flex items-center gap-2">
                            <span className="bg-gray-100 px-1.5 rounded text-brown-muted" dir="ltr">Lvl {player.level}</span>
                            <span className="text-brown-light">•</span>
                            <span className="text-green-600">{player.wins} فوز</span>
                          </div>
                        </div>

                        {index < 3 && (
                          <Trophy className={`w-5 h-5 ${
                            index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-brown-light' : 'text-orange-500'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token Info Modal */}
      <AnimatePresence>
        {showTokenInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[5000] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowTokenInfoModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-modal-theme rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="p-6 text-center relative shrink-0" style={{ background: `linear-gradient(to right, var(--shop-header-start), var(--shop-header-end))` }}>
                <button 
                  onClick={() => { playSound('clickClose'); setShowTokenInfoModal(false); }}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/30">
                  <Zap className="w-8 h-8 text-accent-purple" />
                </div>
                <h2 className="text-2xl font-black text-light mb-1">ما هو الـ Token؟</h2>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-right" dir="rtl">
                <div className="space-y-4 text-brown-dark">
                  <div className="box-game p-4">
                    <h3 className="font-black mb-2 flex items-center gap-2" style={{ color: 'var(--shop-info-title)' }}>
                      <Zap className="w-4 h-4" />
                      ما فائدته؟
                    </h3>
                    <p className="text-sm font-bold leading-relaxed">
                      الـ Token هو تذكرتك للعب مع المحترفين! يسمح لك باللعب ضد لاعبين مستواهم 40 أو أعلى، والحصول على XP إضافي (1000 XP) عند الفوز.
                    </p>
                  </div>

                  <div className="box-game p-4">
                    <h3 className="font-black mb-2 flex items-center gap-2" style={{ color: 'var(--shop-info-title)' }}>
                      <ShoppingCart className="w-4 h-4" />
                      من أين أشتريه؟
                    </h3>
                    <p className="text-sm font-bold leading-relaxed">
                      يمكنك شراء الـ Tokens من المتجر (أيقونة السلة في الأعلى) باستخدام رصيدك.
                    </p>
                  </div>

                  <div className="box-game p-4">
                    <h3 className="font-black mb-2 flex items-center gap-2" style={{ color: 'var(--shop-warning-title)' }}>
                      <AlertTriangle className="w-4 h-4" />
                      تحذير هام!
                    </h3>
                    <ul className="text-sm font-bold list-disc list-inside space-y-1">
                      <li>يتم خصم الـ Token بمجرد بدء البحث.</li>
                      <li>إذا انسحبت من المباراة (خرجت أو أغلقت اللعبة) ستخسر الـ Token.</li>
                      <li>إذا خسرت المباراة، ستخسر الـ Token.</li>
                      <li>إذا فزت، سيتم استهلاك الـ Token ولكن ستحصل على مكافأة XP ضخمة!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {renderModals()}
      </>
    );
  }

  if (!room) {
    if (isSearching) return null; // Handled by isSearching block
    if (!joined) return null; // Handled by !joined block
    return <div className="min-h-screen w-full flex items-center justify-center text-main font-black text-2xl animate-pulse">جاري التحميل... 🚀</div>;
  }

  return (
    <div className="min-h-screen w-full font-sans flex flex-col relative overflow-y-auto pt-16 md:pt-20">
      {/* Install Modal */}
      {showInstallModal && deferredPrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-4 border-accent-orange">
            <div className="w-20 h-20 mx-auto mb-4 bg-accent-orange-soft rounded-full flex items-center justify-center">
              <span className="text-4xl">🎮</span>
            </div>
            <h2 className="text-2xl font-black text-brown-dark mb-2">خمن تخمينة</h2>
            <p className="text-brown-muted mb-6 font-medium">
              لعبة خمن تخمينة هي لعبة جماعية أونلاين لشخصين مع مؤثرات تفاعلية وكروت مساعدة
            </p>
            <button 
              onClick={handleInstallClick}
              className="w-full py-4 bg-accent-orange hover:brightness-110 text-white font-black rounded-2xl text-lg transition-colors mb-3"
            >
              تثبيت اللعبة
            </button>
            <button 
              onClick={handleCloseInstallModal}
              className="w-full py-2 text-brown-light font-bold hover:text-brown-muted"
            >
              ليس الآن
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md px-3 md:px-6 flex justify-between items-center z-[2000] border-b-4 border-black h-14 md:h-16">
        <div className="flex-1 flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-accent-yellow rounded-xl flex items-center justify-center overflow-hidden">
            <img src="/icon-3.png" alt="Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
          </div>
          <div className="font-black text-lg md:text-xl text-accent-blue tracking-tight hidden sm:block">خمن تخمينة</div>
        </div>
        
        {/* Game Info (Center) */}
        <div className="flex-shrink-0 flex items-center gap-1.5 md:gap-2 mx-2">
           {room.gameState !== 'waiting' && (
            <div className={`flex items-center justify-center min-w-[70px] md:min-w-[80px] gap-1 md:gap-1.5 px-2 md:px-3 py-1 rounded-full text-sm md:text-base font-black transition-colors border-2 ${room.isFrozen ? 'bg-cyan-100 text-cyan-600 border-cyan-200 animate-pulse' : room.timer <= 10 && room.gameState === 'guessing' ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'bg-gray-100 text-brown-muted border-gray-200'}`}>
              {room.isFrozen ? <Snowflake className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Timer className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              {room.isFrozen ? (
                <span className="text-xs md:text-sm">{room.freezeTimer}s</span>
              ) : (
                <span className="text-sm md:text-base">{Math.max(0, Math.floor(room.timer / 60))}:{(Math.max(0, room.timer % 60)).toString().padStart(2, '0')}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 bg-accent-blue-soft text-accent-blue px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-black border-2 border-accent-blue">
            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>{room.players.length}/2</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-1.5 md:gap-3">
          {/* Home Button (Leave Game) */}
          <button 
            onClick={handleLeaveGame}
            className="w-12 h-12 md:w-10 md:h-10 bg-gray-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer touch-manipulation shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="الرئيسية"
          >
            <Home className="w-6 h-6 md:w-5 md:h-5" />
          </button>

          {/* Info Button */}
          <button 
            onClick={toggleLevelInfo}
            className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="معلومات المستوى"
          >
            <Info className="w-4 h-4 md:w-5 md:h-5" />
            {(POWER_UP_UNLOCKS.some(lvl => getLevel(xp) >= lvl && lastSeenPowerUpLevel < lvl)) && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </button>

          {/* Shop Button */}
          <button 
            onClick={toggleShop}
            className="w-9 h-9 md:w-10 md:h-10 bg-orange-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-orange-200 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="المتجر"
          >
            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Settings Button */}
          <button 
            onClick={toggleSettings}
            className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-purple-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="الإعدادات"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
            {(AVATAR_UNLOCKS.some(lvl => getLevel(xp) >= lvl && lastSeenAvatarLevel < lvl)) && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
              </span>
            )}
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
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full border-2 border-black shadow-sm z-20 whitespace-nowrap">
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
              <div className="mt-1 font-black text-base flex items-center gap-2 text-main bg-white/80 px-4 py-1 rounded-full shadow-sm backdrop-blur-sm">
                {opponent.name}
                <button 
                  onClick={() => setShowReportModal(true)}
                  className={`${opponent.reports && opponent.reports > 0 ? 'text-red-500' : 'text-brown-light'} hover:bg-red-50 p-1.5 rounded-full transition-all`}
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
                  className={`${isOpponentBlocked ? 'text-red-500 bg-red-100' : 'text-brown-light hover:bg-gray-100'} p-1.5 rounded-full transition-all`}
                  title={isOpponentBlocked ? "إلغاء الحظر" : "حظر اللاعب (كتم الصوت والدردشة)"}
                >
                  <MessageSquareOff className="w-4 h-4" />
                </button>
              </div>
              {opponent.age && <div className="text-xs text-brown-muted font-bold mt-1">({opponent.age} سنة)</div>}
            </>
          )}
        </div>

        {/* Center Content: Image or Waiting UI */}
        <div className="flex-[2] flex flex-col items-center justify-center w-full max-w-2xl relative my-0.5 min-h-0 overflow-hidden">
          {room.gameState === 'waiting' ? (
            <div className="w-full card-game p-3 md:p-6 text-center space-y-3 md:space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#F6E6CD]">
                <div 
                  className="h-full bg-accent-orange transition-all duration-1000" 
                  style={{ width: `${(room.timer / 60) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center bg-white/50 p-3 rounded-2xl border border-orange-100 shadow-sm">
                <h2 className={`text-lg md:text-xl font-black text-accent-orange ${room.players.length < 2 ? 'animate-pulse' : ''}`}>
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
                {isPrivate && room.players.length < 2 && (
                  <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded-2xl text-accent-blue font-black text-sm md:text-base">
                    ابعت كود الغرفة 
                    <div className="relative inline-block">
                      <AnimatePresence>
                        {copied && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, x: '-50%' }}
                            animate={{ opacity: 1, y: -40, x: '-50%' }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute left-1/2 bg-green-500 text-white text-[10px] px-2 py-1 rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none font-bold"
                          >
                            تم النسخ! ✅
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(roomId);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="bg-white px-3 py-1 rounded-xl border-2 border-accent-blue mx-2 text-accent-blue hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                      >
                        <span className="font-mono text-lg">{roomId}</span>
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    لاصحابك.
                  </div>
                )}
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
                          ${isAgreed ? 'bg-green-100 text-accent-green border-green-400 scale-105 ring-2 ring-green-400 ring-offset-2' : isMyChoice ? 'bg-orange-100 text-accent-orange border-orange-300 scale-105' : 'bg-gray-100 text-brown-muted border-gray-300 hover:bg-gray-200 hover:text-brown-dark'}
                          ${isOpponentChoice && !isMyChoice ? 'hint-glow' : ''}
                        `}
                      >
                        <span className="text-2xl md:text-3xl">{cat.icon}</span>
                        <span className="text-[10px] md:text-xs font-black truncate w-full">{cat.name}</span>
                        {isOpponentChoice && !isMyChoice && (
                          <div className="absolute -top-2 -right-2 bg-accent-orange text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-bounce z-10">
                            اقتراح!
                          </div>
                        )}
                        {isAgreed && (
                          <div className="absolute -top-2 -right-2 bg-accent-green text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-bounce z-10">
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
                      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white">
                        <Lock className="w-12 h-12 mb-2 text-red-400" />
                        <span className="font-black text-lg text-center px-4">تم حظر الدردشة من قبل المنافس</span>
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                      {chatHistory.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-brown-light font-bold text-sm italic">
                          ابدأ الدردشة مع منافسك...
                        </div>
                      ) : (
                        chatHistory.map((msg, index) => (
                          <div key={`waiting-chat-${msg.id}-${index}`} className={`flex ${msg.senderId === socket?.id ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-2 px-3 rounded-xl text-sm font-bold shadow-sm relative break-words ${msg.senderId === socket?.id ? 'bg-[#DCF8C6] text-brown-dark rounded-tr-none' : 'bg-white text-brown-dark rounded-tl-none'}`}>
                              <div className={`text-[9px] mb-0.5 ${msg.senderId === socket?.id ? 'text-accent-green text-right' : 'text-accent-blue text-left'}`}>
                                {msg.playerName}
                              </div>
                              <div className={`leading-tight whitespace-pre-wrap ${msg.senderId === socket?.id ? 'text-right' : 'text-left'}`}>{msg.text}</div>
                            </div>
                          </div>
                        ))
                      )}
                      {isOpponentTyping && (
                        <div className="flex justify-end">
                          <TypingIndicator />
                        </div>
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
                        onChange={(e) => {
                          const val = e.target.value;
                          const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
                          const cleanVal = val.replace(emojiRegex, '');
                          setChatInput(cleanVal);
                        }}
                        placeholder="اسأل المنافس وخمن الاجابة..."
                        className="flex-1 bg-white border-none rounded-full px-4 py-2 text-base outline-none shadow-sm font-bold disabled:bg-gray-200 disabled:cursor-not-allowed"
                        maxLength={250}
                        disabled={isMutedByOpponent}
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          playSound('clickOpen');
                          setShowEmotes(!showEmotes);
                        }}
                        className="bg-white text-brown-muted p-3 rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
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
                                playSound('clickOpen');
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
                    <h3 className="text-3xl font-black text-main mb-6">تخمين سريع!</h3>
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
                        className={`btn-game py-3 text-lg flex items-center justify-center gap-2 ${getLevel(xp) >= 20 ? 'bg-brown-muted hover:bg-brown-dark text-white' : 'bg-gray-300 text-brown-muted cursor-not-allowed'}`}
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
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-0.5 rounded-full font-black text-xs md:text-sm text-main shadow-sm border border-gray-200 backdrop-blur-sm z-10 whitespace-nowrap">
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
                      <div className="h-full flex items-center justify-center text-brown-light font-bold text-sm italic">
                        اسأل المنافس وخمن الاجابة...
                      </div>
                    ) : (
                      chatHistory.map((msg, index) => (
                        <div key={`game-chat-${msg.id}-${index}`} className={`flex ${msg.senderId === socket?.id ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] p-1.5 px-2.5 rounded-xl text-xs font-bold shadow-sm relative break-words ${msg.senderId === socket?.id ? 'bg-[#DCF8C6] text-brown-dark rounded-tr-none' : 'bg-white text-brown-dark rounded-tl-none'}`}>
                            <div className={`text-[9px] mb-0.5 ${msg.senderId === socket?.id ? 'text-green-600 text-right' : 'text-blue-600 text-left'}`}>
                              {msg.playerName}
                            </div>
                            <div className={`leading-tight whitespace-pre-wrap ${msg.senderId === socket?.id ? 'text-right' : 'text-left'}`}>{msg.text}</div>
                          </div>
                        </div>
                      ))
                    )}
                    {isOpponentTyping && (
                      <div className="flex justify-end">
                        <TypingIndicator />
                      </div>
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
                      onChange={(e) => {
                        const val = e.target.value;
                        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
                        const cleanVal = val.replace(emojiRegex, '');
                        setChatInput(cleanVal);
                      }}
                      placeholder="دردشة..."
                      className="flex-1 bg-white border-none rounded-full px-3 py-1.5 text-base outline-none shadow-sm font-bold disabled:bg-gray-200 disabled:cursor-not-allowed"
                      maxLength={250}
                      disabled={isMutedByOpponent}
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        playSound('clickOpen');
                        setShowEmotes(!showEmotes);
                      }}
                      className="bg-white text-brown-muted p-2 rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all w-10 h-10 flex items-center justify-center"
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
                              playSound('clickOpen');
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
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full border-2 border-black shadow-sm z-20 whitespace-nowrap">
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
              <div className="mt-1 font-black text-lg text-main bg-white/80 px-4 py-1 rounded-full shadow-sm backdrop-blur-sm flex items-center gap-2">
                {me.name}
                {reports > 0 && (
                  <Flag className="w-4 h-4 text-red-500" fill="currentColor" title={`لديك ${reports} إبلاغات`} />
                )}
              </div>
              {me.age && <div className="text-xs text-brown-muted font-bold mt-1">({me.age} سنة)</div>}
              

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
              name: 'النصيحة', 
              description: 'تلميح يكشف لك أول وتاني حرف من الكلمة.',
              icon: HelpCircle, 
              color: 'text-blue-500', 
              bg: 'bg-white', 
              disabled: me?.hintCount >= 2,
              level: 10
            },
            { 
              id: 'word_length', 
              name: 'كاشف الحروف', 
              description: 'يكشف لك عدد احرف الكلمة.',
              icon: Type, 
              color: 'text-green-500', 
              bg: 'bg-white', 
              disabled: me?.wordLengthUsed,
              level: 20
            },
            { 
              id: 'time_freeze', 
              name: 'تجميد الوقت', 
              description: 'يوقف العداد الاساسي لمدة 60 ثانية.',
              icon: Snowflake, 
              color: 'text-cyan-500', 
              bg: 'bg-white', 
              disabled: me?.timeFreezeUsed || room.isFrozen,
              level: 30
            },
            { 
              id: 'word_count', 
              name: 'عدد الكلمات', 
              description: 'يكشف لك عدد كلمات صورة التخمين.',
              icon: Hash, 
              color: 'text-indigo-500', 
              bg: 'bg-white', 
              disabled: me?.wordCountUsed,
              level: 40
            },
            { 
              id: 'spy_lens', 
              name: 'الجاسوس', 
              description: 'يكشف لك صورة التخمين.',
              icon: Eye, 
              color: 'text-purple-500', 
              bg: 'bg-white', 
              disabled: me?.spyLensUsed,
              level: 50
            }
          ].filter(card => !card.hide).map((card) => {
            const isLevelLocked = getLevel(me?.xp || xp) < card.level;
            const hasFreeUse = (ownedHelpers[card.id] || 0) > 0;
            const isLocked = isLevelLocked && !hasFreeUse;
            
            // Calculate dynamic cooldown for quick_guess based on room.timer
            let cardCooldown = cooldowns[card.id] || 0;
            if (card.id === 'quick_guess') {
              const threshold = getQuickGuessThreshold(getLevel(me?.xp || xp));
              cardCooldown = Math.max(0, room.timer - threshold);
            }

            // Only disable other cards during quick guess if they are specifically quick guess, or if game is finished
            const isCardDisabled = isLocked || card.disabled || cardCooldown > 0 || room.gameState === 'finished' || (room.isPaused && card.id === 'quick_guess');
            const isReady = readyPowerUps.includes(card.id);
            
            return (
              <button 
                key={card.id}
                onClick={() => {
                  if (!isLocked) {
                    useCard(card.id as any);
                  } else {
                    setActiveTooltip(card.id);
                    setTimeout(() => setActiveTooltip(null), 4000);
                  }
                }}
                disabled={isCardDisabled && !isLocked}
                className={`relative w-10 h-10 md:w-16 md:h-16 rounded-full ${card.bg} flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.1)] border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-80 disabled:grayscale disabled:cursor-not-allowed group ${isReady ? 'ring-4 ring-accent-green ring-offset-2 animate-pulse' : ''} ${hasFreeUse && isLevelLocked ? 'ring-4 ring-yellow-400 animate-pulse' : ''}`}
                title={card.name}
              >
                {isLocked ? (
                  <div className="flex flex-col items-center justify-center text-brown-light">
                    <Lock className="w-4 h-4 md:w-5 md:h-5 mb-0.5" />
                    <span className="text-[8px] md:text-[9px] font-black">Lvl {card.level}</span>
                  </div>
                ) : (
                  <card.icon className={`w-5 h-5 md:w-8 md:h-8 ${card.color}`} />
                )}
                
                {isReady && !isLocked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-green rounded-full border-2 border-white flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  </div>
                )}

                {hasFreeUse && !isLocked && (
                  <div className="absolute -top-2 -right-2 text-lg md:text-xl z-10 animate-bounce" title="استخدام مجاني">
                    ✨
                  </div>
                )}
                
                {!isLocked && !hasProPackage && card.id !== 'quick_guess' && !isReady && !hasFreeUse && (
                  <div className="absolute -top-1.5 -left-1.5 z-10 text-lg md:text-xl drop-shadow-md" title="مشاهدة إعلان">
                    📺
                  </div>
                )}
                
                {cardCooldown > 0 && !isLocked && (
                  <div className="absolute inset-0 bg-gray-900/80 rounded-full flex items-center justify-center text-white text-xs font-black backdrop-blur-[1px]">
                    {cardCooldown}s
                  </div>
                )}
                
                {/* Tooltip */}
                <div className={`absolute left-full ml-3 px-3 py-2 ${isLocked ? 'w-48' : 'bg-gray-800 text-white'} text-xs font-bold rounded-xl ${activeTooltip === card.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity pointer-events-none z-50 shadow-lg text-right`} style={isLocked ? { backgroundColor: '#fff', borderColor: '#000', borderWidth: '2px', color: '#000' } : {}}>
                  {isLocked && card.description ? (
                    <div className="flex flex-col gap-1.5 whitespace-normal">
                      <div className="flex items-center gap-1.5">
                        <card.icon className={`w-4 h-4 ${card.color}`} />
                        <span className="font-black text-sm">{card.name}</span>
                      </div>
                      <p className="text-[10px] leading-relaxed opacity-90">
                        {card.description}
                      </p>
                      <span className="block text-red-500 text-[10px] mt-0.5 font-black bg-red-50 px-2 py-0.5 rounded-md w-fit border border-red-100">
                        مقفول (مطلوب مستوى {card.level})
                      </span>
                    </div>
                  ) : (
                    <span className="whitespace-nowrap">{card.name}</span>
                  )}
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
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[3000] flex items-center justify-center p-4"
          >
            <motion.div 
              className="relative max-w-sm w-full bg-gray-900/80 border-4 border-white/10 rounded-[2.5rem] flex flex-col items-center p-6 shadow-2xl backdrop-blur-xl"
            >
              {room.winnerId === me?.id ? (
                <div className="flex flex-col items-center mb-4 w-full">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 10, stiffness: 100 }}
                    className="mb-4"
                  >
                    <Trophy className="w-20 h-20 text-yellow-400" />
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-3xl font-black text-yellow-400 mb-1"
                  >
                    You Win!
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white font-black text-base mb-4 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm"
                  >
                    أداء أسطوري يا بطل! 💪
                  </motion.p>
                  {me && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-2xl font-black text-white w-full text-center"
                    >
                      {me.level >= 50 && !room.lastUpdates?.[me.id]?.useToken ? (
                        <div className="flex flex-col items-center">
                          <span>XP: 0</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">تحتاج Tokens لزيادة الـ XP</span>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <XPAnimatedCounter finalXP={room.lastUpdates?.[me.id]?.xp || 0} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center mb-4 w-full">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 100 }}
                    className="mb-4 text-6xl"
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -5, 0],
                        rotate: [-3, 3, -3]
                      }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      😢
                    </motion.div>
                  </motion.div>
                  
                  <motion.h2 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-3xl font-black text-red-500 mb-1"
                  >
                    You Lose!
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white font-black text-base mb-4 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm"
                  >
                    حظ أوفر في المرة القادمة
                  </motion.p>
                  {me && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-2xl font-black text-white w-full text-center"
                    >
                      {me.level >= 50 && !room.lastUpdates?.[me.id]?.useToken ? (
                        <div className="flex flex-col items-center">
                          <span>XP: 0</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">تحتاج Tokens لزيادة الـ XP</span>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <XPAnimatedCounter finalXP={room.lastUpdates?.[me.id]?.xp || 0} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                className="flex flex-col items-center mb-6"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
                  <img src={me?.targetImage?.image} className="w-full h-full object-cover" alt={me?.targetImage?.name} />
                </div>
                <div className="font-black text-lg text-white mt-2 bg-black/40 px-3 py-0.5 rounded-lg backdrop-blur-sm">{me?.targetImage?.name}</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full px-4 flex flex-col gap-2"
              >
                {room.players.length >= 2 && (
                  <button 
                    onClick={() => {
                      socket?.emit('play_again', { roomId });
                      setChatHistory([]);
                    }}
                    className="w-full btn-game py-3 text-base btn-success"
                  >
                    العب تاني مع المنافس
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (needsUpdate) {
                      window.location.reload();
                      return;
                    }
                    handleLeaveGame();
                    setIsSearching(false);
                    setProposedMatch(null);
                    setHasResponded(false);
                    setOpponentAccepted(false);
                  }}
                  className="w-full btn-game btn-primary py-3 text-base"
                >
                  الرئيسية
                </button>
              </motion.div>
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
            onClose={() => {
              setShowLevelUp(null);
            }} 
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
            <span className="text-sm font-black text-main">
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
      <AnimatePresence>
        {showMatchIntro && room && room.players.length >= 2 && (
          <MatchIntro 
            player1={{ id: room.players[0].id, name: room.players[0].name, level: room.players[0].level, avatar: room.players[0].avatar }}
            player2={{ id: room.players[1].id, name: room.players[1].name, level: room.players[1].level, avatar: room.players[1].avatar }}
            onStartGame={handleMatchIntroStart}
            onComplete={handleMatchIntroComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
