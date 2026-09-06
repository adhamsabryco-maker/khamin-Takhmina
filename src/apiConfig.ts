// Helper to resolve the Backend Server URL for WebSockets and REST API
// In unified single-server mode (or AI Studio Preview), it defaults to window.location.origin
// In decoupled mode (Static Site on Render/Vercel + Web Service on Render), it reads from import.meta.env.VITE_SERVER_URL

export const getApiBaseUrl = (): string => {
  // If running inside AI Studio preview or local development, always use the local container backend
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    // If we are on GitHub Pages or custom domain, ALWAYS use the Render backend URL
    if (host.includes("github.io") || host.includes("khamin-takhmina-guess-game.online")) {
      const envUrl = import.meta.env.VITE_SERVER_URL;
      if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
        return envUrl.replace(/\/+$/, '');
      }
      // Fallback just in case env variable fails
      return 'https://khamin-takhmina-backend-ud2l.onrender.com';
    }

    if (
      host.includes("run.app") ||
      host.includes("googleusercontent.com") ||
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      host.includes("ais-")
    ) {
      return window.location.origin;
    }
  }

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
