import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, Sparkles, HelpCircle, Type, Snowflake, SkipForward, Eye, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AvatarDisplay } from './AvatarDisplay';

const LEVEL_REWARDS: Record<number, { name: string; description: string; icon: any; color: string }> = {
  10: { name: 'النصيحة', description: 'تلميح يكشف لك أول وتاني حرف من الكلمة.', icon: HelpCircle, color: 'text-blue-500' },
  20: { name: 'كاشف الحروف', description: 'يكشف لك عدد احرف الكلمة.', icon: Type, color: 'text-green-500' },
  30: { name: 'تجميد الوقت', description: 'يوقف العداد الاساسي لمدة 60 ثانية.', icon: Snowflake, color: 'text-cyan-500' },
  40: { name: 'عدد الكلمات', description: 'يكشف لك عدد كلمات صورة التخمين', icon: Hash, color: 'text-purple-500' },
  50: { name: 'الجاسوس', description: 'يكشف لك صورة التخمين.', icon: Eye, color: 'text-purple-500' },
};

interface LevelUpModalProps {
  level: number;
  avatar: string;
  customConfig: any;
  onClose: () => void;
}

export const LevelUpModal = ({ level, avatar, customConfig, onClose }: LevelUpModalProps) => {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const isMilestone = [10, 20, 30, 40, 50].includes(level);

  useEffect(() => {
    // Initial delay before starting progress
    const timer = setTimeout(() => {
      const duration = 800;
      const start = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const elapsed = now - start;
        const nextProgress = Math.min(1, elapsed / duration);
        
        setProgress(nextProgress);
        
        if (nextProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Progress finished
          triggerExplosion();
          setTimeout(() => setShowContent(true), 200);
        }
      };
      
      requestAnimationFrame(animate);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const triggerExplosion = () => {
    const end = Date.now() + 2 * 1000;
    const colors = ['#FFD700', '#FFA500', '#FF4500', '#FFFFFF'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Big burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    });
  };

  const getLevelColor = (lvl: number) => {
    if (lvl >= 50) return 'from-red-500 to-orange-600';
    if (lvl >= 40) return 'from-purple-500 to-pink-600';
    if (lvl >= 30) return 'from-emerald-500 to-teal-600';
    if (lvl >= 20) return 'from-yellow-400 to-orange-500';
    if (lvl >= 10) return 'from-blue-400 to-indigo-500';
    return 'from-orange-400 to-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-hidden cursor-pointer"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="relative max-w-xs w-full bg-white rounded-[32px] shadow-[0_0_100px_rgba(255,215,0,0.3)] p-4 text-center border-4 border-yellow-400/30 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getLevelColor(level)} opacity-5 rounded-[28px]`} />
        
        {/* Close Button (X) */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 p-3 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-all z-50"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Section */}
        <div className="relative mb-2">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white"
          >
            <Trophy className="w-8 h-8 text-white drop-shadow-lg" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-2"
          >
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 leading-tight">
              LEVEL UP!
            </h1>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
              <span className="text-lg font-black text-brown-dark">المستوى {level}</span>
              <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
            </div>
          </motion.div>
        </div>

        {/* Avatar Display Section */}
        <div className="relative mb-4 h-24 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!showContent ? (
              <motion.div
                key="loading"
                exit={{ opacity: 0, scale: 0.5 }}
                className="w-full max-w-[180px]"
              >
                <div className="text-[10px] font-black text-brown-light mb-1 uppercase tracking-widest">جاري الارتقاء...</div>
                <div className="h-4 bg-[#F6E6CD] rounded-full overflow-hidden border-2 border-brown-soft/20 p-0.5" dir="ltr">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${getLevelColor(level)} shadow-[0_0_15px_rgba(250,204,21,0.5)]`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="relative"
              >
                {/* Rotating Background Glow */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className={`absolute inset-0 -m-4 bg-gradient-to-r ${getLevelColor(level)} opacity-20 blur-3xl rounded-full`}
                />
                
                <div className="w-24 h-24 relative z-10">
                  <AvatarDisplay 
                    avatar={avatar} 
                    level={level} 
                    customConfig={customConfig} 
                    className="w-full h-full" 
                  />
                </div>
                
                {/* Floating Stars Count */}
                <motion.div
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white px-2 py-1 rounded-xl shadow-lg border border-yellow-400 z-20"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-yellow-600">{Math.floor(level / 10)}</span>
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  </div>
                </motion.div>

                {/* Milestone Badge */}
                {isMilestone && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black shadow-lg border border-white z-30 whitespace-nowrap"
                  >
                    إنجاز تاريخي! 🏆
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

          {isMilestone && LEVEL_REWARDS[level] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ delay: 0.6 }}
            className="mb-4 box-game p-3 relative overflow-hidden mx-1"
          >
            <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-md">
              جديد!
            </div>
            <div className="flex items-center flex-row-reverse gap-2">
              <div className={`w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-brown-soft/20 shrink-0 ${LEVEL_REWARDS[level].color}`}>
                {React.createElement(LEVEL_REWARDS[level].icon, { className: "w-5 h-5" })}
              </div>
              <div className="text-right flex-1">
                <h3 className={`font-black text-xs ${LEVEL_REWARDS[level].color}`}>{LEVEL_REWARDS[level].name}</h3>
                <p className="text-[10px] font-bold text-brown-muted leading-tight mt-0.5">{LEVEL_REWARDS[level].description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          className="space-y-3"
        >
          <p className="text-brown-muted font-bold text-sm leading-relaxed px-2">
            {isMilestone 
              ? "واو! لقد وصلت لمستوى أسطوري. استمر في التألق وفتح المزيد من المفاجآت!"
              : "رائع جداً! مهاراتك في تحسن مستمر. المستوى القادم ينتظرك!"}
          </p>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-4 left-4 opacity-20">
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </div>
        <div className="absolute bottom-4 right-4 opacity-20">
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </div>
      </motion.div>
    </motion.div>
  );
};
