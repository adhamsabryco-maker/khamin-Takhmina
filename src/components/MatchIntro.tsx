import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

import { AvatarDisplay } from './AvatarDisplay';

interface Player {
  id: string;
  name: string;
  level: number;
  avatar: string;
  selectedFrame?: string;
  isHighestLikes?: boolean;
}

interface MatchIntroProps {
  player1: Player;
  player2: Player;
  customConfig: any;
  onStartGame?: () => void;
  onComplete: () => void;
}

export const MatchIntro: React.FC<MatchIntroProps> = ({ player1, player2, customConfig, onStartGame, onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger game start behind the scenes while the intro is fully covering the screen
    const startGameTimer = setTimeout(() => {
      if (onStartGame) onStartGame();
    }, 1500);

    // Entrance finishes around 0.9s. Hold for 2s. Exit starts at 2.9s.
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2900);

    return () => {
      clearTimeout(startGameTimer);
      clearTimeout(exitTimer);
    };
  }, [onStartGame]);

  const doorTransition = { duration: 0.3, ease: "easeInOut" };
  const dividerTransition = { duration: 0.2 };
  const vsTransition = { type: "spring", stiffness: 200 };
  const contentTransition = { duration: 0.2 };

  return (
    <div className="fixed inset-0 z-[10000] flex overflow-hidden">
      {/* Desktop Sliding Doors (Background) */}
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: isExiting ? '-100%' : 0 }}
        onAnimationComplete={() => {
          if (isExiting) onComplete();
        }}
        transition={doorTransition}
        className="hidden md:block absolute inset-y-0 left-0 w-[65vw] z-10 comic-bg-door"
        style={{
          background: 'radial-gradient(circle at center, var(--bg-body-start) 0%, var(--bg-body-end) 100%) fixed',
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 30vw) 100%, 0 100%)'
        }}
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: isExiting ? '100%' : 0 }}
        transition={doorTransition}
        className="hidden md:block absolute inset-y-0 right-0 w-[65vw] z-10 comic-bg-door"
        style={{
          background: 'radial-gradient(circle at center, var(--bg-body-start) 0%, var(--bg-body-end) 100%) fixed',
          clipPath: 'polygon(30vw 0, 100% 0, 100% 100%, 0 100%)'
        }}
      />

      {/* Mobile Sliding Doors (Background) */}
      <motion.div 
        initial={{ y: '-100%' }}
        animate={{ y: isExiting ? '-100%' : 0 }}
        transition={doorTransition}
        className="md:hidden absolute inset-x-0 top-0 h-[65vh] z-10 comic-bg-door"
        style={{
          background: 'radial-gradient(circle at center, var(--bg-body-start) 0%, var(--bg-body-end) 100%) fixed',
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30vh), 0 100%)'
        }}
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: isExiting ? '100%' : 0 }}
        transition={doorTransition}
        className="md:hidden absolute inset-x-0 bottom-0 h-[65vh] z-10 comic-bg-door"
        style={{
          background: 'radial-gradient(circle at center, var(--bg-body-start) 0%, var(--bg-body-end) 100%) fixed',
          clipPath: 'polygon(0 30vh, 100% 0, 100% 100%, 0 100%)'
        }}
      />

      {/* Content (Fixed in center) */}
      <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-center z-20">
        {/* Left/Top Player (Player 2) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: isExiting ? 0 : 1, x: isExiting ? -50 : 0 }}
          transition={{ delay: isExiting ? 0 : 0.7, ...contentTransition }}
          className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col items-center justify-center md:pr-12 pb-6 md:pb-0"
        >
          <div className="text-center space-y-2 md:space-y-4 bg-accent-orange/80 p-4 md:p-6 border-4 border-black">
            <div className="w-20 h-20 md:w-32 md:h-32 mx-auto">
              <AvatarDisplay avatar={player2.avatar} level={player2.level} customConfig={customConfig} hideExtras={true} selectedFrame={player2.selectedFrame} isHighestLikes={player2.isHighestLikes} />
            </div>
            <h2 className="text-xl md:text-3xl font-black text-white drop-shadow-md">{player2.name}</h2>
            <p className="text-lg md:text-xl font-bold text-white/90 drop-shadow-sm">Level {player2.level}</p>
          </div>
        </motion.div>

        {/* Right/Bottom Player (Player 1) */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: isExiting ? 0 : 1, x: isExiting ? 50 : 0 }}
          transition={{ delay: isExiting ? 0 : 0.7, ...contentTransition }}
          className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col items-center justify-center md:pl-12 pt-6 md:pt-0"
        >
          <div className="text-center space-y-2 md:space-y-4 bg-accent-blue/80 p-4 md:p-6 border-4 border-black">
            <div className="w-20 h-20 md:w-32 md:h-32 mx-auto">
              <AvatarDisplay avatar={player1.avatar} level={player1.level} customConfig={customConfig} hideExtras={true} selectedFrame={player1.selectedFrame} isHighestLikes={player1.isHighestLikes} />
            </div>
            <h2 className="text-xl md:text-3xl font-black text-white drop-shadow-md">{player1.name}</h2>
            <p className="text-lg md:text-xl font-bold text-white/90 drop-shadow-sm">Level {player1.level}</p>
          </div>
        </motion.div>
      </div>

      {/* Angled Divider & VS */}
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
        {/* Desktop Divider */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isExiting ? 0 : 1 }}
          transition={{ delay: isExiting ? 0.2 : 0.3, ...dividerTransition }}
          className="hidden md:block absolute inset-0 bg-black"
          style={{ clipPath: 'polygon(calc(65vw - 8px) 0, calc(65vw + 8px) 0, calc(35vw + 8px) 100%, calc(35vw - 8px) 100%)' }}
        />
        {/* Mobile Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isExiting ? 0 : 1 }}
          transition={{ delay: isExiting ? 0.2 : 0.3, ...dividerTransition }}
          className="md:hidden absolute inset-0 bg-black"
          style={{ clipPath: 'polygon(0 calc(65vh - 8px), 100% calc(35vh - 8px), 100% calc(35vh + 8px), 0 calc(65vh + 8px))' }}
        />
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: isExiting ? 0 : 1 }}
          transition={{ delay: isExiting ? 0.1 : 0.5, ...vsTransition }}
          className="absolute bg-white text-black text-4xl md:text-6xl font-black px-4 py-2 md:px-8 md:py-4 shadow-2xl border-4 border-black"
        >
          VS
        </motion.div>
      </div>
    </div>
  );
};
