import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../apiConfig';

const AvatarContext = createContext<any>(null);

export const AvatarProvider = ({ children }: { children: React.ReactNode }) => {
  const [customConfig, setCustomConfig] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("khamin_config_cache");
      return cached ? JSON.parse(cached) : { avatars: {}, frames: {}, stars: {}, aiBotEnabled: false };
    } catch (e) {
      return { avatars: {}, frames: {}, stars: {}, aiBotEnabled: false };
    }
  });

  const refreshConfig = () => {
    fetch(apiUrl('/api/config'))
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setCustomConfig(data);
          try {
            localStorage.setItem("khamin_config_cache", JSON.stringify(data));
          } catch (e) {}
        }
      })
      .catch(err => console.error("Failed to load config:", err));
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  return (
    <AvatarContext.Provider value={{ customConfig, refreshConfig, setCustomConfig }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatarConfig = () => useContext(AvatarContext);
