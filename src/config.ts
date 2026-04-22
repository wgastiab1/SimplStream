const isLocal = window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1' || 
                 window.location.hostname.startsWith('192.168.');

export const CONFIG = {
  // Direct TMDB API Key
  TMDB_KEY: '335a2d8a6455213ca6201aba18056860',
  TMDB_BASE: 'https://api.themoviedb.org/3',
  
  // Backend API URL (Dynamic for development)
  BACKEND_URL: isLocal 
    ? `http://${window.location.hostname}:8000` 
    : 'https://wilstream.vercel.app', 
  
  // Toggle between using Direct TMDB or Backend
  USE_BACKEND: true 
};
