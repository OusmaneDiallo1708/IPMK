const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'https://ipmk.onrender.com';

export const getImageUrl = (path?: string | null): string => {
  if (!path) return '/images/default-avatar.png';

  if (/^https?:\/\//i.test(path)) {
    return path
      .replace(/^https?:\/\/localhost(:\d+)?/i, API_BASE_URL)
      .replace(/^https?:\/\/127\.0\.0\.1(:\d+)?/i, API_BASE_URL)
      .replace(/^https?:\/\/192\.168\.[\d.]+(:\d+)?/i, API_BASE_URL)
      .replace(/^https?:\/\/10\.[\d.]+(:\d+)?/i, API_BASE_URL);
  }

  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
};