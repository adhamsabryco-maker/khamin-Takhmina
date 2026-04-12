import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { createPortal } from 'react-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { GoogleGenAI } from "@google/genai";
import { io, Socket } from 'socket.io-client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { motion, AnimatePresence, animate } from 'motion/react';
import { 
  Upload,
  Trash2,
  Mail,
  User,
  Image as ImageIcon,
  Bell,
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
  LogOut,
  Plus,
  Edit2,
  ShoppingCart,
  Hash,
  Copy,
  Volume2,
  VolumeX,
  Music,
  Tv,
  Play,
  Gift,
  Unlock,
  Coins,
  FileText,
  History,
  Activity,
  MessageCircle,
  Clock,
  CloudRain,
  Disc,
} from 'lucide-react';

import easyGuessData from './data/easyGuess.json';

const SPIN_REWARDS_UI = [
  { id: 'time_freeze', type: 'helper', value: 'time_freeze', label: 'تجميد الوقت', icon: <Snowflake className="w-6 h-6" />, color: '#06b6d4' },
  { id: 'word_length', type: 'helper', value: 'word_length', label: 'كاشف الحروف', icon: <Type className="w-6 h-6" />, color: '#22c55e' },
  { id: 'word_count', type: 'helper', value: 'word_count', label: 'عدد الكلمات', icon: <Hash className="w-6 h-6" />, color: '#6366f1' },
  { id: 'hint', type: 'helper', value: 'hint', label: 'تلميح', icon: <HelpCircle className="w-6 h-6" />, color: '#3b82f6' },
  { id: 'spy_lens', type: 'helper', value: 'spy_lens', label: 'الجاسوس', icon: <Eye className="w-6 h-6" />, color: '#a855f7' },
  { id: 'token_1', type: 'token', value: 1, label: 'Token 1', icon: <Coins className="w-6 h-6" />, color: '#fbbf24' },
  { id: 'token_2', type: 'token', value: 2, label: 'Token 2', icon: <Coins className="w-6 h-6" />, color: '#f59e0b' },
  { id: 'token_3', type: 'token', value: 3, label: 'Token 3', icon: <Coins className="w-6 h-6" />, color: '#d97706' },
  { id: 'token_4', type: 'token', value: 4, label: 'Token 4', icon: <Coins className="w-6 h-6" />, color: '#b45309' },
  { id: 'token_5', type: 'token', value: 5, label: 'Token 5', icon: <Coins className="w-6 h-6" />, color: '#92400e' },
  { id: 'token_10', type: 'token', value: 10, label: 'Token 10', icon: <Coins className="w-6 h-6" />, color: '#78350f' },
  { id: 'xp_10', type: 'xp', value: 10, label: '10 XP', icon: <Star className="w-6 h-6" />, color: '#f97316' },
  { id: 'xp_20', type: 'xp', value: 20, label: '20 XP', icon: <Star className="w-6 h-6" />, color: '#ea580c' },
  { id: 'xp_30', type: 'xp', value: 30, label: '30 XP', icon: <Star className="w-6 h-6" />, color: '#c2410c' },
  { id: 'xp_40', type: 'xp', value: 40, label: '40 XP', icon: <Star className="w-6 h-6" />, color: '#9a3412' },
  { id: 'xp_50', type: 'xp', value: 50, label: '50 XP', icon: <Star className="w-6 h-6" />, color: '#7c2d12' },
  { id: 'xp_100', type: 'xp', value: 100, label: '100 XP', icon: <Star className="w-6 h-6" />, color: '#431407' },
  { id: 'xp_5000', type: 'xp', value: 5000, label: '5000 XP', icon: <Star className="w-6 h-6" />, color: '#ef4444' },
  { id: 'xp_10000', type: 'xp', value: 10000, label: '10000 XP', icon: <Star className="w-6 h-6" />, color: '#dc2626' },
  { id: 'pro_30', type: 'pro', value: 30, label: 'باقة المحترفين', icon: <Crown className="w-6 h-6" />, color: '#ec4899' },
];

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
import { COLLECTION_DATA } from '../collectionData';
import { AdminCustomization } from './components/AdminCustomization';
import { AdminLogin } from './components/AdminLogin';
import { QuickChatManager } from './components/QuickChatManager';
import { AvatarDisplay } from './components/AvatarDisplay';
import { LevelUpModal } from './components/LevelUpModal';
import { MatchIntro } from './components/MatchIntro';
import { useAvatarConfig } from './contexts/AvatarContext';
import { STATIC_ASSETS } from './constants';
import Cropper from 'react-easy-crop';
import { Howl, Howler } from 'howler';
import { filterProfanity } from './profanityFilter';

declare global {
  interface Window {
    adsbygoogle: any[];
    adBreak: (o: any) => void;
    adConfig: (o: any) => void;
  }
}

// Audio URLs
const SOUNDS = {
  hammer: '/sounds/hammer.mp3',
  pop: '/sounds/pop.mp3',
  xp: '/sounds/xp.mp3',
  prize: '/sounds/prize.mp3',
  win: '/sounds/win.mp3',
  lose: '/sounds/lose.mp3',
  countdown: '/sounds/countdown.mp3',
  cyclingReward: '/sounds/cyclingReward.mp3',
  chestOpen: '/sounds/chestOpen.mp3',
  shakingBox: '/sounds/shakingBox.mp3',
  bell: '/sounds/bell.mp3',
  correct: '/sounds/correct.mp3',
  message: '/sounds/message.mp3',
  clickOpen: '/sounds/click-open.mp3',
  clickClose: '/sounds/click-close.mp3',
  tick: '/sounds/tick.mp3',
  luckyReels: '/sounds/lucky-reels-sound-effect.mp3',
  spinStart: '/sounds/lucky-reels-sound-effect.mp3',
  spinStop: '/sounds/bell.mp3',
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
  gender: string;
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
  helpersUsedCount?: number;
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
  lastRenameAt?: number;
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
  adCooldownTimer?: number;
  currentTurn?: string | null;
  waitingForAnswerFrom?: string | null;
}

const findNodeByText = (text: string, nodes: any[]): any | null => {
  for (const node of nodes) {
    if (node.text === text) return node;
    if (node.children) {
      const found = findNodeByText(text, node.children);
      if (found) return found;
    }
  }
  return null;
};

const AVATARS = [
  { id: '/assets/avatar.png', level: 1, gender: 'all' },
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

// Get version from meta tag injected by server, fallback to hardcoded if not found
const getAppVersion = () => {
  const metaVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
  return (metaVersion && metaVersion !== '{{VERSION}}') ? metaVersion : '1.1.5';
};
const APP_VERSION = getAppVersion(); // Version for cache clearing



const EMOTES = ['😂', '🤪', '😡','😔', '🤔', '🙄', '🤯', '😭', '👀', '🕒', '👋', '✋', '👌', '👍', '👎', '🎉', '🤷🏼‍♂️', '🤷🏻‍♀️', '🤦🏼‍♂️', '🤦'];

const POWER_UP_UNLOCKS = [10, 20, 30, 40, 50];
const AVATAR_UNLOCKS = [10, 20, 30, 40, 50];

const DAILY_QUEST_REWARDS = [50, 100, 150, 250, 300, 400, 500];
const HELPER_ITEMS = [
  { id: 'word_length', name: 'كاشف الحروف', icon: <Type className="w-5 h-5 text-green-500" /> },
  { id: 'word_count', name: 'عدد الكلمات', icon: <Hash className="w-5 h-5 text-indigo-500" /> },
  { id: 'time_freeze', name: 'تجميد الوقت', icon: <Snowflake className="w-5 h-5 text-cyan-500" /> },
  { id: 'hint', name: 'تلميح', icon: <HelpCircle className="w-5 h-5 text-blue-500" /> },
  { id: 'spy_lens', name: 'الجاسوس', icon: <Eye className="w-5 h-5 text-purple-500" /> }
];

const enterFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
  }
};

