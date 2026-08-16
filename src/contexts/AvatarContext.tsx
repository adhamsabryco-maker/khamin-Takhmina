import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../apiConfig';

const AvatarContext = createContext<any>(null);

export const AvatarProvider = ({ children }: { children: React.ReactNode }) => {
  const [customConfig, setCustomConfig] = useState<any>({ avatars: {}, frames: {}, stars: {}, aiBotEnabled: false });

  const refreshConfig = () => {
    fetch(apiUrl('/api/config'))
      .then(res => res.json())
      .then(setCustomConfig)
      .catch(err => console.error("Failed to load config:", err));
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
