// Helper to resolve the Backend Server URL for WebSockets and REST API
// In unified single-server mode (or AI Studio Preview), it defaults to window.location.origin
// In decoupled mode (Static Site on Render/Vercel + Web Service on Render), it reads from import.meta.env.VITE_SERVER_URL

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return '';
};

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return `${base}${cleanPath}`;
};
