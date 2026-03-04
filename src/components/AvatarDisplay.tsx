// src/components/AvatarDisplay.tsx
import React from 'react';

export const AvatarDisplay: React.FC = () => {
  return (
    <div className="p-4 border rounded-xl">
      <h2 className="text-xl font-bold">Avatar Display</h2>
      <img src="/assets/avatar.png" alt="Avatar" className="w-32 h-32" />
    </div>
  );
};