const TypingIndicator = ({ gender }: { gender?: string }) => (
  <div className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl rounded-tl-none shadow-sm w-fit border border-gray-100">
    <span className="text-[10px] font-bold text-accent-blue mr-1">انتظر...! المنافس {gender === 'girl' ? 'تقوم' : 'يقوم'} بتغيير السؤال.</span>
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

import { CheckoutPage } from './components/CheckoutPage';

function normalizeEgyptian(text: string): string {
  if (!text) return "";
  let normalized = text.trim();
  normalized = normalized.replace(/[أإآ]/g, 'ا');
  normalized = normalized.replace(/ة/g, 'ه');
  normalized = normalized.replace(/ى/g, 'ي');
  normalized = normalized.replace(/ؤ/g, 'و');
  normalized = normalized.replace(/ئ/g, 'ي');
  normalized = normalized.replace(/گ/g, 'ج');
  normalized = normalized.replace(/پ/g, 'ب');
  normalized = normalized.replace(/ڤ/g, 'ف');
  normalized = normalized.replace(/چ/g, 'ج');
  normalized = normalized.replace(/ژ/g, 'ز');
  normalized = normalized.replace(/ڤ/g, 'ف');
  return normalized;
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const RewardCard = React.memo(({ playerName, level, avatar, selectedFrame, reward, categoryName, isClaimed, onClaim, isStageComplete, previewFrame, customConfig }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, { 
          useCORS: true, 
          backgroundColor: null,
          scale: 2 // Improve quality
        });
        const dataUrl = canvas.toDataURL('image/png');
        
        const downloadFallback = () => {
          const link = document.createElement('a');
          link.download = 'reward.png';
          link.href = dataUrl;
          link.click();
        };

        if (navigator.share && navigator.canShare) {
          try {
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'reward.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'مكافأتي في خمن تخمينة!',
                text: 'شوف مكافأتي في لعبة خمن تخمينة!',
                url: window.location.origin
              });
            } else {
              downloadFallback();
            }
          } catch (shareErr: any) {
            console.warn('Share API failed or was cancelled, falling back to download:', shareErr);
            if (shareErr.name !== 'AbortError') {
              downloadFallback();
            }
          }
        } else {
          downloadFallback();
        }
      } catch (err) {
        console.error('Share failed:', err);
        alert('حدث خطأ أثناء المشاركة، يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const frameToDisplay = isClaimed ? selectedFrame : previewFrame;

  return (
    <div className="flex flex-col items-center gap-4 pt-6 md:pt-6 space-y-3 md:space-y-4">
      <div ref={cardRef} className="p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm bg-[#fdfbf7]">
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-24 h-24">
            <AvatarDisplay avatar={avatar} level={level} customConfig={customConfig} className="w-full h-full" hideExtras={false} isOnline={true} selectedFrame={frameToDisplay} />
          </div>
          <h3 className="text-2xl font-black" style={{ color: '#4a3f35' }}>{playerName}</h3>
          <p className="text-sm font-bold" style={{ color: '#4b5563' }}>المستوى: {level}</p>
          <div className="mt-4 p-3 bg-white rounded-xl border-2 border-black w-full text-center">
            <p className="text-sm font-black" style={{ color: '#4a3f35' }}>مبروك! كسبت:</p>
            <p className="text-lg font-black" style={{ color: '#f97316' }}>{reward.xp} XP</p>
            {reward.frame && <p className="text-sm font-black" style={{ color: '#3b82f6' }}>+ إطار مميز</p>}
          </div>
        </div>
      </div>
      {isClaimed ? (
        <button onClick={handleShare} className="btn-game btn-secondary py-3 px-6 text-lg font-black">
          مشاركة المكافأة 🚀
        </button>
      ) : (
        <button 
          disabled={!isStageComplete}
          onClick={onClaim}
          className={`px-3 py-1 rounded-lg text-xs font-black transition-colors ${isStageComplete ? 'bg-orange-500 text-white hint-glow hover:bg-orange/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          استلام المكافأة
        </button>
      )}
    </div>
  );
});

const AnimatedXp = ({ xp, joined, children }: { xp: number, joined: boolean, children: (displayXp: number) => React.ReactNode }) => {
  const [displayXp, setDisplayXp] = useState(xp);
  
  useEffect(() => {
    if (xp === displayXp || joined) return;

    const duration = 500;
    const startXp = displayXp;
    const targetXp = xp;
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const nextValue = startXp + (targetXp - startXp) * progress;
      
      setDisplayXp(nextValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayXp(targetXp);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [xp, joined]);

  return <>{children(displayXp)}</>;
};

const getLevel = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;

export default function App() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const { customConfig, refreshConfig } = useAvatarConfig();
  const appVersion = customConfig.version || '1.1.1';
  const [initialVersion, setInitialVersion] = useState<string | null>(null);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onNeedRefresh() {
      // Automatically update when a new SW is available
      console.log('[DEBUG] New SW available, updating...');
      updateServiceWorker(true);
    }
  });

  useEffect(() => {
    if (typeof window.adConfig === 'function') {
      try {
        window.adConfig({
          preloadAdBreaks: 'on',
          sound: 'on',
          maxAdContentRating: 'PG',
          onReady: () => {
            console.log("H5 Games Ads ready");
          }
        });
      } catch (e) {
        console.error("Failed to initialize adConfig", e);
      }
    }
  }, []);

  useEffect(() => {
    if (customConfig.version && !initialVersion) {
      setInitialVersion(customConfig.version);
    }
  }, [customConfig.version, initialVersion]);

  // Re-enabled version check but without forcing reloads
  useEffect(() => {
    if (initialVersion && appVersion !== '1.1.1' && appVersion !== initialVersion) {
      console.log('New version detected from config:', appVersion);
      setNeedsUpdate(true);
      setNeedRefresh(true);
    }
  }, [appVersion, initialVersion, setNeedRefresh]);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/api/version?t=' + Date.now());
        const data = await response.json();
        if (data.version && initialVersion && data.version !== initialVersion) {
          console.log('New version detected from API:', data.version);
          setNeedsUpdate(true);
          setNeedRefresh(true);
        }
      } catch (e) {
        console.error('Failed to check version', e);
      }
    };
    
    if (initialVersion) {
      checkVersion();
      // Periodically check version every 5 minutes
      const interval = setInterval(checkVersion, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [initialVersion, setNeedRefresh]);

  useEffect(() => {
    if (customConfig.version) {
      const version = customConfig.version;
      
      // Update manifest
      const manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (manifestLink) {
        const currentHref = manifestLink.href || '';
        const baseManifest = currentHref.includes('webmanifest') ? '/manifest.webmanifest' : '/manifest.json';
        manifestLink.href = `${baseManifest}?v=${version}`;
      }
    }
  }, [customConfig.version]);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('khamin_player_name') || '');
  const [lastRenameAt, setLastRenameAt] = useState(() => parseInt(localStorage.getItem('khamin_last_rename_at') || '0'));
  const playerNameRef = useRef(playerName);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);

  useEffect(() => {
    fetch('/api/check-level-50-reward')
      .then(res => res.json())
      .then(data => setIsRewardClaimed(data.claimed))
      .catch(err => console.error('Failed to check reward status', err));

    if (socket) {
      socket.on('reward_claimed', () => setIsRewardClaimed(true));
      socket.on('collection_reward_claimed', (data: any) => {
        showAlert(`مبروك! أكملت المرحلة ${data.stage} من فئة ${data.categoryName} وحصلت على ${data.xp} XP! 🏆`, 'مكافأة المجموعة');
        setXp(prev => prev + data.xp);
        if (playerSerial) fetchCollection(playerSerial);
      });
      return () => {
        socket.off('reward_claimed');
      };
    }
  }, [socket]);

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
  const [isRewardClaimed, setIsRewardClaimed] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);

  const [fingerprint, setFingerprint] = useState<string | null>(null);
  useEffect(() => {
    const setFp = async () => {
      const fpPromise = FingerprintJS.load();
      const fp = await fpPromise;
      const result = await fp.get();
      setFingerprint(result.visitorId);
    };
    setFp();
  }, []);

  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('khamin_xp') || '0'));

  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('khamin_streak') || '0'));
  const [wins, setWins] = useState(() => parseInt(localStorage.getItem('khamin_wins') || '0'));
  const [tokens, setTokens] = useState(() => parseInt(localStorage.getItem('khamin_tokens') || '0'));
  const [playerSerial, setPlayerSerial] = useState(() => localStorage.getItem('khamin_player_serial') || '');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [loginSerial, setLoginSerial] = useState('');
  const [loginError, setLoginError] = useState('');
  const [pendingWelcomeModal, setPendingWelcomeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [citySearchState, setCitySearchState] = useState<any>(null);
  const [isCitySearchLoaded, setIsCitySearchLoaded] = useState(false);
  const [displayedRewards, setDisplayedRewards] = useState<any>(null);
  const [citySearchTimeLeft, setCitySearchTimeLeft] = useState("");
  const [selectedCity, setSelectedCity] = useState(1);
  const [blockedPlayers, setBlockedPlayers] = useState<{serial: string, name: string}[]>([]);
  const [showBlockedPlayers, setShowBlockedPlayers] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [canSendComplaint, setCanSendComplaint] = useState(true);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showCheckoutPage, setShowCheckoutPage] = useState(false);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const [selectedWalletItem, setSelectedWalletItem] = useState<string | null>(null);
  const [showTokenInfoModal, setShowTokenInfoModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [isDocumentHidden, setIsDocumentHidden] = useState(document.hidden);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('khamin_notifications_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

  const [showAdConfirmation, setShowAdConfirmation] = useState(false);
  const [readyPowerUps, setReadyPowerUps] = useState<string[]>([]);
  const [adStatus, setAdStatus] = useState({ adsWatched: 0, maxAds: 5, canWatch: false, loading: true });
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCooldown && cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => prev - 1);
      }, 1000);
    } else if (cooldownTime === 0) {
      setIsCooldown(false);
    }
    return () => clearInterval(timer);
  }, [isCooldown, cooldownTime]);

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
        playSound('win');
        showAlert('تمت إضافة الـ Token بنجاح! 🎉', 'نجاح');
      });

      socket.on('ad_error', (msg) => {
        showAlert(msg, 'تنبيه');
      });

      // Sync notifications status
      socket.emit('update_player_notifications', { serial: playerSerial, enabled: notificationsEnabled });

      return () => {
        socket.off('ad_status');
        socket.off('ad_success');
        socket.off('ad_error');
      };
    }
  }, [socket, isConnected, playerSerial, notificationsEnabled]);

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
  const [unlockedHelpersExpiry, setUnlockedHelpersExpiry] = useState<number | null>(() => {
    const saved = localStorage.getItem('khamin_unlocked_helpers_expiry');
    if (saved) return parseInt(saved);
    return null;
  });
  const hasProPackage = proPackageExpiry !== null && proPackageExpiry > Date.now();
  const hasUnlockedHelpers = unlockedHelpersExpiry !== null && unlockedHelpersExpiry > Date.now();
  const proPackageDaysLeft = hasProPackage ? Math.ceil((proPackageExpiry! - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const prevLevelRef = useRef(getLevel(xp));

  useEffect(() => {
    const currentLevel = getLevel(xp);
    if (currentLevel > prevLevelRef.current) {
      let milestoneCrossed = null;
      for (let m of [10, 20, 30, 40, 50]) {
        if (prevLevelRef.current < m && currentLevel >= m) {
          milestoneCrossed = m;
        }
      }
      
      if (milestoneCrossed) {
        setShowLevelUp(milestoneCrossed);
      } else {
        setShowLevelUp(currentLevel);
      }
      playSound('win');
    }
    prevLevelRef.current = currentLevel;
  }, [xp]);
  const [showMatchIntro, setShowMatchIntro] = useState(false);

  // Rain Gift Event States
  const [showRainGiftGame, setShowRainGiftGame] = useState(false);
  const [isRainGiftActive, setIsRainGiftActive] = useState(false);
  const [rainGiftCountdown, setRainGiftCountdown] = useState<string>('');
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const [collectedRewards, setCollectedRewards] = useState({ xp: 0, tokens: 0, helpers: {} as Record<string, number> });
  const [gameTimer, setGameTimer] = useState(180);
  const [showRainGiftSummary, setShowRainGiftSummary] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      try {
        const egyptTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
        const target = new Date(egyptTime);
        target.setHours(19, 0, 0, 0);
        
        const diffMinutes = (egyptTime.getTime() - target.getTime()) / (1000 * 60);
        const active = diffMinutes >= 0 && diffMinutes <= 3;
        
        setIsRainGiftActive(active);
        
        if (active) {
          setRainGiftCountdown('الحدث متاح الآن!');
        } else {
          if (egyptTime > target) {
            target.setDate(target.getDate() + 1);
          }
          const diff = target.getTime() - egyptTime.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setRainGiftCountdown(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      } catch (e) {
        // Fallback if timezone not supported
        const utcHour = now.getUTCHours();
        const targetUTCHour = 17; // 7 PM Egypt is roughly 17:00 UTC
        const active = utcHour === targetUTCHour && now.getUTCMinutes() <= 3;
        setIsRainGiftActive(active);
        setRainGiftCountdown(active ? 'الحدث متاح الآن!' : 'قريباً...');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let spawnInterval: NodeJS.Timeout;
    
    if (showRainGiftGame) {
      setGameTimer(180);
      setCollectedRewards({ xp: 0, tokens: 0, helpers: {} });
      setFallingItems([]);
      
      interval = setInterval(() => {
        setGameTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            clearInterval(spawnInterval);
            setTimeout(() => {
              setShowRainGiftGame(false);
              setShowRainGiftSummary(true);
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      spawnInterval = setInterval(() => {
        const id = Math.random().toString(36).substr(2, 9);
        const x = Math.random() * 60 + 20; // 20% to 80% to keep items fully inside the screen
        const duration = Math.random() * 1.5 + 2; // Slightly faster: 2s to 3.5s
        
        const rand = Math.random();
        let type: 'xp' | 'token' | 'helper' = 'xp';
        let value: any = 10;
        let icon = '⭐';
        
        if (rand < 0.80) { // 80% XP chance
           type = 'xp';
           const xpRand = Math.random();
           if (xpRand < 0.4) value = 10;
           else if (xpRand < 0.7) value = 20;
           else if (xpRand < 0.95) value = 30;
           else if (xpRand < 0.98) value = 40; // 3% chance
           else if (xpRand < 0.995) value = 50; // 1.5% chance
           else value = 100; // 0.5% chance
           icon = `${value}XP`;
        } else if (rand < 0.82) { // 2% Token chance
           type = 'token';
           value = 1;
           icon = '🪙';
        } else { // Helper items (18% chance)
           type = 'helper';
           const helpers = [
             { id: 'spy_lens', icon: <Eye className="w-8 h-8 text-purple-500" /> },
             { id: 'time_freeze', icon: <Snowflake className="w-8 h-8 text-cyan-500" /> },
             { id: 'hint', icon: <HelpCircle className="w-8 h-8 text-blue-500" /> },
             { id: 'word_count', icon: <Hash className="w-8 h-8 text-indigo-500" /> },
             { id: 'word_length', icon: <Type className="w-8 h-8 text-green-500" /> }
           ];
           const h = helpers[Math.floor(Math.random() * helpers.length)];
           value = h.id;
           icon = h.icon;
        }
        
        const newItem = { id, x, duration, type, value, icon, size: Math.random() * 30 + 50 }; // Larger: 60px to 90px
        setFallingItems(prev => [...prev, newItem]);
        
        setTimeout(() => {
          setFallingItems(prev => prev.filter(i => i.id !== id));
        }, duration * 1000);
        
      }, 350);
    }
    
    return () => {
      clearInterval(interval);
      clearInterval(spawnInterval);
    };
  }, [showRainGiftGame]);

  useEffect(() => {
    if (socket) {
      socket.on('force_refresh', () => {
        setNeedRefresh(true);
        setNeedsUpdate(true);
      });
      return () => {
        socket.off('force_refresh');
      };
    }
  }, [socket, setNeedRefresh]);
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
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

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
      const adminEmail = localStorage.getItem('khamin_admin_email') || 'adhamsabry.co@gmail.com';
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
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminPlayers, setAdminPlayers] = useState<any[]>([]);
  const [adminPlayerFilter, setAdminPlayerFilter] = useState<'all' | 'reports' | 'level' | 'wins' | 'streak' | 'online' | 'banned'>('all');
  const [adminVisiblePlayersCount, setAdminVisiblePlayersCount] = useState(10);
  const adminPlayersListRef = useRef<HTMLDivElement>(null);
  const filteredAdminPlayers = useMemo(() => {
    let players = [...adminPlayers];
    
    // Apply search
    if (adminSearchQuery) {
      players = players.filter(p => 
        (p.name && p.name.includes(adminSearchQuery)) || 
        (p.serial && p.serial.includes(adminSearchQuery))
      );
    }
    
    // Apply sorting/filtering
    switch (adminPlayerFilter) {
      case 'reports':
        players.sort((a, b) => (b.reports || 0) - (a.reports || 0));
        break;
      case 'level':
        players.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        break;
      case 'wins':
        players.sort((a, b) => (b.wins || 0) - (a.wins || 0));
        break;
      case 'streak':
        players.sort((a, b) => (b.streak || 0) - (a.streak || 0));
        break;
      case 'online':
        players = players.filter(p => p.isOnline);
        players.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        break;
      case 'banned':
        players = players.filter(p => (p.banUntil && p.banUntil > Date.now()) || p.isPermanentBan === 1);
        players.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        break;
      default:
        // Default sort by XP or something
        players.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        break;
    }
    
    return players;
  }, [adminPlayers, adminSearchQuery, adminPlayerFilter]);

  const handleAdminPlayersScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
      if (adminVisiblePlayersCount < filteredAdminPlayers.length) {
        setAdminVisiblePlayersCount(prev => prev + 10);
      }
    }
  }, [adminVisiblePlayersCount, filteredAdminPlayers.length]);

  useEffect(() => {
    setAdminVisiblePlayersCount(10);
  }, [adminSearchQuery, adminPlayerFilter]);
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem('khamin_admin_email') || '');
  const [adminTab, setAdminTab] = useState<'players' | 'images' | 'customization' | 'shop' | 'colors' | 'announcements' | 'rewards' | 'policies' | 'avatar_review' | 'contacts' | 'live_matches' | 'quick_chat'>('players');
  const [rewardHistory, setRewardHistory] = useState<any[]>([]);
  const [adminContacts, setAdminContacts] = useState<any[]>([]);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);

  const [spectatingRoomId, setSpectatingRoomId] = useState<string | null>(null);
  const spectatingRoomIdRef = useRef<string | null>(null);
  
  const updateSpectatingRoomId = (id: string | null) => {
    setSpectatingRoomId(id);
    spectatingRoomIdRef.current = id;
  };

  useEffect(() => {
    if (spectatingRoomId && activeRooms.length === 0 && socket) {
      socket.emit('admin_get_active_rooms', (rooms: any) => {
        if (Array.isArray(rooms)) setActiveRooms(rooms);
      });
    }
  }, [spectatingRoomId, socket, activeRooms.length]);
  const [spectatorRoomData, setSpectatorRoomData] = useState<any>(null);
  const [pendingAvatars, setPendingAvatars] = useState<{ serial: string, name: string, level: number, pendingAvatar: string }[]>([]);
  const [avatarStatus, setAvatarStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [adminAnnouncementMessage, setAdminAnnouncementMessage] = useState('تنبيه: سيتم تحديث اللعبة خلال 10 دقائق، نرجو إنهاء الجولات الحالية!\nوعدم دخول جولات جديدة الان.');
  const [adminRewardType, setAdminRewardType] = useState<'pro_package' | 'unlock_helpers' | 'tokens'>('pro_package');
  const [adminRewardDuration, setAdminRewardDuration] = useState<number>(24);
  const [adminRewardMessage, setAdminRewardMessage] = useState('هدية مجانية لجميع اللاعبين! استمتع بباقة المحترفين مجاناً.');
  const [adminTokenRewardAmount, setAdminTokenRewardAmount] = useState<number>(100);
  const [adminTokenRewardMessage, setAdminTokenRewardMessage] = useState('هدية خاصة للاعبين المميزين (مستوى 50+) 🎁');
  const [confirmTokenSend, setConfirmTokenSend] = useState(false);
  const [gamePolicies, setGamePolicies] = useState({ termsAr: '', termsEn: '', privacyAr: '', privacyEn: '', isRainGiftEnabled: true });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', subject: '', message: '' });
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
  };
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [adminImages, setAdminImages] = useState<any[]>([]);
  const [shopItems, setShopItems] = useState<any[]>([]);
  const [paymobSettings, setPaymobSettings] = useState({ 
    paymob_api_key: 'ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRFek9EazBNU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5ySGdYVGNEVmFpSkQ2bTktQ1lETzJzSEV1N3JqVjR1RkdpR2F2dHlZNEM4T0JicXFSYWF3NEFqVWdES1otQ25NOHd3aGtDZlVfVFk3UkRjNV9jZ3BUZw==', 
    paymob_wallet_integration_id: '5579190', 
    paymob_card_integration_id: '5572379', 
    paymob_iframe_id: '1013400',
    paymob_hmac: 'A2DBAF7F92579F5B6CE8687D60BE29BA'
  });
  const [luckyWheelEnabled, setLuckyWheelEnabled] = useState(true);
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

  useEffect(() => {
    if (adminTab === 'rewards' && isAdmin) {
      socket?.emit('admin_get_reward_history', (history: any[]) => {
        setRewardHistory(history);
      });
    }
  }, [adminTab, isAdmin, socket]);

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

  const checkImageSafety = async (base64Image: string): Promise<'safe' | 'unsafe' | 'suspicious'> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || (process as any).env?.GOOGLE_API_KEY;
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.warn('GEMINI_API_KEY is missing or invalid. Falling back to manual review.');
        return 'suspicious';
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image.split(',')[1]
        }
      };
      
      const prompt = "Analyze this image for a children's game. Is it safe for kids? \n" +
                     "- 'safe': Clearly safe objects (e.g., animals like horses, cats, giraffes, nature, toys, cartoons, friendly faces). Animals are ALWAYS safe.\n" +
                     "- 'unsafe': Clearly inappropriate (e.g., nudity, gore, violence, drugs, hate symbols).\n" +
                     "- 'suspicious': Borderline, contains text, or is unclear.\n" +
                     "Respond with ONLY one word: 'safe', 'unsafe', or 'suspicious'.";
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [imagePart, { text: prompt }] }]
      });
      
      const result = response.text?.toLowerCase().trim();
      console.log('AI Safety Result:', result);
      if (result === 'safe' || result === 'unsafe' || result === 'suspicious') return result as any;
      return 'suspicious';
    } catch (error) {
      console.error('AI Safety Check failed:', error);
      // If it's a specific API error (like invalid key), log it clearly
      if (error instanceof Error && error.message.includes('API_KEY_INVALID')) {
        console.error('The provided Gemini API key is invalid. Please check your Secrets settings.');
      }
      return 'suspicious'; // Fallback to manual review if AI fails
    }
  };

  useEffect(() => {
    if (adminTab === 'avatar_review' && socket) {
      socket.emit('admin_get_pending_avatars', (pending: any) => {
        if (Array.isArray(pending)) setPendingAvatars(pending);
      });
    } else if (adminTab === 'contacts' && socket) {
      socket.emit('admin_get_contacts', (contacts: any) => {
        if (Array.isArray(contacts)) setAdminContacts(contacts);
      });
    }
  }, [adminTab, socket]);

  const handleCropSave = async () => {
    try {
      if (imageSrc && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        if (croppedImage) {
          setIsUploading(true);
          const safetyResult = await checkImageSafety(croppedImage);
          setIsUploading(false);
          
          if (safetyResult === 'unsafe') {
            setError('الصورة تحتوي على محتوى غير لائق. يرجى اختيار صورة أخرى.');
            return;
          }
          
          socket?.emit('request_custom_avatar', { 
            playerSerial, 
            avatar: croppedImage, 
            status: safetyResult === 'safe' ? 'approved' : 'pending' 
          }, (res: any) => {
            if (res.success) {
              const newStatus = safetyResult === 'safe' ? 'approved' : 'pending';
              setAvatarStatus(newStatus);
              if (newStatus === 'approved') {
                setAvatar(croppedImage);
                setCustomAvatar(croppedImage);
                localStorage.setItem('khamin_custom_avatar', croppedImage);
              } else {
                // If pending, we don't save to localStorage yet
                // We just show it in the UI if needed, but don't "apply" it
                setCustomAvatar(croppedImage);
              }
              showAlert(res.message, 'نجاح');
            } else {
              setError(res.message || 'فشل إرسال الصورة');
            }
          });
          
          setShowCropper(false);
          setImageSrc(null);
        } else {
          setError('حدث خطأ أثناء معالجة الصورة');
        }
      }
    } catch (e) {
      console.error(e);
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsUploading(false);
    }
  };

  const renderAvatarContent = (avatarStr: string, level: number = 1, hideExtras: boolean = false, isOnline: boolean = false, frame?: string) => {
    return <AvatarDisplay avatar={avatarStr} level={level} customConfig={customConfig} className="w-full h-full" hideExtras={hideExtras} isOnline={isOnline} selectedFrame={frame} />;
  };

  const truncateName = (name: string, limit: number = 12) => {
    if (!name) return '';
    return name.length > limit ? name.substring(0, limit) + '...' : name;
  };

  // Cache clearing logic
  useEffect(() => {
    const lastVersion = localStorage.getItem('khamin_app_version');
    if (lastVersion && lastVersion !== APP_VERSION) {
      // DO NOT use localStorage.clear() here! It wipes the player's ID and logs them out.
      // We only want to clear the service worker caches.
      if ('caches' in window) {
        caches.keys().then(names => {
          for (let name of names) {
            caches.delete(name);
          }
        });
      }
      localStorage.setItem('khamin_app_version', APP_VERSION);
      window.location.reload();
    } else if (!lastVersion) {
      localStorage.setItem('khamin_app_version', APP_VERSION);
    }
  }, []);

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
    const starsCount = Math.min(5, Math.floor(level / 10));
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
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            {displayStar ? (
              <img src={displayStar} className="w-4 h-4 object-contain drop-shadow-sm" alt="Star" />
            ) : (
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    localStorage.setItem('khamin_xp', xp.toString());
    localStorage.setItem('khamin_streak', streak.toString());
  }, [xp, streak]);

  const [avatar, setAvatar] = useState(() => localStorage.getItem('khamin_player_avatar') || AVATARS[0].id);
  const [selectedFrame, setSelectedFrame] = useState(() => localStorage.getItem('khamin_player_frame') || '');
  const [hasSelectedAvatar, setHasSelectedAvatar] = useState(false);

  useEffect(() => {
    localStorage.setItem('khamin_player_avatar', avatar);
    if (socket) {
      socket.emit('update_avatar', { avatar });
    }
  }, [avatar, socket]);

  useEffect(() => {
    localStorage.setItem('khamin_player_frame', selectedFrame);
    if (socket && playerSerial) {
      socket.emit('update_selected_frame', { playerSerial, frame: selectedFrame });
    }
  }, [selectedFrame, socket, playerSerial]);

  useEffect(() => {
    localStorage.setItem('khamin_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('khamin_player_age', playerAge.toString());
  }, [playerAge]);

  const [roomId, setRoomId] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [clickedResponses, setClickedResponses] = useState<string[]>([]);
  const [isQuickResponseDisabled, setIsQuickResponseDisabled] = useState(false);
  const quickResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Quick Chat State
  const [currentQuickChatNodes, setCurrentQuickChatNodes] = useState<any[]>([]);
  const [quickChatOffset, setQuickChatOffset] = useState(0);
  const [isReelsSpinning, setIsReelsSpinning] = useState(false);
  const reelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false]);
  const [reelRandomItems, setReelRandomItems] = useState<string[][]>([[], [], [], []]);
  const askedQuickChatNodeRef = useRef<any | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentQuickChatNodes.length > 0 && quickChatOffset >= currentQuickChatNodes.length) {
      setQuickChatOffset(0);
    }
  }, [currentQuickChatNodes.length, quickChatOffset]);

  useEffect(() => {
    if (room?.gameState === 'finished' || room?.gameState === 'waiting') {
      setIsQuickResponseDisabled(false);
      setClickedResponses([]);
      if (quickResponseTimeoutRef.current) {
        clearTimeout(quickResponseTimeoutRef.current);
        quickResponseTimeoutRef.current = null;
      }
    }
  }, [room?.gameState]);

  const roomRef = useRef<Room | null>(null);
  const isIntentionalLeaveRef = useRef(false);
  useEffect(() => { roomRef.current = room; }, [room]);

  const [joined, setJoined] = useState(false);
  
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  useEffect(() => {
    if (isAdmin) {
      const fetchPushStats = async () => {
        try {
          const token = localStorage.getItem('khamin_admin_token');
          if (!token) {
            console.log("No admin token found in localStorage");
            return;
          }
          console.log("Fetching push stats with token...");
          const response = await fetch(`/api/admin/push-stats?token=${token}`);
          if (!response.ok) {
            console.error("Push stats API failed:", response.status);
            setPushStatsError(`خطأ في جلب البيانات (${response.status})`);
            return;
          }
          const data = await response.json();
          console.log("Push stats received:", data);
          if (data.count !== undefined) {
            setPushStats({ count: data.count, totalPlayers: data.totalPlayers || 0 });
            setPushStatsError(null);
          } else {
            console.warn("Push stats response missing count:", data);
            setPushStatsError("بيانات غير مكتملة");
          }
        } catch (err) {
          console.error("Error fetching push stats:", err);
          setPushStatsError("خطأ في الاتصال");
        }
      };
      fetchPushStats();
      const interval = setInterval(fetchPushStats, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [isAdmin, showAdminDashboard, adminTab]);

  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushUrl, setPushUrl] = useState('/');
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushStats, setPushStats] = useState<{ count: number, totalPlayers: number } | null>(null);
  const [pushStatsError, setPushStatsError] = useState<string | null>(null);

  const subscribeToPush = async (force = false) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    // Check current permission
    console.log('[Push] Checking permission:', Notification.permission);
    
    // If permission is default and not forced, show our custom prompt
    if (!force && Notification.permission === 'default') {
      const isDismissed = localStorage.getItem('khamin_push_prompt_dismissed') === 'true';
      console.log('[Push] Prompt dismissed:', isDismissed);
      
      if (!isDismissed) {
        setShowPushPrompt(true);
        return;
      }
      return; // Don't proceed if dismissed
    }

    // If permission is denied, we can't do anything automatically
    if (Notification.permission === 'denied') {
      console.log('[Push] Permission denied by user');
      if (force) {
        showAlert('لقد قمت بحظر الإشعارات من إعدادات المتصفح. يرجى تفعيلها يدوياً لتلقي التنبيهات.', 'تنبيه');
      }
      return;
    }

    // If we are here, either permission is granted or we are forcing (which will trigger browser prompt)
    // But we only proceed if notifications are enabled in our app settings OR we are forcing
    if (!force && !notificationsEnabled) {
      console.log('[Push] Notifications disabled in app settings');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get public key from server
      const response = await fetch('/api/push/public-key');
      const { publicKey } = await response.json();
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // If we got here, subscription was successful (user clicked "Allow" in browser prompt)
      setNotificationsEnabled(true);
      localStorage.setItem('khamin_notifications_enabled', 'true');

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial: playerSerial,
          subscription
        })
      });
      
      if (socket && isConnected) {
        socket.emit('update_player_notifications', { serial: playerSerial, enabled: true });
      }
      
      console.log('Push subscription successful');
      setShowPushPrompt(false);
      if (force) {
        showAlert('تم تفعيل إشعارات الهاتف بنجاح! 🔔', 'نجاح');
      }
    } catch (err) {
      console.error('Failed to subscribe to push:', err);
      if (force) {
        showAlert('فشل تفعيل الإشعارات. يرجى المحاولة مرة أخرى.', 'خطأ');
      }
    }
  };

  const unsubscribeFromPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        // Notify server to remove subscription
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serial: playerSerial,
            subscription
          })
        });
        
        if (socket && isConnected) {
          socket.emit('update_player_notifications', { serial: playerSerial, enabled: false });
        }
      }
      console.log('Push unsubscription successful');
    } catch (err) {
      console.error('Failed to unsubscribe from push:', err);
    }
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('khamin_notifications_enabled', newValue.toString());
    
    if (newValue) {
      await subscribeToPush(true);
    } else {
      await unsubscribeFromPush();
    }
    
    // Update server player data
    if (socket && isConnected) {
      socket.emit('update_player_notifications', { serial: playerSerial, enabled: newValue });
    }
  };
  const [playerCollection, setPlayerCollection] = useState<any[]>([]);
  const [claimedCollectionRewards, setClaimedCollectionRewards] = useState<any[]>([]);
  const [seenCategoryCounts, setSeenCategoryCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('khamin_seen_category_counts');
    return saved ? JSON.parse(saved) : {};
  });
  const [seenFrames, setSeenFrames] = useState<string[]>(() => {
    const saved = localStorage.getItem('khamin_seen_frames');
    return saved ? JSON.parse(saved) : [];
  });
  const [showCollectionModal, setShowCollectionModal] = useState<string | null>(null);
  const [pendingClaimReward, setPendingClaimReward] = useState<{categoryId: string, stage: number} | null>(null);
  const [announcementMessage, setAnnouncementMessage] = useState<string | null>(null);
  const [activeGlobalReward, setActiveGlobalReward] = useState<any | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('جاري التحقق من التحديثات...');
  const [gameVersion, setGameVersion] = useState(localStorage.getItem('khamin_game_version') || '1.1.1');

  const unlockedFrames = useMemo(() => {
    return COLLECTION_DATA.filter(cat => {
      const finalStage = cat.stages[cat.stages.length - 1];
      return claimedCollectionRewards.some(r => r.category_id === cat.id && r.stage === finalStage.stage);
    }).map(cat => cat.id);
  }, [claimedCollectionRewards]);

  const hasNewFrame = unlockedFrames.some(id => !seenFrames.includes(id));
  const [isSearching, setIsSearching] = useState(false);
  const isSearchingRef = useRef(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [banUntil, setBanUntil] = useState<number | null>(null);
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [reports, setReports] = useState(0);
  const [reportedSerials, setReportedSerials] = useState<string[]>([]);
  const [recentOpponents, setRecentOpponents] = useState<any[]>([]);
  const [showRecentOpponents, setShowRecentOpponents] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [confirmedAttributes, setConfirmedAttributes] = useState<string[]>([]);
  const lastInitializedQuickChatRef = useRef<string | null>(null);

  useEffect(() => {
    if (room?.gameState === 'discussion' && room.category && customConfig?.quickChat) {
      const initKey = `${room.id}-${room.category}`;
      if (lastInitializedQuickChatRef.current === initKey) return;

      const categoryObj = categories.find(c => c.id === room.category);
      const categoryName = categoryObj ? categoryObj.name : room.category;

      const rootNode = customConfig.quickChat.find((n: any) => 
        n.text.trim() === categoryName.trim() || 
        n.text.trim() === room.category.trim() ||
        categoryName.includes(n.text.trim()) ||
        n.text.includes(categoryName.trim())
      );

      if (rootNode && rootNode.children) {
        let nodes = [...rootNode.children];
        const normalizedCategory = normalizeEgyptian(categoryName + room.category);
        const isPeople = normalizedCategory.includes('اشخاص');
        const isAnimals = normalizedCategory.includes('حيوانات');
        const isFood = normalizedCategory.includes('اكلات');
        
        if (isPeople || isAnimals || isFood) {
          nodes.sort((a, b) => {
            const aText = normalizeEgyptian(a.text);
            const bText = normalizeEgyptian(b.text);
            let aIsPriority = false;
            let bIsPriority = false;
            
            if (isPeople) {
              aIsPriority = aText.includes('رجل') || aText.includes('ست');
              bIsPriority = bText.includes('رجل') || bText.includes('ست');
            } else if (isAnimals) {
              aIsPriority = aText.includes('بري') || aText.includes('بحري');
              bIsPriority = bText.includes('بري') || bText.includes('بحري');
            } else if (isFood) {
              aIsPriority = aText.includes('حلو') || aText.includes('حادق');
              bIsPriority = bText.includes('حلو') || bText.includes('حادق');
            }
            
            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;
            return 0;
          });
        }
        setCurrentQuickChatNodes(nodes);
        setQuickChatOffset(0);
      } else {
        setCurrentQuickChatNodes([]);
        setQuickChatOffset(0);
      }
      askedQuickChatNodeRef.current = null;
      setConfirmedAttributes([]);
      lastInitializedQuickChatRef.current = initKey;
    } else if (room?.gameState !== 'discussion') {
      lastInitializedQuickChatRef.current = null;
      setConfirmedAttributes([]);
    }
  }, [room?.gameState, room?.category, room?.id, customConfig?.quickChat, categories]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalPlayersCount, setTotalPlayersCount] = useState(0);
  const [proposedMatch, setProposedMatch] = useState<{ matchId: string, opponent: { name: string, avatar: string, selectedFrame?: string, age: number, level?: number } } | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [opponentAccepted, setOpponentAccepted] = useState(false);
  const [matchResponseTimeLeft, setMatchResponseTimeLeft] = useState<number | null>(null);
  const [searchTimeLeft, setSearchTimeLeft] = useState<number | null>(null);
  const [adCooldownTimer, setAdCooldownTimer] = useState<number>(0);
  const [error, setError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [error]);

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
  const [showLuckyWheelModal, setShowLuckyWheelModal] = useState(false);
  const [hasSeenLuckyWheelThisSession, setHasSeenLuckyWheelThisSession] = useState(() => {
    return sessionStorage.getItem('khamin_has_seen_lucky_wheel_session') === 'true';
  });

  const updateHasSeenLuckyWheelThisSession = (value: boolean) => {
    setHasSeenLuckyWheelThisSession(value);
    sessionStorage.setItem('khamin_has_seen_lucky_wheel_session', value.toString());
  };

  const [hasSeenCitySearchToday, setHasSeenCitySearchToday] = useState(() => {
    const saved = localStorage.getItem('khamin_has_seen_city_search_today');
    if (saved) {
      try {
        const { date } = JSON.parse(saved);
        return isSameDay(Date.now(), date);
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const updateHasSeenCitySearchToday = () => {
    setHasSeenCitySearchToday(true);
    localStorage.setItem('khamin_has_seen_city_search_today', JSON.stringify({ date: Date.now() }));
  };

  const [hasOpenedCitySearchToday, setHasOpenedCitySearchToday] = useState(() => {
    const saved = localStorage.getItem('khamin_has_opened_city_search_today');
    if (saved) {
      try {
        const { date } = JSON.parse(saved);
        return isSameDay(Date.now(), date);
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const updateHasOpenedCitySearchToday = () => {
    setHasOpenedCitySearchToday(true);
    localStorage.setItem('khamin_has_opened_city_search_today', JSON.stringify({ date: Date.now() }));
  };

  const toggleCitySearch = (isAuto: boolean = false) => {
    if (showCitySearch) {
      playSound('clickClose');
      setShowCitySearch(false);
    } else {
      playSound('clickOpen');
      closeAllModals();
      setShowCitySearch(true);
      if (!isAuto) {
        updateHasOpenedCitySearchToday();
        if (!hasSeenCitySearchToday) {
          updateHasSeenCitySearchToday();
        }
      }
    }
  };

  const checkFreeSpinUsedToday = () => {
    const saved = localStorage.getItem('khamin_has_used_free_spin');
    const lastUsed = localStorage.getItem('khamin_last_free_spin_date');
    if (saved === 'true' && lastUsed) {
      if (isSameDay(Date.now(), parseInt(lastUsed))) {
        return true;
      }
    }
    return false;
  };

  const [spinStatus, setSpinStatus] = useState(() => ({ 
    dailySpinCount: 0, 
    freeSpinUsed: checkFreeSpinUsedToday() ? 1 : 0, 
    maxPaidSpins: 10, 
    hasFreeSpin: !checkFreeSpinUsedToday() 
  }));
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [rotation, setRotation] = useState(0);
  const [localIsSpinning, setLocalIsSpinning] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [showDailyQuestModal, setShowDailyQuestModal] = useState(false);
  const [spinCooldown, setSpinCooldown] = useState(() => {
    const savedEnd = localStorage.getItem('khamin_spin_cooldown_end');
    if (savedEnd) {
      const end = parseInt(savedEnd);
      const now = Date.now();
      if (end > now) {
        return Math.ceil((end - now) / 1000);
      }
    }
    return 0;
  });

  useEffect(() => {
    if (spinCooldown > 0) {
      const timer = setTimeout(() => {
        setSpinCooldown(prev => {
          const next = prev - 1;
          if (next <= 0) {
            localStorage.removeItem('khamin_spin_cooldown_end');
          }
          return next;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [spinCooldown]);

  const [hasUsedFreeQuickGuess, setHasUsedFreeQuickGuess] = useState(() => {
    return localStorage.getItem('khamin_has_used_free_quick_guess') === 'true';
  });

  const updateHasUsedFreeQuickGuess = (value: boolean) => {
    setHasUsedFreeQuickGuess(value);
    localStorage.setItem('khamin_has_used_free_quick_guess', value.toString());
  };

  const [hasUsedFreeSpin, setHasUsedFreeSpin] = useState(() => checkFreeSpinUsedToday());

  const updateHasUsedFreeSpin = (value: boolean) => {
    setHasUsedFreeSpin(value);
    localStorage.setItem('khamin_has_used_free_spin', value.toString());
    localStorage.setItem('khamin_last_free_spin_date', Date.now().toString());
  };
  const [dailyQuestStreak, setDailyQuestStreak] = useState(() => {
    const saved = localStorage.getItem('khamin_daily_streak');
    return saved ? parseInt(saved) : 1;
  });
  const [lastDailyClaim, setLastDailyClaim] = useState(() => {
    const saved = localStorage.getItem('khamin_last_daily_claim');
    return saved ? parseInt(saved) : 0;
  });
  const [hasSeenDailyToday, setHasSeenDailyToday] = useState(() => {
    const saved = localStorage.getItem('khamin_has_seen_daily_today');
    if (saved) {
      try {
        const { date } = JSON.parse(saved);
        return isSameDay(Date.now(), date);
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const updateHasSeenDailyToday = () => {
    setHasSeenDailyToday(true);
    localStorage.setItem('khamin_has_seen_daily_today', JSON.stringify({ date: Date.now() }));
  };

  useEffect(() => {
    if (showLuckyWheelModal) {
      setRotation(0);
      setShowReward(false);
      setLocalIsSpinning(false);
      setIsSpinning(false);
    }
  }, [showLuckyWheelModal]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (spinResult && localIsSpinning) {
      const segments = SPIN_REWARDS_UI;
      const segmentAngle = 360 / segments.length;
      const rewardIndex = segments.findIndex(r => r.id === spinResult.reward.id);
      const targetIndex = rewardIndex >= 0 ? rewardIndex : 0;
      
      const extraSpins = 8;
      const targetAngle = 360 * extraSpins + (360 - (targetIndex * segmentAngle));
      
      setRotation(targetAngle);
      
      timer = setTimeout(() => {
        setLocalIsSpinning(false);
        setIsSpinning(false);
        setShowReward(true);
        playSound('win');
        
        // Start cooldown if it was an ad spin
        // If dailySpinCount > 1, it means we've done at least one spin.
        // Since freeSpinUsed is 1 after the first spin, any spin where dailySpinCount > 1 is an ad spin.
        if (spinResult.dailySpinCount > 1) {
          setSpinCooldown(30);
          localStorage.setItem('khamin_spin_cooldown_end', (Date.now() + 30000).toString());
        }
        
        // Update stats
        setXp(spinResult.newStats.xp);
        setTokens(spinResult.newStats.tokens);
        setOwnedHelpers(spinResult.newStats.ownedHelpers);
        setProPackageExpiry(spinResult.newStats.proPackageExpiry);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [spinResult, localIsSpinning]);

  const handleSpinClick = () => {
    if (isSpinning || localIsSpinning || spinCooldown > 0) return;
    
    const isAdSpin = hasUsedFreeSpin || !spinStatus.hasFreeSpin;
    
    if (isAdSpin) {
      if (spinStatus.dailySpinCount >= 11 && !isAdmin) {
        showAlert('لقد استنفدت جميع محاولاتك لليوم! عد غداً.', 'تنبيه');
        return;
      }
      
      // Ad logic
      const adFunc = (window as any).adBreak || (window as any).showAdBreak || (window as any).adConfig || (window as any).adsbygoogle?.push;
      if (typeof adFunc === 'function') {
        try {
          adFunc({
            type: 'reward',
            name: 'lucky_wheel_spin',
            beforeAd: () => Howler.mute(true),
            afterAd: () => Howler.mute(false),
            beforeReward: (showAdFn: any) => {
              showAdFn();
            },
            adViewed: () => {
              startSpin(true);
            },
            adDismissed: () => {
              Howler.mute(false);
              showAlert('يجب مشاهدة الإعلان للحصول على المحاولة!', 'تنبيه');
            },
            adBreakDone: (placementInfo: any) => {
              console.log("Ad break done:", placementInfo);
            }
          });
        } catch (e) {
          console.error("Ad error:", e);
          startSpin(true);
        }
      } else {
        // Fallback if no ad SDK
        startSpin(true);
      }
    } else {
      startSpin(false);
    }
  };

  const startSpin = (isAd: boolean) => {
    if (!isAd) {
      updateHasUsedFreeSpin(true);
    }
    setLocalIsSpinning(false);
    setRotation(0);
    setShowReward(false);
    
    setTimeout(() => {
      setLocalIsSpinning(true);
      setIsSpinning(true);
      playSound('luckyReels');
      socket?.emit('perform_spin', { serial: playerSerial, isAdSpin: isAd });
    }, 50);
  };
  const [ownedHelpers, setOwnedHelpers] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem('khamin_owned_helpers');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (joined && playerSerial) {
      const pendingGift = localStorage.getItem('khamin_pending_rain_gift');
      if (pendingGift) {
        try {
          const rewards = JSON.parse(pendingGift);
          if (rewards.xp > 0 || rewards.tokens > 0 || Object.keys(rewards.helpers || {}).length > 0) {
            socket?.emit('claim_rain_gift', { serial: playerSerial, rewards, isPro: hasProPackage });
          }
        } catch (e) {}
        localStorage.removeItem('khamin_pending_rain_gift');
      }
    }
  }, [joined, playerSerial, socket, hasProPackage]);

  const [dailyQuestRewardInfo, setDailyQuestRewardInfo] = useState<{ xp: number, helper?: string, tokens?: number } | null>(null);
  const [isChestOpening, setIsChestOpening] = useState(false);
  const [isCycling, setIsCycling] = useState(false);
  const [hasClickedChest, setHasClickedChest] = useState(false);
  const [cyclingReward, setCyclingReward] = useState<any>(null);
  const [chestReward, setChestReward] = useState<any>(null);
  const [pendingDailyReward, setPendingDailyReward] = useState<any>(null);
  const [appOpenDate] = useState(Date.now());
  const [tokensEarnedThisWeek, setTokensEarnedThisWeek] = useState(0);
  const [lastTokenEarnedDay, setLastTokenEarnedDay] = useState(0);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (pendingWelcomeModal && !showInstallModal) {
      setShowWelcomeModal(true);
      setPendingWelcomeModal(false);
    }
  }, [pendingWelcomeModal, showInstallModal]);

  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

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
    if (loadingProgress === 100 && deferredPrompt && !localStorage.getItem('khamin_install_dismissed')) {
      setShowInstallModal(true);
    }
  }, [loadingProgress, deferredPrompt]);


  useEffect(() => {
    if (!joined && !hasSeenDailyToday && playerSerial && isCitySearchLoaded) {
      const hasUnclaimedDaily = lastDailyClaim === 0 || !isSameDay(Date.now(), lastDailyClaim);
      if (hasUnclaimedDaily) {
        setShowDailyQuestModal(true);
        updateHasSeenDailyToday();
      } else if (!hasSeenLuckyWheelThisSession && !hasUsedFreeSpin && (luckyWheelEnabled || isAdmin)) {
        // If daily quest already seen/claimed, show lucky wheel if free spin is available
        setShowLuckyWheelModal(true);
        updateHasSeenLuckyWheelThisSession(true);
        updateHasSeenDailyToday();
      } else if (!hasSeenCitySearchToday && !citySearchState?.active) {
        toggleCitySearch(true);
        updateHasSeenCitySearchToday();
        updateHasSeenDailyToday();
      } else {
        updateHasSeenDailyToday();
      }
    }
  }, [joined, lastDailyClaim, hasSeenDailyToday, playerSerial, hasSeenLuckyWheelThisSession, hasUsedFreeSpin, luckyWheelEnabled, isAdmin, hasSeenCitySearchToday, isCitySearchLoaded, citySearchState]);

  useEffect(() => {
    if (socket && isConnected && playerSerial) {
      socket.emit('get_spin_status', { serial: playerSerial });
      socket.on('spin_status', (status) => {
        setSpinStatus(status);
        if (status.freeSpinUsed === 1) {
          updateHasUsedFreeSpin(true);
        } else {
          // Only reset if it's a new day (handled by checkFreeSpinUsedToday logic usually, but server is source of truth)
          setHasUsedFreeSpin(false);
        }
      });
      socket.on('spin_result', (data) => {
        setSpinResult(null); // Reset to ensure next spin triggers effect
        setTimeout(() => setSpinResult(data), 0);
        if (data.freeSpinUsed === 1) {
          updateHasUsedFreeSpin(true);
        }
        setSpinStatus({
          dailySpinCount: data.dailySpinCount,
          freeSpinUsed: data.freeSpinUsed,
          maxPaidSpins: 10,
          hasFreeSpin: data.freeSpinUsed === 0
        });
      });
      socket.on('spin_error', (msg) => {
        setIsSpinning(false);
        showAlert(msg, 'تنبيه');
      });

      return () => {
        socket.off('spin_status');
        socket.off('spin_result');
        socket.off('spin_error');
      };
    }
  }, [socket, isConnected, playerSerial]);

  const handleClaimDailyQuest = () => {
    setIsChestOpening(true);
    setPendingDailyReward(null); // Reset pending reward
    setHasClickedChest(false); // Reset clicked state
    playSound('clickOpen');
    if (socket) {
      socket.emit('claim_daily_quest', { serial: playerSerial, isPro: hasProPackage });
    }
  };

  const startCycling = () => {
    if (isCycling) return;
    if (!pendingDailyReward) {
      setHasClickedChest(true);
      return;
    }
    setIsCycling(true);
    playSound('chestOpen');
    
    // Cycle animation
    let cycleCount = 0;
    const interval = setInterval(() => {
      const randomItem = HELPER_ITEMS[Math.floor(Math.random() * HELPER_ITEMS.length)];
      setCyclingReward(randomItem);
      playSound('cyclingReward');
      cycleCount++;
      if (cycleCount >= 40) {
        clearInterval(interval);
        setCyclingReward(pendingDailyReward.helperReward);
        setChestReward({ 
          xp: pendingDailyReward.xpReward, 
          helper: pendingDailyReward.helperReward, 
          tokens: pendingDailyReward.tokenReward 
        });
        stopSound('cyclingReward');
        playSound('bell');
        setIsCycling(false);
        
        // Apply rewards locally for immediate UI update
        setXp(pendingDailyReward.newXp);
        setTokens(pendingDailyReward.newTokens);
        setOwnedHelpers(pendingDailyReward.newOwnedHelpers);
        setDailyQuestStreak(pendingDailyReward.newStreak);
        setLastDailyClaim(pendingDailyReward.newLastClaim);
        if (pendingDailyReward.weeklyTokensClaimed !== undefined) {
          setTokensEarnedThisWeek(pendingDailyReward.weeklyTokensClaimed);
          localStorage.setItem('khamin_tokens_earned_this_week', pendingDailyReward.weeklyTokensClaimed.toString());
        }
        
        // Sync local storage
        localStorage.setItem('khamin_daily_streak', pendingDailyReward.newStreak.toString());
        localStorage.setItem('khamin_last_daily_claim', pendingDailyReward.newLastClaim.toString());
        localStorage.setItem('khamin_owned_helpers', JSON.stringify(pendingDailyReward.newOwnedHelpers));
        
        setPendingDailyReward(null);
        setHasClickedChest(false);
      }
    }, 50);
  };

  useEffect(() => {
    if (hasClickedChest && pendingDailyReward && !isCycling) {
      startCycling();
    }
  }, [hasClickedChest, pendingDailyReward, isCycling]);

  const toggleDailyQuests = () => {
    if (showDailyQuestModal) {
      playSound('clickClose');
      setShowDailyQuestModal(false);
      // After closing daily quest, check if we should show lucky wheel
      if (!hasSeenLuckyWheelThisSession && !hasUsedFreeSpin && (luckyWheelEnabled || isAdmin)) {
        setShowLuckyWheelModal(true);
        updateHasSeenLuckyWheelThisSession(true);
      } else if (!hasSeenCitySearchToday && !citySearchState?.active) {
        toggleCitySearch(true);
        updateHasSeenCitySearchToday();
      }
    } else {
      playSound('clickOpen');
      closeAllModals();
      setShowDailyQuestModal(true);
      setIsChestOpening(false);
      setIsCycling(false);
      setHasClickedChest(false);
      setChestReward(null);
      setCyclingReward(null);
    }
  };

  const toggleLuckyWheel = () => {
    if (showLuckyWheelModal) {
      playSound('clickClose');
      setShowLuckyWheelModal(false);
      if (!hasSeenCitySearchToday && !citySearchState?.active) {
        toggleCitySearch(true);
        updateHasSeenCitySearchToday();
      }
    } else {
      playSound('clickOpen');
      closeAllModals();
      setShowLuckyWheelModal(true);
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
    setShowLuckyWheelModal(false);
  };

  const toggleSettings = () => {
    if (showSettingsModal) {
      playSound('clickClose');
      handleProfileUpdate();
    } else {
      playSound('clickOpen');
      closeAllModals();
      setShowSettingsModal(true);
    }
  };

  const handleBuyItem = (itemId: string) => {
    playSound('clickOpen');
    setSelectedWalletItem(itemId);
    setShowCheckoutPage(true);
  };

  const handleProcessPayment = async (paymentMethod: 'wallet' | 'card', details: any, quantity: number = 1) => {
    if (!selectedWalletItem) return;
    
    setIsInitiatingPayment(true);
    
    try {
      const response = await fetch('/api/paymob/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: selectedWalletItem,
          playerSerial,
          paymentMethod,
          customerInfo: details,
          quantity
        }),
      });
      const data = await response.json();
      
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setIsInitiatingPayment(false);
        showAlert(data.error || 'حدث خطأ أثناء بدء عملية الدفع', 'خطأ');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setIsInitiatingPayment(false);
      showAlert('حدث خطأ أثناء الاتصال بخادم الدفع', 'خطأ');
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
    const fetchCats = () => {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => setCategories(data))
        .catch(err => console.error('Failed to fetch categories:', err));
    };
    
    fetchCats();

    if (socket) {
      socket.on('categories_updated', fetchCats);
      return () => {
        socket.off('categories_updated', fetchCats);
      };
    }
  }, [socket]);

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

  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Global Fullscreen and Audio trigger on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume().catch(() => {});
      }
      setAudioUnlocked(true);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
    };
    
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchend', handleFirstInteraction);
    
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
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
  const [reportTarget, setReportTarget] = useState<{ serial: string, name: string } | null>(null);
  const [isOpponentBlocked, setIsOpponentBlocked] = useState(false);
  const [useToken, setUseToken] = useState(false);
  const [isMutedByOpponent, setIsMutedByOpponent] = useState(false);
  const isOpponentBlockedRef = useRef(isOpponentBlocked);
  useEffect(() => { isOpponentBlockedRef.current = isOpponentBlocked; }, [isOpponentBlocked]);
  
  const audioRef = useRef<{ [key: string]: Howl }>({});
  const lobbyMusicRef = useRef<Howl | null>(null);
  const gameMusicRef = useRef<Howl | null>(null);

  useEffect(() => {
    // Initialize sounds
    Object.entries(SOUNDS).forEach(([key, url]) => {
      if (key === 'lobbyBackground') {
        lobbyMusicRef.current = new Howl({ src: [url], loop: true, preload: true, volume: musicVolume, html5: true });
      } else if (key === 'gameBackground') {
        gameMusicRef.current = new Howl({ src: [url], loop: true, preload: true, volume: musicVolume, html5: true });
      } else {
        audioRef.current[key] = new Howl({ src: [url], preload: true });
      }
    });

    return () => {
      if (lobbyMusicRef.current) lobbyMusicRef.current.unload();
      if (gameMusicRef.current) gameMusicRef.current.unload();
      Object.values(audioRef.current).forEach((howl: any) => howl.unload());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const isGameActive = room?.gameState === 'guessing' || room?.gameState === 'discussion';
    
    const activeMusic = isGameActive ? gameMusicRef.current : lobbyMusicRef.current;
    const inactiveMusic = isGameActive ? lobbyMusicRef.current : gameMusicRef.current;

    if (inactiveMusic && inactiveMusic.playing()) {
      inactiveMusic.pause();
    }

    if (activeMusic) {
      // Set volume
      const vol = isMusicMuted ? 0 : musicVolume;
      activeMusic.volume(vol);

      if (!isMusicMuted && musicVolume > 0 && audioUnlocked && !isDocumentHidden) {
        if (!activeMusic.playing()) {
          if (activeMusic.state() === 'loaded') {
            activeMusic.play();
          } else {
            activeMusic.once('load', () => {
              if (!isMusicMuted && musicVolume > 0 && audioUnlocked && !isDocumentHidden) {
                activeMusic.play();
              }
            });
          }
        }
      } else {
        if (activeMusic.playing()) {
          activeMusic.pause();
        }
      }
    }
  }, [musicVolume, isMusicMuted, room?.gameState, audioUnlocked, isDocumentHidden]);

  const playSound = useCallback((key: keyof typeof SOUNDS, volumeOverride?: number) => {
    if (isSfxMuted) return;
    const sound = audioRef.current[key];
    if (sound) {
      sound.volume(volumeOverride !== undefined ? volumeOverride * sfxVolume : sfxVolume);
      sound.stop(); // Stop any currently playing instance of this sound
      sound.play();
    }
  }, [sfxVolume, isSfxMuted]);

  const stopSound = useCallback((key: keyof typeof SOUNDS) => {
    const sound = audioRef.current[key];
    if (sound) {
      sound.stop();
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
    let timeoutId: NodeJS.Timeout;
    if (room && (room.gameState === 'guessing' || room.gameState === 'discussion')) {
      const hasSeenRules = localStorage.getItem('khamin_rules_seen');
      if (!hasSeenRules) {
        timeoutId = setTimeout(() => {
          setShowRulesModal(true);
        }, 3000); // تأخير الظهور لمدة 3 ثواني
      }
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [room?.gameState]);

  const handleAcceptRules = () => {
    localStorage.setItem('khamin_rules_seen', 'true');
    setShowRulesModal(false);
    playSound('clickClose');
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
        if (userData.adminToken) {
          localStorage.setItem('khamin_admin_token', userData.adminToken);
        }
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

  const fetchAdminImages = useCallback(async () => {
    try {
      console.log("Fetching admin images...");
      const res = await fetch('/api/admin/images');
      const data = await res.json();
      console.log("Admin images fetched:", data);
      if (Array.isArray(data)) setAdminImages(data);
    } catch (error) {
      console.error("Fetch images failed", error);
    }
  }, []);

  useEffect(() => {
    fetchAdminImages();
  }, [fetchAdminImages]);

  useEffect(() => {
    console.log("DEBUG: adminImages updated:", adminImages.map(img => ({name: img.name, category: img.category})));
  }, [adminImages]);

  const fetchCollection = useCallback(async (serial: string) => {
    try {
      const res = await fetch(`/api/collection/${serial}`);
      const data = await res.json();
      if (data.collection) setPlayerCollection(data.collection);
      if (data.claimed) setClaimedCollectionRewards(data.claimed);
    } catch (error) {
      console.error("Fetch collection failed", error);
    }
  }, []);

  useEffect(() => {
    if (playerSerial) {
      fetchCollection(playerSerial);
    }
  }, [playerSerial, fetchCollection]);

  useEffect(() => {
    if (showAdminDashboard && socket) {
      socket.emit('admin_get_players', (players: any) => {
        if (Array.isArray(players)) setAdminPlayers(players);
      });
      socket.emit('admin_get_reports', (reports: any) => {
        if (Array.isArray(reports)) setAdminReports(reports);
      });
      socket.emit('admin_get_pending_avatars', (pending: any) => {
        if (Array.isArray(pending)) setPendingAvatars(pending);
      });
      socket.emit('admin_get_contacts', (contacts: any) => {
        if (Array.isArray(contacts)) setAdminContacts(contacts);
      });
      socket.emit('admin_get_settings', (settings: any) => {
        if (settings) {
          setPaymobSettings({
            paymob_api_key: settings.paymob_api_key || 'ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRFek9EazBNU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5ySGdYVGNEVmFpSkQ2bTktQ1lETzJzSEV1N3JqVjR1RkdpR2F2dHlZNEM4T0JicXFSYWF3NEFqVWdES1otQ25NOHd3aGtDZlVfVFk3UkRjNV9jZ3BUZw==',
            paymob_wallet_integration_id: settings.paymob_wallet_integration_id || '5579190',
            paymob_card_integration_id: settings.paymob_card_integration_id || '5572379',
            paymob_iframe_id: settings.paymob_iframe_id || '1013400',
            paymob_hmac: settings.paymob_hmac || 'A2DBAF7F92579F5B6CE8687D60BE29BA'
          });
          if (settings.lucky_wheel_enabled !== undefined) {
            setLuckyWheelEnabled(settings.lucky_wheel_enabled === 'true');
          }
        }
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

    newSocket.on('system_announcement', (message: string) => {
      setAnnouncementMessage(message);
    });

    newSocket.on('global_reward_available', (reward: any) => {
      setActiveGlobalReward(reward);
    });

    newSocket.on('app_settings', (settings: any) => {
      if (settings && settings.lucky_wheel_enabled !== undefined) {
        setLuckyWheelEnabled(settings.lucky_wheel_enabled === 'true' || settings.lucky_wheel_enabled === true);
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully! ID:', newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      
      refreshConfig();
      
      newSocket.emit('get_shop_items', (items: any[]) => {
        if (items) setShopItems(items);
      });
      
      newSocket.on('show_alert', (data: { message: string, title?: string }) => {
        showAlert(data.message, data.title);
      });
      
      const serial = localStorage.getItem('khamin_player_serial');
      if (serial) {
        newSocket.emit('set_player_serial_for_socket', serial);
        const isAdmin = localStorage.getItem('khamin_is_admin') === 'true';
        const adminEmail = localStorage.getItem('khamin_admin_email') || 'adhamsabry.co@gmail.com';
        const adminToken = localStorage.getItem('khamin_admin_token');
        if (isAdmin) {
          newSocket.emit('admin_set_admin_status', { serial, isAdmin: true, email: adminEmail, adminToken });
        }
        // Fetch actual server data
        newSocket.emit('get_player_data', { serial, fingerprint }, (data: any) => {
          if (data && data.error) {
            // We DO NOT remove the serial from localStorage here anymore.
            // This prevents permanent account loss if the server DB is temporarily empty/reset.
            setError('تعذر العثور على حسابك في الخادم. قد يكون هناك تحديث أو صيانة. إذا قمت بإنشاء حساب جديد سيتم مسح حسابك القديم.');
            setShowWelcomeModal(true);
          } else if (data) {
            setXp(data.xp);
            prevLevelRef.current = getLevel(data.xp);
            setWins(data.wins || 0);
            setReports(data.reports || 0);
            setTokens(data.tokens || 0);
            setReportedSerials(data.reportedSerials || []);
            if (data.recentOpponents) {
              setRecentOpponents(data.recentOpponents);
            }
            localStorage.setItem('khamin_tokens', (data.tokens || 0).toString());
            
            if (data.ownedHelpers) {
              setOwnedHelpers(data.ownedHelpers);
              localStorage.setItem('khamin_owned_helpers', JSON.stringify(data.ownedHelpers));
            }

            newSocket.emit("get_city_search", { serial });

            if (data.dailyQuestStreak) {
              setDailyQuestStreak(data.dailyQuestStreak);
              localStorage.setItem('khamin_daily_streak', data.dailyQuestStreak.toString());
            }

            if (data.lastDailyClaim) {
              setLastDailyClaim(data.lastDailyClaim);
              localStorage.setItem('khamin_last_daily_claim', data.lastDailyClaim.toString());
            }

            if (data.weeklyTokensClaimed !== undefined) {
              setTokensEarnedThisWeek(data.weeklyTokensClaimed);
              localStorage.setItem('khamin_tokens_earned_this_week', data.weeklyTokensClaimed.toString());
            }

            if (data.isPermanentBan) {
              setIsPermanentBan(true);
              newSocket.disconnect();
            } else if (data.banUntil && data.banUntil > Date.now()) {
              setBanUntil(data.banUntil);
              newSocket.disconnect();
            }

            if (data.proPackageExpiry) {
              setProPackageExpiry(data.proPackageExpiry);
              localStorage.setItem('khamin_pro_package_expiry', data.proPackageExpiry.toString());
            }
            if (data.unlockedHelpersExpiry) {
              setUnlockedHelpersExpiry(data.unlockedHelpersExpiry);
              localStorage.setItem('khamin_unlocked_helpers_expiry', data.unlockedHelpersExpiry.toString());
            }

            // Sync Avatar State from Server
            if (data.avatar) {
              setAvatar(data.avatar);
              localStorage.setItem('khamin_player_avatar', data.avatar);
              if (data.avatar.startsWith('data:image/')) {
                setCustomAvatar(data.avatar);
                localStorage.setItem('khamin_custom_avatar', data.avatar);
              } else if (data.avatarStatus !== 'pending') {
                // If the current avatar is NOT a custom one, and we don't have a pending one,
                // we should probably clear the customAvatar state unless it's actually pending
                if (!data.pendingAvatar) {
                  setCustomAvatar('');
                  localStorage.removeItem('khamin_custom_avatar');
                }
              }
            }
            if (data.avatarStatus) {
              setAvatarStatus(data.avatarStatus);
              if (data.avatarStatus === 'rejected') {
                setCustomAvatar('');
                localStorage.removeItem('khamin_custom_avatar');
              }
            }
            if (data.pendingAvatar) {
              setCustomAvatar(data.pendingAvatar);
              // We don't save pending to localStorage to avoid it persisting if rejected
            }
            if (data.selectedFrame !== undefined) {
              setSelectedFrame(data.selectedFrame);
              localStorage.setItem('khamin_player_frame', data.selectedFrame);
            }

            localStorage.setItem('khamin_xp', data.xp.toString());
            localStorage.setItem('khamin_wins', (data.wins || 0).toString());
          } else {
            // We DO NOT call clearPlayerData() here anymore to prevent permanent account loss
            // if the server database is temporarily empty or unavailable.
            setError('لم يتم العثور على حسابك في قاعدة البيانات. قد يكون هناك تحديث أو صيانة.');
            setPendingWelcomeModal(true);
          }
        });
      } else {
        setPendingWelcomeModal(true);
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

    newSocket.on('online_count', (data) => {
      if (typeof data === 'number') {
        setOnlineCount(data);
      } else if (data && typeof data === 'object') {
        setOnlineCount(data.online);
        setTotalPlayersCount(data.total);
      }
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
      if (data.proPackageExpiry !== undefined) {
        setProPackageExpiry(data.proPackageExpiry);
        localStorage.setItem('khamin_pro_package_expiry', data.proPackageExpiry.toString());
      }
      if (data.unlockedHelpersExpiry !== undefined) {
        setUnlockedHelpersExpiry(data.unlockedHelpersExpiry);
        localStorage.setItem('khamin_unlocked_helpers_expiry', data.unlockedHelpersExpiry.toString());
      }
      if (data.name !== undefined) {
        setPlayerName(data.name);
        localStorage.setItem('khamin_player_name', data.name);
      }
      if (data.ownedHelpers !== undefined) {
        setOwnedHelpers(data.ownedHelpers);
        localStorage.setItem('khamin_owned_helpers', JSON.stringify(data.ownedHelpers));
      }
      if (data.lastRenameAt !== undefined) {
        setLastRenameAt(data.lastRenameAt);
        localStorage.setItem('khamin_last_rename_at', data.lastRenameAt.toString());
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
      if (data.recentOpponents !== undefined) {
        setRecentOpponents(data.recentOpponents);
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

    newSocket.on('ad_cooldown_update', (timeLeft: number) => {
      setAdCooldownTimer(timeLeft);
    });

    newSocket.on('room_update', (updatedRoom: Room) => {
      if (spectatingRoomIdRef.current === updatedRoom.id) {
        setSpectatorRoomData(updatedRoom);
        return;
      }

      if (updatedRoom.gameState !== roomRef.current?.gameState) {
        setChatHistory([]);
        setChatInput('');
      }
      
      if (updatedRoom.adCooldownTimer !== undefined) {
        setAdCooldownTimer(updatedRoom.adCooldownTimer);
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

    newSocket.on('policies_update', (policies: any) => {
      setGamePolicies(policies);
    });

    newSocket.on('avatar_review_result', ({ success, message, status, avatar: newAvatar }) => {
      if (success) {
        setAvatarStatus(status);
        if (status === 'approved') {
          // If approved, we can now use the custom avatar
          if (newAvatar) {
            setAvatar(newAvatar);
            setCustomAvatar(newAvatar);
            localStorage.setItem('khamin_player_avatar', newAvatar);
            localStorage.setItem('khamin_custom_avatar', newAvatar);
          }
        } else if (status === 'rejected') {
          // If rejected, revert to what the server says is our current avatar
          if (newAvatar) {
            setAvatar(newAvatar);
            localStorage.setItem('khamin_player_avatar', newAvatar);
            if (newAvatar.startsWith('data:image/')) {
              setCustomAvatar(newAvatar);
              localStorage.setItem('khamin_custom_avatar', newAvatar);
            } else {
              setCustomAvatar(null);
              localStorage.removeItem('khamin_custom_avatar');
            }
          }
        }
        showAlert(message, 'مراجعة الصورة');
      } else {
        showAlert(message, 'خطأ');
      }
    });

    newSocket.on('timer_update', (timer: number) => {
      setRoom(prev => prev ? { ...prev, timer } : null);
    });

    newSocket.on('chat_bubble', async ({ senderId, text }) => {
      if (senderId !== newSocket.id && isOpponentBlockedRef.current) return;
      
      // Re-enable quick response buttons if message is from opponent
      if (senderId !== newSocket.id && senderId !== 'system') {
        setIsOpponentTyping(false);
        setIsQuickResponseDisabled(false);
        setClickedResponses([]);
        if (quickResponseTimeoutRef.current) {
          clearTimeout(quickResponseTimeoutRef.current);
          quickResponseTimeoutRef.current = null;
        }

        // Quick Chat Reels Logic
        if (text === 'آه' || text === 'لأ') {
          if (reelTimeoutRef.current) clearTimeout(reelTimeoutRef.current);
          setIsReelsSpinning(true);
          setSpinningReels([true, true, true, true]);
          setTimeout(() => setSpinningReels([false, true, true, true]), 400);
          setTimeout(() => setSpinningReels([false, false, true, true]), 500);
          setTimeout(() => setSpinningReels([false, false, false, true]), 600);
          reelTimeoutRef.current = setTimeout(() => {
            setSpinningReels([false, false, false, false]);
            setIsReelsSpinning(false);
            reelTimeoutRef.current = null;
            if (text === 'آه' && askedQuickChatNodeRef.current) {
              const nodeText = askedQuickChatNodeRef.current.text;
              setConfirmedAttributes(prev => prev.includes(nodeText) ? prev : [...prev, nodeText]);
              
              const children = askedQuickChatNodeRef.current.children;
              if (children && children.length > 0) {
                // If 'Yes' and has children, we enter its branch
                setCurrentQuickChatNodes(children);
                setQuickChatOffset(0);
              } else {
                // If 'Yes' but no children (flat structure), just remove this question
                const nodeToFilter = askedQuickChatNodeRef.current;
                setCurrentQuickChatNodes(prev => {
                  const filtered = prev.filter(n => n.id !== nodeToFilter.id && n.text !== nodeToFilter.text);
                  // If only one option remains, it's inferred as 'Yes'
                  if (filtered.length === 1) {
                    const inferredNode = filtered[0];
                    setConfirmedAttributes(prevAttrs => prevAttrs.includes(inferredNode.text) ? prevAttrs : [...prevAttrs, inferredNode.text]);
                    return inferredNode.children && inferredNode.children.length > 0 ? inferredNode.children : [];
                  }
                  return filtered;
                });
              }
            } else if (text === 'لأ' && askedQuickChatNodeRef.current) {
              // Answer is 'No', remove this branch/question from current options
              const nodeToFilter = askedQuickChatNodeRef.current;
              const currentCategory = roomRef.current?.category || '';
              const categoryObj = categories.find(c => c.id === currentCategory);
              const categoryName = categoryObj ? categoryObj.name : currentCategory;
              const normalizedCategory = normalizeEgyptian(categoryName + currentCategory);
              const isPeople = normalizedCategory.includes('اشخاص');
              const isAnimals = normalizedCategory.includes('حيوانات');
              const isFood = normalizedCategory.includes('اكلات');
              
              const nodeText = normalizeEgyptian(nodeToFilter.text);
              const isGenderNode = isPeople && (nodeText.includes('رجل') || nodeText.includes('ست'));
              const isAnimalTypeNode = isAnimals && (nodeText.includes('بري') || nodeText.includes('بحري'));
              const isFoodTypeNode = isFood && (nodeText.includes('حلو') || nodeText.includes('حادق'));

              if (isGenderNode || isAnimalTypeNode || isFoodTypeNode) {
                setCurrentQuickChatNodes(prev => {
                  let otherText = '';
                  if (isGenderNode) {
                    otherText = nodeText.includes('رجل') ? 'ست' : 'رجل';
                  } else if (isAnimalTypeNode) {
                    otherText = nodeText.includes('بري') ? 'بحري' : 'بري';
                  } else if (isFoodTypeNode) {
                    otherText = nodeText.includes('حلو') ? 'حادق' : 'حلو';
                  }
                  
                  const otherNode = prev.find(n => normalizeEgyptian(n.text).includes(otherText));
                  
                  if (otherNode) {
                    // Automatic inference
                    setConfirmedAttributes(prevAttrs => prevAttrs.includes(otherNode.text) ? prevAttrs : [...prevAttrs, otherNode.text]);
                    return otherNode.children && otherNode.children.length > 0 ? otherNode.children : [];
                  }
                  
                  // Fallback to default filtering
                  const filtered = prev.filter(n => n.id !== nodeToFilter.id && n.text !== nodeToFilter.text);
                  if (filtered.length === 1) {
                    const inferredNode = filtered[0];
                    setConfirmedAttributes(prevAttrs => prevAttrs.includes(inferredNode.text) ? prevAttrs : [...prevAttrs, inferredNode.text]);
                    return inferredNode.children && inferredNode.children.length > 0 ? inferredNode.children : [];
                  }
                  return filtered;
                });
              } else {
                setCurrentQuickChatNodes(prev => {
                  const filtered = prev.filter(n => n.id !== nodeToFilter.id && n.text !== nodeToFilter.text);
                  
                  // If only one option remains, it's inferred as 'Yes'
                  if (filtered.length === 1) {
                    const inferredNode = filtered[0];
                    setConfirmedAttributes(prevAttrs => prevAttrs.includes(inferredNode.text) ? prevAttrs : [...prevAttrs, inferredNode.text]);
                    
                    // Auto-advance to its children (even if empty, to clear siblings)
                    return inferredNode.children && inferredNode.children.length > 0 ? inferredNode.children : [];
                  }
                  return filtered;
                });
              }
            }
            askedQuickChatNodeRef.current = null;
          }, 700); // Spin duration
        }
      }
      
      // Update spectator data if spectating
      if (spectatingRoomIdRef.current) {
        setSpectatorRoomData(prev => {
          if (!prev) return null;
          const sender = prev.players.find((p: any) => p.id === senderId);
          const newMsg = {
            senderId,
            senderName: sender?.name || (senderId === 'system' ? 'النظام' : 'منافس'),
            text,
            timestamp: Date.now()
          };
          return {
            ...prev,
            chatHistory: [...(prev.chatHistory || []), newMsg].slice(-50)
          };
        });
      }

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
          playerName: sender?.name || (senderId === 'system' ? 'النظام' : (senderId === newSocket.id ? playerNameRef.current : 'منافس')),
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
      
      // Mark free quick guess as used after the first match finishes
      if (!hasUsedFreeQuickGuess) {
        updateHasUsedFreeQuickGuess(true);
      }

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
          const newXp = prev + myUpdate.xp;
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
      setOpponentAccepted(data.opponentAccepted || false);
      setMatchResponseTimeLeft(10);
    });

    newSocket.on('opponent_accepted', () => {
      setOpponentAccepted(true);
    });

    newSocket.on('match_rejected', ({ reason }: { reason?: string } = {}) => {
      setProposedMatch(prev => {
        if (prev && isSearchingRef.current) {
          let message = 'تم إلغاء التحدي';
          if (reason === 'rejected') message = 'المنافس رفض التحدي ❌';
          if (reason === 'timeout') message = 'انتهى وقت قبول التحدي ⏰';
          if (reason === 'blocked') message = 'المنافس قام بحظرك 🚫';
          if (reason === 'opponent_left') message = 'المنافس غادر البحث 🏃';
          if (reason === 'opponent_disconnected') message = 'انقطع اتصال المنافس 🔌';
          
          if (reason !== 'you_rejected') {
            setError(message);
            setTimeout(() => setError(''), 3000);
          }
        }
        return null;
      });
      setHasResponded(false);
      setOpponentAccepted(false);
      setMatchResponseTimeLeft(null);
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
      setPendingWelcomeModal(true);
      setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
    });

    newSocket.on('account_deleted_by_admin', () => {
      clearPlayerData();
      window.location.reload();
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

    newSocket.on('update_reported_serials', (serials: string[]) => {
      setReportedSerials(serials);
    });

    newSocket.on("city_search_update", (state) => {
      setCitySearchState(state);
      setIsCitySearchLoaded(true);
    });

    newSocket.on("rewards_claimed", (rewards) => {
      playSound('win');
      showAlert("تم استلام المكافآت بنجاح! 🥳", "نجاح");
      setShowCitySearch(false);
      setCitySearchState(null);
      
      // Update state immediately for instant feedback
      if (rewards.xp) setXp(prev => prev + rewards.xp);
      if (rewards.tokens) setTokens(prev => prev + rewards.tokens);
      
      if (rewards.pro_package_days) {
        const currentExpiry = proPackageExpiry || Date.now();
        const base = currentExpiry < Date.now() ? Date.now() : currentExpiry;
        const newExpiry = base + (rewards.pro_package_days * 24 * 60 * 60 * 1000);
        setProPackageExpiry(newExpiry);
        localStorage.setItem('khamin_pro_package_expiry', newExpiry.toString());
      }
      
      setOwnedHelpers(prev => {
        const next = { ...prev };
        if (rewards.time_freeze) next.time_freeze = (next.time_freeze || 0) + rewards.time_freeze;
        if (rewards.word_count) next.word_count = (next.word_count || 0) + rewards.word_count;
        if (rewards.word_length) next.word_length = (next.word_length || 0) + rewards.word_length;
        if (rewards.hint) next.hint = (next.hint || 0) + rewards.hint;
        if (rewards.spy_lens) next.spy_lens = (next.spy_lens || 0) + rewards.spy_lens;
        localStorage.setItem('khamin_owned_helpers', JSON.stringify(next));
        return next;
      });

      newSocket.emit("get_player_data", { serial: localStorage.getItem('khamin_player_serial'), fingerprint: localStorage.getItem('khamin_fingerprint') });
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

        // Fetch real config from server with cache busting
        const response = await fetch('/api/config?t=' + Date.now());
        if (!response.ok) throw new Error('Failed to fetch config');
        const config = await response.json();
        
        // Try to subscribe to push notifications
        // We do it after a short delay to not block loading
        setTimeout(() => subscribeToPush(), 60000);

        const serverVersion = config.version || '1.1.1';
        setGameVersion(serverVersion);
        setLoadingProgress(50);
        
        // Check maintenance mode with cache busting
        try {
          const maintenanceResponse = await fetch('/api/maintenance?t=' + Date.now());
          if (maintenanceResponse.ok) {
            const maintenanceData = await maintenanceResponse.json();
            const params = new URLSearchParams(window.location.search);
            const isAdminInUrl = params.get('isAdmin') === 'true';
            
            if (maintenanceData.maintenance) {
              if (!isAdmin && !isAdminInUrl) {
                setIsMaintenanceMode(true);
                setIsAppLoading(false);
                return;
              }
            }
          }
        } catch (err) {
          console.error('Failed to check maintenance mode:', err);
        }
        
        // Check if we need to force update (reload)
        const localVersion = localStorage.getItem('khamin_game_version');
        const lastRefreshDate = localStorage.getItem('khamin_last_refresh_date');
        const today = new Date().toDateString();
        const needsDailyRefresh = lastRefreshDate !== today;
        
        console.log('[DEBUG] Version Check:', { localVersion, serverVersion, needsDailyRefresh });

        // Force a hard refresh if:
        // 1. Version mismatch (always reload to get new version)
        // 2. OR: It's a new day (once a day refresh for freshness)
        if (needsDailyRefresh || (localVersion && localVersion !== serverVersion)) {
          console.log('[DEBUG] Needs refresh. Daily:', needsDailyRefresh, 'Version mismatch:', localVersion !== serverVersion);
          setLoadingStatus('جاري تهيئة الملفات وضمان أحدث نسخة...');
          setLoadingProgress(100);
          localStorage.setItem('khamin_game_version', serverVersion);
          localStorage.setItem('khamin_last_refresh_date', today);
          
          // Unregister all service workers to force fetching new files
          if ('serviceWorker' in navigator) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (let registration of registrations) {
                console.log('[DEBUG] Unregistering SW:', registration.scope);
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
              console.log('[DEBUG] Clearing caches:', keys);
              await Promise.all(keys.map(key => caches.delete(key)));
            } catch (err) {
              console.error('Error clearing caches:', err);
            }
          }

          // Add cache busting query parameter to force browser to fetch new files
          const url = new URL(window.location.href);
          url.searchParams.set('v', Date.now().toString());
          console.log('[DEBUG] Reloading to:', url.toString());
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
      setPendingWelcomeModal(true);
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
      setPendingWelcomeModal(true);
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
    socket?.emit('find_random_match', { playerId, playerName, avatar, age: playerAge, xp, streak, wins, serial: playerSerial, useToken: (getLevel(xp) >= 50 && useToken) });
    setIsOpponentBlocked(false);
  };

  const handleRegister = () => {
    playSound('clickOpen');
    setRegisterError('');
    if (!playerName.trim() || !playerAge) {
      setRegisterError('يرجى إدخال اسمك وعمرك أولاً');
      return;
    }
    
    if (!hasSelectedAvatar) {
      setRegisterError('يرجى اختيار افاتار البداية الخاص بك');
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setRegisterError('يجب الموافقة على الشروط والأحكام وسياسة الخصوصية لإنشاء حساب');
      return;
    }

    socket?.emit('register_player', { name: playerName, avatar, xp, gender, fingerprint }, (response: any) => {
      if (response.error) {
        setRegisterError(response.error);
        return;
      }
      
      const { serial, name } = response;
      if (serial) {
        setPlayerSerial(serial);
        setPlayerName(name); // Update with filtered name
        localStorage.setItem('khamin_player_serial', serial);
        localStorage.setItem('khamin_player_name', name);
        localStorage.setItem('khamin_player_age', playerAge.toString());
        localStorage.setItem('khamin_player_gender', gender);
        localStorage.setItem('khamin_player_avatar', avatar);
        localStorage.setItem('khamin_wins', '0');
        
        const isAdmin = localStorage.getItem('khamin_is_admin') === 'true';
        const adminEmail = localStorage.getItem('khamin_admin_email') || 'adhamsabry.co@gmail.com';
        if (isAdmin) {
          socket?.emit('admin_set_admin_status', { serial, isAdmin: true, email: adminEmail });
        }
        
        setShowWelcomeModal(false);
        playSound('clickClose');
        setError('');
      } else {
        setError('فشل التسجيل. يرجى المحاولة مرة أخرى.');
      }
    });
  };

  const handleLogin = () => {
    playSound('clickOpen');
    setLoginError('');
    if (!loginSerial.trim()) {
      setLoginError('يرجى إدخال رقم ID اللاعب');
      return;
    }
    
    socket?.emit('get_player_data', { serial: loginSerial.trim(), fingerprint }, (player: any) => {
      if (player && player.error) {
        setLoginError(player.error);
      } else if (player) {
        setPlayerSerial(player.serial);
        setPlayerName(player.name);
        setPlayerAge(player.age || 18);
        setGender(player.gender || 'boy');
        setAvatar(player.avatar);
        setXp(player.xp || 0);
        prevLevelRef.current = getLevel(player.xp || 0);
        setWins(player.wins || 0);
        setTokens(player.tokens || 0);
        setStreak(player.streak || 0);
        setOwnedHelpers(player.ownedHelpers || {});
        if (player.selectedFrame !== undefined) {
          setSelectedFrame(player.selectedFrame);
          localStorage.setItem('khamin_player_frame', player.selectedFrame);
        }
        
        localStorage.setItem('khamin_player_serial', player.serial);
        localStorage.setItem('khamin_player_name', player.name);
        localStorage.setItem('khamin_player_age', (player.age || 18).toString());
        localStorage.setItem('khamin_player_gender', player.gender || 'boy');
        localStorage.setItem('khamin_player_avatar', player.avatar);
        localStorage.setItem('khamin_wins', (player.wins || 0).toString());
        localStorage.setItem('khamin_xp', (player.xp || 0).toString());
        localStorage.setItem('khamin_tokens', (player.tokens || 0).toString());
        localStorage.setItem('khamin_streak', (player.streak || 0).toString());
        
        socket?.emit('set_player_serial_for_socket', player.serial);
        
        setShowWelcomeModal(false);
        playSound('clickClose');
        setError('');
      } else {
        setLoginError('رقم ID غير صحيح أو الحساب غير موجود');
      }
    });
  };

  const getEasyGuessOptions = () => {
    if (!room || !room.category || !me?.targetImage?.name) return null;
    const categoryObj = categories.find(c => c.id === room.category);
    const categoryName = categoryObj ? categoryObj.name : room.category;
    
    // @ts-ignore
    const categoryData = easyGuessData[categoryName];
    if (!categoryData) return null;
    
    const options = categoryData[me.targetImage.name];
    if (!options || !Array.isArray(options)) return null;
    
    return options;
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

  const adTriggeredRef = useRef(false);

  const handleWatchAd = () => {
    console.log('handleWatchAd called. Current adStatus:', adStatus);
    
    if (adTriggeredRef.current) return;
    if (isCooldown) {
      showAlert('يرجى الانتظار 30 ثانية قبل مشاهدة الإعلان التالي!', 'تنبيه');
      return;
    }
    
    const isPowerUp = !!activePowerUp;

    // Level check only for token rewards (from shop)
    if (!isPowerUp && getLevel(xp) < 50) {
      showAlert('يجب أن تصل للمستوى 50 لتتمكن من مشاهدة الإعلانات!', 'تنبيه');
      return;
    }
    
    // Daily limit check only for token rewards
    if (!isPowerUp && !adStatus.canWatch) {
      console.log('Cannot watch ad: limit reached or level too low');
      showAlert('انتهت المحاولات لهذا اليوم!', 'تنبيه');
      return;
    }

    // Close confirmation modal immediately to prevent "fixed window" issue
    setShowAdConfirmation(false);

    // Set triggered to true immediately to prevent double clicks
    adTriggeredRef.current = true;

    let localAdTriggered = false;

    const startAdProcess = () => {
      if (localAdTriggered) return;
      localAdTriggered = true;
      
      if (roomId && isPowerUp) {
        const powerUpName = {
          quick_guess: 'تخمين سريع',
          hint: 'نصيحة',
          word_length: 'كاشف الحروف',
          word_count: 'عدد الكلمات',
          time_freeze: 'تجميد الوقت',
          spy_lens: 'الجاسوس'
        }[activePowerUp || ''];
        
        if (roomId) {
          socket?.emit('ad_started', { roomId, powerUpName, helperId: activePowerUp });
        }
      } else if (roomId) {
        socket?.emit('ad_started', { roomId });
      }
      socket?.emit('start_ad_watch', { serial: playerSerial });
    };

    let adSafetyTimeout: NodeJS.Timeout;

    const onAdComplete = () => {
      clearTimeout(adSafetyTimeout);
      adTriggeredRef.current = false;
      
      // Trigger cooldown after ad finishes
      setIsCooldown(true);
      setCooldownTime(30);
      
      if (isPowerUp) {
        if (!readyPowerUps.includes(activePowerUp!)) {
          setReadyPowerUps(prev => [...prev, activePowerUp!]);
        }
        // Notify server that ad reward is ready for this helper
        if (roomId) {
          socket?.emit('ad_reward_ready', { roomId, helperId: activePowerUp });
        }
        setActivePowerUp(null);
      } else {
        socket?.emit('watch_ad_request', { serial: playerSerial });
      }
      
      if (roomId) {
        socket?.emit('ad_ended', { roomId });
      }
    };

    const startMockAd = () => {
      console.log('Falling back to mock ad');
      startAdProcess();
      onAdComplete();
    };

    const handleAdUnavailable = () => {
      console.warn('Google Ads unavailable, falling back to mock ad temporarily');
      startMockAd();
    };

    // Call real AdSense adBreak if available
    if (typeof window.adBreak === 'function') {
      console.log('Calling Google AdSense adBreak');
      
      // Set a safety timeout: if AdSense doesn't trigger beforeAd within 2 seconds, use fallback
      const adTimeout = setTimeout(() => {
        if (!localAdTriggered) {
          console.warn('AdSense adBreak timed out, using fallback');
          handleAdUnavailable();
        }
      }, 2000);

      try {
        window.adBreak({
          type: 'reward',
          name: isPowerUp ? `use_${activePowerUp}` : 'get_token',
          beforeAd: () => {
            console.log('AdSense: beforeAd');
            clearTimeout(adTimeout);
            startAdProcess();
            
            // Safety timeout: if ad doesn't finish or dismiss within 60 seconds, resume game
            adSafetyTimeout = setTimeout(() => {
              console.warn('AdSense ad stuck, resuming game');
              if (roomId) {
                socket?.emit('ad_ended', { roomId });
              }
              setActivePowerUp(null);
              adTriggeredRef.current = false;
              showAlert('حدث خطأ أثناء تحميل الإعلان.', 'خطأ');
            }, 60000);
          },
          afterAd: () => {
            console.log('AdSense: afterAd');
          },
          beforeReward: (showAdFn: any) => {
            console.log('AdSense: beforeReward');
            showAdFn();
          },
          adDismissed: () => {
            console.log('AdSense: adDismissed');
            clearTimeout(adSafetyTimeout);
            adTriggeredRef.current = false;
            showAlert('تم إغلاق الإعلان قبل الاكتمال. لن تحصل على مكافأة.', 'تنبيه');
            if (roomId) {
              socket?.emit('ad_ended', { roomId });
            }
            setActivePowerUp(null);
          },
          adViewed: () => {
            console.log('AdSense: adViewed');
            onAdComplete();
          },
          adBreakDone: (placementInfo: any) => {
            console.log('AdSense: adBreakDone', placementInfo);
            // If adBreakDone is called but ad was never triggered, it means no ad was available
            if (!localAdTriggered) {
              clearTimeout(adTimeout);
              console.warn('AdSense adBreakDone called without triggering ad, using fallback');
              handleAdUnavailable();
            } else {
              adTriggeredRef.current = false;
            }
          }
        });
      } catch (error) {
        console.error('Error calling window.adBreak:', error);
        clearTimeout(adTimeout);
        handleAdUnavailable();
      }
    } else {
      // Fallback if AdSense is blocked or not loaded
      handleAdUnavailable();
    }
  };

  const handleRewardAd = (categoryId: string, stage: number) => {
    if (adTriggeredRef.current) return;
    
    // Close confirmation modal immediately
    setPendingClaimReward(null);

    adTriggeredRef.current = false;
    let localAdTriggered = false;

    const startAdProcess = () => {
      if (localAdTriggered) return;
      localAdTriggered = true;
      if (roomId) {
        socket?.emit('ad_started', { roomId, powerUpName: 'استلام مكافأة' });
      }
      socket?.emit('start_ad_watch', { serial: playerSerial });
    };

    let adSafetyTimeout: NodeJS.Timeout;

    const onAdComplete = () => {
      clearTimeout(adSafetyTimeout);
      adTriggeredRef.current = false;
      
      if (roomId) {
        socket?.emit('ad_ended', { roomId });
      }

      socket?.emit('claim_collection_reward', { 
        serial: playerSerial, 
        categoryId, 
        stage 
      });
    };

    const startMockAd = () => {
      startAdProcess();
      onAdComplete();
    };

    const handleAdUnavailable = () => {
      startMockAd();
    };

    if (typeof window.adBreak === 'function') {
      const adTimeout = setTimeout(() => {
        if (!localAdTriggered) {
          handleAdUnavailable();
        }
      }, 2000);

      try {
        window.adBreak({
          type: 'reward',
          name: 'claim_collection_reward',
          beforeAd: () => {
            clearTimeout(adTimeout);
            startAdProcess();
            adSafetyTimeout = setTimeout(() => {
              if (roomId) {
                socket?.emit('ad_ended', { roomId });
              }
              adTriggeredRef.current = false;
              showAlert('حدث خطأ أثناء تحميل الإعلان.', 'خطأ');
            }, 60000);
          },
          afterAd: () => {},
          beforeReward: (showAdFn: any) => { showAdFn(); },
          adDismissed: () => {
            clearTimeout(adSafetyTimeout);
            adTriggeredRef.current = false;
            if (roomId) {
              socket?.emit('ad_ended', { roomId });
            }
            showAlert('تم إغلاق الإعلان قبل الاكتمال. لن تحصل على مكافأة.', 'تنبيه');
          },
          adViewed: () => {
            onAdComplete();
          },
          adBreakDone: (placementInfo: any) => {
            if (!localAdTriggered) {
              clearTimeout(adTimeout);
              handleAdUnavailable();
            } else {
              adTriggeredRef.current = false;
            }
          }
        });
      } catch (error) {
        clearTimeout(adTimeout);
        handleAdUnavailable();
      }
    } else {
      handleAdUnavailable();
    }
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
      ({ topPlayers, name, lastRenameAt: updatedLastRenameAt }: { topPlayers: any[], name: string, lastRenameAt?: number }) => {
        // 2. In the callback, update with the authoritative list from the server
        if (topPlayers) {
          setTopPlayers(sortPlayers(topPlayers));
        }
        if (name) {
          setPlayerName(name);
          localStorage.setItem('khamin_player_name', name);
        }
        if (updatedLastRenameAt !== undefined) {
          setLastRenameAt(updatedLastRenameAt);
          localStorage.setItem('khamin_last_rename_at', updatedLastRenameAt.toString());
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
    if (reportTarget && socket) {
      socket.emit('report_player_by_serial', { reporterSerial: playerSerial, reportedSerial: reportTarget.serial, reason }, (res: any) => {
        if (res && res.success) {
          setError('تم إرسال بلاغك بنجاح. شكراً لك!');
        } else {
          setError(res?.message || 'لقد قمت بالإبلاغ عن هذا اللاعب بالفعل.');
        }
        setTimeout(() => setError(''), 5000);
      });
      setShowReportModal(false);
      setReportTarget(null);
    } else if (opponent && socket && room) {
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

  const handleBlockPlayer = () => {
    const target = reportTarget || opponent;
    if (target && socket) {
      setCustomConfirm({
        show: true,
        title: 'حظر اللاعب',
        message: `هل أنت متأكد من حظر ${target.name}؟ لن تتمكن من اللعب معه مرة أخرى.`,
        onConfirm: () => {
          if (reportTarget) {
            socket.emit('block_player_by_serial', { blockerSerial: playerSerial, blockedSerial: reportTarget.serial }, (res: any) => {
              if (res && res.success) {
                showAlert(`تم حظر ${target.name} بنجاح`, 'حظر');
              } else {
                showAlert(res.error || 'حدث خطأ أثناء حظر اللاعب.', 'خطأ');
              }
            });
          } else if (opponent && room) {
            socket.emit('block_player', { roomId: room.id, blockedPlayerId: opponent.id }, (res: any) => {
              if (res && res.success) {
                showAlert(`تم حظر ${target.name} بنجاح`, 'حظر');
              } else {
                showAlert(res.error || 'حدث خطأ أثناء حظر اللاعب.', 'خطأ');
              }
            });
          }
          setShowReportModal(false);
          setReportTarget(null);
        }
      });
    }
  };

  useEffect(() => {
    if (!citySearchState?.active) {
      setDisplayedRewards(null);
      return;
    }
    const updateTimer = () => {
      const now = Date.now();
      const remaining = citySearchState.endTime - now;
      
      const totalDuration = citySearchState.endTime - citySearchState.startTime;
      const elapsed = now - citySearchState.startTime;
      const progress = Math.min(1, Math.max(0, elapsed / totalDuration));

      if (citySearchState.rewards) {
        setDisplayedRewards({
          xp: Math.floor((citySearchState.rewards.xp || 0) * progress),
          tokens: Math.floor((citySearchState.rewards.tokens || 0) * progress),
          time_freeze: Math.floor((citySearchState.rewards.time_freeze || 0) * progress),
          word_count: Math.floor((citySearchState.rewards.word_count || 0) * progress),
          word_length: Math.floor((citySearchState.rewards.word_length || 0) * progress),
          hint: Math.floor((citySearchState.rewards.hint || 0) * progress),
          spy_lens: Math.floor((citySearchState.rewards.spy_lens || 0) * progress),
          pro_package_days: Math.floor((citySearchState.rewards.pro_package_days || 0) * progress),
        });
      }

      if (remaining <= 0) {
        setCitySearchTimeLeft("00:00:00");
      } else {
        const h = Math.floor(remaining / 3600000).toString().padStart(2, '0');
        const m = Math.floor((remaining % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
        setCitySearchTimeLeft(`${h}:${m}:${s}`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [citySearchState]);

  const handleShowAd = (onComplete: () => void) => {
    if (adTriggeredRef.current) return;
    
    adTriggeredRef.current = false;
    let localAdTriggered = false;

    const startAdProcess = () => {
      if (localAdTriggered) return;
      localAdTriggered = true;
      socket?.emit('start_ad_watch', { serial: playerSerial });
    };

    let adSafetyTimeout: NodeJS.Timeout;

    const onAdComplete = () => {
      clearTimeout(adSafetyTimeout);
      adTriggeredRef.current = false;
      onComplete();
    };

    const startMockAd = () => {
      startAdProcess();
      onAdComplete();
    };

    const handleAdUnavailable = () => {
      startMockAd();
    };

    if (typeof (window as any).adBreak === 'function') {
      const adTimeout = setTimeout(() => {
        if (!localAdTriggered) {
          handleAdUnavailable();
        }
      }, 2000);

      try {
        (window as any).adBreak({
          type: 'reward',
          name: 'city_search_ad',
          beforeAd: () => {
            clearTimeout(adTimeout);
            startAdProcess();
            Howler.mute(true);
            
            adSafetyTimeout = setTimeout(() => {
              onAdComplete();
            }, 30000);
          },
          afterAd: () => {
            Howler.mute(false);
          },
          beforeReward: (showAdFn: any) => { showAdFn(); },
          adDismissed: () => {
            clearTimeout(adSafetyTimeout);
            onAdComplete();
          },
          adViewed: () => {
            clearTimeout(adSafetyTimeout);
            onAdComplete();
          },
          adBreakDone: (placementInfo: any) => {
            clearTimeout(adSafetyTimeout);
            if (!localAdTriggered) {
              clearTimeout(adTimeout);
              handleAdUnavailable();
            }
          }
        });
      } catch (e) {
        clearTimeout(adTimeout);
        handleAdUnavailable();
      }
    } else {
      handleAdUnavailable();
    }
  };

  const handleStartCitySearch = () => {
    handleShowAd(() => {
      socket?.emit("start_city_search", { serial: playerSerial, cityId: selectedCity });
      // Optimistically update state so the button hides immediately
      setCitySearchState({
        active: true,
        cityId: selectedCity,
        startTime: Date.now(),
        endTime: Date.now() + 60 * 60 * 1000,
        rewards: { xp: 0, tokens: 0, time_freeze: 0, word_count: 0, word_length: 0, hint: 0, spy_lens: 0, pro_package_days: 0 }
      });
      showAlert("ارجعوا بعد ساعة ولموا الهدايا والمكافآت 🤩 وابدأوا بحث جديد 🧐", "تم بدء البحث");
    });
  };

  const handleClaimCitySearch = () => {
    socket?.emit("claim_city_search", { serial: playerSerial });
  };

  const isCitySearchFinished = citySearchState?.active && Date.now() >= citySearchState.endTime;

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

    // Use card immediately ONLY if it's quick guess, already ready from an ad, or player has Pro package
    if (type === 'quick_guess' || readyPowerUps.includes(type) || hasProPackage) {
      // Actually use the card FIRST so the server sees we still have the free use
      socket?.emit('use_card', { roomId, cardType: type, serial: playerSerial, isAdReward: readyPowerUps.includes(type) });

      // Remove from ready
      if (type !== 'quick_guess' && readyPowerUps.includes(type)) {
        setReadyPowerUps(prev => prev.filter(p => p !== type));
      }
      
      // Hint has 150s cooldown (2.5m)
      if (type === 'hint') {
        const currentPlayer = room?.players.find(p => p.id === socket?.id);
        if ((currentPlayer?.hintCount || 0) < 1) {
          setCooldowns(prev => ({ ...prev, [type]: 150 }));
        }
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

  const renderLuckyWheelModal = () => {
    const segments = SPIN_REWARDS_UI;
    const segmentAngle = 360 / segments.length;

    return (
      <AnimatePresence>
        {showLuckyWheelModal && (
          <div 
            className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={toggleLuckyWheel}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-pink-500 p-4 border-b-4 border-black flex justify-between items-center" dir="ltr">
                <h2 className="text-white text-2xl font-black flex items-center gap-2">
                  <Disc className="w-6 h-6 animate-spin-slow" />
                  عجلة الحظ
                </h2>
                <button onClick={toggleLuckyWheel} className="text-white hover:text-pink-200"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-4 flex flex-col items-center gap-4">
                {/* The Wheel */}
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-8 h-8 text-pink-600 drop-shadow-md">
                    <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-current mx-auto" />
                  </div>
                  
                  {/* Wheel Body */}
                  <motion.div 
                    animate={{ rotate: rotation }}
                    transition={localIsSpinning ? { duration: 5, ease: [0.15, 0, 0.15, 1] } : { duration: 0 }}
                    className="w-full h-full rounded-full border-4 border-black overflow-hidden relative"
                    style={{ 
                      background: `conic-gradient(from ${-segmentAngle/2}deg, ${segments.map((s, i) => `${s.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`).join(', ')})` 
                    }}
                  >
                    {/* Icons & Labels on segments */}
                    {segments.map((s, i) => {
                      const angle = i * segmentAngle;
                      return (
                        <div 
                          key={`icon-${s.id}`}
                          className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-start pt-2"
                          style={{ transform: `rotate(${angle}deg)` }}
                        >
                          <div 
                            className="flex flex-col items-center gap-1"
                          >
                            <div 
                              className="text-white"
                              style={{ transform: `rotate(${-angle}deg)` }}
                            >
                              {s.icon}
                            </div>
                            <div 
                              className="text-white flex items-center justify-center"
                              style={{ 
                                height: '60px',
                                width: '20px',
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed'
                              }}
                            >
                              <span className="text-[9px] md:text-[9px] font-bold whitespace-nowrap leading-none text-center uppercase tracking-tighter">
                                {s.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                  
                  {/* Center Hub */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-black rounded-full z-20 flex items-center justify-center">
                    <div className="w-4 h-4 bg-pink-500 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Info & Button */}
                <div className="w-full text-center space-y-4">
                  {showReward && spinResult && (
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="p-1 mb-2 bg-yellow-100 border-2 border-yellow-400 rounded-xl"
                    >
                      <p className="text-sm font-bold text-yellow-800">مبروك! كسبت:</p>
                      <p className="text-xl font-black text-yellow-600">{spinResult.reward.label}</p>
                    </motion.div>
                  )}

                  <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-red-600">
                    جميع الهدايا التي تحصل عليها يجب أن تستخدم في نفس اليوم.
                  </p>                  
                    <p className="text-sm font-bold text-gray-500">
                      المحاولات المتبقية: {isAdmin ? 'غير محدود' : `${Math.max(0, 11 - spinStatus.dailySpinCount)} / 11`}
                    </p>                  
                    <button 
                      onClick={handleSpinClick}
                      disabled={isSpinning || localIsSpinning || spinCooldown > 0}
                      className={`w-full py-2 rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 ${
                        isSpinning || localIsSpinning || spinCooldown > 0
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : (!hasUsedFreeSpin && spinStatus.hasFreeSpin) 
                          ? 'bg-accent-green text-white hover:brightness-110' 
                          : 'bg-accent-blue text-white hover:brightness-110'
                      }`}
                    >
                      {isSpinning || localIsSpinning ? (
                        'جاري التدوير...'
                      ) : spinCooldown > 0 ? (
                        <>انتظر {spinCooldown} ثانية...</>
                      ) : !hasUsedFreeSpin && spinStatus.hasFreeSpin ? (
                        <>لف العجلة (مجاناً)</>
                      ) : (
                        <>
                          <span className="text-2xl">📺</span>
                          لف العجلة (مشاهدة إعلان)
                        </>
                      )}
                    </button>
                    
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  const renderDailyQuestModal = () => {
    let effectiveStreak = dailyQuestStreak;
    const now = Date.now();
    
    if (lastDailyClaim !== 0 && !isSameDay(now, lastDailyClaim)) {
      const isConsecutiveDay = (d1: number, d2: number) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        date2.setUTCDate(date2.getUTCDate() + 1);
        return date1.getUTCFullYear() === date2.getUTCFullYear() &&
               date1.getUTCMonth() === date2.getUTCMonth() &&
               date1.getUTCDate() === date2.getUTCDate();
      };
      
      if (!isConsecutiveDay(now, lastDailyClaim) || effectiveStreak > 7) {
        effectiveStreak = 1;
      }
    } else if (effectiveStreak > 7) {
      effectiveStreak = 8; // For display purposes when day 7 is claimed today
    }

    return (
    <AnimatePresence>
      {showDailyQuestModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[6000] flex items-center justify-center p-4"
          onClick={toggleDailyQuests}
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
                onClick={toggleDailyQuests}
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
                  const isClaimed = day < effectiveStreak && lastDailyClaim !== 0;
                  const isCurrent = day === effectiveStreak;
                  const canClaim = isCurrent && (lastDailyClaim === 0 || !isSameDay(now, lastDailyClaim));
                  
                  return (
                    <div 
                      key={day}
                      className={`relative flex flex-col items-center p-1 rounded-2xl border-4 transition-all ${
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

              {effectiveStreak <= 8 && (
                <button
                  disabled={isChestOpening || (lastDailyClaim !== 0 && isSameDay(now, lastDailyClaim))}
                  onClick={handleClaimDailyQuest}
                  className={`w-full py-4 rounded-2xl font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all border-4 border-black ${
                    (lastDailyClaim !== 0 && isSameDay(now, lastDailyClaim))
                    ? 'btn-primary cursor-not-allowed'
                    : 'bg-accent-green text-white hover:-translate-y-1 active:translate-y-0'
                  }`}
                >
                  {isChestOpening ? 'جاري الفتح...' : 
                   (lastDailyClaim !== 0 && isSameDay(now, lastDailyClaim)) ? 'تم الاستلام اليوم ✅' : 'استلم جائزة اليوم! 🎁'}
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
                          onAnimationStart={() => playSound('shakingBox')}
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
                        <div className="w-40 h-40 bg-white rounded-[32px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto mb-4">
                          <div className="scale-[5] transform flex items-center justify-center">
                            {cyclingReward ? (HELPER_ITEMS.find(h => h.id === cyclingReward.id)?.icon || cyclingReward.icon) : <span className="text-2xl">❓</span>}
                          </div>
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
                        <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
                          <div className="text-xl font-black">+{chestReward.xp} XP</div>
                        </div>
                        {chestReward.helper && chestReward.helper.id !== 'bonus_xp' && (
                          <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black flex items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-xl border-2 border-black flex items-center justify-center">
                              <div className="scale-[2.5] transform flex items-center justify-center">
                                {HELPER_ITEMS.find(h => h.id === chestReward.helper.id)?.icon || chestReward.helper.icon}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-gray-500">وسيلة مساعدة</div>
                              <div className="text-xl font-black">{chestReward.helper.name}</div>
                            </div>
                          </div>
                        )}
                        {chestReward.helper && chestReward.helper.id === 'bonus_xp' && (
                          <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black flex items-center justify-center gap-3">
                            <span className="text-2xl">⭐</span>
                            <div className="text-xl font-black">تم تحويل الوسيلة إلى 100 XP</div>
                          </div>
                        )}
                        {chestReward.tokens > 0 && (
                          <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
                            <div className="text-xl font-black">+{chestReward.tokens} Tokens</div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setIsChestOpening(false);
                          setChestReward(null);
                          toggleDailyQuests();
                        }}
                        className="w-full btn-game btn-success flex items-center justify-center mt-6 px-8 py-3 bg-white text-accent-blue rounded-xl font-black text-lg shadow-lg hover:bg-gray-100 transition-colors"
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
  };

  const renderCheckoutPage = () => (
    <AnimatePresence>
      {showCheckoutPage && selectedWalletItem && (
        <CheckoutPage
          item={shopItems.find(i => i.id === selectedWalletItem)}
          player={me}
          onBack={() => setShowCheckoutPage(false)}
          onPay={handleProcessPayment}
          isProcessing={isInitiatingPayment}
        />
      )}
    </AnimatePresence>
  );

  const renderComplaintModal = () => (
    <AnimatePresence>
      {showComplaintModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="card-game p-6 w-full max-w-sm space-y-4"
          >
            <h2 className="text-2xl font-black text-main text-center">الشكاوي والمقترحات</h2>
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-game bg-gray-50 focus:border-accent-purple outline-none min-h-[150px] resize-none"
              placeholder="اكتب شكواك أو مقترحك هنا..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const filtered = filterProfanity(complaintText);
                  socket?.emit('send_complaint', { text: filtered }, (res: any) => {
                    if (res.success) {
                      setComplaintText("");
                      setShowComplaintModal(false);
                    } else {
                      alert(res.error);
                    }
                  });
                }}
                disabled={!canSendComplaint}
                className={`flex-1 btn-game ${canSendComplaint ? 'btn-success' : 'btn-disabled'} py-3 text-lg`}
              >
                {canSendComplaint ? 'إرسال' : 'تم الإرسال اليوم'}
              </button>
              <button
                onClick={() => setShowComplaintModal(false)}
                className="flex-1 btn-game btn-primary py-3 text-lg"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.subject || !contactForm.message) {
      showAlert('يرجى ملء جميع الحقول', 'تنبيه');
      return;
    }
    setIsSendingContact(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: filterProfanity(contactForm.name),
          subject: filterProfanity(contactForm.subject),
          message: filterProfanity(contactForm.message),
          playerSerial 
        })
      });
      if (response.ok) {
        showAlert('تم إرسال رسالتك بنجاح! سنقوم بالرد عليك في أقرب وقت.', 'نجاح');
        setShowContactModal(false);
        setContactForm({ name: '', subject: '', message: '' });
      } else {
        const data = await response.json();
        showAlert(data.error || 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقاً.', 'خطأ');
      }
    } catch (err) {
      console.error('Contact error:', err);
      showAlert('حدث خطأ في الاتصال بالسيرفر', 'خطأ');
    } finally {
      setIsSendingContact(false);
    }
  };

  const renderContactModal = () => (
    <AnimatePresence>
      {showContactModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowContactModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-accent-blue p-6 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black">اتصل بنا</h2>
              <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الاسم</label>
                <input 
                  type="text" 
                  value={contactForm.name}
                  onChange={e => setContactForm({...contactForm, name: e.target.value})}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-accent-blue outline-none transition-all"
                  placeholder="اسمك الكامل"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الموضوع</label>
                <input 
                  type="text" 
                  value={contactForm.subject}
                  onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-accent-blue outline-none transition-all"
                  placeholder="موضوع الرسالة"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الرسالة</label>
                <textarea 
                  value={contactForm.message}
                  onChange={e => setContactForm({...contactForm, message: e.target.value})}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-accent-blue outline-none transition-all h-32 resize-none"
                  placeholder="اكتب رسالتك هنا..."
                  required
                />
              </div>
              
              <button 
                type="submit"
                disabled={isSendingContact}
                className={`w-full py-4 rounded-2xl font-black text-xl shadow-lg transform active:scale-95 transition-all ${
                  isSendingContact ? 'bg-gray-400 cursor-not-allowed' : 'bg-accent-blue hover:bg-blue-600 text-white'
                }`}
              >
                {isSendingContact ? 'جاري الإرسال...' : 'إرسال الرسالة'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderModals = () => (
    <>
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

      {renderCollectionModal()}
      {/* Global Reward Modal */}
      <AnimatePresence>
        {activeGlobalReward && (activeGlobalReward.type !== 'tokens' || getLevel(xp) >= 50) && (
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
              className="card-game p-6 w-full max-w-sm space-y-4 text-center border-4 border-accent-orange"
            >
              <div className="w-20 h-20 bg-accent-orange-soft rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <Gift className="w-10 h-10 text-accent-orange" />
              </div>
              <h2 className="text-3xl font-black text-accent-orange">هدية مجانية!</h2>
              <p className="text-brown-muted font-bold text-lg whitespace-pre-wrap">{activeGlobalReward.message}</p>
              
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100 my-4">
                <div className="flex items-center justify-center gap-2 text-main font-bold">
                  {activeGlobalReward.type === 'pro_package' ? (
                    <>
                      <Crown className="w-5 h-5 text-accent-yellow" />
                      <span>باقة المحترفين (بدون إعلانات)</span>
                    </>
                  ) : activeGlobalReward.type === 'unlock_helpers' ? (
                    <>
                      <Unlock className="w-5 h-5 text-accent-blue" />
                      <span>فتح كل وسائل المساعدة</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-5 h-5 text-accent-yellow" />
                      <span>{activeGlobalReward.tokenAmount} Tokens</span>
                    </>
                  )}
                </div>
                <div className="text-sm text-brown-light mt-2">
                  {activeGlobalReward.type === 'tokens' ? 'مكافأة خاصة لمستوى 50+' : `لمدة ${activeGlobalReward.durationHours} ساعة`}
                </div>
              </div>

              <button 
                onClick={() => {
                  socket?.emit('claim_global_reward', (res: any) => {
                    if (res.success) {
                      setActiveGlobalReward(null);
                      showAlert('تم استلام الهدية بنجاح! استمتع 🎉', 'نجاح');
                      if (res.player) {
                        if (res.player.proPackageExpiry) {
                          setProPackageExpiry(res.player.proPackageExpiry);
                          localStorage.setItem('khamin_pro_package_expiry', res.player.proPackageExpiry.toString());
                        }
                        if (res.player.unlockedHelpersExpiry) {
                          setUnlockedHelpersExpiry(res.player.unlockedHelpersExpiry);
                          localStorage.setItem('khamin_unlocked_helpers_expiry', res.player.unlockedHelpersExpiry.toString());
                        }
                        if (res.player.tokens !== undefined) {
                          setTokens(res.player.tokens);
                          localStorage.setItem('khamin_tokens', res.player.tokens.toString());
                        }
                      }
                    } else {
                      showAlert(res.error || 'حدث خطأ أثناء استلام الهدية', 'خطأ');
                      setActiveGlobalReward(null);
                    }
                  });
                }}
                className="w-full btn-game btn-primary py-3 text-xl animate-pulse"
              >
                استلام الهدية 🎁
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcement Modal */}
      <AnimatePresence>
        {announcementMessage && (
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
              className="card-game p-6 w-full max-w-sm space-y-4 text-center border-4 border-red-500"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-red-600">تنبيه هام</h2>
              <p className="text-brown-muted font-bold text-lg whitespace-pre-wrap">{announcementMessage}</p>
              <button 
                onClick={() => setAnnouncementMessage(null)}
                className="w-full btn-game bg-red-500 text-white hover:bg-red-600 border-b-4 border-red-700 py-3 text-lg"
              >
                فهمت
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {renderCheckoutPage()}
      {renderDailyQuestModal()}
      {renderLuckyWheelModal()}
      {renderComplaintModal()}
      {renderContactModal()}
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
                  onClick={handleWatchAd}
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

      {/* Reward Ad Confirmation Modal */}
      <AnimatePresence>
        {pendingClaimReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[20000] flex items-center justify-center p-4 text-white"
          >
            <div className="bg-modal-theme p-8 rounded-[2rem] text-center max-w-sm w-full space-y-6">
              <h2 className="text-2xl font-black text-accent-orange">استلام المكافأة</h2>
              <p className="text-brown-dark font-bold">هل تود مشاهدة إعلان لاستلام المكافأة؟</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleRewardAd(pendingClaimReward.categoryId, pendingClaimReward.stage)}
                  className="flex-1 bg-accent-green hover:brightness-110 text-white py-4 rounded-2xl font-black"
                >
                  نعم، شاهد الآن
                </button>
                <button 
                  onClick={() => setPendingClaimReward(null)}
                  className="flex-1 bg-gray-500 hover:brightness-110 text-white py-4 rounded-2xl font-black"
                >
                  لا
                </button>
              </div>
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
                      <Coins className="w-6 h-6 text-purple-500" />
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
                        onClick={handleWatchAd}
                        disabled={isCooldown || !adStatus.canWatch || getLevel(xp) < 50}
                        className={`px-4 py-2 rounded-xl font-black text-sm transition-all shadow-md relative z-10 ${
                          !isCooldown && adStatus.canWatch && getLevel(xp) >= 50
                            ? 'bg-accent-green text-white hover:scale-105 active:scale-95'
                            : 'bg-gray-300 text-brown-muted cursor-not-allowed'
                        }`}
                      >
                        {getLevel(xp) < 50 ? 'Level 50+' : isCooldown ? `${cooldownTime}s` : adStatus.canWatch ? 'مشاهدة' : 'انتهى اليوم'}
                      </button>
                    </div>
                  )}
                  
                  {/* Dynamic Packages */}
                  {shopItems.length > 0 ? (
                    shopItems.filter(item => item.type !== 'pro_pack').map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-accent-purple transition-colors box-game relative">
                        {item.type === 'token_pack_5' && (
                          <div className="absolute -top-3 left-4 bg-accent-orange text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
                            الأكثر مبيعاً
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-accent-purple-soft rounded-xl flex items-center justify-center text-2xl font-black text-accent-purple">
                            {item.amount}
                          </div>
                          <div>
                            <div className="font-black text-brown-dark">{item.name}</div>
                            <div className="text-xs font-bold text-brown-muted">{item.description}</div>
                          </div>
                        </div>
                        {isAdmin ? (
                          <button 
                            onClick={() => handleBuyItem(item.id)}
                            className="bg-accent-purple hover:brightness-110 text-white px-4 py-2 rounded-xl font-black text-sm transition-colors shadow-md"
                          >
                            {item.price} ج.م
                          </button>
                        ) : (
                          <button 
                            onClick={() => showAlert('سيتم تفعيل الشراء قريباً!', 'المتجر')}
                            className={`px-4 py-2 rounded-xl font-black text-sm transition-all shadow-md relative z-10 bg-gray-300 text-brown-muted cursor-not-allowed`}
                          >
                            قريباً
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-brown-muted font-bold">
                      لا توجد باقات متاحة حالياً
                    </div>
                  )}

                  {/* Ad-free Power-ups Package (Visible to all, locked for 50+) */}
                  {shopItems.find(item => item.type === 'pro_pack') && (
                    <div className="flex items-center justify-between p-4 border-2 border-accent-orange rounded-2xl bg-orange-50 mt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-accent-orange-soft rounded-xl flex items-center justify-center text-2xl">
                          {shopItems.find(item => item.type === 'pro_pack')?.image || '⚡'}
                        </div>
                        <div>
                          <div className="font-black text-brown-dark">{shopItems.find(item => item.type === 'pro_pack')?.name || 'باقة المحترفين'}</div>
                          <div className="text-xs font-bold text-brown-muted">{shopItems.find(item => item.type === 'pro_pack')?.description || 'استخدم وسائل المساعدة بدون إعلانات لمدة 30 يوم'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <button 
                            onClick={() => handleBuyItem(shopItems.find(item => item.type === 'pro_pack')?.id || 'pro_pack')}
                            className={`px-4 py-2 rounded-xl font-black text-sm transition-all shadow-md ${hasProPackage ? 'bg-gray-300 text-brown-muted cursor-not-allowed' : 'bg-accent-orange hover:bg-accent-orange-dark text-white'}`}
                            disabled={hasProPackage}
                          >
                            {hasProPackage ? 'تم الشراء' : `${shopItems.find(item => item.type === 'pro_pack')?.price} ج.م`}
                          </button>
                        ) : (
                          <button 
                            onClick={() => showAlert('سيتم تفعيل الشراء قريباً!', 'المتجر')}
                            className={`px-4 py-2 rounded-xl font-black text-sm transition-all shadow-md relative z-10 bg-gray-300 text-brown-muted cursor-not-allowed`}
                          >
                            قريباً
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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
                    التخمين السريع
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
                      <span className="text-accent-orange">بعد 0:03 ثوانٍ (من البداية!)</span>
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

      {/* City Search Modal */}
      <AnimatePresence>
        {showCitySearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
            onClick={() => toggleCitySearch()}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-accent-blue p-4 flex justify-between items-center text-white" dir="ltr">
                <h3 className="font-black text-[14px] flex items-center gap-2">
                  <Search className="w-6 h-6" /> ابحث في المدينة عن الهدايا
                </h3>
                <button onClick={() => toggleCitySearch()} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4">
                {/* City Selection */}
                <div className="flex gap-3 justify-center mb-2">
                  {[
                    { id: 1, name: 'مدينة الأحلام' },
                    { id: 2, name: 'مدينة الظلام' },
                    { id: 3, name: 'مدينة الثلج' },
                    { id: 4, name: 'مدينة القدماء' }
                  ].map(city => (
                    <div key={city.id} className="flex flex-col items-center gap-1">
                      <img 
                        src={`/city-gift-0${city.id}.jpg`}
                        alt={city.name}
                        className={`w-16 h-16 rounded-xl object-cover cursor-pointer border-4 transition-all ${
                          (citySearchState?.active ? citySearchState.cityId === city.id : selectedCity === city.id) 
                            ? 'border-accent-blue scale-103 shadow-md' 
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => !citySearchState?.active && setSelectedCity(city.id)}
                      />
                      <span className={`text-[10px] mt-1 font-bold transition-all ${
                        (citySearchState?.active ? citySearchState.cityId === city.id : selectedCity === city.id)
                          ? 'text-accent-blue scale-103'
                          : 'text-gray-500'
                      }`}>{city.name}</span>
                    </div>
                  ))}
                </div>

                {/* Main Image */}
                <div className="relative w-full flex justify-center items-center rounded-2xl mb-2 bg-gray-900 shadow-inner border-2 border-gray-200">
                  <img 
                    src={`/city-gift-0${citySearchState?.active ? citySearchState.cityId : selectedCity}.jpg`} 
                    className={`flex justify-between items-center w-auto h-auto object-cover transition-opacity duration-500 ${citySearchState?.active && !isCitySearchFinished ? 'opacity-50' : 'opacity-100'}`} 
                    alt="Selected City"
                  />
                  
                  {citySearchState?.active && !isCitySearchFinished && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <Search className="w-15 h-15 text-white animate-search-circle" />
                    </div>
                  )}
                  
                  {isCitySearchFinished && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                      <div className="bg-accent-green text-white px-6 py-3 rounded-full font-black text-xl shadow-lg flex items-center gap-2 animate-bounce">
                        <Gift className="w-6 h-6" /> اكتمل البحث!
                      </div>
                    </div>
                  )}
                </div>

                {!citySearchState?.active && (
                  <div className="text-center mb-2 px-2">
                    <p className="text-sm font-bold text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-100">
                     ابحث في المدينة وجمع هدايا XP، Tokens، باقة المحترفين، ووسائل مساعدة!
                    </p>
                  </div>
                )}

                {/* Rewards Display */}
                {citySearchState?.active && (
                  <div className="bg-gray-50 p-2 rounded-2xl border border-gray-200 mb-2">
                    <h4 className="text-center font-bold text-[13px] md:text-[14px] text-gray-500 mb-1">
                      {isCitySearchFinished ? 'المكافآت التي حصلت عليها:' : 'المكافآت التي يتم تجميعها:'}
                    </h4>
                    <div className="flex flex-wrap justify-center gap-1" dir="ltr">
                      {displayedRewards && (
                        <span className="px-0.5 py-0.5 rounded-lg text-xs font-bold text-orange-600 flex items-center gap-0.5">
                          <Star className="w-3 h-3 md:w-4 md:h-4" /> {displayedRewards.xp} XP
                        </span>
                      )}
                      {displayedRewards && (
                        <span className="px-0.5 py-0.5 rounded-lg text-xs font-bold text-purple-600 flex items-center gap-0.5">
                          <Coins className="w-3 h-3 md:w-4 md:h-4" /> {displayedRewards.tokens}
                        </span>
                      )}
                      {displayedRewards && (
                        <span className="px-0.5 py-0.5 rounded-lg text-xs font-bold text-yellow-500 flex items-center gap-0.5">
                          <Crown className="w-3 h-3 md:w-4 md:h-4" /> {displayedRewards.pro_package_days}
                        </span>
                      )}
                      {displayedRewards && (
                        <span className="px-0.5 py-0.5 rounded-lg text-xs font-bold text-cyan-500 flex items-center gap-0.5">
                          <Snowflake className="w-3 h-3 md:w-4 md:h-4" /> {displayedRewards.time_freeze}
                        </span>
                      )}
                      {displayedRewards && (
                        <span className="px-0.5 py-0.5 rounded-lg text-xs font-bold text-indigo-500 flex items-center gap-0.5">
                          <Hash className="w-3 h-3 md:w-4 md:h-4" /> {displayedRewards.word_count}
                        </span>
                      )}
                      {displayedRewards && (
                        <span className="px-0.5 py-0.5 rounded-lg text-xs font-bold text-green-500 flex items-center gap-0.5">
                          <Type className="w-3 h-3 md:w-4 md:h-4" /> {displayedRewards.word_length}
                        </span>
                      )}
                      {displayedRewards && (
                        <span className="px-0.5 py-0.5 rounded-lg text-xs font-bold text-blue-500 flex items-center gap-0.5">
                          <HelpCircle className="w-3 h-3 md:w-4 md:h-4" /> {displayedRewards.hint}
                        </span>
                      )}
                      {displayedRewards && (
                        <span className="px-0.5 py-0.5 rounded-lg text-xs font-bold text-purple-400 flex items-center gap-0.5">
                          <Eye className="w-3 h-3 md:w-4 md:h-4" /> {displayedRewards.spy_lens}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!citySearchState?.active ? (
                  <button 
                    onClick={handleStartCitySearch} 
                    className="w-full py-4 bg-accent-blue hover:bg-blue-600 text-white rounded-2xl font-black text-lg shadow-[0_4px_0_0_#1e3a8a] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-2xl">📺</span>
                     ابدأ البحث (شاهد إعلان)
                  </button>
                ) : !isCitySearchFinished ? (
                  <div className="text-center bg-gray-100 rounded-2xl p-1 border-2 border-gray-200">
                    <div className="text-sm font-bold text-gray-500 mb-1">الوقت المتبقي</div>
                    <div className="text-3xl font-black text-accent-orange font-mono" dir="ltr">{citySearchTimeLeft}</div>
                  </div>
                ) : (
                  <button 
                    onClick={handleClaimCitySearch} 
                    className="w-full py-4 bg-accent-green hover:bg-green-600 text-white rounded-2xl font-black text-lg shadow-[0_4px_0_0_#15803d] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 animate-pulse"
                  >
                    <Gift className="w-6 h-6" /> استلم المكافآت
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings / Profile Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            key="settings-modal"
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
                <div className="bg-orange-100 p-3 rounded-2xl border-4 border-black space-y-4">
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="relative w-16 h-16">
                      {renderAvatarContent(avatar, getLevel(xp), false, true, selectedFrame)}
                    </div>
                    <div className="text-right flex-1">
                      <div className="font-black text-lg text-main">{playerName}</div>
                      <div 
                        className="text-[10px] font-mono text-brown-muted mt-1 cursor-pointer hover:text-accent-blue flex items-center justify-end gap-1" dir="ltr"
                        onClick={() => {
                          navigator.clipboard.writeText(playerSerial);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        title="نسخ رقم اللاعب"
                      >
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        ID: {playerSerial}
                      </div>
                    </div>
                  </div>

                  <AnimatedXp xp={xp} joined={joined}>
                    {(displayXp) => (
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1 flex-row-reverse">
                            <span className="text-xs font-black text-brown-muted">Level {getLevel(Math.floor(displayXp))}</span>
                          </div>
                          <div className="w-full bg-[var(--level-bar-bg)] rounded-full h-2 overflow-hidden mb-2" dir="ltr">
                            <div 
                              className="h-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, (getLevel(Math.floor(displayXp)) / 50) * 100)}%`, backgroundColor: 'var(--level-bar-fill)' }}
                            ></div>
                          </div>
                          <div className="w-full bg-[var(--xp-bar-bg)] rounded-full h-5 shadow-inner overflow-hidden relative border-2 border-black" dir="ltr">
                            <div 
                              className="h-full transition-all duration-500" 
                              style={{ width: `${getXpProgress(Math.floor(displayXp))}%`, backgroundColor: 'var(--xp-bar-fill)' }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: getXpProgress(Math.floor(displayXp)) >= 100 ? 'var(--xp-bar-text-active)' : 'var(--xp-bar-text)' }}>
                                <Zap className="w-3 h-3" />
                                {Math.floor(displayXp)} / {getXpForNextLevel(getLevel(Math.floor(displayXp)))} XP
                              </span>
                            </div>
                          </div>
                        </div>
                        {renderStars(getLevel(Math.floor(displayXp)))}
                      </div>
                    )}
                  </AnimatedXp>
                </div>

                {/* Edit Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-brown-muted mb-1 text-right">الاسم</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={playerName}
                        onChange={(e) => {
                          const name = e.target.value;
                          const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
                          const cleanName = name.replace(emojiRegex, '');
                          setPlayerName(filterProfanity(cleanName.slice(0, 15)));
                        }}
                        className={`input-game ${(!lastRenameAt || (Date.now() - lastRenameAt) / (1000 * 60 * 60 * 24) >= 30) ? '' : 'opacity-60 cursor-not-allowed pl-10'}`}
                        maxLength={15}
                        disabled={lastRenameAt > 0 && (Date.now() - lastRenameAt) / (1000 * 60 * 60 * 24) < 30}
                      />
                      {lastRenameAt > 0 && (Date.now() - lastRenameAt) / (1000 * 60 * 60 * 24) < 30 && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          <Lock className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-red-500 mt-1 font-bold text-right">
                      {lastRenameAt > 0 && (Date.now() - lastRenameAt) / (1000 * 60 * 60 * 24) < 30 
                        ? `متبقي ${Math.ceil(30 - (Date.now() - lastRenameAt) / (1000 * 60 * 60 * 24))} يوم لتتمكن من تغيير الاسم`
                        : 'يتم تعديل الاسم كل 30 يوم'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-brown-muted mb-1 text-right">العمر</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
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
                      maxLength={2}
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
                            className={`relative aspect-square box-game flex items-center justify-center transition-all overflow-hidden ${avatar === av.id ? '!bg-orange-100 !border-orange-400 scale-105' : 'hover:bg-gray-200'} ${isLocked ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
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
                    <div className="flex items-center justify-between mb-2 flex-row-reverse relative" dir="ltr">
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
                          className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 ${avatar === customAvatar ? 'border-purple-500' : 'border-black'}`}
                        >
                          <img src={customAvatar} className="w-full h-full object-cover" alt="Custom" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Frame Selection */}
                  <div className="pt-4 border-t border-game">
                    <div className="flex items-center justify-between mb-3 flex-row-reverse" dir="ltr">
                      <span className="text-sm font-black text-brown-muted">إطارات أبطال التخمين</span>
                      <span className="text-[10px] font-black text-brown-muted bg-gray-200 px-2 py-1 rounded-lg">
                        اجمع الصور لفتحها
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      
                      {/* Collection Frames */}
                      {COLLECTION_DATA.map((cat, index) => {
                        const finalStage = cat.stages[cat.stages.length - 1];
                        const frameImage = finalStage.reward.frame;
                        if (!frameImage) return null;
                        
                        const isUnlocked = claimedCollectionRewards.some(r => r.category_id === cat.id && r.stage === finalStage.stage);
                        
                        return (
                          <button
                            key={`frame-${cat.id}-${index}`}
                            onClick={() => {
                              if (isUnlocked) {
                                setSelectedFrame(frameImage);
                                if (!seenFrames.includes(cat.id)) {
                                  const newSeen = [...seenFrames, cat.id];
                                  setSeenFrames(newSeen);
                                  localStorage.setItem('khamin_seen_frames', JSON.stringify(newSeen));
                                }
                              }
                            }}
                            disabled={!isUnlocked}
                            className={`relative aspect-square box-game flex items-center justify-center transition-all overflow-hidden ${selectedFrame === frameImage ? '!bg-orange-100 !border-orange-400 scale-105' : 'hover:bg-gray-200'} ${!isUnlocked ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                          >
                            <div className="w-full h-full p-1 relative">
                              <img src={`/assets/${frameImage}`} alt={`${cat.name} Frame`} className="w-full h-full object-contain absolute inset-0 z-10" />
                            </div>
                            {isUnlocked && !seenFrames.includes(cat.id) && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse z-30"></span>
                            )}
                            {!isUnlocked && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl z-20">
                                <Lock className="w-4 h-4 text-white mb-1" />
                                <span className="text-[10px] font-black text-white">{cat.icon}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                      {/* Default No Frame Option */}
                      <button
                        onClick={() => setSelectedFrame('')}
                        className={`w-full btn-game bg-orange-100 flex items-center justify-center transition-all overflow-hidden py-2 text-lg gap-2 mb-1 ${selectedFrame === '' ? '!bg-orange-100 !border-orange-400' : 'hover:bg-orange-200'}`}
                      >
                        <span className="text-xs font-black text-brown-muted">بدون إطار</span>
                      </button>                    
                  </div>

                  {/* Notification Settings */}
                  <div className="pt-4 border-t border-game space-y-4">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <div className="w-8 h-8 bg-accent-purple rounded-xl flex items-center justify-center text-white shadow-sm border-2 border-black">
                          <Bell className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-brown-muted">إشعارات الهاتف</span>
                      </div>
                      <button 
                        onClick={toggleNotifications}
                        className={`w-12 h-6 rounded-full border-2 border-black transition-all relative ${notificationsEnabled ? 'bg-accent-green' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white border-2 border-black transition-all ${notificationsEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  </div>

                  {/* Audio Settings */}
                  <div className="pt-4 border-t border-game space-y-4">
                    <div className="flex items-center justify-between flex-row-reverse" dir="ltr">
                      <span className="text-sm font-black text-brown-muted">إعدادات الصوت</span>
                    </div>
                    
                    {/* SFX Volume */}
                    <div className="space-y-2 bg-purple-100 p-2">
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
                        onTouchStart={(e) => e.stopPropagation()}
                        className="w-full h-2 bg-gray-400 rounded-lg cursor-pointer accent-orange-500"
                        dir="ltr"
                      />
                    </div>

                    {/* Music Volume */}
                    <div className="space-y-2 bg-purple-100 p-2">
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
                        onTouchStart={(e) => e.stopPropagation()}
                        className="w-full h-2 bg-gray-400 rounded-lg cursor-pointer accent-purple-600"
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
                  <div className="flex items-center justify-between flex-row-reverse" dir="ltr">
                    <label className="text-sm font-black text-brown-muted">حالة الحساب</label>
                    <span className="text-[10px] font-black text-brown-light" dir="rtl">10 إبلاغات = حظر 24 ساعة</span>
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
                    <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
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

                {/* Recent Opponents */}
                <div className="space-y-2 relative">
                  <button
                    onClick={() => setShowRecentOpponents(true)}
                    className="w-full btn-game bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200 py-2 text-sm flex items-center justify-center gap-2 mb-1"
                  >
                    <Users className="w-4 h-4 text-blue-500" />
                    عرض آخر 10 منافسين
                  </button>
                  
                  {showRecentOpponents && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[6000] flex items-center justify-center p-4"
                      onClick={() => setShowRecentOpponents(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="card-game p-4 w-full max-w-md space-y-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-center flex-row-reverse">
                          <h2 className="text-2xl font-black text-main">آخر 10 منافسين</h2>
                          <button onClick={() => setShowRecentOpponents(false)} className="text-brown-light hover:text-red-500"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                          {(Array.isArray(recentOpponents) ? recentOpponents : []).length === 0 ? (
                            <p className="text-center text-brown-muted font-black py-4">لا يوجد منافسين سابقين</p>
                          ) : (
                            <div className="flex flex-col">
                              {(Array.isArray(recentOpponents) ? recentOpponents : []).map((opponent, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 flex-row-reverse">
                                  <div className="flex items-center gap-3 flex-row-reverse">
                                    <div className="w-8 h-8">
                                      {renderAvatarContent(opponent.avatar, opponent.level || getLevel(opponent.xp || 0), true, false, opponent.selectedFrame)}
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm font-black text-main">{opponent.name}</span>
                                      <span className="text-[10px] text-gray-500">{new Date(opponent.timestamp).toLocaleString('ar-EG')}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setReportTarget({ serial: opponent.serial, name: opponent.name });
                                        setShowReportModal(true);
                                        setShowRecentOpponents(false);
                                      }}
                                      className={`p-2 rounded-full transition-colors ${
                                        (reportedSerials || []).includes(opponent.serial)
                                          ? 'text-red-500 cursor-not-allowed'
                                          : 'hover:bg-red-100 text-red-500'
                                      }`}
                                      title="إبلاغ"
                                      disabled={(reportedSerials || []).includes(opponent.serial)}
                                    >
                                      <Flag className={`w-4 h-4 ${(reportedSerials || []).includes(opponent.serial) ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCustomConfirm({
                                          show: true,
                                          title: 'حظر اللاعب',
                                          message: `هل أنت متأكد من حظر ${opponent.name}؟ لن تتمكن من اللعب معه مرة أخرى.`,
                                          onConfirm: () => {
                                            socket?.emit('block_player_by_serial', { blockerSerial: playerSerial, blockedSerial: opponent.serial }, (res: any) => {
                                              if (res && res.success) {
                                                showAlert(`تم حظر ${opponent.name} بنجاح`, 'حظر');
                                                setShowRecentOpponents(false);
                                                // Update local blocked list
                                                setBlockedPlayers(prev => [...prev, { serial: opponent.serial, name: opponent.name }]);
                                                // Remove from recent opponents
                                                setRecentOpponents(prev => prev.filter(op => op.serial !== opponent.serial));
                                              } else {
                                                showAlert(res.error || 'حدث خطأ أثناء الحظر', 'خطأ');
                                              }
                                            });
                                          }
                                        });
                                      }}
                                      className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                                      title="حظر"
                                    >
                                      <Ban className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                {/* Blocked Players Status */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      socket?.emit('get_blocked_players', { serial: playerSerial }, (list: any) => {
                        setBlockedPlayers(list);
                        setShowBlockedPlayers(true);
                      });
                    }}
                    className="w-full btn-game bg-gray-300 border-gray-300 text-gray-700 hover:bg-gray-200 py-2 text-sm flex items-center justify-center gap-2 mb-1"
                  >
                    <Ban className="w-4 h-4 text-red-500" />
                    عرض اللاعبين المحظورين
                  </button>
                </div>
              </div>

              <button 
                onClick={handleProfileUpdate}
                className="w-full btn-game btn-success py-2 text-lg"
              >
                حفظ التعديلات
              </button>

              <div className="pt-2 border-t border-game">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full btn-game btn-danger gap-2 py-2 text-sm mb-2"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح الحساب نهائياً
                </button>
                <button 
                  onClick={() => {
                    socket?.emit('check_complaint_status', {}, (res: any) => {
                      if (res.success) {
                        setCanSendComplaint(res.canSend);
                        setShowComplaintModal(true);
                      }
                    });
                  }}
                  className="w-full btn-game btn-primary gap-2 py-2 text-sm mb-4"
                >
                  <MessageSquare className="w-4 h-4" />
                  الشكاوي والمقترحات
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-3 text-[10px] font-black text-brown-muted border-t border-game pt-4">
                <button 
                  onClick={() => setShowPrivacyModal(true)}
                  className="hover:text-accent-blue transition-colors"
                >
                  سياسة الخصوصية
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={() => setShowTermsModal(true)}
                  className="hover:text-accent-blue transition-colors"
                >
                  الشروط والأحكام
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="hover:text-accent-blue transition-colors"
                >
                  اتصل بنا
                </button>
              </div>



            </motion.div>
          </motion.div>
        )}

        {/* Blocked Players Modal */}
        {showBlockedPlayers && (
          <motion.div
            key="blocked-players-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[6000] flex items-center justify-center p-4"
            onClick={() => setShowBlockedPlayers(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="card-game p-4 w-full max-w-md space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center flex-row-reverse">
                <h2 className="text-2xl font-black text-main">قائمة الحظر</h2>
                <button onClick={() => setShowBlockedPlayers(false)} className="text-brown-light hover:text-red-500"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {blockedPlayers.length === 0 ? (
                  <p className="text-center text-brown-muted font-black py-4">لا يوجد لاعبين محظورين</p>
                ) : (
                  blockedPlayers.map((bp) => (
                    <div key={bp.serial} className="flex items-center justify-between bg-white p-3 rounded-xl border-2 border-gray-200 flex-row-reverse">
                      <span className="font-black text-main">{bp.name}</span>
                      <button
                        onClick={() => {
                          socket?.emit('unblock_player', { serial: playerSerial, blockedSerial: bp.serial }, (res: any) => {
                            if (res.success) {
                              setBlockedPlayers(prev => prev.filter(p => p.serial !== bp.serial));
                            }
                          });
                        }}
                        className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-black transition-colors"
                      >
                        إلغاء الحظر
                      </button>
                    </div>
                  ))
                )}
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
                        setPlayerName(filterProfanity(cleanName.slice(0, 15)));
                      }}
                      placeholder="ادخل اسمك..."
                      className="input-game"
                      maxLength={15}
                    />
                    <p className="text-[10px] text-red-500 mt-1 font-bold text-right">تنبيه: لن يتم تعديل الاسم مره آخري الا بعد 30 يوم</p>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-brown-muted mb-1 text-right">عمر اللاعب</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
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
                        onClick={() => { setGender('boy'); setHasSelectedAvatar(false); }}
                        className={`flex-1 py-3 box-game font-black transition-all ${gender === 'boy' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'text-brown-light opacity-60'}`}
                      >
                        ولد 👦
                      </button>
                      <button
                        onClick={() => { setGender('girl'); setHasSelectedAvatar(false); }}
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
                          onClick={() => { setAvatar(av.id); setHasSelectedAvatar(true); }}
                          className={`w-full aspect-square box-game flex items-center justify-center transition-all overflow-hidden ${hasSelectedAvatar && avatar === av.id ? '!bg-orange-100 !border-orange-400 scale-105' : ''}`}
                        >
                          <div className="w-full h-full p-1">
                            {renderAvatarContent(av.id, 1)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border-2 border-gray-100">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      checked={acceptedTerms} 
                      onChange={e => setAcceptedTerms(e.target.checked)} 
                      className="w-5 h-5 accent-accent-blue rounded cursor-pointer" 
                    />
                    <label htmlFor="terms" className="text-sm font-bold text-brown-dark cursor-pointer select-none">
                      أوافق على <button type="button" onClick={() => setShowTermsModal(true)} className="text-accent-blue hover:text-blue-600 underline">الشروط والأحكام</button>
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="privacy" 
                      checked={acceptedPrivacy} 
                      onChange={e => setAcceptedPrivacy(e.target.checked)} 
                      className="w-5 h-5 accent-accent-blue rounded cursor-pointer" 
                    />
                    <label htmlFor="privacy" className="text-sm font-bold text-brown-dark cursor-pointer select-none">
                      أوافق على <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-accent-blue hover:text-blue-600 underline">سياسة الخصوصية</button>
                    </label>
                  </div>
                </div>

                <AnimatePresence>
                  {registerError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-100 border-2 border-red-200 p-3 text-red-600 text-sm font-black rounded-xl text-center"
                    >
                      {registerError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={handleRegister}
                  className="w-full btn-game btn-primary py-4 text-xl"
                >
                  حفظ البيانات والبدء
                </button>

                <div className="pt-6 mt-6 border-t-2 border-gray-100">
                  <h3 className="text-center font-black text-brown-dark mb-4">لديك حساب بالفعل؟</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={loginSerial}
                      onChange={(e) => setLoginSerial(e.target.value)}
                      placeholder="أدخل رقم ID اللاعب الخاص بك"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-accent-blue focus:ring-2 focus:ring-blue-200 outline-none transition-all text-center font-bold font-mono"
                      dir="rtl"
                    />
                    <AnimatePresence>
                      {loginError && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-red-100 border-2 border-red-200 p-3 text-red-600 text-sm font-black rounded-xl text-center"
                        >
                          {loginError}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button 
                      onClick={handleLogin}
                      className="w-full btn-game btn-primary py-3 text-lg"
                    >
                      تسجيل الدخول
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rules Modal */}
        <AnimatePresence>
          {showRulesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[6000] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="card-game p-5 w-full max-w-sm space-y-4"
              >
                <h2 className="text-xl font-black text-main text-center border-b-2 border-gray-100 pb-3">
                  * قوانين لعبة - خمن تخمينة:
                </h2>
                <ul className="text-sm text-right space-y-2 text-brown-dark font-bold dir-rtl" dir="rtl">
                  <li>1- ممنوع الكذب وتضليل الأجابة.</li>
                  <li>7- ممنوع تعمد التأخير فى الرد.</li>
                  <li>2- ممنوع تسريب الاجابة.</li>
                  <li>3- ممنوع الغش من الطرفين.</li>
                  <li>6- تخمين الاجابة فقط فى نوافذ التخمين.</li>
                  <li>12- الابلاغ 🚩 عن اي لاعب يخالف القوانين.</li>
                </ul>
                <p className="text-xs text-red-600 font-black text-center mt-4 bg-red-50 p-2 rounded-lg border border-red-200">
                  لكل من يخالف ذلك سيتم حظره نهائيا من اللعبة.
                </p>
                <button 
                  onClick={handleAcceptRules}
                  className="w-full btn-game btn-primary py-3 text-lg mt-2"
                >
                  حسنا
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terms Modal */}
        <AnimatePresence>
          {showTermsModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowTermsModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[32px] p-6 max-w-lg w-full shadow-2xl border-4 border-accent-blue max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-black text-brown-dark flex items-center gap-2">
                    <FileText className="w-6 h-6 text-accent-blue" />
                    الشروط والأحكام
                  </h3>
                  <button onClick={() => setShowTermsModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap text-brown-muted font-bold text-sm leading-relaxed space-y-4">
                  <div dir="rtl" className="text-right">{gamePolicies.termsAr || 'جاري التحميل...'}</div>
                  <div dir="ltr" className="text-left">{gamePolicies.termsEn || 'Loading...'}</div>
                </div>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="w-full mt-6 py-3 bg-accent-blue hover:bg-blue-600 text-white rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1"
                >
                  إغلاق
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy Modal */}
        <AnimatePresence>
          {showPrivacyModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPrivacyModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[32px] p-6 max-w-lg w-full shadow-2xl border-4 border-accent-purple max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-black text-brown-dark flex items-center gap-2">
                    <Shield className="w-6 h-6 text-accent-purple" />
                    سياسة الخصوصية
                  </h3>
                  <button onClick={() => setShowPrivacyModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap text-brown-muted font-bold text-sm leading-relaxed space-y-4">
                  <div dir="rtl" className="text-right">{gamePolicies.privacyAr || 'جاري التحميل...'}</div>
                  <div dir="ltr" className="text-left">{gamePolicies.privacyEn || 'Loading...'}</div>
                </div>
                <button 
                  onClick={() => setShowPrivacyModal(false)}
                  className="w-full mt-6 py-3 bg-accent-purple hover:bg-purple-600 text-white rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1"
                >
                  إغلاق
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
                className="bg-white rounded-[40px] w-full h-full flex flex-col shadow-2xl border-4 border-purple-100"
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
                          className={`relative text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'players' ? 'bg-accent-purple text-white' : 'bg-accent-purple-soft text-accent-purple hover:bg-accent-purple-soft'}`}
                        >
                          اللاعبين والبلاغات
                          {adminReports.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                              {adminReports.length}
                            </span>
                          )}
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
                          onClick={() => {
                            setAdminTab('shop');
                            socket?.emit('admin_get_shop_items', (items: any) => {
                              if (Array.isArray(items)) setShopItems(items);
                            });
                          }}
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
                        <button 
                          onClick={() => setAdminTab('announcements')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'announcements' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-500 hover:bg-red-200'}`}
                        >
                          الإشعارات
                        </button>
                        <button 
                          onClick={() => setAdminTab('rewards')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'rewards' ? 'bg-accent-green text-white' : 'bg-accent-green-soft text-accent-green hover:bg-accent-green-soft'}`}
                        >
                          المكافآت
                        </button>
                        <button 
                          onClick={() => setAdminTab('policies')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'policies' ? 'bg-brown-dark text-white' : 'bg-gray-300 text-brown-dark hover:bg-gray-300'}`}
                        >
                          سياسات اللعبة
                        </button>
                        <button 
                          onClick={() => setAdminTab('avatar_review')}
                          className={`relative text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'avatar_review' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
                        >
                          مراجعة الصور
                          {pendingAvatars.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                              {pendingAvatars.length}
                            </span>
                          )}
                        </button>
                        <button 
                          onClick={() => setAdminTab('contacts')}
                          className={`relative text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'contacts' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                        >
                          الرسائل
                          {adminContacts.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                              {adminContacts.length}
                            </span>
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            setAdminTab('live_matches');
                            socket?.emit('admin_get_active_rooms', (rooms: any) => {
                              if (Array.isArray(rooms)) setActiveRooms(rooms);
                            });
                          }}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'live_matches' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        >
                          المباريات المباشرة
                        </button>
                        <button 
                          onClick={() => setAdminTab('quick_chat')}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${adminTab === 'quick_chat' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                        >
                          Quick Chat
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        // Always fetch data for badges and general stats
                        socket?.emit('admin_get_players', (players: any) => {
                          if (Array.isArray(players)) setAdminPlayers(players);
                        });
                        socket?.emit('admin_get_reports', (reports: any) => {
                          if (Array.isArray(reports)) setAdminReports(reports);
                        });
                        socket?.emit('admin_get_pending_avatars', (pending: any) => {
                          if (Array.isArray(pending)) setPendingAvatars(pending);
                        });
                        socket?.emit('admin_get_contacts', (contacts: any) => {
                          if (Array.isArray(contacts)) setAdminContacts(contacts);
                        });
                        socket?.emit('admin_get_active_rooms', (rooms: any) => {
                          if (Array.isArray(rooms)) setActiveRooms(rooms);
                        });

                        if (adminTab === 'shop') {
                          socket?.emit('admin_get_shop_items', (items: any) => {
                            if (Array.isArray(items)) setShopItems(items);
                          });
                        } else if (adminTab === 'images') {
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
                    <button 
                      onClick={() => {
                        localStorage.removeItem('khamin_is_admin');
                        localStorage.removeItem('khamin_admin_token');
                        localStorage.removeItem('khamin_admin_email');
                        setIsAdmin(false);
                        setShowAdminDashboard(false);
                        showAlert('تم تسجيل الخروج من لوحة التحكم بنجاح', 'نجاح');
                      }}
                      className="flex items-center gap-2 p-3 bg-red-100 text-red-600 rounded-xl border-2 border-gray-100 font-black text-sm hover:bg-red-200 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
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
                                {shopItems.map(item => (
                                  <div key={item.id} className="flex items-center justify-between p-3 box-game">
                                    <div className="font-bold text-sm">{item.name}</div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-orange-600 font-black">{item.price} ج.م</div>
                                      <button
                                        onClick={() => {
                                          setEditingPackage(item);
                                          setShowPackageModal(true);
                                        }}
                                        className="text-blue-500 hover:text-blue-700"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          showConfirm('هل أنت متأكد من حذف هذه الباقة؟', () => {
                                            socket?.emit('admin_delete_shop_item', item.id, (res: any) => {
                                              if (res.success) {
                                                socket.emit('admin_get_shop_items', (items: any) => {
                                                  if (Array.isArray(items)) setShopItems(items);
                                                });
                                                showAlert('تم حذف الباقة بنجاح', 'نجاح');
                                              } else {
                                                showAlert('حدث خطأ أثناء الحذف', 'خطأ');
                                              }
                                            });
                                          });
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <button 
                                  onClick={() => {
                                    setEditingPackage(null);
                                    setShowPackageModal(true);
                                  }}
                                  className="w-full text-sm text-brown-muted hover:text-orange-600 font-bold py-2 border border-dashed border-gray-300 rounded-lg mt-2 transition-colors"
                                >
                                  + إضافة باقة جديدة
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Paymob Settings */}
                          <div className="box-game p-6 shadow-sm mt-6">
                            <h3 className="text-xl font-black text-brown-dark mb-4 flex items-center gap-2">
                              <ShoppingCart className="w-6 h-6 text-purple-500" />
                              إعدادات Paymob
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-brown-dark mb-1">API Key</label>
                                <input 
                                  type="text" 
                                  value={paymobSettings.paymob_api_key}
                                  onChange={(e) => setPaymobSettings({...paymobSettings, paymob_api_key: e.target.value})}
                                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-brown-dark mb-1">HMAC</label>
                                <input 
                                  type="text" 
                                  value={paymobSettings.paymob_hmac}
                                  onChange={(e) => setPaymobSettings({...paymobSettings, paymob_hmac: e.target.value})}
                                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-bold text-brown-dark mb-1">Wallet Integration ID</label>
                                  <input 
                                    type="text" 
                                    value={paymobSettings.paymob_wallet_integration_id}
                                    onChange={(e) => setPaymobSettings({...paymobSettings, paymob_wallet_integration_id: e.target.value})}
                                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-purple-500 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-brown-dark mb-1">Card Integration ID</label>
                                  <input 
                                    type="text" 
                                    value={paymobSettings.paymob_card_integration_id}
                                    onChange={(e) => setPaymobSettings({...paymobSettings, paymob_card_integration_id: e.target.value})}
                                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-purple-500 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-brown-dark mb-1">Iframe ID</label>
                                  <input 
                                    type="text" 
                                    value={paymobSettings.paymob_iframe_id}
                                    onChange={(e) => setPaymobSettings({...paymobSettings, paymob_iframe_id: e.target.value})}
                                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-purple-500 font-mono"
                                  />
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  socket?.emit('admin_update_settings', paymobSettings, (res: any) => {
                                    if (res.success) showAlert('تم حفظ إعدادات Paymob بنجاح', 'نجاح');
                                    else showAlert('حدث خطأ أثناء الحفظ', 'خطأ');
                                  });
                                }}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl transition-colors shadow-md"
                              >
                                حفظ إعدادات الدفع
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Package Modal */}
                      {showPackageModal && (
                        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                          <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl border-4 border-orange-100 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-2xl font-black text-brown-dark mb-4 text-center">
                              {editingPackage ? 'تعديل باقة' : 'إضافة باقة جديدة'}
                            </h3>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const pkg = {
                                name: formData.get('name'),
                                description: formData.get('description'),
                                price: Number(formData.get('price')),
                                amount: Number(formData.get('amount')),
                                type: formData.get('type'),
                                image: formData.get('image') || '💰',
                                active: formData.get('active') === 'on'
                              };
                              
                              if (editingPackage) {
                                socket?.emit('admin_update_shop_item', { id: editingPackage.id, updates: pkg }, (res: any) => {
                                  if (res.success) {
                                    socket.emit('admin_get_shop_items', (items: any) => {
                                      if (Array.isArray(items)) setShopItems(items);
                                    });
                                    setShowPackageModal(false);
                                    showAlert('تم تعديل الباقة بنجاح', 'نجاح');
                                  } else {
                                    showAlert('حدث خطأ أثناء التعديل', 'خطأ');
                                  }
                                });
                              } else {
                                socket?.emit('admin_add_shop_item', pkg, (res: any) => {
                                  if (res.success) {
                                    socket.emit('admin_get_shop_items', (items: any) => {
                                      if (Array.isArray(items)) setShopItems(items);
                                    });
                                    setShowPackageModal(false);
                                    showAlert('تم إضافة الباقة بنجاح', 'نجاح');
                                  } else {
                                    showAlert('حدث خطأ أثناء الإضافة', 'خطأ');
                                  }
                                });
                              }
                            }} className="space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-brown-dark mb-1">اسم الباقة</label>
                                <input name="name" defaultValue={editingPackage?.name} required className="w-full p-3 rounded-xl border-2 border-gray-200" />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-brown-dark mb-1">الوصف</label>
                                <input name="description" defaultValue={editingPackage?.description} className="w-full p-3 rounded-xl border-2 border-gray-200" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-bold text-brown-dark mb-1">السعر (ج.م)</label>
                                  <input name="price" type="number" step="0.01" defaultValue={editingPackage?.price} required className="w-full p-3 rounded-xl border-2 border-gray-200" />
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-brown-dark mb-1">الكمية (توكنز/أيام)</label>
                                  <input name="amount" type="number" defaultValue={editingPackage?.amount} required className="w-full p-3 rounded-xl border-2 border-gray-200" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-bold text-brown-dark mb-1">النوع</label>
                                  <select name="type" defaultValue={editingPackage?.type || 'tokens'} className="w-full p-3 rounded-xl border-2 border-gray-200">
                                    <option value="tokens">توكنز</option>
                                    <option value="pro_pack">باقة Pro</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-brown-dark mb-1">صورة/إيموجي</label>
                                  <input name="image" defaultValue={editingPackage?.image || '💰'} className="w-full p-3 rounded-xl border-2 border-gray-200" />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <input type="checkbox" name="active" id="active_pkg" defaultChecked={editingPackage ? editingPackage.active : true} className="w-5 h-5" />
                                <label htmlFor="active_pkg" className="font-bold text-brown-dark">مفعلة (تظهر للاعبين)</label>
                              </div>
                              <div className="flex gap-3 pt-4">
                                <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl">
                                  حفظ
                                </button>
                                <button type="button" onClick={() => setShowPackageModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-brown-dark font-black py-3 rounded-xl">
                                  إلغاء
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
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
                  ) : adminTab === 'rewards' ? (
                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div className="box-game p-6 shadow-sm border-4 border-accent-yellow">
                          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <Gift className="w-6 h-6" />
                            إرسال مكافأة لجميع اللاعبين
                          </h3>
                          <p className="text-brown-muted font-bold mb-6">
                            هذه المكافأة ستكون متاحة لجميع اللاعبين الحاليين والجدد خلال فترة الصلاحية.
                          </p>
                          
                          <div className="space-y-4 mb-6">
                            <div>
                              <label className="block text-brown-dark font-bold mb-2">نوع المكافأة</label>
                              <select 
                                value={adminRewardType}
                                onChange={(e) => setAdminRewardType(e.target.value as any)}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold focus:border-accent-yellow outline-none"
                                dir="rtl"
                              >
                                <option value="pro_package">باقة المحترفين (بدون إعلانات)</option>
                                <option value="unlock_helpers">فتح كل وسائل المساعدة</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-brown-dark font-bold mb-2">مدة الصلاحية (بالساعات)</label>
                              <input 
                                type="number" 
                                min="1"
                                value={adminRewardDuration}
                                onChange={(e) => setAdminRewardDuration(parseInt(e.target.value) || 1)}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold focus:border-accent-yellow outline-none"
                                dir="rtl"
                              />
                              <p className="text-[10px] text-brown-muted mt-1 font-bold">
                                * ملاحظة: هذه هي المدة التي سيحصل عليها اللاعب، وهي أيضاً المدة التي سيظل فيها العرض متاحاً للتحصيل.
                              </p>
                            </div>

                            <div>
                              <label className="block text-brown-dark font-bold mb-2">رسالة الهدية</label>
                              <textarea
                                value={adminRewardMessage}
                                onChange={(e) => setAdminRewardMessage(e.target.value)}
                                className="w-full h-24 p-3 border-2 border-gray-200 rounded-xl font-bold resize-none focus:border-accent-yellow outline-none"
                                placeholder="اكتب رسالة الهدية هنا..."
                                dir="rtl"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (!adminRewardMessage.trim() || adminRewardDuration <= 0) return;
                              socket?.emit('admin_set_global_reward', {
                                type: adminRewardType,
                                durationHours: adminRewardDuration,
                                tokenAmount: adminRewardType === 'tokens' ? adminTokenRewardAmount : 0,
                                message: adminRewardMessage
                              }, (res: any) => {
                                if (res.success) {
                                  showAlert('تم تعيين المكافأة بنجاح!', 'نجاح');
                                  // Refresh history
                                  socket?.emit('admin_get_reward_history', (history: any[]) => {
                                    setRewardHistory(history);
                                  });
                                } else {
                                  showAlert(res.error || 'فشل تعيين المكافأة', 'خطأ');
                                }
                              });
                            }}
                             className="w-full py-4 bg-accent-green hover:bg-green-500 text-white rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1"
                          >
                            تفعيل المكافأة الآن 🎁
                          </button>

                          <button
                            onClick={() => {
                              socket?.emit('admin_cancel_global_reward', (res: any) => {
                                if (res.success) {
                                  showAlert('تم إلغاء المكافأة الحالية بنجاح', 'نجاح');
                                } else {
                                  showAlert(res.error || 'فشل إلغاء المكافأة', 'خطأ');
                                }
                              });
                            }}
                            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1 mt-4"
                          >
                            إلغاء المكافأة الحالية ❌
                          </button>
                        </div>

                        <div className="box-game p-6 shadow-sm border-4 border-accent-purple">
                          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <History className="w-6 h-6" />
                            سجل المكافآت المرسلة
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-right font-bold">
                              <thead>
                                <tr className="border-b-2 border-gray-100">
                                  <th className="p-2">الرسالة</th>
                                  <th className="p-2">النوع</th>
                                  <th className="p-2">مدة المكافأة</th>
                                  <th className="p-2">تاريخ الإرسال</th>
                                  <th className="p-2">نهاية توافر العرض</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rewardHistory.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="p-4 text-center text-brown-muted">لا يوجد سجل مكافآت حتى الآن</td>
                                  </tr>
                                ) : (
                                  rewardHistory.map((reward) => (
                                    <tr key={reward.id} className="border-b border-gray-50 hover:bg-gray-50">
                                      <td className="p-2 text-sm">{reward.message}</td>
                                      <td className="p-2 text-sm">
                                        {reward.type === 'pro_package' ? 'باقة المحترفين' : 
                                         reward.type === 'unlock_helpers' ? 'فتح المساعدات' : 
                                         `توزيع ${reward.tokenAmount || 0} Tokens`}
                                      </td>
                                      <td className="p-2 text-sm text-accent-orange">
                                        {reward.durationHours} ساعة
                                      </td>
                                      <td className="p-2 text-xs text-brown-muted">
                                        {new Date(reward.sentAt).toLocaleString('ar-EG')}
                                      </td>
                                      <td className="p-2 text-xs text-brown-muted">
                                        {new Date(reward.expiresAt).toLocaleString('ar-EG')}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="box-game p-6 shadow-sm border-4 border-accent-blue">
                          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <Coins className="w-6 h-6 text-accent-yellow" />
                            توزيع Tokens للاعبين (مستوى 50+)
                          </h3>
                          <p className="text-brown-muted font-bold mb-6">
                            هذه المكافأة مخصصة فقط للاعبين الذين وصلوا للمستوى 50 أو أعلى. ستكون متاحة للمطالبة بها خلال فترة زمنية محددة.
                          </p>
                          
                          <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-brown-dark font-bold mb-2">عدد الـ Tokens</label>
                                <input 
                                  type="number" 
                                  min="1"
                                  value={adminTokenRewardAmount}
                                  onChange={(e) => setAdminTokenRewardAmount(parseInt(e.target.value) || 0)}
                                  className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold focus:border-accent-blue outline-none"
                                  dir="rtl"
                                />
                              </div>
                              <div>
                                <label className="block text-brown-dark font-bold mb-2">مدة توافر العرض (ساعة)</label>
                                <input 
                                  type="number" 
                                  min="1"
                                  value={adminRewardDuration}
                                  onChange={(e) => setAdminRewardDuration(parseInt(e.target.value) || 1)}
                                  className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold focus:border-accent-blue outline-none"
                                  dir="rtl"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-brown-dark font-bold mb-2">رسالة التهنئة</label>
                              <textarea
                                value={adminTokenRewardMessage}
                                onChange={(e) => setAdminTokenRewardMessage(e.target.value)}
                                className="w-full h-24 p-3 border-2 border-gray-200 rounded-xl font-bold resize-none focus:border-accent-blue outline-none"
                                placeholder="اكتب رسالة التهنئة هنا..."
                                dir="rtl"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (!adminTokenRewardMessage.trim() || adminTokenRewardAmount <= 0 || adminRewardDuration <= 0) return;
                              
                              if (!confirmTokenSend) {
                                setConfirmTokenSend(true);
                                setTimeout(() => setConfirmTokenSend(false), 3000);
                                return;
                              }

                              socket?.emit('admin_set_global_reward', {
                                type: 'tokens',
                                durationHours: adminRewardDuration,
                                tokenAmount: adminTokenRewardAmount,
                                message: adminTokenRewardMessage
                              }, (res: any) => {
                                setConfirmTokenSend(false);
                                if (res.success) {
                                  showAlert(`تم تفعيل مكافأة الـ Tokens بنجاح!`, 'نجاح');
                                  // Refresh history
                                  socket?.emit('admin_get_reward_history', (history: any[]) => {
                                    setRewardHistory(history);
                                  });
                                } else {
                                  showAlert(res.error || 'فشل تفعيل المكافأة', 'خطأ');
                                }
                              });
                            }}
                            className={`w-full py-4 text-white rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1 ${confirmTokenSend ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-accent-blue hover:bg-blue-600'}`}
                          >
                            {confirmTokenSend ? `تأكيد تفعيل ${adminTokenRewardAmount} Tokens لمدة ${adminRewardDuration} ساعة؟` : 'تفعيل مكافأة الـ Tokens الآن 🪙'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : adminTab === 'policies' ? (
                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                      <div className="max-w-3xl mx-auto space-y-6">
                        <div className="box-game p-6 shadow-sm border-4 border-brown-dark">
                          <h3 className="text-xl font-black text-brown-dark mb-4 flex items-center gap-2">
                            <FileText className="w-6 h-6" />
                            سياسات اللعبة
                          </h3>
                          <p className="text-brown-muted font-bold mb-6">
                            قم بتعديل الشروط والأحكام وسياسة الخصوصية. ستظهر هذه النصوص للاعبين الجدد عند التسجيل.
                          </p>
                          
                          <div className="space-y-6">
                            <div>
                              <label className="block text-brown-dark font-black mb-2 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-accent-blue" />
                                الشروط والأحكام (عربي)
                              </label>
                              <textarea
                                value={gamePolicies?.termsAr || ''}
                                onChange={(e) => setGamePolicies(prev => ({ ...(prev || {}), termsAr: e.target.value }))}
                                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl font-bold text-sm resize-none focus:border-accent-blue focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                placeholder="اكتب الشروط والأحكام (عربي) هنا..."
                                dir="rtl"
                              />
                              <label className="block text-brown-dark font-black mb-2 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-accent-blue" />
                                الشروط والأحكام (إنجليزي)
                              </label>
                              <textarea
                                value={gamePolicies?.termsEn || ''}
                                onChange={(e) => setGamePolicies(prev => ({ ...(prev || {}), termsEn: e.target.value }))}
                                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl font-bold text-sm resize-none focus:border-accent-blue focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                placeholder="Write Terms and Conditions (English) here..."
                                dir="ltr"
                              />
                            </div>

                            <div>
                              <label className="block text-brown-dark font-black mb-2 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-accent-purple" />
                                سياسة الخصوصية (عربي)
                              </label>
                              <textarea
                                value={gamePolicies?.privacyAr || ''}
                                onChange={(e) => setGamePolicies(prev => ({ ...(prev || {}), privacyAr: e.target.value }))}
                                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl font-bold text-sm resize-none focus:border-accent-purple focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                                placeholder="اكتب سياسة الخصوصية (عربي) هنا..."
                                dir="rtl"
                              />
                              <label className="block text-brown-dark font-black mb-2 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-accent-purple" />
                                سياسة الخصوصية (إنجليزي)
                              </label>
                              <textarea
                                value={gamePolicies?.privacyEn || ''}
                                onChange={(e) => setGamePolicies(prev => ({ ...(prev || {}), privacyEn: e.target.value }))}
                                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl font-bold text-sm resize-none focus:border-accent-purple focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                                placeholder="Write Privacy Policy (English) here..."
                                dir="ltr"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              socket?.emit('admin_update_policies', gamePolicies, (res: any) => {
                                if (res.success) {
                                  showAlert('تم حفظ السياسات بنجاح!', 'نجاح');
                                } else {
                                  showAlert('فشل حفظ السياسات', 'خطأ');
                                }
                              });
                            }}
                            className="w-full mt-6 py-4 bg-brown-dark hover:bg-brown-900 text-white rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1"
                          >
                            حفظ السياسات
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : adminTab === 'contacts' ? (
                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                      <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                          <div>
                            <h2 className="text-3xl font-black text-brown-dark mb-2">رسائل اللاعبين</h2>
                            <p className="text-brown-muted font-bold">تواصل مع اللاعبين وراجع استفساراتهم</p>
                          </div>
                          <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl font-black">
                            {adminContacts.length} رسالة
                          </div>
                        </div>

                        {adminContacts.length === 0 ? (
                          <div className="bg-white rounded-3xl p-12 text-center border-4 border-dashed border-gray-100">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Mail className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-brown-dark mb-2">لا توجد رسائل حالياً</h3>
                            <p className="text-brown-muted font-bold">عندما يرسل اللاعبون رسائل عبر "اتصل بنا" ستظهر هنا</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-6">
                            {adminContacts.map((contact) => (
                              <div key={contact.id} className="bg-white rounded-3xl p-6 shadow-sm border-2 border-gray-100 hover:border-blue-200 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                      <User className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                      <h3 className="font-black text-brown-dark text-lg">{contact.name}</h3>
                                      <div className="flex items-center gap-2 text-xs font-bold text-brown-muted">
                                        <span>سيريال: {contact.playerSerial}</span>
                                        <span>•</span>
                                        <span>{new Date(contact.timestamp).toLocaleString('ar-EG')}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                                        socket?.emit('admin_delete_contact', contact.id, (res: any) => {
                                          if (res.success) {
                                            setAdminContacts(prev => prev.filter(c => c.id !== contact.id));
                                            showAlert('تم حذف الرسالة بنجاح', 'نجاح');
                                          } else {
                                            showAlert('فشل حذف الرسالة', 'خطأ');
                                          }
                                        });
                                      }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="حذف الرسالة"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4">
                                  <div className="text-blue-600 font-black text-sm mb-2">الموضوع: {contact.subject}</div>
                                  <p className="text-brown-dark font-bold whitespace-pre-wrap leading-relaxed">
                                    {contact.message}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : adminTab === 'avatar_review' ? (
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                      <div className="max-w-3xl mx-auto space-y-4">
                        <div className="box-game p-4 shadow-sm border-4 border-purple-600">
                          <h3 className="text-lg font-black text-purple-600 mb-2 flex items-center gap-2">
                            <Camera className="w-5 h-5" />
                            مراجعة صور الأفاتار
                          </h3>
                          <p className="text-gray-600 font-bold mb-4 text-xs">
                            الصور التي لم يستطع الذكاء الاصطناعي تأكيد سلامتها بنسبة 100%.
                          </p>

                          {pendingAvatars.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                              <p className="text-gray-400 font-bold">لا توجد صور بانتظار المراجعة حالياً.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {pendingAvatars.map((player) => (
                                <div key={player.serial} className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm flex flex-col gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-200">
                                      <img 
                                        src="/assets/avatar.png" 
                                        alt={player.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="font-black text-brown-dark text-sm truncate">{player.name}</p>
                                      <p className="text-[10px] font-bold text-gray-400">Level: {player.level}</p>
                                    </div>
                                  </div>

                                  <div className="aspect-square w-full rounded-lg overflow-hidden border-2 border-purple-100 bg-gray-50 flex items-center justify-center">
                                    <img 
                                      src={player.pendingAvatar} 
                                      alt="Pending Avatar"
                                      className="max-w-full max-h-full object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        socket?.emit('admin_review_avatar', { playerSerial: player.serial, status: 'approved' }, (res: any) => {
                                          if (res.success) {
                                            setPendingAvatars(prev => prev.filter(p => p.serial !== player.serial));
                                            showAlert('تمت الموافقة على الصورة بنجاح!', 'نجاح');
                                          } else {
                                            showAlert(res.error || 'فشل تحديث الحالة', 'خطأ');
                                          }
                                        });
                                      }}
                                      className="flex-1 py-2 bg-accent-green hover:bg-green-600 text-white rounded-lg font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1"
                                    >
                                      <Check className="w-4 h-4" />
                                      موافقة
                                    </button>
                                    <button
                                      onClick={() => {
                                        socket?.emit('admin_review_avatar', { playerSerial: player.serial, status: 'rejected' }, (res: any) => {
                                          if (res.success) {
                                            setPendingAvatars(prev => prev.filter(p => p.serial !== player.serial));
                                            showAlert('تم رفض الصورة.', 'تم الرفض');
                                          } else {
                                            showAlert(res.error || 'فشل تحديث الحالة', 'خطأ');
                                          }
                                        });
                                      }}
                                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1"
                                    >
                                      <X className="w-4 h-4" />
                                      رفض
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : adminTab === 'announcements' ? (
                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div className="box-game p-6 shadow-sm border-4 border-red-500">
                          <h3 className="text-xl font-black text-red-600 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" />
                            إرسال إشعار لجميع اللاعبين
                          </h3>
                          <p className="text-brown-muted font-bold mb-6">
                            هذه الرسالة ستظهر فوراً كإشعار منبثق (Modal) لجميع اللاعبين المتصلين حالياً.
                          </p>
                          <textarea
                            value={adminAnnouncementMessage}
                            onChange={(e) => setAdminAnnouncementMessage(e.target.value)}
                            className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl font-bold text-lg mb-4 resize-none focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                            placeholder="اكتب رسالة التنبيه هنا..."
                            dir="rtl"
                          />
                          <button
                            onClick={() => {
                              if (!adminAnnouncementMessage.trim()) return;
                              socket?.emit('admin_send_announcement', adminAnnouncementMessage, (res: any) => {
                                if (res.success) {
                                  showAlert('تم إرسال الإشعار لجميع اللاعبين بنجاح!', 'نجاح');
                                } else {
                                  showAlert('فشل إرسال الإشعار', 'خطأ');
                                }
                              });
                            }}
                            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1 mb-8"
                          >
                            إرسال الإشعار الآن
                          </button>

                          <div className="border-t-2 border-dashed border-gray-200 pt-8 mt-8">
                            <h3 className="text-xl font-black text-accent-purple mb-4 flex items-center gap-2">
                              <Bell className="w-6 h-6" />
                              إرسال إشعار للهاتف (Push Notification)
                            </h3>

                            {pushStats === null ? (
                              <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-4 rounded-xl mb-6 flex items-center justify-center gap-3">
                                {pushStatsError ? (
                                  <p className="text-sm font-bold text-red-500">{pushStatsError}</p>
                                ) : (
                                  <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                                    <p className="text-sm font-bold text-gray-500">جاري جلب الإحصائيات...</p>
                                  </>
                                )}
                                {!localStorage.getItem('khamin_admin_token') && (
                                  <p className="text-xs text-red-500 font-bold"> (يرجى تسجيل الدخول مجدداً لتفعيل الإحصائيات)</p>
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      <Bell className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-blue-800">المشتركين في الإشعارات</p>
                                      <p className="text-xs text-blue-600">الذين وافقوا على الإشعارات</p>
                                    </div>
                                  </div>
                                  <div className="text-2xl font-black text-blue-700">
                                    {pushStats.count}
                                  </div>
                                </div>
                                <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-xl flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                      <Users className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-purple-800">إجمالي اللاعبين</p>
                                      <p className="text-xs text-purple-600">جميع اللاعبين المسجلين</p>
                                    </div>
                                  </div>
                                  <div className="text-2xl font-black text-purple-700">
                                    {pushStats.totalPlayers}
                                  </div>
                                </div>
                              </div>
                            )}
                            <p className="text-brown-muted font-bold mb-6">
                              هذا الإشعار سيظهر على شاشة قفل الهاتف لجميع اللاعبين الذين قاموا بتثبيت اللعبة (PWA) ووافقوا على الإشعارات.
                            </p>
                            <div className="space-y-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    localStorage.removeItem('khamin_push_prompt_dismissed');
                                    showAlert('تم إعادة تعيين رسالة الترحيب. ستظهر بعد دقيقة من تحديث الصفحة.', 'نجاح');
                                  }}
                                  className="text-xs bg-gray-300 p-2 rounded-lg font-bold text-brown-muted hover:bg-gray-200 rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1"
                                >
                                  إعادة تعيين رسالة الترحيب (للتجربة)
                                </button>
                              </div>
                              <div>
                                <label className="block text-sm font-black text-brown-dark mb-1">عنوان الإشعار</label>
                                <input
                                  type="text"
                                  value={pushTitle}
                                  onChange={(e) => setPushTitle(e.target.value)}
                                  className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold focus:border-accent-purple outline-none"
                                  placeholder="مثال: تحديث جديد متاح! 🚀"
                                  dir="rtl"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-black text-brown-dark mb-1">نص الإشعار</label>
                                <textarea
                                  value={pushBody}
                                  onChange={(e) => setPushBody(e.target.value)}
                                  className="w-full h-24 p-3 border-2 border-gray-200 rounded-xl font-bold focus:border-accent-purple outline-none resize-none"
                                  placeholder="اكتب تفاصيل الإشعار هنا..."
                                  dir="rtl"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-black text-brown-dark mb-1">الرابط (اختياري)</label>
                                <input
                                  type="text"
                                  value={pushUrl}
                                  onChange={(e) => setPushUrl(e.target.value)}
                                  className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold focus:border-accent-purple outline-none"
                                  placeholder="/"
                                  dir="ltr"
                                />
                              </div>
                              <button
                                disabled={isSendingPush || !pushTitle || !pushBody}
                                onClick={async () => {
                                  setIsSendingPush(true);
                                  try {
                                    const response = await fetch('/api/push/send', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        title: pushTitle,
                                        body: pushBody,
                                        url: pushUrl,
                                        adminToken: localStorage.getItem('khamin_admin_token')
                                      })
                                    });
                                    const res = await response.json();
                                    if (res.success) {
                                      const msg = res.sentCount === res.totalAttempted 
                                        ? `تم إرسال الإشعار لـ ${res.sentCount} جهاز بنجاح! 🔔`
                                        : `تم إرسال الإشعار لـ ${res.sentCount} من أصل ${res.totalAttempted} جهاز بنجاح! (تم تنظيف الاشتراكات القديمة)`;
                                      showAlert(msg, 'نجاح');
                                      setPushTitle('');
                                      setPushBody('');
                                    } else {
                                      showAlert('فشل إرسال الإشعار', 'خطأ');
                                    }
                                  } catch (err) {
                                    showAlert('حدث خطأ أثناء الإرسال', 'خطأ');
                                  } finally {
                                    setIsSendingPush(false);
                                  }
                                }}
                                className={`w-full py-4 bg-accent-purple hover:bg-purple-600 text-white rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1 ${isSendingPush ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isSendingPush ? 'جاري الإرسال...' : 'إرسال إشعار للهواتف الآن'}
                              </button>
                            </div>
                          </div>

                          <div className="border-t-2 border-dashed border-gray-200 pt-8 mt-8">
                            <h3 className="text-2xl font-black text-brown-dark mb-2 flex items-center gap-2">
                              <RefreshCw className="text-accent-blue" />
                              تحديث إجباري لجميع اللاعبين
                            </h3>
                            <p className="text-brown-muted font-bold mb-6">
                              سيتم إظهار رسالة لجميع اللاعبين تطلب منهم تحديث اللعبة (Refresh) للحصول على آخر التحديثات.
                            </p>
                            <button
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من إرسال طلب التحديث لجميع اللاعبين؟')) {
                                  socket?.emit('admin_force_refresh', (res: any) => {
                                    if (res.success) {
                                      showAlert('تم إرسال طلب التحديث لجميع اللاعبين!', 'نجاح');
                                    } else {
                                      showAlert('فشل إرسال طلب التحديث', 'خطأ');
                                    }
                                  });
                                }
                              }}
                              className="w-full py-4 bg-accent-blue hover:bg-blue-600 text-white rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1"
                            >
                              إرسال طلب التحديث الآن
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : adminTab === 'customization' ? (
                    <AdminCustomization showAlert={showAlert} socket={socket} gamePolicies={gamePolicies} setGamePolicies={setGamePolicies} luckyWheelEnabled={luckyWheelEnabled} setLuckyWheelEnabled={setLuckyWheelEnabled} />
                  ) : adminTab === 'live_matches' ? (
                    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-brown-dark flex items-center gap-2">
                          <Activity className="w-6 h-6 text-red-500" />
                          المباريات المباشرة الجارية الآن
                        </h3>
                        <button 
                          onClick={() => {
                            socket?.emit('admin_get_active_rooms', (rooms: any) => {
                              if (Array.isArray(rooms)) setActiveRooms(rooms);
                            });
                          }}
                          className="px-4 py-2 bg-white border-2 border-gray-100 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          تحديث القائمة
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2">
                        {activeRooms.length === 0 ? (
                          <div className="col-span-full flex flex-col items-center justify-center py-20 text-brown-light">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Activity className="w-10 h-10 opacity-20" />
                            </div>
                            <p className="font-black text-lg">لا توجد مباريات نشطة حالياً</p>
                            <p className="text-sm font-bold opacity-60">سيظهر هنا أي تحدي يبدأ بين لاعبين</p>
                          </div>
                        ) : (
                          activeRooms.map((room) => (
                            <motion.div 
                              key={room.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white rounded-3xl p-6 shadow-sm border-2 border-gray-100 hover:border-red-200 transition-all group"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                                  مباشر
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">ID: {room.id}</span>
                              </div>

                              <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="flex flex-col items-center gap-2 flex-1">
                                  <div className="w-12 h-12">
                                    {renderAvatarContent(room.players[0]?.avatar, getLevel(room.players[0]?.xp || 0), false, true, room.players[0]?.selectedFrame)}
                                  </div>
                                  <span className="text-xs font-black text-brown-dark truncate w-full text-center">{room.players[0]?.name}</span>
                                </div>
                                
                                <div className="text-xl font-black text-gray-300 italic">VS</div>

                                <div className="flex flex-col items-center gap-2 flex-1">
                                  <div className="w-12 h-12">
                                    {renderAvatarContent(room.players[1]?.avatar, getLevel(room.players[1]?.xp || 0), false, true, room.players[1]?.selectedFrame)}
                                  </div>
                                  <span className="text-xs font-black text-brown-dark truncate w-full text-center">{room.players[1]?.name || '...'}</span>
                                </div>
                              </div>

                              <button 
                                onClick={() => {
                                  // Set spectating ID first to avoid race condition with room_update
                                  updateSpectatingRoomId(room.id);
                                  socket?.emit('admin_join_spectator', room.id, (res: any) => {
                                    if (res.success) {
                                      setShowAdminDashboard(false);
                                    } else {
                                      updateSpectatingRoomId(null);
                                      showAlert(res.error || 'فشل الانضمام للمشاهدة', 'خطأ');
                                    }
                                  });
                                }}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-sm shadow-[0_4px_0_0_#b91c1c] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                دخول لمشاهدة المباراة
                              </button>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : adminTab === 'quick_chat' ? (
                    <QuickChatManager config={customConfig} refreshConfig={refreshConfig} showAlert={showAlert} />
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
                                    onClick={() => {
                                      const serialToSearch = report.reportedSerial || report.reporterSerial;
                                      setAdminSearchQuery(serialToSearch);
                                      setAdminTab('players');
                                    }}
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
                          <div className="mt-3 text-sm font-bold text-brown-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              إجمالي عدد اللاعبين المسجلين: <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">{adminPlayers.length}</span>
                              <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs mr-2">
                                متصل الآن: {adminPlayers.filter(p => p.isOnline).length}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wider text-brown-light">تصنيف:</span>
                              <select 
                                value={adminPlayerFilter}
                                onChange={(e) => setAdminPlayerFilter(e.target.value as any)}
                                className="bg-gray-100 border-2 rounded-lg px-3 py-1.5 text-xs font-black text-brown-dark focus:ring-2 focus:ring-purple-400 outline-none cursor-pointer"
                              >
                                <option value="all">الكل ({adminPlayers.length})</option>
                                <option value="reports">الأكثر بلاغات ({adminPlayers.filter(p => p.reports > 0).length})</option>
                                <option value="level">الأعلى مستوى ({adminPlayers.length})</option>
                                <option value="wins">الأكثر فوزاً ({adminPlayers.filter(p => p.wins > 0).length})</option>
                                <option value="streak">الأكثر فوز متتالي ({adminPlayers.filter(p => p.streak > 0).length})</option>
                                <option value="online">المتصلون الآن ({adminPlayers.filter(p => p.isOnline).length})</option>
                                <option value="banned">المحظورين ({adminPlayers.filter(p => (p.banUntil && p.banUntil > Date.now()) || p.isPermanentBan === 1).length})</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Players List */}
                        <div 
                          ref={adminPlayersListRef}
                          onScroll={handleAdminPlayersScroll}
                          className="flex-1 overflow-y-auto p-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredAdminPlayers.length === 0 ? (
                              <div className="col-span-full text-center py-12 text-brown-light font-bold">
                                لا يوجد لاعبين يطابقون هذا البحث أو التصنيف
                              </div>
                            ) : (
                              filteredAdminPlayers
                                .slice(0, adminVisiblePlayersCount)
                                .map((p, index) => (
                                <div key={`admin-player-${p.serial}-${index}`} className="box-game p-5 hover:border-purple-200 transition-all group relative">
                                  <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14">
                                      {renderAvatarContent(p.avatar, getLevel(p.xp), false, p.isOnline, p.selectedFrame)}
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

                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className={`p-2 rounded-xl text-center border-2 ${p.proPackageExpiry > Date.now() ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                      <div className={`text-[10px] font-bold ${p.proPackageExpiry > Date.now() ? 'text-green-500' : 'text-gray-400'}`}>باقة المحترفين</div>
                                      <div className={`text-xs font-black ${p.proPackageExpiry > Date.now() ? 'text-green-600' : 'text-gray-500'}`}>
                                        {p.proPackageExpiry > Date.now() ? new Date(p.proPackageExpiry).toLocaleDateString('ar-EG') : 'غير مفعلة'}
                                      </div>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded-xl text-center border-2 border-red-100">
                                      <div className="text-[10px] font-bold text-red-400">البلاغات</div>
                                      <div className="text-sm font-black text-red-600">{p.reports || 0}</div>
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
                                    <div className="bg-blue-50 p-2 rounded-xl text-center">
                                      <div className="text-[10px] font-bold text-blue-400">المستوى</div>
                                      <div className="text-sm font-black text-blue-600">{getLevel(p.xp)}</div>
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
                                        showPrompt('كم عدد الأيام التي تريد إضافتها لباقة المحترفين؟', '30', (days) => {
                                          if (days !== null && days.trim() !== '' && !isNaN(parseInt(days))) {
                                            const durationMs = parseInt(days) * 24 * 60 * 60 * 1000;
                                            const currentExpiry = Math.max(Date.now(), p.proPackageExpiry || 0);
                                            const newExpiry = currentExpiry + durationMs;
                                            socket?.emit('admin_update_player', { serial: p.serial, updates: { proPackageExpiry: newExpiry } }, (res: any) => {
                                              if (res.success) socket.emit('admin_get_players', (players: any) => { if (Array.isArray(players)) setAdminPlayers(players); });
                                            });
                                          }
                                        }, 'إضافة باقة المحترفين');
                                      }}
                                      className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black hover:bg-green-600 hover:text-white transition-all"
                                    >
                                      باقة المحترفين
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
                                    {(p.banUntil > Date.now() || p.isPermanentBan === 1) && (
                                      <button 
                                        onClick={() => {
                                          showConfirm('هل أنت متأكد من إلغاء حظر هذا اللاعب؟', () => {
                                            socket?.emit('admin_update_player', { serial: p.serial, updates: { banUntil: 0, isPermanentBan: 0 } }, (res: any) => {
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
                              ))
                            )}
                          </div>
                          
                          {adminVisiblePlayersCount < filteredAdminPlayers.length && (
                            <div className="text-center py-6 text-xs font-bold text-brown-light animate-pulse">
                              جاري تحميل المزيد من اللاعبين...
                            </div>
                          )}
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
                              <div className="max-h-100 overflow-y-auto space-y-2 pr-2">
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
          {showReportModal && (opponent || reportTarget) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
              onClick={() => {
                setShowReportModal(false);
                setReportTarget(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="card-game p-4 w-full max-w-md text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-3xl font-black text-main mb-4">الإبلاغ عن {reportTarget ? reportTarget.name : opponent?.name}</h3>
                <div className="space-y-4 mb-4">
                  <button 
                    onClick={() => handleReportPlayer('الكذب والتضليل فى الأجابة')}
                    className="w-full btn-game btn-danger bg-red-100 border-red-200 text-red-500 hover:bg-red-200 py-2 text-lg"
                  >
                    الكذب والتضليل فى الأجابة
                  </button>
                  <button 
                    onClick={() => handleReportPlayer('يتعمد التأخير فى الرد')}
                    className="w-full btn-game btn-danger bg-red-100 border-red-200 text-red-500 hover:bg-red-200 py-2 text-lg"
                  >
                    يتعمد التأخير فى الرد
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
                  className="w-full btn-game btn-secondary px-4 md:px-6 py-2 md:py-3 text-base md:text-lg"
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
                  onTouchStart={(e) => e.stopPropagation()}
                  className="w-full h-2 bg-gray-400 rounded-lg cursor-pointer accent-purple-500"
                />
              </div>

              <div className="mt-1 text-white text-[13px] text-center bg-red-500 px-2 py-1 shadow-sm backdrop-blur-sm items-center gap-2">يجب أن تلتزم صور الأفاتار المرفوعة بقوانين اللعبة ومعايير المجتمع. ⚠️</div>

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

  const renderCollectionModal = () => {
    if (!showCollectionModal) return null;
    const category = COLLECTION_DATA.find(c => c.id === showCollectionModal);
    if (!category) return null;

    return (
      <AnimatePresence>
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCollectionModal(null)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white border-8 border-black rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          >
            {/* Header */}
            <div className="p-6 border-b-4 border-black flex justify-between items-center bg-accent-blue/10">
              <button onClick={() => setShowCollectionModal(null)} className="w-10 h-10 bg-white border-4 border-black rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3 flex-row-reverse">
                <span className="text-3xl">{category.icon}</span>
                <h2 className="text-2xl font-bold text-main uppercase tracking-tighter">مكافآت {category.name}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {category.stages.map((stage, sIdx) => {
                const prevStageComplete = sIdx === 0 || category.stages[sIdx - 1].images.every(img => {
                  const norm = normalizeEgyptian(img).toLowerCase();
                  const count = playerCollection.find(c => c.image_name === norm)?.count || 0;
                  return count >= 5;
                });
                const isLocked = !prevStageComplete;
                const isClaimed = claimedCollectionRewards.some(r => r.category_id === category.id && r.stage === stage.stage);
                const isStageComplete = stage.images.every(imgName => {
                  const norm = normalizeEgyptian(imgName).toLowerCase();
                  const count = playerCollection.find(c => c.image_name === norm)?.count || 0;
                  return count >= 5;
                });

                return (
                  <div key={stage.stage} className={`relative ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between mb-4 flex-row-reverse" dir="ltr">
                      <h3 className="text-xl font-black text-main">المرحلة {stage.stage}</h3>
                      {isLocked && <Lock className="w-5 h-5 text-gray-400" />}
                      {isClaimed && <Check className="w-6 h-6 text-green-500" />}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {stage.images.map((imgName, iIdx) => {
                        const norm = normalizeEgyptian(imgName).toLowerCase();
                        const count = playerCollection.find(c => c.image_name === norm)?.count || 0;
                        const isRevealed = count > 0;
                        const isUnlocked = count >= 5;

                        return (
                          <div key={iIdx} className="flex flex-col items-center gap-1">
                            <div className={`w-full aspect-square bg-gray-50/50 border-4 border-black rounded-2xl flex items-center justify-center relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isUnlocked ? 'bg-white' : ''}`}>
                              {isRevealed ? (
                                <div className="relative w-full h-full">
                                  {(() => {
                                    const found = adminImages.find(img => {
                                      const catMatch = img.category === category.id;
                                      const nameMatch = img.name.trim() === imgName.trim();
                                      return catMatch && nameMatch;
                                    });
                                    return (
                                      <img 
                                        src={found?.data ? (found.data.startsWith('data:') ? found.data : `data:image/png;base64,${found.data}`) : `https://picsum.photos/seed/${imgName}/200/200`}
                                        alt={imgName} 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    );
                                  })()}
                                  <span className="absolute bottom-1 left-1 text-[8px] font-black text-white bg-black/50 px-1 rounded">
                                    {imgName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-4xl font-black text-gray-300">?</span>
                              )}
                              {count > 0 && (
                                <div className={`absolute bottom-1 right-1 border-2 border-black rounded-lg px-1 text-[10px] font-black ${isUnlocked ? 'bg-green-400' : 'bg-accent-yellow'}`}>
                                  {count}/5
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reward Footer */}
                    {stage.stage === 3 ? (
                      <RewardCard 
                        playerName={playerName}
                        level={getLevel(xp)}
                        avatar={avatar}
                        selectedFrame={selectedFrame}
                        reward={stage.reward}
                        categoryName={category.name}
                        isClaimed={isClaimed}
                        isStageComplete={isStageComplete}
                        previewFrame={`/${category.id}-category-frame-gift.png`}
                        customConfig={customConfig}
                        onClaim={() => {
                          setPendingClaimReward({ categoryId: category.id, stage: stage.stage });
                        }}
                      />
                    ) : (
                      <div className="mt-4 p-2 bg-accent-yellow/10 border-4 border-black rounded-2xl flex items-center justify-between flex-row-reverse">
                        <div className="flex items-center gap-0.5 text-sm font-black text-main">
                          <Zap className="w-4 h-4 text-accent-yellow fill-accent-yellow" />
                          <span>{stage.reward.xp} XP</span>
                          {stage.reward.frame && <span className="text-accent-blue">+ إطار مميز</span>}
                        </div>
                        
                        {isClaimed ? (
                          <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-black">تم الاستلام</div>
                        ) : (
                          <button 
                            disabled={!isStageComplete}
                            onClick={() => {
                              setPendingClaimReward({ categoryId: category.id, stage: stage.stage });
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-colors ${isStageComplete ? 'bg-orange-500 text-white hint-glow hover:bg-orange/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                          >
                            استلام المكافأة
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  const renderUpdateBanner = () => {
    if (!needRefresh && !needsUpdate) return null;
    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] bg-accent-blue text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20 w-[90%] max-w-md"
          dir="rtl"
        >
          <div className="flex flex-col flex-1">
            <span className="font-black text-sm">تمت اضافة بعض المميزات الجديدة!</span>
            <span className="text-xs font-bold opacity-90">يرجى انهاء الجولات قبل التحديث للحصول على أفضل تجربة.</span>
          </div>
          <button
            onClick={async () => {
              try {
                // Unregister all Service Workers
                if ('serviceWorker' in navigator) {
                  const registrations = await navigator.serviceWorker.getRegistrations();
                  for (const registration of registrations) {
                    await registration.unregister();
                  }
                }
                
                // Clear all Caches
                if ('caches' in window) {
                  const cacheNames = await caches.keys();
                  await Promise.all(cacheNames.map(name => caches.delete(name)));
                }
                
                // Final Hard Reload
                window.location.reload();
              } catch (error) {
                console.error('Update process failed:', error);
                window.location.reload();
              }
            }}
            className="bg-white text-accent-blue px-4 py-2 rounded-xl font-black text-sm hover:bg-gray-100 transition-colors whitespace-nowrap shadow-sm"
          >
            تحديث
          </button>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  };

  if (isMaintenanceMode) {
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
            <div className="absolute inset-0 bg-accent-white/20 animate-pulse"></div>
            <img src="/icon-3.png" alt="Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain relative z-10" />
          </motion.div>

          {/* Game Name */}
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black text-main mb-6 uppercase tracking-tighter text-center"
            style={{ textShadow: '4px 4px 0px #FFF, -1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF' }}
          >
            خمن تخمينة
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl font-black text-brown-muted text-center leading-relaxed mb-8"
          >
            احنا اسفين, دقايق بس بنضيف حاجات جديدة يا ابطال التخمين.
          </motion.p>
        </div>
      </div>
    );
  }

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
            <div className="absolute inset-0 bg-accent-white/20 animate-pulse"></div>
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

  if (spectatingRoomId) {
    if (!spectatorRoomData) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black text-white font-black text-2xl animate-pulse">
          جاري تحميل بيانات المباراة... 🚀
        </div>
      );
    }
    return (
      <>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[7000] flex flex-col"
          >
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-black flex items-center gap-2 animate-pulse">
                  <Activity className="w-3 h-3" />
                  وضع المشاهدة المباشرة
                </div>
                <div className="text-white/60 text-xs font-bold">غرفة: {spectatingRoomId}</div>
              </div>
              
              <button 
                onClick={() => {
                  socket?.emit('admin_leave_spectator', spectatingRoomId);
                  updateSpectatingRoomId(null);
                  setSpectatorRoomData(null);
                  setShowAdminDashboard(true);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-sm transition-all"
              >
                خروج من المشاهدة
              </button>
            </div>

            {showCitySearch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => toggleCitySearch()}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border-4 border-accent-blue/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-accent-blue p-4 flex justify-between items-center text-white">
              <h3 className="font-black text-xl flex items-center gap-2">
                <Search className="w-6 h-6" /> البحث في المدينة
              </h3>
              <button onClick={() => toggleCitySearch()} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* City Selection */}
              <div className="flex gap-3 justify-center mb-6">
                {[
                  { id: 1, name: 'مدينة الأحلام' },
                  { id: 2, name: 'مدينة الظلام' },
                  { id: 3, name: 'مدينة الثلج' },
                  { id: 4, name: 'مدينة القدماء' }
                ].map(city => (
                  <div key={city.id} className="flex flex-col items-center gap-1">
                    <img 
                      src={`/city-gift-0${city.id}.jpg`}
                      alt={city.name}
                      className={`w-16 h-16 rounded-xl object-cover cursor-pointer border-4 transition-all ${
                        (citySearchState?.active ? citySearchState.cityId === city.id : selectedCity === city.id) 
                          ? 'border-accent-blue scale-110 shadow-md' 
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => !citySearchState?.active && setSelectedCity(city.id)}
                    />
                    <span className={`text-[10px] font-bold transition-all ${
                      (citySearchState?.active ? citySearchState.cityId === city.id : selectedCity === city.id)
                        ? 'text-accent-blue scale-110'
                        : 'text-gray-500'
                    }`}>{city.name}</span>
                  </div>
                ))}
              </div>

              {/* Main Image */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-6 bg-gray-900 shadow-inner border-2 border-gray-200">
                <img 
                  src={`/city-gift-0${citySearchState?.active ? citySearchState.cityId : selectedCity}.jpg`} 
                  className={`w-full h-full object-cover transition-opacity duration-500 ${citySearchState?.active && !isCitySearchFinished ? 'opacity-50' : 'opacity-100'}`} 
                  alt="Selected City"
                />
                
                {citySearchState?.active && !isCitySearchFinished && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-search-circle" />
                  </div>
                )}
                
                {isCitySearchFinished && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-accent-green text-white px-6 py-3 rounded-full font-black text-xl shadow-lg flex items-center gap-2 animate-bounce">
                      <Gift className="w-6 h-6" /> اكتمل البحث!
                    </div>
                  </div>
                )}
              </div>

              {/* Rewards Display */}
              {citySearchState?.active && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6">
                  <h4 className="text-center font-bold text-sm text-gray-500 mb-3">
                    {isCitySearchFinished ? 'المكافآت التي حصلت عليها:' : 'المكافآت التي يتم تجميعها:'}
                  </h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {displayedRewards && (
                      <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-accent-blue flex items-center gap-1 shadow-sm border border-gray-100">
                        <Star className="w-4 h-4" /> {displayedRewards.xp} XP
                      </span>
                    )}
                    {displayedRewards && (
                      <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-purple-600 flex items-center gap-1 shadow-sm border border-gray-100">
                        <Coins className="w-4 h-4" /> {displayedRewards.tokens}
                      </span>
                    )}
                    {displayedRewards && (
                      <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-yellow-600 flex items-center gap-1 shadow-sm border border-gray-100">
                        <Crown className="w-4 h-4" /> {displayedRewards.pro_package_days} يوم
                      </span>
                    )}
                    {displayedRewards && (
                      <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-cyan-500 flex items-center gap-1 shadow-sm border border-gray-100">
                        <Snowflake className="w-4 h-4" /> {displayedRewards.time_freeze}
                      </span>
                    )}
                    {displayedRewards && (
                      <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-indigo-500 flex items-center gap-1 shadow-sm border border-gray-100">
                        <Hash className="w-4 h-4" /> {displayedRewards.word_count}
                      </span>
                    )}
                    {displayedRewards && (
                      <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-orange-500 flex items-center gap-1 shadow-sm border border-gray-100">
                        <Type className="w-4 h-4" /> {displayedRewards.word_length}
                      </span>
                    )}
                    {displayedRewards && (
                      <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-blue-500 flex items-center gap-1 shadow-sm border border-gray-100">
                        <HelpCircle className="w-4 h-4" /> {displayedRewards.hint}
                      </span>
                    )}
                    {displayedRewards && (
                      <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-purple-400 flex items-center gap-1 shadow-sm border border-gray-100">
                        <Eye className="w-4 h-4" /> {displayedRewards.spy_lens}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!citySearchState?.active ? (
                <button 
                  onClick={handleStartCitySearch} 
                  className="w-full py-4 bg-accent-blue hover:bg-blue-600 text-white rounded-2xl font-black text-lg shadow-[0_4px_0_0_#1e3a8a] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <Tv className="w-6 h-6" /> ابدأ البحث (شاهد إعلان)
                </button>
              ) : !isCitySearchFinished ? (
                <div className="text-center bg-gray-100 rounded-2xl p-4 border-2 border-gray-200">
                  <div className="text-sm font-bold text-gray-500 mb-1">الوقت المتبقي</div>
                  <div className="text-3xl font-black text-accent-orange font-mono" dir="ltr">{citySearchTimeLeft}</div>
                </div>
              ) : (
                <button 
                  onClick={handleClaimCitySearch} 
                  className="w-full py-4 bg-accent-green hover:bg-green-600 text-white rounded-2xl font-black text-lg shadow-[0_4px_0_0_#15803d] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 animate-pulse"
                >
                  <Gift className="w-6 h-6" /> استلم المكافآت
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Active Matches Sidebar (Right side in RTL) */}
              <div className="w-full md:w-64 bg-white/5 border-l border-white/10 flex flex-col overflow-hidden order-last md:order-first">
                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <h4 className="text-white font-black flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-green-400" />
                    المباريات المباشرة
                  </h4>
                  <button 
                    onClick={() => {
                      socket?.emit('admin_get_active_rooms', (rooms: any) => {
                        if (Array.isArray(rooms)) setActiveRooms(rooms);
                      });
                    }}
                    className="p-1 hover:bg-white/10 rounded-lg text-white/60 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {activeRooms.length === 0 ? (
                    <div className="text-center py-10 text-white/20 font-bold text-xs">لا توجد مباريات حالياً</div>
                  ) : (
                    activeRooms.map((room: any) => (
                      <button
                        key={room.id}
                        onClick={() => {
                          if (room.id === spectatingRoomId) return;
                          if (spectatingRoomId) socket?.emit('admin_leave_spectator', spectatingRoomId);
                          updateSpectatingRoomId(room.id);
                          setSpectatorRoomData(null);
                          socket?.emit('admin_join_spectator', room.id, (res: any) => {
                            if (!res.success) {
                              updateSpectatingRoomId(null);
                              showAlert('حدث خطأ أثناء الانضمام للمشاهدة', 'خطأ');
                            }
                          });
                        }}
                        className={`w-full p-3 rounded-xl border transition-all text-right flex flex-col gap-1 ${
                          room.id === spectatingRoomId 
                            ? 'bg-purple-600/20 border-purple-500/50' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-black text-xs">غرفة: {room.id}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                            room.gameState === 'guessing' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {room.gameState === 'guessing' ? 'تخمين' : 'نقاش'}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/40 font-bold">
                          {room.playerCount} لاعبين
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Game Info & Chat */}
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* Players Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {spectatorRoomData.players.map((p: any) => (
                    <div key={p.serial} className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10">
                        {renderAvatarContent(p.avatar, getLevel(p.xp), false, true, p.selectedFrame)}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-black text-xs">{p.name}</div>
                        <div className="text-white/40 text-[8px]">ID: {p.serial}</div>
                      </div>
                      <button 
                        onClick={() => {
                          setReportTarget({ serial: p.serial, name: p.name });
                          setShowReportModal(true);
                        }}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                        title="إبلاغ عن اللاعب"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Game State & Images */}
                <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-4 flex flex-col relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="px-3 py-1 bg-white/10 rounded-full text-white font-black text-xs">
                      الحالة: {spectatorRoomData.gameState === 'guessing' ? 'جاري التخمين' : spectatorRoomData.gameState === 'discussion' ? 'نقاش' : spectatorRoomData.gameState}
                    </div>
                    <div className="text-white/40 text-[10px] font-bold">
                      {spectatorRoomData.gameState === 'discussion' ? 'اللاعبون يتناقشون في الشات' : 'اللاعبون يحاولون تخمين الصور'}
                    </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
                    {spectatorRoomData.players.map((p: any, idx: number) => (
                      <div key={p.serial} className="flex flex-col items-center gap-2">
                        <div className="text-white/60 text-[10px] font-black">صورة اللاعب: {p.name}</div>
                        <div className="relative w-full max-w-[200px] aspect-square rounded-xl overflow-hidden shadow-xl border-2 border-white/10 bg-black/20">
                          {p.targetImage ? (
                            <img 
                              src={p.targetImage.image} 
                              alt={`Target for ${p.name}`} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px] font-bold text-center p-4">
                              لا توجد صورة حالياً
                            </div>
                          )}
                          {spectatorRoomData.gameState === 'guessing' && !p.hasGuessed && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                              <p className="text-white font-black text-[10px] text-center px-2">يخمن الآن...</p>
                            </div>
                          )}
                          {p.hasGuessed && (
                            <div className="absolute inset-0 bg-green-500/40 backdrop-blur-[1px] flex items-center justify-center">
                              <p className="text-white font-black text-[10px] text-center px-2">تم التخمين ✅</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Chat Sidebar */}
              <div className="w-full md:w-80 bg-white/5 border-r border-white/10 flex flex-col overflow-hidden relative">
                <div className="p-4 border-b border-white/10 bg-white/5">
                  <h4 className="text-white font-black flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                    الدردشة المباشرة
                  </h4>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {(!spectatorRoomData.chatHistory || spectatorRoomData.chatHistory.length === 0) ? (
                    <div className="text-center py-20 text-white/20 font-bold">لا توجد رسائل بعد</div>
                  ) : (
                    spectatorRoomData.chatHistory.map((msg: any, idx: number) => (
                      <div key={idx} className={`flex flex-col ${msg.senderId === socket?.id ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-white/40">{msg.senderName}</span>
                        </div>
                        <div className="bg-white/10 text-white px-4 py-2 rounded-2xl text-sm font-bold max-w-[80%] break-words">
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="p-4 bg-red-500/10 border-t border-red-500/20">
                  <p className="text-red-400 text-[10px] font-bold text-center">
                    أنت في وضع المشاهدة. يمكنك مراقبة الشات والإبلاغ عن أي مخالفات.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        {renderModals()}
      </>
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
              : 'لقد تلقيت أكثر من 10 إبلاغات من لاعبين آخرين أو الإساءة فى شات الدردشة، لذلك تم منعك من اللعب مؤقتاً لمدة 24 ساعة.'}
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
          
          <div className="flex justify-center gap-4 mt-8 text-sm font-bold text-brown-light">
            <button onClick={() => setShowTermsModal(true)} className="hover:text-purple-600 transition-colors">الشروط والأحكام</button>
            <span>|</span>
            <button onClick={() => setShowPrivacyModal(true)} className="hover:text-purple-600 transition-colors">سياسة الخصوصية</button>
            <span>|</span>
            <button onClick={() => setShowContactModal(true)} className="hover:text-purple-600 transition-colors">اتصل بنا</button>
          </div>
        </motion.div>
        {renderModals()}
      </div>
      </>
    );
  }

  if (isSearching) {
    return (
      <>
      {renderUpdateBanner()}
      <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-y-auto pt-24">
          {/* Fixed Header */}
          <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md px-3 md:px-6 flex justify-between items-center z-[2000] border-b-4 border-black h-14 md:h-16">
            <div className="flex-1 flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center overflow-hidden">
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

              {/* City Search Button */}
              <button 
                onClick={() => toggleCitySearch()}
                className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                title="البحث في المدينة"
              >
                <Search className="w-4 h-4 md:w-5 md:h-5" />
                {((citySearchState?.active && Date.now() >= citySearchState.endTime) || (!hasOpenedCitySearchToday && !citySearchState?.active)) && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>

              {/* Settings Button */}
              <button 
                onClick={toggleSettings}
                className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-purple-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                title="الإعدادات"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                {((AVATAR_UNLOCKS.some(lvl => getLevel(xp) >= lvl && lastSeenAvatarLevel < lvl)) || hasNewFrame) && (
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
                  {renderAvatarContent(proposedMatch.opponent.avatar, proposedMatch.opponent.level || getLevel(proposedMatch.opponent.xp || 0), false, true, proposedMatch.opponent.selectedFrame)}
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

  if (currentRoute === '/privacy' || currentRoute === '/terms') {
    const isPrivacy = currentRoute === '/privacy';
    return (
      <div className="min-h-screen bg-gray-50 p-6 font-cairo" dir="rtl">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-black">
          <div className="bg-accent-blue p-8 text-white flex justify-between items-center">
            <h1 className="text-3xl font-black">{isPrivacy ? 'سياسة الخصوصية' : 'الشروط والأحكام'}</h1>
            <button onClick={() => navigate('/')} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
              <Home size={24} />
            </button>
          </div>
          <div className="p-8 prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-gray-700 font-bold">
              {isPrivacy ? (
                <div className="space-y-4">
                  <div dir="rtl" className="text-right">{gamePolicies.privacyAr}</div>
                  <div dir="ltr" className="text-left">{gamePolicies.privacyEn}</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div dir="rtl" className="text-right">{gamePolicies.termsAr}</div>
                  <div dir="ltr" className="text-left">{gamePolicies.termsEn}</div>
                </div>
              )}
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t-2 border-gray-100 text-center">
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-accent-blue text-white rounded-2xl font-black text-xl shadow-lg hover:bg-blue-600 transition-all"
            >
              العودة للعبة
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderRainGiftGame = () => {
    if (!showRainGiftGame) return null;
    
    return (
      <div className="fixed inset-0 bg-black/85 z-[10000] overflow-hidden h-screen w-screen touch-none select-none flex justify-center">
        <style>{`
          @keyframes fall {
            0% { transform: translateY(-100px); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
          }
          .gift-fall {
            animation: fall linear forwards;
            will-change: transform, opacity;
          }
        `}</style>
        
        <div className="relative w-full max-w-md h-full mx-auto">
          {/* Header with Timer and Close Button */}
          <div className="absolute top-5 w-full px-6 flex justify-between items-center z-20 pointer-events-auto">
            <button 
              onClick={() => {
                setShowRainGiftGame(false);
                if (collectedRewards.xp > 0 || collectedRewards.tokens > 0 || Object.keys(collectedRewards.helpers).length > 0) {
                  socket?.emit('claim_rain_gift', { serial: playerSerial, rewards: collectedRewards, isPro: hasProPackage });
                }
                localStorage.removeItem('khamin_pending_rain_gift');
                setCollectedRewards({ xp: 0, tokens: 0, helpers: {} });
              }}
              className="bg-red-500 text-white w-10 h-10 rounded-full border-red-100 flex items-center justify-center font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="bg-accent-orange text-white px-6 py-1 rounded-full font-black text-xl shadow-lg flex items-center gap-2">
              <Clock className="w-6 h-6" />
              {Math.floor(gameTimer / 60)}:{(gameTimer % 60).toString().padStart(2, '0')}
            </div>
            
            <div className="w-10"></div> {/* Spacer to keep timer centered */}
          </div>
          
          {/* Falling Items */}
          {fallingItems.map(item => (
            <div
              key={item.id}
              className="absolute cursor-pointer select-none gift-fall flex items-center justify-center pointer-events-auto"
              style={{ 
                width: item.size + 35, 
                height: item.size + 35, 
                left: `calc(${item.x}% - ${(item.size + 35) / 2}px)`,
                animationDuration: `${item.duration}s`
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (item.type === 'xp') playSound('xp');
                else if (item.type === 'token') playSound('prize');
                else if (item.type === 'helper') playSound('pop');
                setCollectedRewards(prev => {
                  const next = { ...prev, helpers: { ...(prev.helpers || {}) } };
                  if (item.type === 'xp') next.xp += item.value;
                  else if (item.type === 'token') next.tokens += item.value;
                  else if (item.type === 'helper') {
                    next.helpers[item.value] = (next.helpers[item.value] || 0) + 1;
                  }
                  localStorage.setItem('khamin_pending_rain_gift', JSON.stringify(next));
                  return next;
                });
                setFallingItems(prev => prev.filter(i => i.id !== item.id));
              }}
            >
              <div 
                className={`rounded-full flex items-center justify-center text-white font-black shadow-lg border-2 border-white/50 ${
                  item.type === 'xp' ? 'bg-accent-blue text-[13px] md:text-[13px]' : item.type === 'token' ? 'bg-yellow-500 text-2xl md:text-3xl' : 'bg-accent-green-soft text-2xl md:text-3xl'
                }`}
                style={{ width: item.size, height: item.size }}
              >
                {item.icon}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRainGiftSummary = () => {
    if (!showRainGiftSummary) return null;
    
    const level = getLevel(xp);

    return (
      <div className="fixed inset-0 bg-black/60 z-[10001] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-modal-theme p-8 rounded-[2.5rem] w-full max-w-md text-center space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-accent-orange"></div>
          <h2 className="text-3xl font-black text-main">انتهى المطر! 🌧️✨</h2>
          <p className="text-brown-muted font-bold">لقد جمعت الكثير من الهدايا الرائعة:</p>
          
          <div className="grid grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto p-2">
            <div className="bg-white/50 p-4 rounded-2xl border-2 border-accent-blue/20">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xl font-black text-accent-blue">+{collectedRewards.xp} XP</div>
            </div>
            <div className="bg-white/50 p-4 rounded-2xl border-2 border-yellow-500/20">
              <div className="text-2xl mb-1">🪙</div>
              <div className="text-xl font-black text-yellow-600">+{collectedRewards.tokens} Token</div>
            </div>
            {Object.entries(collectedRewards.helpers || {}).map(([id, count]) => (
              <div key={id} className="bg-white/50 p-4 rounded-2xl border-2 border-accent-green/20 relative">
                <div className="text-2xl mb-1 flex justify-center">
                  {id === 'spy_lens' && <Eye className="w-8 h-8 text-purple-500" />}
                  {id === 'time_freeze' && <Snowflake className="w-8 h-8 text-cyan-500" />}
                  {id === 'hint' && <HelpCircle className="w-8 h-8 text-blue-500" />}
                  {id === 'word_count' && <Hash className="w-8 h-8 text-indigo-500" />}
                  {id === 'word_length' && <Type className="w-8 h-8 text-green-500" />}
                </div>
                <div className="text-[10px] font-black text-accent-green">
                  {( {spy_lens: 'الجاسوس', time_freeze: 'تجميد الوقت', hint: 'تلميح', word_count: 'عدد الكلمات', word_length: 'كاشف الحروف'} as any)[id]} x{count}
                </div>
                {level >= 50 && (
                  <div className="absolute -top-2 -right-2 bg-accent-blue text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                    +{Number(count) * 50} XP
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {level >= 50 && Object.keys(collectedRewards.helpers || {}).length > 0 && (
            <p className="text-xs text-accent-blue font-bold">
              * تم تحويل وسائل المساعدة إلى XP لأن مستواك 50+
            </p>
          )}
          <p className="text-[10px] md:text-xs text-red-500 font-bold mt-2">
            * يجب استخدام هدايا وسائل المساعدة والـ Tokens في نفس اليوم وإلا سيتم تصفيرها.
          </p>
          
          <button
            onClick={() => {
              socket?.emit('claim_rain_gift', { serial: playerSerial, rewards: collectedRewards, isPro: hasProPackage });
              localStorage.removeItem('khamin_pending_rain_gift');
              setShowRainGiftSummary(false);
              playSound('win');
            }}
            className="w-full bg-accent-green hover:brightness-110 text-white py-4 rounded-2xl font-black text-xl shadow-lg transition-all"
          >
            استلام الهدايا
          </button>
        </motion.div>
      </div>
    );
  };

  if (!joined) {
    return (
      <>
        {renderRainGiftGame()}
        {renderRainGiftSummary()}
        {renderUpdateBanner()}
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md px-3 md:px-6 flex justify-between items-center z-[2000] border-b-4 border-black h-14 md:h-16">
          <div className="flex-1 flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center overflow-hidden">
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
              {(lastDailyClaim === 0 || !isSameDay(Date.now(), lastDailyClaim)) && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>

            {/* City Search Button */}
            <button 
              onClick={() => toggleCitySearch()}
              className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="البحث في المدينة"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
              {((citySearchState?.active && Date.now() >= citySearchState.endTime) || (!hasOpenedCitySearchToday && !citySearchState?.active)) && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>

            {/* Lucky Wheel Button */}
            {(luckyWheelEnabled || isAdmin) && (
              <button 
                onClick={toggleLuckyWheel}
                className="w-9 h-9 md:w-10 md:h-10 bg-pink-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-pink-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                title="عجلة الحظ"
              >
                <Disc className="w-4 h-4 md:w-5 md:h-5" />
                {!hasUsedFreeSpin && spinStatus.hasFreeSpin && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>
            )}

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
              {((AVATAR_UNLOCKS.some(lvl => getLevel(xp) >= lvl && lastSeenAvatarLevel < lvl)) || hasNewFrame) && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="min-h-screen w-full flex items-center overflow-x-hidden justify-center p-4 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-2"
        >

          {/* Profile Card */}
          <div className="player-card flex flex-col p-3 md:p-4 mb-4 md:mb-4 w-full">
            <AnimatedXp xp={xp} joined={joined}>
              {(displayXp) => (
                <div className="flex items-center gap-3 md:gap-4 flex-row-reverse w-full">
                  <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20">
                    {renderAvatarContent(avatar, getLevel(Math.floor(displayXp)), false, true, selectedFrame)}
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1 flex-row-reverse">
                      <div className="text-sm md:text-base font-black text-main truncate text-right">{playerName || 'لاعب جديد'}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs md:text-sm font-black text-accent-blue px-0.5 py-0.5">Level {getLevel(Math.floor(displayXp))}</span>                        
                      </div>
                    </div>
                    
                    {/* Level Bar */}
                    <div className="w-full bg-[var(--level-bar-bg)] rounded-full h-2 md:h-3 shadow-inner overflow-hidden mb-2" dir="ltr">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (getLevel(Math.floor(displayXp)) / 50) * 100)}%`, backgroundColor: 'var(--level-bar-fill)' }}
                      ></div>
                    </div>
                    
                    {/* XP Bar */}
                    <div className="w-full bg-[var(--xp-bar-bg)] rounded-full h-5 md:h-6 shadow-inner overflow-hidden relative border-2 border-black mb-1" dir="ltr">
                      <div 
                        className="h-full transition-all duration-500" 
                        style={{ width: `${getXpProgress(Math.floor(displayXp))}%`, backgroundColor: 'var(--xp-bar-fill)' }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] md:text-xs font-bold flex items-center gap-1" style={{ color: getXpProgress(Math.floor(displayXp)) >= 100 ? 'var(--xp-bar-text-active)' : 'var(--xp-bar-text)' }}>
                          <Zap className="w-3 h-3" />
                          {Math.floor(displayXp)} / {getXpForNextLevel(getLevel(Math.floor(displayXp)))} XP
                        </span>
                      </div>
                    </div>
                    
                    {/* Tokens and Pro Package */}
                    <div className="flex flex-wrap justify-center gap-1">
                      <div className="mt-0.5 pt-0.5 flex flex-wrap justify-center gap-0.3 md:gap-0.5 text-xs font-bold text-brown-dark" dir="ltr">
                      <span 
                        className={`gap-0.5 flex items-center justify-center transition-all ${
                          hasProPackage 
                            ? 'text-yellow-600' 
                            : 'text-gray-400 opacity-70'
                        }`} 
                        title="باقة المحترفين"
                      >
                        <Crown className={`w-3 h-3 md:w-4 md:h-4 transition-all ${
                          hasProPackage 
                            ? 'fill-yellow-500 text-yellow-500 animate-pulse' 
                            : 'fill-gray-400 text-gray-400'
                        }`} />
                        <span className="text-[11px] md:text-[12px]" dir="ltr">{proPackageDaysLeft}</span>
                      </span>                      
                        <span className="bg-white/50 px-1 flex items-center gap-0.5">
                          <span className="text-[13px] md:text-[14px]"><Coins className="w-3 h-3 md:w-4 md:h-4 text-purple-600" /></span> <span className="text-[11px] md:text-[12px]">{tokens}</span>
                        </span>
                        <span className="flex text-xs md:text-sm text-gray-400 px-0.5">|</span>
                        <span className="bg-white/50 px-1 flex items-center gap-0.5">
                          <span className="text-[13px] md:text-[14px]"><Snowflake className="w-3 h-3 md:w-4 md:h-4 text-cyan-500" /></span> <span className="text-[11px] md:text-[12px]">{ownedHelpers.time_freeze || 0}</span>
                        </span>
                        <span className="bg-white/50 px-1 flex items-center gap-0.5">
                          <span className="text-[13px] md:text-[14px]"><Eye className="w-3 h-3 md:w-4 md:h-4 text-purple-400" /></span> <span className="text-[11px] md:text-[12px]">{ownedHelpers.spy_lens || 0}</span>
                        </span>
                        <span className="bg-white/50 px-1 flex items-center gap-0.5">
                          <span className="text-[13px] md:text-[14px]"><Hash className="w-3 h-3 md:w-4 md:h-4 text-indigo-500" /></span> <span className="text-[11px] md:text-[12px]">{ownedHelpers.word_count || 0}</span>
                        </span>
                        <span className="bg-white/50 px-1 flex items-center gap-0.5">
                          <span className="text-[13px] md:text-[14px]"><Type className="w-3 h-3 md:w-4 md:h-4 text-green-500" /></span> <span className="text-[11px] md:text-[12px]">{ownedHelpers.word_length || 0}</span>
                        </span>
                        <span className="bg-white/50 px-1 flex items-center gap-0.5">
                          <span className="text-[13px] md:text-[14px]"><HelpCircle className="w-3 h-3 md:w-4 md:h-4 text-blue-500" /></span> <span className="text-[11px] md:text-[12px]">{ownedHelpers.hint || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AnimatedXp>
          </div>
            
          {/* Collection Icons - Moved outside player card */}
          <div className="flex items-center justify-center gap-1.5 mb-4 flex-wrap">
            {COLLECTION_DATA.map((cat) => {
              const hasAny = playerCollection.some(c => {
                const catImages = cat.stages.flatMap(s => s.images.map(img => normalizeEgyptian(img).toLowerCase()));
                return catImages.includes(c.image_name);
              });

              const currentCount = cat.stages.flatMap(s => s.images).reduce((acc, img) => {
                const norm = normalizeEgyptian(img).toLowerCase();
                const count = playerCollection.find(c => c.image_name === norm)?.count || 0;
                return acc + count;
              }, 0);

              const hasNewImage = currentCount > (seenCategoryCounts[cat.id] || 0);

              const hasClaimableReward = cat.stages.some(stage => {
                const isClaimed = claimedCollectionRewards.some(r => r.category_id === cat.id && r.stage === stage.stage);
                if (isClaimed) return false;
                
                const isStageComplete = stage.images.every(imgName => {
                  const norm = normalizeEgyptian(imgName).toLowerCase();
                  const count = playerCollection.find(c => c.image_name === norm)?.count || 0;
                  return count >= 5;
                });
                
                return isStageComplete;
              });

              return (
                <button
                  key={cat.id}
                  onClick={() => { 
                    playSound('clickOpen'); 
                    setShowCollectionModal(cat.id);
                    if (hasNewImage) {
                      const newCounts = { ...seenCategoryCounts, [cat.id]: currentCount };
                      setSeenCategoryCounts(newCounts);
                      localStorage.setItem('khamin_seen_category_counts', JSON.stringify(newCounts));
                    }
                  }}
                  className={`relative w-9 h-9 md:w-11 md:h-11 rounded-xl border-2 border-black flex items-center justify-center text-lg md:text-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none ${
                    hasAny ? 'bg-white opacity-100' : 'bg-white opacity-70 grayscale'
                  }`}
                >
                  {cat.icon}
                  {(hasClaimableReward || hasNewImage) && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                    </span>
                  )}
                </button>
              );
            })}
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
                  <span className="text-[10px] md:text-xs font-bold text-accent-orange px-2 py-1 rounded-full">المتصدرون حالياً</span>
                </div>

                <div className="flex items-end justify-center gap-2 md:gap-4">
                  {/* Rank 2 */}
                  {topPlayers[1] && (
                    <div key={`${topPlayers[1].serial || 'unknown'}-rank-2`} className="flex flex-col items-center flex-1 z-10">
                      <div className="relative mb-2 flex flex-col items-center">
                        <div className="w-14 h-14 md:w-16 md:h-16">
                          {renderAvatarContent(topPlayers[1].avatar, topPlayers[1].level || getLevel(topPlayers[1].xp || 0), false, topPlayers[1].isOnline, topPlayers[1].selectedFrame)}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-gray-300 text-brown-muted w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-sm z-[60]">2</div>
                      </div>
                      <div className="text-[10px] md:text-xs font-black text-main truncate w-full text-center max-w-[80px] md:max-w-[100px]">{truncateName(topPlayers[1].name)}</div>
                      <div className="w-full rank-2-bar h-16 md:h-20 rounded-t-xl mt-1 shadow-inner border-t-4 flex flex-col items-center justify-center gap-0.5 md:gap-1">
                        <div className="text-[8px] md:text-[9px] font-black text-black/60 px-2 py-0.5">
                          Lvl {topPlayers[1].level || getLevel(topPlayers[1].xp || 0)}
                        </div>
                        <div className="text-[8px] md:text-[9px] font-black text-black/60 px-2 py-0.5 flex items-center gap-1">
                          <Trophy className="w-2 h-2" />
                          {topPlayers[1].wins || 0} فوز
                        </div>
                        <div className="text-[8px] md:text-[9px] font-black text-black/60 px-2 py-0.5">
                          {topPlayers[1].streak || 0} 🔥
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rank 1 */}
                  {topPlayers[0] && (
                    <div key={`${topPlayers[0].serial || 'unknown'}-rank-1`} className="flex flex-col items-center flex-1 z-20 -mt-8 md:-mt-12">
                      <div className="relative mb-2 flex flex-col items-center scale-110 md:scale-125">
                        <img src="/crown.gif" className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 drop-shadow-md z-[60]" />
                        {/* <Crown className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 drop-shadow-md z-[60]" /> */}
                        <div className="fire-glow-effect"></div>
                        <div className="w-16 h-16 md:w-20 md:h-20 relative z-10">
                          {renderAvatarContent(topPlayers[0].avatar, topPlayers[0].level || getLevel(topPlayers[0].xp || 0), false, topPlayers[0].isOnline, topPlayers[0].selectedFrame)}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow-md z-[60] animate-bounce">1</div>
                      </div>
                      <div className="text-xs md:text-sm font-black text-main truncate w-full text-center mt-2 max-w-[90px] md:max-w-[120px]">{truncateName(topPlayers[0].name)}</div>
                      <div className="w-full rank-1-bar h-24 md:h-32 rounded-t-xl mt-1 shadow-inner border-t-4 flex flex-col items-center justify-center gap-1 md:gap-2">
                        <div className="text-[9px] md:text-xs font-black text-black/70 px-3 py-1 ">
                          Lvl {topPlayers[0].level || getLevel(topPlayers[0].xp || 0)}
                        </div>
                        <div className="text-[9px] md:text-xs font-black text-black/70 px-3 py-1 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {topPlayers[0].wins || 0} فوز
                        </div>
                        <div className="text-[9px] md:text-xs font-black text-black/70 px-3 py-1">
                          {topPlayers[0].streak || 0} 🔥
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rank 3 */}
                  {topPlayers[2] && (
                    <div key={`${topPlayers[2].serial || 'unknown'}-rank-3`} className="flex flex-col items-center flex-1 z-10">
                      <div className="relative mb-2 flex flex-col items-center">
                        <div className="w-14 h-14 md:w-16 md:h-16">
                          {renderAvatarContent(topPlayers[2].avatar, topPlayers[2].level || getLevel(topPlayers[2].xp || 0), false, topPlayers[2].isOnline, topPlayers[2].selectedFrame)}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-orange-200 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-sm z-[60]">3</div>
                      </div>
                      <div className="text-[10px] md:text-xs font-black text-main truncate w-full text-center max-w-[80px] md:max-w-[100px]">{truncateName(topPlayers[2].name)}</div>
                      <div className="w-full rank-3-bar h-12 md:h-16 rounded-t-xl mt-1 shadow-inner border-t-4 flex flex-col items-center justify-center gap-0 md:gap-0.2">
                        <div className="text-[8px] md:text-[9px] font-black text-black/80 px-2 py-0.5">
                          Lvl {topPlayers[2].level || getLevel(topPlayers[2].xp || 0)}
                        </div>
                        <div className="text-[8px] md:text-[9px] font-black text-black/80 px-2 py-0.5 flex items-center gap-1">
                          <Trophy className="w-2 h-2" />
                          {topPlayers[2].wins || 0} فوز
                        </div>
                        <div className="text-[8px] md:text-[9px] font-black text-black/80 px-2 py-0.5">
                          {topPlayers[2].streak || 0} 🔥
                        </div>
                      </div>
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
                        <div className="bg-white h-10 rounded-[14px] py-3 px-4 flex items-center justify-between">
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
                        className="mt-3 w-full h-10 group box-game hover:border-orange-200 py-3 px-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
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

                {/* Level 50 Reward Section */}
                {!isRewardClaimed && (
                  <div className="mt-2 p-2 justify-between items-center flex gap-2 md:gap-2 bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-300 rounded-lg shadow-sm">
                  <div className="items-center justify-between gap-2">
                    <h3 className="font-bold md:font-black md:text-sm text-xs text-amber-900">هدية أول لاعب يصل Lvl 50 🎁</h3>
                    <span className="font-bold md:text-[12px] text-[10px] text-amber-800">10 Tokens + باقة المحترفين 7 أيام</span>
                  </div>  
                      <button 
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/claim-level-50-reward', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ serial: playerSerial })
                            });
                            if (response.ok) {
                              setIsRewardClaimed(true);
                              setShowRewardModal(true);
                            } else {
                              const data = await response.json();
                              alert(data.message);
                            }
                          } catch (err) {
                            console.error('Failed to claim reward', err);
                          }
                        }}
                        disabled={getLevel(xp) < 50}
                        className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-black text-xs md:text-[12px] text-[10px] px-1 py-1 md:px-3 md:py-1.5 rounded-md shadow-sm border border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {getLevel(xp) < 50 ? 'مغلق' : 'استلم الهدية'}
                      </button>
                  </div>
                )}
              </div>

              {/* Rain Gift Event Section - Moved outside and below leaderboard */}
              {gamePolicies.isRainGiftEnabled && (
              <div className="p-2 bg-gradient-to-r from-accent-orange/10 to-accent-green/10 rounded-2xl border-2 border-white shadow-sm box-game">
              <span className="flex font-bold p-0.5 py-0.5 items-center justify-center md:text-[13px] text-[11px] text-accent-orange">مطر الهدايا 🎁 كل يوم الساعة 7 مساء بتوقيت مصر 🌧️</span>
              <span className="flex font-bold p-0.5 py-0.5 items-center justify-center md:text-[13px] text-[12px] text-accent-purple">مدة الحدث 3 دقائق فقط! ⏰</span>
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="flex items-center gap-2" dir="ltr">
                    <div className="w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center text-white shadow-sm">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-main ${isRainGiftActive ? 'text-base md:text-lg' : 'text-[21px]'}`}>{rainGiftCountdown}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setGameTimer(180);
                      setCollectedRewards({ xp: 0, tokens: 0, helpers: {} });
                      setFallingItems([]);
                      setShowRainGiftGame(true);
                      playSound('clickOpen');
                    }}
                    // Enabled for testing as requested
                    disabled={!isAdmin && !isRainGiftActive}
                    className={`px-6 py-2 rounded-xl font-black text-xs transition-all shadow-md ${
                      (isAdmin || isRainGiftActive) // Always active style for testing
                      ? 'bg-accent-green text-white hover:scale-105 active:scale-95 event-glow' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {(isAdmin || isRainGiftActive) ? 'اشترك في الحدث' : 'انتهي الحدث اليوم'}
                  </button>
                </div>
              </div>
              )}
            </div>

            {/* Reward Modal */}
            <AnimatePresence>
              {showRewardModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-md z-[5000] flex items-center justify-center p-4"
                  onClick={() => setShowRewardModal(false)}
                >
                  <motion.div
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-[2rem] p-6 w-full max-w-sm text-center shadow-2xl border-4 border-black"
                  >
                    <h2 className="text-2xl font-black mb-4">مبروك يا بطل التخمين 💪</h2>
                    <button 
                      onClick={() => setShowRewardModal(false)}
                      className="btn-game btn-primary w-full py-3 text-lg"
                    >
                      شكرا خمن تخمينة
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-3 md:pt-3 border-t-2 border-game space-y-3 md:space-y-4">
                <div className="flex items-center font-bold md:text-sm text-xs gap-1">
                <Users className="w-4 h-4" />
                 إجمالي عدد اللاعبين: <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">{totalPlayersCount}</span>
                <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-full md:text-sm text-xs mr-2">
                  متصل الآن: {onlineCount > 1000 ? '1000+' : onlineCount}
                </span>
                </div>            
              <div className="pt-2 md:pt-3 border-t-2 border-game">
                {error && (
                  <motion.div 
                    ref={errorRef}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-100 border-2 border-red-200 p-2 md:p-4 mb-2 md:mb-4 text-red-600 text-xs md:text-sm font-black rounded-2xl text-center shadow-sm"
                  >
                    {error}
                  </motion.div>
                )}
                <label className="block text-base md:text-lg font-bold text-main mb-1 md:mb-2 px-1">إنشاء / دخول بكود غرفة</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={roomId}
                    onChange={(e) => {
                      // Normalize Arabic numbers to English
                      const val = e.target.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
                      setRoomId(val);
                    }}
                    placeholder="أكتب كود الغرفة..."
                    className="input-game flex-1 py-2 md:py-4"
                    maxLength={6}
                  />
                  <button 
                    onClick={handleJoin}
                    disabled={!isConnected}
                    className={`btn-game btn-secondary px-4 md:px-6 py-2 md:py-3 text-base md:text-lg ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isConnected ? 'دخول' : 'جاري الاتصال...'}
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
                  disabled={!isConnected}
                  className={`flex-1 btn-game btn-primary py-4 md:py-4 text-sm md:text-xl gap-1 md:gap-3 cursor-pointer touch-manipulation ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-1.5" dir="ltr">
                  <span className="large-emoji">🔍</span>
                  </div>
                  <span>{isConnected ? 'بحث عشوائي' : 'جاري الاتصال...'}</span>
                </button>

                <div className="flex flex-col box-game p-2 h-16 relative overflow-hidden">
                  {getLevel(xp) < 50 && (
                    <div className="absolute inset-0 bg-gray-200/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
                      <Lock className="w-4 h-4 text-gray-600 mb-0.5" />
                      <span className="text-[11px] font-black text-gray-700" dir="ltr">Lvl 50+</span>
                    </div>
                  )}
                  <div className="flex items-center gap-6 flex-1">
                    <input 
                      type="checkbox" 
                      id="useToken" 
                      checked={useToken && getLevel(xp) >= 50} 
                      onChange={(e) => getLevel(xp) >= 50 && setUseToken(e.target.checked)}
                      disabled={tokens <= 0 || getLevel(xp) < 50}
                      className="checkbox-game disabled:opacity-50"
                    />
                    <label htmlFor="useToken" className={`cursor-pointer select-none flex items-center gap-1 ${getLevel(xp) < 50 ? 'pointer-events-none' : ''}`}>
                      <button onClick={toggleTokenInfo} className="font-black text-accent-purple hover:underline text-sm truncate">Token</button>
                      <span className="font-black text-main text-sm">({tokens})</span>
                    </label>
                  </div>
                  <div className="border-t border-game mt-1 mb-0.5"></div>
                  <div className="w-full flex text-left" dir="ltr">
                    <span className="font-bold text-xs md:text-sm">Lvl 50+</span>
                    <span className="flex text-xs md:text-sm text-gray-400 px-1">|</span>
                    <span className="font-bold text-xs md:text-sm">1=500xp</span>
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
                        {renderAvatarContent(avatar, getLevel(xp), true, true, selectedFrame)}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="font-black truncate">أنت ({playerName})</div>
                        <div className="text-xs text-white/80 font-bold flex items-center gap-2">
                          <span dir="ltr">Lvl {getLevel(xp)}</span>
                          <span>•</span>
                          <span>{wins} فوز</span>
                          <span>•</span>
                          <span>{streak} 🔥</span>
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
                          {renderAvatarContent(player.avatar, player.level, true, player.isOnline, player.selectedFrame)}
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                          <div className={`font-black truncate ${isMe ? 'text-purple-700' : 'text-brown-dark'}`}>
                            {player.name} {isMe && '(أنت)'}
                          </div>
                          <div className="text-xs text-brown-muted font-bold flex items-center gap-2">
                            <span className="bg-gray-100 px-1.5 rounded text-brown-muted" dir="ltr">Lvl {player.level}</span>
                            <span className="text-brown-light">•</span>
                            <span className="text-green-600">{player.wins} فوز</span>
                            <span className="text-brown-light">•</span>
                            <span className="bg-gray-100 px-1.5 rounded text-brown-muted" dir="rtl">{player.streak || 0} 🔥</span>
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
                  <Coins className="w-8 h-8 text-accent-purple" />
                </div>
                <h2 className="text-2xl font-black text-light mb-1">ما هو الـ Token؟</h2>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-right" dir="rtl">
                <div className="space-y-4 text-brown-dark">
                  <div className="box-game p-4">
                    <h3 className="font-black mb-2 flex items-center gap-2" style={{ color: 'var(--shop-info-title)' }}>
                      <Coins className="w-4 h-4" />
                      ما فائدته؟
                    </h3>
                    <p className="text-sm font-bold leading-relaxed">
                      الـ Token هو تذكرتك للعب مع المحترفين! يسمح لك باللعب ضد لاعبين مستواهم 40 أو أعلى، والحصول على XP إضافي (500 XP) عند الفوز.
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

      {/* Footer Links */}
      <footer className="mt-auto py-4 text-center border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 text-[11px] md:text-xs font-bold text-black">
          <button 
            onClick={() => navigate('/privacy')}
            className="hover:text-accent-blue transition-colors"
          >
            سياسة الخصوصية
          </button>
          <span className="text-gray-300">|</span>
          <button 
            onClick={() => navigate('/terms')}
            className="hover:text-accent-blue transition-colors"
          >
            الشروط والأحكام
          </button>
          <span className="text-gray-300">|</span>
          <button 
            onClick={() => setShowContactModal(true)}
            className="hover:text-accent-blue transition-colors"
          >
            اتصل بنا
          </button>
        </div>
        <p className="mt-2 text-[11px] font-bold text-black">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} خمن تخمينة
        </p>
      </footer>

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
    <>
    {renderRainGiftGame()}
    {renderRainGiftSummary()}
    {renderUpdateBanner()}
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
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center overflow-hidden">
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

          {/* City Search Button */}
          <button 
            onClick={() => toggleCitySearch()}
            className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="البحث في المدينة"
          >
            <Search className="w-4 h-4 md:w-5 md:h-5" />
            {((citySearchState?.active && Date.now() >= citySearchState.endTime) || (!hasOpenedCitySearchToday && !citySearchState?.active)) && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button 
            onClick={toggleSettings}
            className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 text-black border-2 border-black rounded-xl flex items-center justify-center hover:bg-purple-200 transition-colors relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="الإعدادات"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
            {((AVATAR_UNLOCKS.some(lvl => getLevel(xp) >= lvl && lastSeenAvatarLevel < lvl)) || hasNewFrame) && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </button>
        </div>
      </header>


      <main className="flex-1 relative flex flex-col items-center py-2 px-2 max-w-md mx-auto w-full overflow-hidden">
        {/* Players Header (VS Mode) */}
        <div className="w-full flex items-center justify-center gap-3 md:gap-6 py-2 px-4 bg-white/60 backdrop-blur-md rounded-[32px] border-4 border-white shadow-xl mb-4 relative z-50">
          {/* Player (Me) */}
          <div className="flex flex-col items-center relative">
            {me && (
              <>
                <div className="relative w-14 h-14 md:w-20 md:h-20">
                  {renderAvatarContent(me.avatar, getLevel(xp), false, true, me.selectedFrame)}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] md:text-[10px] font-black px-2 py-0.3 rounded-full border-1.5 border-black shadow-sm z-20 whitespace-nowrap">
                    Lvl {getLevel(xp)}
                  </div>
                  {showHammer === me.id && (
                    <motion.div 
                      initial={{ rotate: -45, y: -60, x: -20, opacity: 0 }}
                      animate={{ rotate: 45, y: -30, x: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                      <Hammer className="w-16 h-16 text-[#2D3436] fill-[#FF9F43] drop-shadow-lg" />
                    </motion.div>
                  )}
                </div>
                <div className="mt-2 font-black text-[10px] md:text-xs text-main truncate max-w-[80px] md:max-w-[90px] flex items-center gap-1" dir="ltr">
                  {me.name}
                  {reports > 0 && <Flag className="w-3 h-3 text-red-500" fill="currentColor" />}
                </div>
                {me.age && <div className="text-[8px] text-brown-muted font-bold">({me.age} سنة)</div>}
              </>
            )}
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-2xl md:text-4xl font-black text-accent-orange italic drop-shadow-sm animate-pulse">VS</div>
          </div>

          {/* Opponent */}
          <div className="flex flex-col items-center relative">
            {opponent ? (
              <>
                <div className="relative w-14 h-14 md:w-20 md:h-20">
                  {renderAvatarContent(opponent.avatar, opponent.level || getLevel(opponent.xp || 0), false, true, opponent.selectedFrame)}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] md:text-[10px] font-black px-2 py-0.3 rounded-full border-1.5 border-black shadow-sm z-20 whitespace-nowrap">
                    Lvl {opponent.level || getLevel(opponent.xp || 0)}
                  </div>
                  {showHammer === opponent.id && (
                    <motion.div 
                      initial={{ rotate: -45, y: -60, x: -20, opacity: 0 }}
                      animate={{ rotate: 45, y: -30, x: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                      <Hammer className="w-16 h-16 text-[#2D3436] fill-[#FF9F43] drop-shadow-lg" />
                    </motion.div>
                  )}
                </div>
                <div className="mt-2 font-black text-[10px] md:text-xs text-main truncate max-w-[70px] md:max-w-[90px] flex items-center gap-1" dir="ltr">
                  {opponent.name}
                  {opponent.isAdmin ? (
                    <Shield className="w-3 h-3 text-purple-500" />
                  ) : (
                    <>
                      <button onClick={() => setShowReportModal(true)} className="text-red-500">
                        <Flag className="w-3 h-3" fill={opponent.reports > 0 ? "currentColor" : "none"} />
                      </button>
                      {/* <button 
                        onClick={() => {
                          const newBlockedState = !isOpponentBlocked;
                          setIsOpponentBlocked(newBlockedState);
                          socket?.emit('toggle_mute_opponent', { roomId, isMuted: newBlockedState });
                        }}
                        className={isOpponentBlocked ? 'text-red-500' : 'text-brown-light'}
                      >
                        <MessageSquareOff className="w-3 h-3" />
                      </button> */}
                    </>
                  )}
                </div>
                {opponent.age && <div className="text-[8px] text-brown-muted font-bold">({opponent.age} سنة)</div>}
              </>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-100 rounded-full border-4 border-white shadow-inner flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-300 animate-pulse" />
                </div>
                <div className="text-[10px] font-bold text-gray-400">بانتظار...</div>
              </div>
            )}
          </div>
        </div>

        {/* Center Content: Image or Waiting UI */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl relative my-0.5 min-h-0 overflow-hidden">
          {room.gameState === 'waiting' ? (
            <div className="w-full card-game p-3 md:p-6 text-center space-y-3 md:space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#F6E6CD]">
                <div 
                  className="h-full bg-accent-orange transition-all duration-1000" 
                  style={{ width: `${(room.timer / 60) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center bg-white/50 p-3 rounded-2xl border border-orange-100 shadow-sm">
                <h2 className={`text-sm md:text-sm font-black text-accent-orange ${room.players.length < 2 ? 'animate-pulse' : ''}`}>
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
                    const isNew = cat.latestImageTimestamp && (Date.now() - cat.latestImageTimestamp <= 48 * 60 * 60 * 1000);
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => socket?.emit('select_category', { roomId, category: cat.id })}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all border-b-4 active:border-b-0 active:translate-y-1 relative
                          ${isAgreed ? 'bg-green-100 text-accent-green border-green-400 scale-105 ring-2 ring-green-400 ring-offset-2' : isMyChoice ? 'bg-orange-100 text-accent-orange border-orange-300 scale-105' : isNew ? 'bg-yellow-50 text-yellow-700 border-yellow-400 ring-2 ring-yellow-400 ring-offset-1 hover:bg-yellow-100' : 'bg-gray-100 text-brown-muted border-gray-300 hover:bg-gray-200 hover:text-brown-dark'}
                          ${isOpponentChoice && !isMyChoice ? 'hint-glow' : ''}
                        `}
                      >
                        <span className="text-2xl md:text-3xl">{cat.icon}</span>
                        <span className="text-[10px] md:text-xs font-black truncate w-full">{cat.name}</span>
                        {isNew && (
                          <div className="absolute -top-2 -left-2 bg-yellow-400 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse z-10">
                            جديد
                          </div>
                        )}
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
                  <div className="w-full bg-[#E5DDD5] rounded-2xl border-4 border-white shadow-inner flex flex-col h-46 mt-4 relative">
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
                          <TypingIndicator gender={opponent?.gender} />
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={(e) => e.preventDefault()} className="p-2 bg-[#F0F0F0] flex gap-2 border-t border-gray-200 relative items-center">
                      <div className="flex-1 flex gap-0 overflow-x-auto no-scrollbar py-1">
                        {['⚽', '🐞', '🌿', '📦', '👥', '🍕', '🦜', '🐘'].map(emote => (
                          <button
                            key={emote}
                            type="button"
                            disabled={isMutedByOpponent}
                            onClick={() => {
                              playSound('clickOpen');
                              socket?.emit('send_emote', { roomId: room!.id, emote });
                            }}
                            className="bg-white text-xl p-2 rounded-xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all min-w-[30px] min-h-[30px] flex items-center justify-center disabled:opacity-50"
                          >
                            {emote}
                          </button>
                        ))}
                      </div>
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
                        <div className="absolute bottom-full left-2 mb-2 bg-white p-2 rounded-2xl shadow-xl border border-gray-200 grid grid-cols-4 gap-1 w-48 z-50">
                          {EMOTES.map(emote => (
                            <button
                              key={emote}
                              type="button"
                              onClick={() => {
                                playSound('clickOpen');
                                socket?.emit('send_emote', { roomId: room!.id, emote });
                                setShowEmotes(false);
                              }}
                              className="text-1xl hover:scale-125 transition-transform p-1"
                            >
                              {emote}
                            </button>
                          ))}
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {/* Start Game Button - Shown when consensus reached */}
                {consensusReached && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mt-6 flex flex-col items-center gap-4"
                  >
                    
                    <button 
                      onClick={handleStartGame}
                      className="w-full py-5 bg-accent-green hover:bg-green-600 text-white rounded-2xl font-black text-2xl shadow-[0_6px_0_0_#15803d] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3 group"
                    >
                      <Play className="w-8 h-8 fill-current group-hover:scale-110 transition-transform" />
                      بدأ اللعب
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative w-full flex flex-col items-center">
              {/* Quick Guess Overlay for the one guessing */}
              {room.isPaused && room.pausingPlayerId === me?.id && (
                <div 
                  className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                  <div className="w-full max-w-md card-game p-8 text-center relative">
                    <div className="text-6xl font-black text-red-500 mb-4 drop-shadow-md">{room.quickGuessTimer}</div>
                    <h3 className="text-2xl font-black text-main mb-6">تخمين سريع!</h3>
                      <form onSubmit={handleQuickGuess} className="flex flex-col gap-3">
                        <input 
                          autoFocus
                          type="text" 
                          value={guess}
                          onChange={(e) => setGuess(e.target.value)}
                          placeholder="ما هي الصورة؟"
                          className="input-game text-center text-2xl"
                        />
                        
                        {/* Easy Guess Options */}
                        {getEasyGuessOptions() && (() => {
                          const isQuickGuessLocked = hasUsedFreeQuickGuess && (me?.helpersUsedCount || 0) < 3;
                          return (
                          <div className="flex flex-col items-center gap-1 mt-2">
                            <span className="text-[13px] text-brown-muted font-bold">اختار اجابة او خمن بنفسك</span>
                            <div className="relative w-full">
                              {/* Blur Overlay */}
                              {isQuickGuessLocked && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-md rounded-xl border-2 border-dashed border-orange-200">
                                  <span className="text-[12px] font-bold text-orange-600 text-center px-4 leading-tight drop-shadow-sm">
                                    يجب استخدام على الاقل 3 وسائل مساعدة لفتح اختيارات الإجابات السريعة
                                  </span>
                                </div>
                              )}
                              <div className={`flex flex-wrap justify-center gap-2 p-1 ${isQuickGuessLocked ? 'blur-xl select-none pointer-events-none' : ''}`}>
                                {getEasyGuessOptions()?.map((option: string, idx: number) => (
                                  <button
                                    key={`quick-easy-${idx}`}
                                    type="button"
                                    onClick={() => {
                                      if (!isQuickGuessLocked) {
                                        playSound('clickOpen');
                                        setGuess(option);
                                      }
                                    }}
                                    className="px-4 py-2 bg-accent-orange text-white rounded-xl font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-md border-b-4 border-orange-600"
                                  >
                                    {isQuickGuessLocked ? '???' : option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          );
                        })()}

                        <button className={`btn-game btn-primary py-4 text-xl transition-all ${guess.trim() ? 'button-glow scale-105' : ''}`}>إرسال</button>
                      
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
                      <h3 className="text-3xl font-black">المنافس {opponent?.gender === 'girl' ? 'تقوم' : 'يقوم'} بالتخمين الآن!</h3>
                      <p className="font-bold mt-2 opacity-90 text-xl">انتظر {room.quickGuessTimer} ثوانٍ</p>
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
                    className="relative z-10 flex flex-row items-center justify-center gap-3 md:gap-6 w-full px-4"
                  >
                    {/* Confirmed Attributes Box on the left (User's Right) */}
                    <div className="flex-1 max-w-[9rem] md:max-w-[14rem] h-[9rem] md:h-[12rem] bg-white backdrop-blur-[2px] rounded-[20px] border border-black p-2 shadow-[0_8px_20px_rgba(0,0,0,0.15)] overflow-y-auto flex flex-col gap-1 custom-scrollbar">
                      {confirmedAttributes.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-[12px] text-gray-500 font-bold text-center px-1">
                          التخمينات الصح هتظهر هنا
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {confirmedAttributes.map((attr, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              className="text-[10px] md:text-[11px] font-black text-purple-900 flex items-center gap-1 py-0.5 px-1 border-b border-purple-50/30 last:border-0"
                            >
                              <span className="text-purple-500 text-[8px]">●</span>
                              {attr}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Target Image on the right (User's Left) */}
                    <div className="relative w-full max-w-[9rem] md:max-w-[12rem] aspect-square bg-white p-1.5 rounded-[24px] shadow-[0_8px_20px_rgba(0,0,0,0.15)] overflow-hidden border-2 border-white flex items-center justify-center">
                      <img 
                        src={opponent?.targetImage?.image} 
                        className={`w-full h-full object-cover rounded-xl ${funnyFilter === opponent?.id ? 'invert sepia hue-rotate-90 scale-110' : ''}`}
                        alt="Target"
                      />
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-0.5 rounded-full font-black text-[10px] md:text-xs text-main shadow-sm border border-gray-200 backdrop-blur-sm z-10 whitespace-nowrap">
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

                        {/* Easy Guess Options */}
                        {getEasyGuessOptions() && (() => {
                          const isQuickGuessLocked = hasUsedFreeQuickGuess && (me?.helpersUsedCount || 0) < 3;
                          return (
                          <div className="flex flex-col items-center gap-1 mt-1">
                            <span className="text-[13px] text-brown-muted font-bold">اختار اجابة او خمن بنفسك</span>
                            <div className="relative w-full">
                              {/* Blur Overlay */}
                              {isQuickGuessLocked && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-md rounded-xl border-2 border-dashed border-orange-200">
                                  <span className="text-[12px] font-bold text-orange-600 text-center px-4 leading-tight drop-shadow-sm">
                                    يجب استخدام على الاقل 3 وسائل مساعدة لفتح اختيارات الإجابات السريعة
                                  </span>
                                </div>
                              )}
                              <div className={`flex flex-wrap justify-center gap-2 p-1 ${isQuickGuessLocked ? 'blur-xl select-none pointer-events-none' : ''}`}>
                                {getEasyGuessOptions()?.map((option: string, idx: number) => (
                                  <button
                                    key={`final-easy-${idx}`}
                                    type="button"
                                    onClick={() => {
                                      if (!isQuickGuessLocked) {
                                        playSound('clickOpen');
                                        setGuess(option);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-accent-orange text-white rounded-xl font-black text-xs md:text-sm hover:brightness-110 active:scale-95 transition-all shadow-md border-b-4 border-orange-600"
                                  >
                                    {isQuickGuessLocked ? '???' : option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          );
                        })()}

                        <button className={`btn-game btn-primary w-full py-2.5 text-base md:text-lg transition-all ${guess.trim() ? 'button-glow scale-105' : ''}`}>إرسال</button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gameplay Chat Box - Moved to Center */}
              {room.gameState !== 'waiting' && room.gameState !== 'finished' && room.gameState !== 'guessing' && (
                <>
                  <div className="w-[75%] md:w-full bg-[#E5DDD5] rounded-2xl border-4 border-white shadow-inner flex flex-col h-50 md:h-64 mt-4 z-20 relative">
                    {isMutedByOpponent && (
                      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white">
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
                          <TypingIndicator gender={opponent?.gender} />
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={(e) => e.preventDefault()} className="p-1.5 bg-[#F0F0F0] flex gap-2 border-t border-gray-200 relative items-center">
                      <div className="flex-1 flex gap-2 py-1">
                        <button
                          disabled={isMutedByOpponent || isQuickResponseDisabled || clickedResponses.includes('آه') || room?.waitingForAnswerFrom !== socket?.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isQuickResponseDisabled || clickedResponses.includes('آه') || room?.waitingForAnswerFrom !== socket?.id) return;
                            playSound('clickOpen');
                            socket?.emit('send_chat', { roomId: room!.id, text: 'آه', passTurn: currentQuickChatNodes.length === 0 });
                            setClickedResponses(prev => [...prev, 'آه']);
                            
                            if (!quickResponseTimeoutRef.current) {
                              quickResponseTimeoutRef.current = setTimeout(() => {
                                setIsQuickResponseDisabled(true);
                                quickResponseTimeoutRef.current = null;
                              }, 3000);
                            }
                          }}
                          className={`flex-1 py-1 md:py-1.5 px-4 rounded-xl font-black text-[13px] md:text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 border-2 ${clickedResponses.includes('آه') ? 'bg-green-500 text-white border-green-600 scale-105' : 'bg-white text-green-600 border-green-500 hover:bg-green-50'}`}
                        >
                          آه
                        </button>

                        <button
                          disabled={isMutedByOpponent || isQuickResponseDisabled || clickedResponses.includes('لأ') || room?.waitingForAnswerFrom !== socket?.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isQuickResponseDisabled || clickedResponses.includes('لأ') || room?.waitingForAnswerFrom !== socket?.id) return;
                            playSound('clickOpen');
                            socket?.emit('send_chat', { roomId: room!.id, text: 'لأ', passTurn: currentQuickChatNodes.length === 0 });
                            setClickedResponses(prev => [...prev, 'لأ']);
                            
                            if (!quickResponseTimeoutRef.current) {
                              quickResponseTimeoutRef.current = setTimeout(() => {
                                setIsQuickResponseDisabled(true);
                                quickResponseTimeoutRef.current = null;
                              }, 3000);
                            }
                          }}
                          className={`flex-1 py-1 md:py-1.5 px-4 rounded-xl font-black text-[13px] md:text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 border-2 ${clickedResponses.includes('لأ') ? 'bg-red-500 text-white border-red-600 scale-105' : 'bg-white text-red-600 border-red-500 hover:bg-red-50'}`}
                        >
                          لأ
                        </button>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          playSound('clickOpen');
                          setShowEmotes(!showEmotes);
                        }}
                        className="bg-white text-brown-muted p-2 rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all w-10 h-10 flex items-center justify-center shrink-0"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      {showEmotes && (
                        <div className="absolute bottom-full left-2 mb-2 bg-white p-2 rounded-2xl shadow-xl border border-gray-200 grid grid-cols-4 gap-1 w-48 z-50">
                          {EMOTES.map(emote => (
                            <button
                              key={emote}
                              type="button"
                              onClick={() => {
                                playSound('clickOpen');
                                socket?.emit('send_emote', { roomId: room!.id, emote });
                                setShowEmotes(false);
                              }}
                              className="text-1xl hover:scale-125 transition-transform p-1"
                            >
                              {emote}
                            </button>
                          ))}
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Quick Chat Reels */}
                  {room.gameState === 'discussion' && (
                    <div className="w-[75%] md:w-full mt-2 flex flex-col gap-2 z-20">
                      {currentQuickChatNodes.length > 4 && (
                        <button
                          disabled={isReelsSpinning}
                          onClick={() => {
                            if (isReelsSpinning) return;
                            playSound('luckyReels');
                            if (reelTimeoutRef.current) clearTimeout(reelTimeoutRef.current);
                            setIsReelsSpinning(true);
                            
                            // Show typing indicator to opponent
                            socket?.emit('typing', { roomId: room!.id });
                            
                            // Generate random items for the reels
                            const newReelItems = Array.from({ length: 4 }).map(() => {
                              const items = [];
                              for (let j = 0; j < 10; j++) {
                                const randomNode = currentQuickChatNodes[Math.floor(Math.random() * currentQuickChatNodes.length)];
                                items.push(randomNode?.text || '...');
                              }
                              return items;
                            });
                            setReelRandomItems(newReelItems);

                            // Staggered Start
                            setSpinningReels([true, false, false, false]);
                            setTimeout(() => setSpinningReels(prev => [true, true, false, false]), 100);
                            setTimeout(() => setSpinningReels(prev => [true, true, true, false]), 200);
                            setTimeout(() => setSpinningReels(prev => [true, true, true, true]), 300);
                            
                            setQuickChatOffset(prev => (prev + 4 >= currentQuickChatNodes.length ? 0 : prev + 4));
                            
                            // Staggered Stop
                            setTimeout(() => setSpinningReels(prev => [false, true, true, true]), 400);
                            setTimeout(() => setSpinningReels(prev => [false, false, true, true]), 500);
                            setTimeout(() => setSpinningReels(prev => [false, false, false, true]), 600);
                            reelTimeoutRef.current = setTimeout(() => {
                              setSpinningReels([false, false, false, false]);
                              setIsReelsSpinning(false);
                              reelTimeoutRef.current = null;
                            }, 700);

                            // Stop typing indicator after 1.5 seconds
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => {
                              socket?.emit('stop_typing', { roomId: room!.id });
                              typingTimeoutRef.current = null;
                            }, 1500);
                          }}
                          className={`flex items-center justify-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 py-1 md:py-1.5 px-3 rounded-lg text-[13px] md:text-sm font-bold transition-colors w-full shadow-sm border border-purple-200 ${isReelsSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <RefreshCw className={`w-4 h-4 ${isReelsSpinning ? 'animate-spin' : ''}`} />
                          تغيير الأسئلة
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                        {currentQuickChatNodes.length === 0 ? (
                          <button
                            disabled={room.currentTurn !== socket?.id || isMutedByOpponent}
                            onClick={() => {
                              if (room.currentTurn !== socket?.id || isMutedByOpponent) return;
                              playSound('clickOpen');
                              socket?.emit('pass_turn', { roomId: room!.id });
                            }}
                            className={`rounded-xl p-0 text-center font-bold text-[13px] md:text-sm shadow-sm transition-all overflow-hidden relative h-10 md:h-12 flex items-center justify-center border-2 ${room.currentTurn === socket?.id ? 'bg-white border-orange-300 text-orange-800 hover:bg-orange-50 active:scale-95' : 'bg-gray-100 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed'}`}
                          >
                            تخطي الدور (لا يوجد أسئلة)
                          </button>
                        ) : (
                          Array.from({ length: 4 }).map((_, i) => {
                            const node = currentQuickChatNodes[quickChatOffset + i];
                            const isMyTurn = room.currentTurn === socket?.id;
                            return (
                              <button
                                key={node ? node.id : `empty-${i}`}
                                disabled={!node || isReelsSpinning || isMutedByOpponent || !isMyTurn}
                                onClick={() => {
                                  if (!node || isReelsSpinning || isMutedByOpponent || !isMyTurn) return;
                                  playSound('clickOpen');
                                  
                                  // Clear typing timeout and stop indicator immediately
                                  if (typingTimeoutRef.current) {
                                    clearTimeout(typingTimeoutRef.current);
                                    typingTimeoutRef.current = null;
                                  }
                                  socket?.emit('stop_typing', { roomId: room!.id });
                                  
                                  socket?.emit('send_chat', { roomId: room!.id, text: node.text });
                                  askedQuickChatNodeRef.current = node;
                                }}
                                className={`rounded-xl p-0 text-center font-bold text-[13px] md:text-sm shadow-sm transition-all overflow-hidden relative h-10 md:h-12 flex items-center justify-center border-2 ${node && isMyTurn ? 'bg-white border-purple-300 text-purple-800 hover:bg-purple-50 active:scale-95' : 'bg-gray-100 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed'}`}
                              >
                                <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                                  {spinningReels[i] && node ? (
                                    <motion.div
                                      animate={{ 
                                        y: i % 2 === 0 
                                          ? [0, isMobile ? -360 : -432] 
                                          : [isMobile ? -360 : -432, 0] 
                                      }}
                                      transition={{ 
                                        repeat: Infinity, 
                                        duration: 0.15 + (i * 0.03), 
                                        ease: "linear" 
                                      }}
                                      className="absolute top-0 flex flex-col w-full blur-[0.8px] md:blur-[1px]"
                                    >
                                      {reelRandomItems[i].map((text, idx) => (
                                        <span key={idx} className="h-10 md:h-12 flex items-center justify-center truncate w-full px-2 text-purple-400/70">
                                          {text}
                                        </span>
                                      ))}
                                    </motion.div>
                                  ) : (
                                    <motion.span
                                      key={node ? node.id : `empty-text-${i}`}
                                      initial={{ opacity: 0, y: 15 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="truncate w-full px-2"
                                    >
                                      {node ? node.text : '...'}
                                    </motion.span>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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
            const isLocked = !hasUnlockedHelpers && isLevelLocked && !hasFreeUse;
            
            // Calculate dynamic cooldown for quick_guess based on room.timer
            let cardCooldown = cooldowns[card.id] || 0;
            if (card.id === 'quick_guess') {
              const threshold = getQuickGuessThreshold(getLevel(me?.xp || xp));
              cardCooldown = Math.max(0, room.timer - threshold);
            }

            const isReady = readyPowerUps.includes(card.id);
            // A power-up requires an ad if it's not locked, not pro, not quick guess, and not ready
            // Even if it has a free use (gift), it still requires an ad to be activated
            const requiresAd = !isLocked && !hasProPackage && card.id !== 'quick_guess' && !isReady && !card.disabled;

            // Only disable other cards during quick guess if they are specifically quick guess, or if game is finished
            const isCardDisabled = isLocked || card.disabled || cardCooldown > 0 || room.gameState === 'finished' || (room.isPaused && card.id === 'quick_guess') || (requiresAd && isCooldown);
            
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

                {hasFreeUse && isLevelLocked && (
                  <div className="absolute -top-2 -right-2 text-lg md:text-xl z-10 animate-bounce" title="مفتوحة من المهام اليومية">
                    ✨
                  </div>
                )}
                
                {!isLocked && !hasProPackage && card.id !== 'quick_guess' && !isReady && (
                  <div className="absolute -top-1.5 -left-1.5 z-10 text-lg md:text-xl drop-shadow-md" title="مشاهدة إعلان">
                    📺
                  </div>
                )}
                
                {(cardCooldown > 0 || (requiresAd && isCooldown)) && !isLocked && (
                  <div className="absolute inset-0 bg-gray-900/80 rounded-full flex items-center justify-center text-white text-xs font-black backdrop-blur-[1px]">
                    {cardCooldown > 0 ? cardCooldown : cooldownTime}s
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
          <>
            {/* 1. الطبقة الشفافة اللي ورا النافذة */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHint(null)} // بتقفل لما تضغط في أي مكان بره
              className="fixed inset-0 z-[240] bg-transparent cursor-default" // bg-black/10 بيعمل ضل خفيف، لو عايزها شفافة تماماً خليها bg-transparent
            />

            {/* 2. النافذة نفسها */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="fixed bottom-28 left-6 z-[250] bg-blue-500 text-white px-8 py-6 rounded-[32px] shadow-[0_8px_0_rgba(0,0,0,0.2)] font-black text-lg border-4 border-blue-400"
            >
              <button 
                onClick={() => setHint(null)} 
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-colors"
              >
                ✕
              </button>

              {hint}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[55%] flex items-center justify-center p-6 px-6 py-3 rounded-full font-black shadow-[0_8px_0_rgba(0,0,0,0.2)] z-[500] flex items-center gap-4 border-4 ${error.includes('انضم') ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}
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
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[3000] flex items-center justify-center p-4"
          >
            <motion.div 
              className="relative max-w-sm w-full flex flex-col items-center p-6 backdrop-blur-xl"
            >
              {room.winnerId === me?.id ? (
                <div className="flex flex-col items-center mb-4 w-full">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 10, stiffness: 100 }}
                    className="mb-1"
                  >
                    <img src="/trophy-01.gif" className="w-25 h-25 md:w-25 md:h-25 mx-auto mb-1 md:mb-1 object-contain" />
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-3xl font-bowlby text-yellow-400 mb-1" dir="ltr"
                  >
                    You Win!
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white font-black text-base mb-3 px-4 py-1.5 backdrop-blur-sm"
                  >
                   ⭐مبروووووووك!⭐
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
                          <span className="text-[13px] text-yellow-400 mt-0.5">تحتاج Tokens لزيادة الـ XP</span>
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
                <div className="flex flex-col items-center mb-2 w-full">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 100 }}
                    className="mb-1 text-6xl"
                  >
                      <img src="/oh-no.gif" className="w-25 h-25 md:w-25 md:h-25 mx-auto mb-1 md:mb-1 object-contain" />
                  </motion.div>
                  
                  <motion.h2 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-3xl font-bowlby text-red-500 mb-1" dir="ltr"
                  >
                    You Lose!
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white font-black text-base mb-4 px-4 py-1.5 backdrop-blur-sm"
                  >
                   حظ أوفر في التخمينة القادمة
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
                          <span className="text-[13px] text-yellow-400 mt-0.5">تحتاج Tokens لزيادة الـ XP</span>
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
                <div className="w-21 h-21 rounded-2xl overflow-hidden shadow-lg">
                  <img src={me?.targetImage?.image} className="w-full h-full object-cover" alt={me?.targetImage?.name} />
                </div>
                <div className="font-black text-lg text-white mt-2 px-3 py-0.5 backdrop-blur-sm">{me?.targetImage?.name}</div>
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
                  onClick={async () => {
                    if (needsUpdate || needRefresh) {
                      try {
                        if ('serviceWorker' in navigator) {
                          const registrations = await navigator.serviceWorker.getRegistrations();
                          for (let registration of registrations) {
                            await registration.unregister();
                          }
                        }

                        if ('caches' in window) {
                          const cacheNames = await caches.keys();
                          await Promise.all(cacheNames.map(name => caches.delete(name)));
                        }

                        window.location.reload();
                      } catch (error) {
                        console.error('Manual update failed:', error);
                        window.location.reload();
                      }
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

      {/* Push Notification Prompt */}
      <AnimatePresence>
        {showPushPrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-[7000]"
          >
            <div className="box-game p-6 bg-white border-4 border-accent-purple shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-accent-purple rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm border-2 border-black">
                  <Bell className="w-6 h-6 animate-bounce" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-main leading-tight mb-1">تفعيل الإشعارات؟ 🔔</h3>
                  <p className="text-xs font-bold text-brown-muted">
                    كن أول من يعرف عن التحديثات الجديدة، الهدايا اليومية، والفعاليات الحصرية!
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('khamin_push_prompt_dismissed', 'true');
                    setShowPushPrompt(false);
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-brown-dark rounded-xl font-black text-sm transition-all border-2 border-black"
                >
                  ليس الآن
                </button>
                <button
                  onClick={() => subscribeToPush(true)}
                  className="flex-2 py-3 bg-accent-purple hover:bg-purple-600 text-white rounded-xl font-black text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1"
                >
                  تفعيل الآن 🚀
                </button>
              </div>
            </div>
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
            player1={{ id: room.players[0].id, name: room.players[0].name, level: room.players[0].level, avatar: room.players[0].avatar, selectedFrame: room.players[0].selectedFrame }}
            player2={{ id: room.players[1].id, name: room.players[1].name, level: room.players[1].level, avatar: room.players[1].avatar, selectedFrame: room.players[1].selectedFrame }}
            customConfig={customConfig}
            onStartGame={handleMatchIntroStart}
            onComplete={handleMatchIntroComplete}
          />
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
