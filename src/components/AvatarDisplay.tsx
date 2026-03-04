import React from 'react';
import { Star } from 'lucide-react';
import { STATIC_ASSETS } from '../constants';

export const AvatarDisplay = ({ avatar, level, customConfig, className = "w-full h-full", hideExtras = false }: { avatar: string, level: number, customConfig: any, className?: string, hideExtras?: boolean }) => {
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
  if (avatar === 'avatar-free-01.png') avatarReplacement = customConfig.avatars?.['free1'];
  else if (avatar === 'avatar-free-02.png') avatarReplacement = customConfig.avatars?.['free2'];
  else if (avatar === 'avatar-free-03.png') avatarReplacement = customConfig.avatars?.['free3'];
  else if (avatar === 'avatar-free-04.png') avatarReplacement = customConfig.avatars?.['free4'];
  else if (avatar === 'avatar-lvl-10.png') avatarReplacement = customConfig.avatars?.[10];
  else if (avatar === 'avatar-lvl-20.png') avatarReplacement = customConfig.avatars?.[20];
  else if (avatar === 'avatar-lvl-30.png') avatarReplacement = customConfig.avatars?.[30];
  else if (avatar === 'avatar-lvl-40.png') avatarReplacement = customConfig.avatars?.[40];
  else if (avatar === 'avatar-lvl-50.png') avatarReplacement = customConfig.avatars?.[50];

  const customAvatar = customConfig.avatars?.[milestoneLevel];
  const customFrame = customConfig.frames?.[milestoneLevel];
  const customStar = customConfig.stars?.[milestoneLevel];

  const staticAvatar = !customAvatar && STATIC_ASSETS.avatars[milestoneLevel as keyof typeof STATIC_ASSETS.avatars];
  const staticFrame = !customFrame && STATIC_ASSETS.frames[milestoneLevel as keyof typeof STATIC_ASSETS.frames];
  const staticStar = !customStar && STATIC_ASSETS.stars[milestoneLevel as keyof typeof STATIC_ASSETS.stars];

  const isFilename = typeof avatar === 'string' && avatar.includes('.png');
  
  let displayAvatar = avatarReplacement ? `/uploads/${avatarReplacement}` :
                     (isFilename ? `/assets/${avatar}` : 
                     (customAvatar ? `/uploads/${customAvatar}` :
                     (staticAvatar ? `/assets/${Array.isArray(staticAvatar) ? staticAvatar[0] : staticAvatar}` : 
                     avatar)));

  const displayFrame = !hideExtras && (customFrame ? `/uploads/${customFrame}` : (staticFrame ? `/assets/${staticFrame}` : null));
  const displayStar = !hideExtras && (customStar ? `/uploads/${customStar}` : (staticStar ? `/assets/${staticStar}` : null));

  const getAvatarStyle = (lvl: number) => {
    if (lvl >= 50) return 'bg-red-50 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)]';
    if (lvl >= 40) return 'bg-purple-50 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)]';
    if (lvl >= 30) return 'bg-emerald-50 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]';
    if (lvl >= 20) return 'bg-yellow-50 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]';
    if (lvl >= 10) return 'bg-gray-100 border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.5)]';
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
};
