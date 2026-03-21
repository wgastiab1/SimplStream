
export const CONFIG = {
  // Direct TMDB API Key - used for basic browse functionality if backend is slow/offline
  TMDB_KEY: '335a2d8a6455213ca6201aba18056860',
  TMDB_BASE: 'https://api.themoviedb.org/3',
  
  // Backend API URL (Vercel)
  // After deploying the /backend folder to Vercel, update this URL.
  BACKEND_URL: 'https://wilstream.vercel.app', 
  
  // Toggle between using Direct TMDB or Backend
  USE_BACKEND: true 
};
