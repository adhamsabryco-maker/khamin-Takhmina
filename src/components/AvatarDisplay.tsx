import React from 'react';

export const AvatarDisplay = ({ avatar, level, customConfig, className = "w-full h-full" }: { avatar: string, level: number, customConfig: any, className?: string }) => {
  const frame = customConfig.frames?.[level];
  const star = customConfig.stars?.[level];

  return (
    <div className={`relative ${className}`}>
      {/* Avatar */}
      {avatar.startsWith('data:image') || avatar.startsWith('http') ? (
        <img src={avatar} className="w-full h-full object-cover rounded-full" alt="Avatar" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl">{avatar}</div>
      )}

      {/* Frame */}
      {frame && (
        <img src={`/uploads/${frame}`} className="absolute inset-0 w-full h-full object-contain pointer-events-none" alt="Frame" />
      )}

      {/* Stars */}
      {star && (
        <img src={`/uploads/${star}`} className="absolute -top-4 -right-4 w-12 h-12 animate-spin-slow pointer-events-none" alt="Star" />
      )}
    </div>
  );
};
