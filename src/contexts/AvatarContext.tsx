import React, { createContext, useContext, useState, useEffect } from 'react';

const AvatarContext = createContext<any>(null);

export const AvatarProvider = ({ children }: { children: React.ReactNode }) => {
  const [customConfig, setCustomConfig] = useState<any>({ avatars: {}, frames: {}, stars: {}, aiBotEnabled: false });

  const refreshConfig = () => {
    fetch('/api/config').then(res => res.json()).then(setCustomConfig);
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  return (
    <AvatarContext.Provider value={{ customConfig, refreshConfig }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatarConfig = () => useContext(AvatarContext);
