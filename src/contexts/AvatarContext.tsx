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

  const updateConfig = (newConfig: any) => {
    if (newConfig && typeof newConfig === 'object') {
      setCustomConfig(newConfig);
      try {
        localStorage.setItem("khamin_config_cache", JSON.stringify(newConfig));
      } catch (e) {}
    }
  };

  const refreshConfig = async () => {
    try {
      const res = await fetch(apiUrl('/api/config'));
      const data = await res.json();
      updateConfig(data);
      return data;
    } catch (err) {
      console.error("Failed to load config:", err);
      return customConfig;
    }
  };

  useEffect(() => {
    // Only auto-fetch if we have no cached config
    const cached = localStorage.getItem("khamin_config_cache");
    if (!cached) {
      refreshConfig();
    }
  }, []);

  return (
    <AvatarContext.Provider value={{ customConfig, refreshConfig, setCustomConfig, updateConfig }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatarConfig = () => useContext(AvatarContext);
