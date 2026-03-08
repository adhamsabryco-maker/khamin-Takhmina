import React from 'react';
import { Star } from 'lucide-react';
import { STATIC_ASSETS } from '../constants';

export const AvatarDisplay = React.memo(({ avatar, level, customConfig, className = "w-full h-full", hideExtras = false }: { avatar: string, level: number, customConfig: any, className?: string, hideExtras?: boolean }) => {
  const getMilestoneLevel = (lvl: number) => {
    if (lvl >= 50) return 50;
    if (lvl >= 40) return 40;
    if (lvl >= 30) return 30;
    if (lvl >= 20) return 20;
    if (lvl >= 10) return 10;
    return 1;
  };

  const milestoneLevel = getMilestoneLevel(level);

  // Check for specific avatar replacements based on the selected avatar ID
  let avatarReplacement = null;
  const avatarMap: Record<string, string> = {
    'avatar-free-boy-01.png': 'free-boy-1', 'avatar-free-boy-02.png': 'free-boy-2', 'avatar-free-boy-03.png': 'free-boy-3', 'avatar-free-boy-04.png': 'free-boy-4',
    'avatar-free-girl-01.png': 'free-girl-1', 'avatar-free-girl-02.png': 'free-girl-2', 'avatar-free-girl-03.png': 'free-girl-3', 'avatar-free-girl-04.png': 'free-girl-4',
    'avatar-lvl-boy-10.png': 'boy-10', 'avatar-lvl-girl-10.png': 'girl-10',
    'avatar-lvl-boy-20.png': 'boy-20', 'avatar-lvl-girl-20.png': 'girl-20',
    'avatar-lvl-boy-30.png': 'boy-30', 'avatar-lvl-girl-30.png': 'girl-30',
    'avatar-lvl-boy-40.png': 'boy-40', 'avatar-lvl-girl-40.png': 'girl-40',
  };
  
  if (avatarMap[avatar]) {
    avatarReplacement = customConfig.avatars?.[avatarMap[avatar]];
  }

  const customAvatar = customConfig.avatars?.[milestoneLevel];
  const customFrame = customConfig.frames?.[milestoneLevel];
  const customStar = customConfig.stars?.[milestoneLevel];

  const staticAvatar = !customAvatar && STATIC_ASSETS.avatars[milestoneLevel as keyof typeof STATIC_ASSETS.avatars];
  const staticFrame = !customFrame && STATIC_ASSETS.frames[milestoneLevel as keyof typeof STATIC_ASSETS.frames];
  const staticStar = !customStar && STATIC_ASSETS.stars[milestoneLevel as keyof typeof STATIC_ASSETS.stars];

  const isFilename = typeof avatar === 'string' && avatar.includes('.png');
  const isDataUrl = typeof avatar === 'string' && avatar.startsWith('data:image');
  
  let displayAvatar = isDataUrl ? avatar :
                     (avatarReplacement ? `/uploads/${avatarReplacement}` :
                     (isFilename ? `/assets/${avatar}` : 
                     (customAvatar ? `/uploads/${customAvatar}` :
                     (staticAvatar ? `/assets/${Array.isArray(staticAvatar) ? staticAvatar[0] : staticAvatar}` : 
                     avatar))));

  const displayFrame = !hideExtras && (customFrame ? `/uploads/${customFrame}` : (staticFrame ? `/assets/${staticFrame}` : null));
  const displayStar = !hideExtras && (customStar ? `/uploads/${customStar}` : (staticStar ? `/assets/${staticStar}` : null));

  const getAvatarStyle = (lvl: number) => {
    if (lvl >= 50) return 'bg-red-50 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)]';
    if (lvl >= 40) return 'bg-purple-50 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)]';
    if (lvl >= 30) return 'bg-emerald-50 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]';
    if (lvl >= 20) return 'bg-yellow-50 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]';
    if (lvl >= 10) return 'bg-brown-soft/20 border-brown-light shadow-[0_0_10px_rgba(166,139,124,0.5)]';
    return 'bg-orange-100 border-orange-300 shadow-inner';
  };

  const renderStarsFallback = (lvl: number) => {
    if (hideExtras) return null;
    const starsCount = Math.floor(lvl / 10);
    if (starsCount === 0) return null;
    return (
      <div className="absolute inset-0 z-30 pointer-events-none animate-[spin_15s_linear_infinite]">
        {Array.from({ length: starsCount }).map((_, i) => {
          const angle = (i * 360) / starsCount;
          return (
            <div 
              key={i} 
              className="absolute inset-0 flex items-start justify-center"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div className="-mt-2">
                {displayStar ? (
                  <img 
                    src={displayStar} 
                    className="w-3.5 h-3.5 object-contain drop-shadow-md" 
                    style={{ transform: `rotate(-${angle}deg)` }} 
                    alt="Star"
                  />
                ) : (
                  <Star 
                    className="w-3 h-3 text-yellow-500 fill-yellow-500 drop-shadow-md" 
                    style={{ transform: `rotate(-${angle}deg)` }} 
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Stars Animation Layer - Now on top of Frame */}
      {renderStarsFallback(level)}

      {/* Avatar Container */}
      <div className={`
        relative
        w-full h-full 
        rounded-full 
        flex items-center justify-center 
        overflow-hidden 
        z-10
        ${displayFrame ? 'p-1.5' : `border-4 ${getAvatarStyle(level)}`}
      `}>
        {displayAvatar.startsWith('data:image') || displayAvatar.startsWith('http') || displayAvatar.startsWith('/uploads/') || displayAvatar.startsWith('/assets/') ? (
          <img src={displayAvatar} className="w-full h-full object-cover rounded-full" alt="Avatar" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-inherit font-black">{displayAvatar}</div>
        )}
      </div>

      {/* Frame Image Layer */}
      {displayFrame && (
        <img 
          src={displayFrame} 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[115%] max-w-none object-contain pointer-events-none z-20" 
          alt="Frame" 
        />
      )}
    </div>
  );
});
