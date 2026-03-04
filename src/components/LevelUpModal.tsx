import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AvatarDisplay } from './AvatarDisplay';

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
      const duration = 1500;
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
    }, 500);

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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="relative max-w-md w-full bg-white rounded-[40px] shadow-[0_0_100px_rgba(255,215,0,0.3)] p-8 text-center border-8 border-yellow-400/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getLevelColor(level)} opacity-5 rounded-[32px]`} />
        
        {/* Header Section */}
        <div className="relative mb-8">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white"
          >
            <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4"
          >
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 leading-tight">
              LEVEL UP!
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
              <span className="text-2xl font-black text-gray-800">المستوى {level}</span>
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            </div>
          </motion.div>
        </div>

        {/* Avatar Display Section */}
        <div className="relative mb-10 h-48 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!showContent ? (
              <motion.div
                key="loading"
                exit={{ opacity: 0, scale: 0.5 }}
                className="w-full max-w-[280px]"
              >
                <div className="text-sm font-black text-gray-400 mb-3 uppercase tracking-widest">جاري الارتقاء...</div>
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200 p-1">
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
                  className={`absolute inset-0 -m-8 bg-gradient-to-r ${getLevelColor(level)} opacity-20 blur-3xl rounded-full`}
                />
                
                <div className="w-40 h-40 relative z-10">
                  <AvatarDisplay 
                    avatar={avatar} 
                    level={level} 
                    customConfig={customConfig} 
                    className="w-full h-full" 
                  />
                </div>
                
                {/* Floating Stars Count */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-2xl shadow-xl border-2 border-yellow-400 z-20"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-yellow-600">{Math.floor(level / 10)}</span>
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                </motion.div>

                {/* Milestone Badge */}
                {isMilestone && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-1.5 rounded-full text-sm font-black shadow-lg border-2 border-white z-30 whitespace-nowrap"
                  >
                    إنجاز تاريخي! 🏆
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          className="space-y-4"
        >
          <p className="text-gray-500 font-bold text-lg leading-relaxed px-4">
            {isMilestone 
              ? "واو! لقد وصلت لمستوى أسطوري. استمر في التألق وفتح المزيد من المفاجآت!"
              : "رائع جداً! مهاراتك في تحسن مستمر. المستوى القادم ينتظرك!"}
          </p>
          
          <button
            onClick={onClose}
            className={`w-full py-4 rounded-2xl text-white text-2xl font-black shadow-xl transition-all active:scale-95 bg-gradient-to-r ${getLevelColor(level)} hover:brightness-110`}
          >
            استمرار المغامرة!
          </button>
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
