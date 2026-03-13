import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Player {
  id: string;
  name: string;
  level: number;
  avatar: string;
}

interface MatchIntroProps {
  player1: Player;
  player2: Player;
  onComplete: () => void;
}

export const MatchIntro: React.FC<MatchIntroProps> = ({ player1, player2, onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance finishes around 0.9s. Hold for 2s.
    const holdTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2900);

    return () => {
      clearTimeout(holdTimer);
    };
  }, []);

  const doorTransition = { duration: 0.3, ease: "easeInOut" };
  const dividerTransition = { duration: 0.2 };
  const vsTransition = { type: "spring", stiffness: 200 };
  const contentTransition = { duration: 0.2 };

  return (
    <div className="fixed inset-0 z-[10000] flex overflow-hidden">
      {/* Sliding Doors (Background) */}
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: isExiting ? '-100%' : 0 }}
        onAnimationComplete={() => {
          if (isExiting) onComplete();
        }}
        transition={doorTransition}
        className="absolute inset-y-0 left-0 w-1/2 z-10"
        style={{
          background: 'radial-gradient(circle at center, var(--bg-body-start) 0%, var(--bg-body-end) 100%) fixed',
        }}
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: isExiting ? '100%' : 0 }}
        transition={doorTransition}
        className="absolute inset-y-0 right-0 w-1/2 z-10"
        style={{
          background: 'radial-gradient(circle at center, var(--bg-body-start) 0%, var(--bg-body-end) 100%) fixed',
        }}
      />

      {/* Content (Fixed in center) */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        {/* Left Player (Player 2) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          transition={{ delay: isExiting ? 0 : 0.7, ...contentTransition }}
          className="w-1/2 flex flex-col items-center justify-center"
        >
          <div className="text-center space-y-4 bg-accent-orange/80 p-6 border-4 border-black">
            <img src={player2.avatar} alt={player2.name} className="w-32 h-32 rounded-none border-4 border-black shadow-lg mx-auto bg-white" />
            <h2 className="text-3xl font-black text-white drop-shadow-md">{player2.name}</h2>
            <p className="text-xl font-bold text-white/90 drop-shadow-sm">Level {player2.level}</p>
          </div>
        </motion.div>

        {/* Right Player (Player 1) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          transition={{ delay: isExiting ? 0 : 0.7, ...contentTransition }}
          className="w-1/2 flex flex-col items-center justify-center"
        >
          <div className="text-center space-y-4 bg-accent-blue/80 p-6 border-4 border-black">
            <img src={player1.avatar} alt={player1.name} className="w-32 h-32 rounded-none border-4 border-black shadow-lg mx-auto bg-white" />
            <h2 className="text-3xl font-black text-white drop-shadow-md">{player1.name}</h2>
            <p className="text-xl font-bold text-white/90 drop-shadow-sm">Level {player1.level}</p>
          </div>
        </motion.div>
      </div>

      {/* Straight Divider & VS */}
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isExiting ? 0 : 1 }}
          transition={{ delay: isExiting ? 0.2 : 0.3, ...dividerTransition }}
          className="w-4 h-full bg-black shadow-lg"
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: isExiting ? 0 : 1 }}
          transition={{ delay: isExiting ? 0.1 : 0.5, ...vsTransition }}
          className="absolute bg-white text-black text-6xl font-black px-8 py-4 shadow-2xl border-4 border-black"
        >
          VS
        </motion.div>
      </div>
    </div>
  );
};
