import React from 'react';
import { Star } from 'lucide-react';
import { STATIC_ASSETS } from '../constants';

export const AvatarDisplay = ({ avatar, level, customConfig, className = "w-full h-full" }: { avatar: string, level: number, customConfig: any, className?: string }) => {
  const customAvatar = customConfig.avatars?.[level];
  const customFrame = customConfig.frames?.[level];
  const customStar = customConfig.stars?.[level];

  const staticAvatar = !customAvatar && STATIC_ASSETS.avatars[level as keyof typeof STATIC_ASSETS.avatars];
  const staticFrame = !customFrame && STATIC_ASSETS.frames[level as keyof typeof STATIC_ASSETS.frames];
  const staticStar = !customStar && STATIC_ASSETS.stars[level as keyof typeof STATIC_ASSETS.stars];

  const isFilename = typeof avatar === 'string' && avatar.includes('.png');
  
  let displayAvatar = customAvatar ? `/uploads/${customAvatar}` : 
                     (isFilename ? `/assets/${avatar}` : 
                     (staticAvatar ? `/assets/${Array.isArray(staticAvatar) ? staticAvatar[0] : staticAvatar}` : 
                     avatar));
  const displayFrame = customFrame ? `/uploads/${customFrame}` : (staticFrame ? `/assets/${staticFrame}` : null);
  const displayStar = customStar ? `/uploads/${customStar}` : (staticStar ? `/assets/${staticStar}` : null);

  const getAvatarStyle = (lvl: number) => {
    if (lvl >= 50) return 'bg-red-50 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)]';
    if (lvl >= 40) return 'bg-purple-50 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)]';
    if (lvl >= 30) return 'bg-emerald-50 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]';
    if (lvl >= 20) return 'bg-yellow-50 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]';
    if (lvl >= 10) return 'bg-gray-100 border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.5)]';
    return 'bg-orange-100 border-orange-300 shadow-inner';
  };

  const renderStarsFallback = (lvl: number) => {
    const starsCount = Math.floor(lvl / 10);
    if (starsCount === 0) return null;
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

  return (
    <div className={`relative ${className}`}>
      {/* Fallback Stars (only if no custom/static star image) */}
      {!displayStar && renderStarsFallback(level)}

      {/* Avatar Container with Fallback Style (only if no custom/static frame image) */}
      <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden border-4 ${!displayFrame ? getAvatarStyle(level) : ''}`}>
        {displayAvatar.startsWith('data:image') || displayAvatar.startsWith('http') || displayAvatar.startsWith('/uploads/') || displayAvatar.startsWith('/assets/') ? (
          <img src={displayAvatar} className="w-full h-full object-cover" alt="Avatar" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-inherit">{displayAvatar}</div>
        )}
      </div>

      {/* Frame Image */}
      {displayFrame && (
        <img src={displayFrame} className="absolute inset-0 w-full h-full object-contain pointer-events-none" alt="Frame" />
      )}

      {/* Star Image */}
      {displayStar && (
        <img src={displayStar} className="absolute -top-4 -right-4 w-12 h-12 animate-spin-slow pointer-events-none" alt="Star" />
      )}
    </div>
  );
};
