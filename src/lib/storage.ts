import { Profile, WatchHistory, WatchlistItem } from '../types';


const STORAGE_KEYS = {
  PROFILES: 'WilStream_profiles',
  WATCH_HISTORY: 'WilStream_watch_history',
  WATCHLIST: 'WilStream_watchlist',
  THEME: 'WilStream_theme',
};


export type Theme = 'light' | 'dark' | 'system';


// Profile Management
export function getProfiles(): Profile[] {
  const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
  return data ? JSON.parse(data) : [];
}


export function saveProfile(profile: Profile): void {
  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.id === profile.id);


  if (index >= 0) {
    profiles[index] = profile;
  } else {
    profiles.push(profile);
  }


  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}


export function deleteProfile(profileId: string): void {
  const profiles = getProfiles().filter(p => p.id !== profileId);
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));


  // Also delete related data
  const history = getWatchHistory().filter(h => h.profile_id !== profileId);
  localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(history));


  const watchlist = getWatchlist().filter(w => w.profile_id !== profileId);
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
}


export function deleteAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}


// Watch History Management
export function getWatchHistory(profileId?: string): WatchHistory[] {
  const data = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
  const history = data ? JSON.parse(data) : [];
  return profileId ? history.filter((h: WatchHistory) => h.profile_id === profileId) : history;
}


export function saveWatchHistory(history: WatchHistory): void {
  const allHistory = getWatchHistory();
  const index = allHistory.findIndex(h => h.id === history.id);


  if (index >= 0) {
    allHistory[index] = history;
  } else {
    allHistory.push(history);
  }


  localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(allHistory));
}


// Watchlist Management
export function getWatchlist(profileId?: string): WatchlistItem[] {
  const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
  const watchlist = data ? JSON.parse(data) : [];
  return profileId ? watchlist.filter((w: WatchlistItem) => w.profile_id === profileId) : watchlist;
}


export function addToWatchlist(item: WatchlistItem): void {
  const watchlist = getWatchlist();
  const exists = watchlist.find(w => w.profile_id === item.profile_id && w.tmdb_id === item.tmdb_id);


  if (!exists) {
    watchlist.push(item);
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
  }
}


export function removeFromWatchlist(profileId: string, tmdbId: number): void {
  const watchlist = getWatchlist().filter(w => !(w.profile_id === profileId && w.tmdb_id === tmdbId));
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
}


export function isInWatchlist(profileId: string, tmdbId: number): boolean {
  const watchlist = getWatchlist(profileId);
  return watchlist.some(w => w.tmdb_id === tmdbId);
}


// Theme Management
export function getTheme(): Theme {
  const theme = localStorage.getItem(STORAGE_KEYS.THEME);
  return (theme as Theme) || 'system';
}


export function saveTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}


export function getEffectiveTheme(): 'light' | 'dark' {
  const theme = getTheme();


  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }


  return theme;
}


// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}


// Rating Management
export function getRatings(profileId?: string): any[] {
  const data = localStorage.getItem('WilStream_ratings');
  const ratings = data ? JSON.parse(data) : [];
  return profileId ? ratings.filter((r: any) => r.profile_id === profileId) : ratings;
}


export function saveRating(rating: any): void {
  const ratings = getRatings();
  const index = ratings.findIndex(r => r.profile_id === rating.profile_id && r.tmdb_id === rating.tmdb_id && r.media_type === rating.media_type);


  if (index >= 0) {
    ratings[index] = rating;
  } else {
    ratings.push(rating);
  }


  localStorage.setItem('WilStream_ratings', JSON.stringify(ratings));
}


export function getRating(profileId: string, tmdbId: number, mediaType: string): any | null {
  const ratings = getRatings(profileId);
  return ratings.find(r => r.tmdb_id === tmdbId && r.media_type === mediaType) || null;
}


// Import/Export profile data
export function exportProfileData(profileId: string): string {
  const profile = getProfiles().find(p => p.id === profileId);
  const watchHistory = getWatchHistory(profileId);
  const watchlist = getWatchlist(profileId);
  const ratings = getRatings(profileId);


  const data = {
    profile,
    watchHistory,
    watchlist,
    ratings,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };


  return JSON.stringify(data, null, 2);
}


export function importProfileData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);


    if (!data.profile || !data.version) {
      throw new Error('Invalid data format');
    }


    // Generate new profile ID to avoid conflicts
    const newProfileId = generateId();


    // Save profile with new ID
    const newProfile = { ...data.profile, id: newProfileId };
    saveProfile(newProfile);


    // Import watch history with new profile ID
    if (data.watchHistory && Array.isArray(data.watchHistory)) {
      data.watchHistory.forEach((history: WatchHistory) => {
        saveWatchHistory({ ...history, id: generateId(), profile_id: newProfileId });
      });
    }


    // Import watchlist with new profile ID
    if (data.watchlist && Array.isArray(data.watchlist)) {
      data.watchlist.forEach((item: WatchlistItem) => {
        addToWatchlist({ ...item, id: generateId(), profile_id: newProfileId });
      });
    }


    // Import ratings with new profile ID
    if (data.ratings && Array.isArray(data.ratings)) {
      data.ratings.forEach((rating: any) => {
        saveRating({ ...rating, id: generateId(), profile_id: newProfileId });
      });
    }


    return true;
  } catch (error) {
    console.error('Import failed:', error);
    return false;
  }
}


