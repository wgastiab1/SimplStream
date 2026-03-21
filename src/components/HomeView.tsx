import { useState, useEffect, useRef } from 'react';
import { Search, Play, Plus, Info, Sun, Moon, ChevronDown, X, Film, Sparkles, Check, Coffee, Copy } from 'lucide-react';
import { Profile, TMDBMovie, TMDBShow, WatchlistItem, Language } from '../types';
import { tmdbFetch, getTMDBImageUrl } from '../lib/tmdb';
import { getWatchlist, addToWatchlist, removeFromWatchlist, getWatchHistory, saveProfile, deleteProfile, deleteAllData, isInWatchlist, exportProfileData, importProfileData } from '../lib/storage';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
// import { Footer } from './Footer';
import { InactivityWarning } from './InactivityWarning';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';


interface HomeViewProps {
  profile: Profile;
  onLogout: () => void;
  onShowDetail: (id: number, type: 'movie' | 'tv') => void;
  onShowLiveTV: () => void;
  onProfileUpdate: () => void;
  onShowAbout: () => void;
  onShowTerms: () => void;
  onShowSurprise: () => void;
}


export function HomeView({ profile, onLogout, onShowDetail, onShowLiveTV, onProfileUpdate, onShowSurprise }: HomeViewProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hero, setHero] = useState<(TMDBMovie | TMDBShow) | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([]);
  const [trendingShows, setTrendingShows] = useState<TMDBShow[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([]);
  const [popularShows, setPopularShows] = useState<TMDBShow[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(TMDBMovie | TMDBShow)[]>([]);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [modalInput2, setModalInput2] = useState('');
  const [selectedColor, setSelectedColor] = useState(profile.avatar_color);
  const { language: currentLang, setLanguage } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(profile.language || currentLang);
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'tv' | 'mylist'>('home');
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean, id: number, title: string, type: 'watchlist' | 'continue'} | null>(null);
  const { effectiveTheme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [inactivityDisabled, setInactivityDisabled] = useState(() => {
    return localStorage.getItem('WilStream_inactivity_disabled') === 'true';
  });
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };


    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  useEffect(() => {
    if (inactivityDisabled) return;


    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);
      }, 10 * 60 * 1000);
    };


    const handleActivity = () => {
      if (!showInactivityWarning) {
        resetTimer();
      }
    };


    resetTimer();


    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);


    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [inactivityDisabled, showInactivityWarning]);


  function handleStillWatching() {
    setShowInactivityWarning(false);
    lastActivityRef.current = Date.now();
  }


  function handleDontShowAgain() {
    setInactivityDisabled(true);
    localStorage.setItem('WilStream_inactivity_disabled', 'true');
    setShowInactivityWarning(false);
  }


  function handleInactivityTimeout() {
    onLogout();
  }


  useEffect(() => {
    loadContent();
    loadWatchlist();
    loadContinueWatching();
  }, [profile.id, currentLang]);


  function handleItemClick(id: number, type: 'movie' | 'tv') {
    onShowDetail(id, type);
  }


  useEffect(() => {
    if (searchQuery.trim()) {
      searchContent();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);


  async function loadContent() {
    try {
      const [trending, moviesData, showsData] = await Promise.all([
        tmdbFetch('/trending/all/day', currentLang),
        tmdbFetch('/movie/popular', currentLang),
        tmdbFetch('/tv/popular', currentLang)
      ]);


      const heroItem = trending.results?.[0];
      setHero(heroItem);
      setTrendingMovies(trending.results?.filter((i: any) => i.media_type === 'movie').slice(0, 10) || []);
      setTrendingShows(trending.results?.filter((i: any) => i.media_type === 'tv').slice(0, 10) || []);
      setPopularMovies(moviesData.results?.slice(0, 10) || []);
      setPopularShows(showsData.results?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  }


  async function searchContent() {
    try {
      const results = await tmdbFetch(`/search/multi?query=${encodeURIComponent(searchQuery)}`, currentLang);
      setSearchResults(results.results?.filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv') || []);
    } catch (error) {
      console.error('Error searching:', error);
    }
  }


  function loadWatchlist() {
    const list = getWatchlist(profile.id);
    setWatchlist(list);
  }


  function loadContinueWatching() {
    const history = getWatchHistory(profile.id);
    const uniqueHistory = history.reduce((acc: any[], current) => {
      const exists = acc.find(item =>
        item.tmdb_id === current.tmdb_id &&
        item.media_type === current.media_type &&
        item.season === current.season &&
        item.episode === current.episode
      );
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    setContinueWatching(uniqueHistory.slice(0, 10));
  }


  function handleAddToWatchlist(item: TMDBMovie | TMDBShow, type: 'movie' | 'tv') {
    const watchlistItem: WatchlistItem = {
      id: `${Date.now()}`,
      profile_id: profile.id,
      tmdb_id: item.id,
      media_type: type,
      title: 'title' in item ? item.title : item.name,
      poster_path: item.poster_path || undefined,
      created_at: new Date().toISOString()
    };
    addToWatchlist(watchlistItem);
    loadWatchlist();
    showAlert('Added to My Library!');
  }


  function handleRemoveFromWatchlist(tmdbId: number) {
    removeFromWatchlist(profile.id, tmdbId);
    loadWatchlist();
    showAlert('Removed from My Library!');
  }


  function handleConfirmDeleteWatchlist(tmdbId: number) {
    handleRemoveFromWatchlist(tmdbId);
    setConfirmDelete(null);
  }


  function handleConfirmDeleteContinue(tmdbId: number) {
    const history = getWatchHistory(profile.id);
    const filtered = history.filter(h => h.tmdb_id !== tmdbId);
    localStorage.setItem('WilStream_watch_history', JSON.stringify(filtered));
    loadContinueWatching();
    showAlert('Removed from Continue Watching!');
    setConfirmDelete(null);
  }


  function handleChangeName() {
    setShowModal('changeName');
    setModalInput(profile.name);
  }


  function handleChangeColor() {
    setShowModal('changeColor');
    setSelectedColor(profile.avatar_color);
  }


  function handleChangeLanguage() {
    setShowModal('changeLanguage');
    setSelectedLanguage(profile.language || currentLang);
  }


  function handleAddPassword() {
    setShowModal('addPassword');
    setModalInput('');
    setModalInput2('');
  }


  function handleChangePassword() {
    setShowModal('changePassword');
    setModalInput('');
    setModalInput2('');
  }


  function handleRemovePassword() {
    setShowModal('removePassword');
    setModalInput('');
  }


  function handleDeleteProfile() {
    if (confirm(`Are you sure you want to delete the profile "${profile.name}"? This action cannot be undone.`)) {
      deleteProfile(profile.id);
      showAlert('Profile deleted successfully!');
      onLogout();
    }
  }


  function handleDeleteAllData() {
    if (confirm('Are you sure you want to delete ALL data? This will remove all profiles and cannot be undone!')) {
      deleteAllData();
      showAlert('All data deleted!');
      onLogout();
    }
  }


  function handleToggleAds() {
    const updatedProfile = { ...profile, ads_removed: !profile.ads_removed };
    saveProfile(updatedProfile);
    showAlert(updatedProfile.ads_removed ? t('adsRemoved') : 'Ads enabled');
    onProfileUpdate();
  }


  function handleToggleSafeMode() {
    const updatedProfile = { ...profile, safe_mode: !profile.safe_mode };
    saveProfile(updatedProfile);
    showAlert(updatedProfile.safe_mode ? 'Safe Mode Enabled (Anti-Popups)' : 'Safe Mode Disabled');
    onProfileUpdate();
  }


  function handleExportData() {
    try {
      const jsonData = exportProfileData(profile.id);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WilStream-${profile.name}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showAlert('Profile data exported successfully!');
    } catch (error) {
      showAlert('Export failed!');
    }
  }


  function handleImportData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const success = importProfileData(text);
          if (success) {
            showAlert('Profile data imported successfully!');
            onProfileUpdate();
          } else {
            showAlert('Import failed - invalid file format!');
          }
        } catch (error) {
          showAlert('Import failed!');
        }
      }
    };
    input.click();
  }


  function submitModal() {
    if (showModal === 'changeName' && modalInput.trim()) {
      const updatedProfile = { ...profile, name: modalInput.trim() };
      saveProfile(updatedProfile);
      showAlert('Name changed successfully!');
      onProfileUpdate();
      setShowModal(null);
    } else if (showModal === 'changeColor') {
      const updatedProfile = { ...profile, avatar_color: selectedColor };
      saveProfile(updatedProfile);
      showAlert('Profile color changed successfully!');
      onProfileUpdate();
      setShowModal(null);
    } else if (showModal === 'changeLanguage') {
      const updatedProfile = { ...profile, language: selectedLanguage };
      saveProfile(updatedProfile);
      setLanguage(selectedLanguage);
      showAlert('Language changed successfully!');
      onProfileUpdate();
      setShowModal(null);
    } else if (showModal === 'addPassword') {
      if (modalInput.length === 4 && /^\d{4}$/.test(modalInput) && modalInput2.trim()) {
        const updatedProfile = { ...profile, pin: modalInput, security_word: modalInput2.trim() };
        saveProfile(updatedProfile);
        showAlert(`Passcode added! Your security word is: ${modalInput2.trim()} - COPY THIS SOMEWHERE SAFE!`);
        onProfileUpdate();
        setShowModal(null);
      } else {
        showAlert('Please enter a valid 4-digit passcode and security word!');
      }
    } else if (showModal === 'changePassword') {
      if (modalInput === profile.pin && modalInput2.length === 4 && /^\d{4}$/.test(modalInput2)) {
        const updatedProfile = { ...profile, pin: modalInput2 };
        saveProfile(updatedProfile);
        showAlert('Passcode changed successfully!');
        onProfileUpdate();
        setShowModal(null);
      } else {
        showAlert('Incorrect old passcode or invalid new passcode!');
      }
    } else if (showModal === 'removePassword') {
      if (modalInput === profile.pin) {
        const updatedProfile = { ...profile, pin: null, security_word: null };
        saveProfile(updatedProfile);
        showAlert('Passcode removed successfully!');
        onProfileUpdate();
        setShowModal(null);
      } else {
        showAlert('Incorrect passcode!');
      }
    }
  }


  function showAlert(message: string) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[100] ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'} px-8 py-4 rounded-xl shadow-2xl border-2 ${effectiveTheme === 'dark' ? 'border-blue-500' : 'border-blue-600'} font-semibold text-base backdrop-blur-lg`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
      alertDiv.style.transition = 'opacity 0.3s ease';
      alertDiv.style.opacity = '0';
      setTimeout(() => alertDiv.remove(), 300);
    }, 2000);
  }


  const getTitle = (item: TMDBMovie | TMDBShow) => 'title' in item ? item.title : item.name;


  const bgClass = effectiveTheme === 'dark' ? 'bg-black' : 'bg-gray-50';
  const textClass = effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900';
  const headerBg = effectiveTheme === 'dark'
    ? scrolled ? 'bg-black' : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
    : scrolled ? 'bg-white' : 'bg-gradient-to-b from-white/90 via-white/40 to-transparent';


  const handleLogoClick = () => {
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 pt-[env(safe-area-inset-top)] ${headerBg} ${scrolled ? 'shadow-2xl' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-6">
            <button onClick={handleLogoClick} className="text-xl sm:text-3xl 4k:text-5xl font-bold whitespace-nowrap hover:opacity-80 transition-opacity">
              <span className="text-blue-500">Wil</span>
              <span className={effectiveTheme === 'dark' ? 'text-white' : 'text-black'}>Stream</span>
            </button>


            <nav className="hidden sm:flex items-center gap-6 4k:gap-12 flex-1 justify-center">
              <button onClick={() => setActiveTab('home')} className={`${activeTab === 'home' ? (effectiveTheme === 'dark' ? 'text-white' : 'text-black') : 'text-gray-400'} hover:text-blue-400 transition-colors font-medium whitespace-nowrap text-base 4k:text-2xl`}>{t('home')}</button>
              <button onClick={() => setActiveTab('movies')} className={`${activeTab === 'movies' ? (effectiveTheme === 'dark' ? 'text-white' : 'text-black') : 'text-gray-400'} hover:text-blue-400 transition-colors font-medium whitespace-nowrap text-base 4k:text-2xl`}>{t('movies')}</button>
              <button onClick={() => setActiveTab('tv')} className={`${activeTab === 'tv' ? (effectiveTheme === 'dark' ? 'text-white' : 'text-black') : 'text-gray-400'} hover:text-blue-400 transition-colors font-medium whitespace-nowrap text-base 4k:text-2xl`}>{t('tvShows')}</button>
              <button onClick={onShowLiveTV} className="text-gray-400 hover:text-blue-400 transition-colors font-medium whitespace-nowrap text-base 4k:text-2xl">{t('liveTv')}</button>
              <button onClick={() => setActiveTab('mylist')} className={`${activeTab === 'mylist' ? (effectiveTheme === 'dark' ? 'text-white' : 'text-black') : 'text-gray-400'} hover:text-blue-400 transition-colors font-medium whitespace-nowrap text-base 4k:text-2xl`}>{t('myLibrary')}</button>
            </nav>


            <div className="flex items-center gap-2 4k:gap-4">
              <button onClick={() => setShowSearch(!showSearch)} className={`p-2 4k:p-4 hover:${effectiveTheme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded-full transition-colors`}>
                <Search size={18} className="sm:w-5 sm:h-5 4k:w-8 4k:h-8" />
              </button>
              <button onClick={toggleTheme} className={`p-2 4k:p-4 hover:${effectiveTheme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded-full transition-colors`}>
                {effectiveTheme === 'dark' ? <Sun size={18} className="sm:w-5 sm:h-5 4k:w-8 4k:h-8" /> : <Moon size={18} className="sm:w-5 sm:h-5 4k:w-8 4k:h-8" />}
              </button>
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 4k:px-6 py-2 4k:py-3 hover:${effectiveTheme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded-lg transition-colors`}
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 4k:w-14 4k:h-14 rounded flex items-center justify-center text-xs sm:text-sm 4k:text-2xl font-bold text-white"
                    style={{ backgroundColor: profile.avatar_color }}
                  >
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown size={14} className="hidden sm:block sm:w-4 sm:h-4 4k:w-7 4k:h-7" />
                </button>


                 {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-64 4k:w-96 ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-2xl border ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} overflow-hidden z-50 max-h-[75vh] overflow-y-auto custom-scrollbar`}>
                    <div className="px-4 py-2 bg-orange-600 text-white text-xs font-bold text-center animate-pulse">
                      !!! WILSTREAM v1.8.2 RECARGADA !!!
                    </div>
                    <button onClick={() => { handleToggleSafeMode(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl flex items-center justify-between gap-2 border-b border-gray-800`}>
                      <span className="font-bold text-blue-400">🛡️ Modo Seguro (Anti-Popups)</span>
                      {profile.safe_mode && <Check size={16} className="text-blue-500 4k:w-6 4k:h-6" />}
                    </button>
                    <button onClick={() => { handleChangeName(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl`}>{t('changeName')}</button>
                    <button onClick={() => { handleChangeColor(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl`}>{t('changeProfileColor')}</button>
                    {!profile.pin ? (
                      <button onClick={() => { handleAddPassword(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl`}>{t('addPasscode')}</button>
                    ) : (
                      <>
                        <button onClick={() => { handleChangePassword(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl`}>{t('changePasscode')}</button>
                        <button onClick={() => { handleRemovePassword(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl`}>{t('removePasscode')}</button>
                      </>
                    )}
                    <button onClick={() => { handleExportData(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl`}>{t('exportProfileData')}</button>
                    <button onClick={() => { handleImportData(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl`}>{t('importProfileData')}</button>
                    <button onClick={() => { handleChangeLanguage(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl`}>{t('selectLanguage')}</button>
                    <button onClick={() => { onShowSurprise(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl flex items-center gap-2`}><Sparkles size={16} className="4k:w-6 4k:h-6" />{t('surpriseMe')}</button>
                    <button onClick={() => { handleToggleAds(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl flex items-center justify-between gap-2`}>
                      <span>{profile.ads_removed ? t('adsRemoved') : t('removeAds')}</span>
                      {profile.ads_removed && <Check size={16} className="text-green-500 4k:w-6 4k:h-6" />}
                    </button>
                    <hr className={effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} />
                    <button onClick={() => { setShowDonationModal(true); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-green-500 font-bold text-sm 4k:text-xl flex items-center gap-2`}>
                      <Coffee size={16} /> <span>Cafecito al Desarrollador</span>
                    </button>
                    <hr className={effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} />
                    <button onClick={() => { handleDeleteProfile(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-red-500 text-sm 4k:text-xl`}>{t('deleteProfile')}</button>
                    <button onClick={() => { handleDeleteAllData(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-red-600 font-bold text-sm 4k:text-xl`}>{t('deleteAllData')}</button>
                    <hr className={effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} />
                     <button onClick={() => { onLogout(); setShowProfileMenu(false); }} className={`w-full text-left px-4 py-3 4k:px-6 4k:py-4 hover:${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} transition-colors text-sm 4k:text-xl`}>{t('signOut')}</button>
                     <div className="px-4 py-2 text-[10px] text-gray-500 text-center border-t border-gray-800">
                       WilStream build_id: {Date.now()}
                     </div>
                   </div>
                )}
              </div>
            </div>
          </div>


          <nav className="flex sm:hidden gap-5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-6">
            <button onClick={() => setActiveTab('home')} className={`${activeTab === 'home' ? (effectiveTheme === 'dark' ? 'text-white' : 'text-black') : 'text-gray-400'} hover:text-blue-400 transition-colors font-medium whitespace-nowrap text-sm`}>{t('home')}</button>
            <button onClick={() => setActiveTab('movies')} className={`${activeTab === 'movies' ? (effectiveTheme === 'dark' ? 'text-white' : 'text-black') : 'text-gray-400'} hover:text-blue-400 transition-colors font-medium whitespace-nowrap text-sm`}>{t('movies')}</button>
            <button onClick={() => setActiveTab('tv')} className={`${activeTab === 'tv' ? (effectiveTheme === 'dark' ? 'text-white' : 'text-black') : 'text-gray-400'} hover:text-blue-400 transition-colors font-medium whitespace-nowrap text-sm`}>{t('tvShows')}</button>
            <button onClick={onShowLiveTV} className="text-gray-400 hover:text-blue-400 transition-colors font-medium whitespace-nowrap text-sm">{t('liveTv')}</button>
            <button onClick={() => setActiveTab('mylist')} className={`${activeTab === 'mylist' ? (effectiveTheme === 'dark' ? 'text-white' : 'text-black') : 'text-gray-400'} hover:text-blue-400 transition-colors font-medium whitespace-nowrap text-sm`}>{t('myLibrary')}</button>
          </nav>
        </div>


        {showSearch && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className={`w-full px-4 py-3 rounded-lg ${effectiveTheme === 'dark' ? 'bg-gray-900/90 border-gray-700' : 'bg-white border-gray-300'} border ${effectiveTheme === 'dark' ? 'text-white' : 'text-black'} placeholder-gray-400 focus:outline-none focus:border-blue-500`}
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>
        )}
      </header>


      {showInactivityWarning && (
        <InactivityWarning
          onStillWatching={handleStillWatching}
          onDontShowAgain={handleDontShowAgain}
          onTimeout={handleInactivityTimeout}
        />
      )}


      {showSearch && searchResults.length > 0 && (
        <div className="fixed top-32 left-0 right-0 z-40 max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-2xl p-4 max-h-96 overflow-y-auto`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onShowDetail(item.id, item.media_type);
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="group"
                >
                  {item.poster_path ? (
                    <img
                      src={getTMDBImageUrl(item.poster_path, 'w342')}
                      alt={getTitle(item)}
                      className="w-full rounded-lg group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-800 rounded-lg flex flex-col items-center justify-center p-4">
                      <div className="relative">
                        <Film size={48} className="text-gray-600 mb-2" />
                        <X size={24} className="text-gray-600 absolute -top-1 -right-1" />
                      </div>
                      <p className="text-gray-500 text-xs text-center mt-2">No thumbnail available</p>
                    </div>
                  )}
                  <p className={`mt-2 text-sm ${effectiveTheme === 'dark' ? 'text-white' : 'text-black'} truncate`}>{getTitle(item)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      <div className="pt-44 sm:pt-24">
        {hero && activeTab === 'home' && (
          <div className="relative h-[70vh] sm:h-[85vh] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${getTMDBImageUrl(hero.backdrop_path, 'original')})` }}
            >
              <div className={`absolute inset-0 ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-black via-black/70 to-transparent' : 'bg-gradient-to-r from-white via-white/70 to-transparent'}`}></div>
              <div className={`absolute inset-0 ${effectiveTheme === 'dark' ? 'bg-gradient-to-t from-black via-transparent to-transparent' : 'bg-gradient-to-t from-white via-transparent to-transparent'}`}></div>
            </div>


            <div className="relative z-10 h-full flex items-center max-w-7xl mx-auto px-4 sm:px-6">
              <div className="max-w-2xl 4k:max-w-5xl">
                <h1 className={`text-3xl sm:text-6xl 4k:text-8xl font-bold mb-4 4k:mb-8 drop-shadow-2xl ${textClass}`}>{getTitle(hero)}</h1>
                <p className={`text-sm sm:text-lg 4k:text-3xl mb-6 4k:mb-10 line-clamp-3 drop-shadow-lg ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{hero.overview}</p>
                <div className="flex flex-wrap gap-2 sm:gap-4 4k:gap-6">
                   <button
                    onClick={() => onShowDetail(hero.id, 'title' in hero ? 'movie' : 'tv')}
                    className={`px-4 sm:px-8 4k:px-12 py-2 sm:py-3 4k:py-5 ${effectiveTheme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} rounded-lg font-bold transition-all flex items-center gap-2 4k:gap-3 shadow-xl text-sm sm:text-base 4k:text-2xl`}
                  >
                    <Play size={20} className="4k:w-10 4k:h-10" fill="currentColor" />
                    {t('play')}
                  </button>
                  {isInWatchlist(profile.id, hero.id) ? (
                    <button
                      onClick={() => handleRemoveFromWatchlist(hero.id)}
                      className={`px-4 sm:px-8 4k:px-12 py-2 sm:py-3 4k:py-5 ${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} backdrop-blur-sm rounded-lg font-bold transition-all flex items-center gap-2 4k:gap-3 shadow-xl text-sm sm:text-base 4k:text-2xl`}
                    >
                      <X size={20} className="4k:w-10 4k:h-10" />
                      {t('remove')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToWatchlist(hero, 'title' in hero ? 'movie' : 'tv')}
                      className={`px-4 sm:px-8 4k:px-12 py-2 sm:py-3 4k:py-5 ${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} backdrop-blur-sm rounded-lg font-bold transition-all flex items-center gap-2 4k:gap-3 shadow-xl text-sm sm:text-base 4k:text-2xl`}
                    >
                      <Plus size={20} className="4k:w-10 4k:h-10" />
                      {t('myLibrary')}
                    </button>
                  )}
                  <button
                    onClick={() => onShowDetail(hero.id, 'title' in hero ? 'movie' : 'tv')}
                    className={`px-4 sm:px-8 4k:px-12 py-2 sm:py-3 4k:py-5 ${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} backdrop-blur-sm rounded-lg font-bold transition-all flex items-center gap-2 4k:gap-3 shadow-xl text-sm sm:text-base 4k:text-2xl`}
                  >
                    <Info size={20} className="4k:w-10 4k:h-10" />
                    {t('moreInfo')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        <div className="relative z-10 px-4 sm:px-6 pb-20 -mt-20 sm:-mt-32">
          <div className="max-w-7xl mx-auto space-y-12">             {activeTab === 'home' && (
              <>
                {continueWatching.length > 0 && <ContentRow title={t('continueWatching')} items={continueWatching} onItemClick={(item: any) => handleItemClick(item.tmdb_id, item.media_type)} onRemove={(id: number, title: string) => {
                  setConfirmDelete({show: true, id, title, type: 'continue'});
                }} theme={effectiveTheme} isContinueWatching={true} t={t} language={currentLang} profile={profile} />}
                {watchlist.length > 0 && <ContentRow title={t('myLibrary')} items={watchlist} onItemClick={(item: any) => handleItemClick(item.tmdb_id, item.media_type)} onRemove={(id: number, title: string) => {
                  setConfirmDelete({show: true, id, title, type: 'watchlist'});
                }} theme={effectiveTheme} t={t} language={currentLang} profile={profile} />}
                <ContentRow title={t('trendingMovies')} items={trendingMovies} onItemClick={(item: any) => handleItemClick(item.id, 'movie')} onRemove={null} theme={effectiveTheme} t={t} language={currentLang} profile={profile} />
                <ContentRow title={t('trendingTvShows')} items={trendingShows} onItemClick={(item: any) => handleItemClick(item.id, 'tv')} onRemove={null} theme={effectiveTheme} t={t} language={currentLang} profile={profile} />
                <ContentRow title={t('popularMovies')} items={popularMovies} onItemClick={(item: any) => handleItemClick(item.id, 'movie')} onRemove={null} theme={effectiveTheme} t={t} language={currentLang} profile={profile} />
                <ContentRow title={t('popularTvShows')} items={popularShows} onItemClick={(item: any) => handleItemClick(item.id, 'tv')} onRemove={null} theme={effectiveTheme} t={t} language={currentLang} profile={profile} />
              </>
            )}



            {activeTab === 'movies' && (
              <>
                <ContentRow title={t('trendingMovies')} items={trendingMovies} onItemClick={(item: any) => handleItemClick(item.id, 'movie')} onRemove={null} theme={effectiveTheme} t={t} language={currentLang} profile={profile} />
                <ContentRow title={t('popularMovies')} items={popularMovies} onItemClick={(item: any) => handleItemClick(item.id, 'movie')} onRemove={null} theme={effectiveTheme} t={t} language={currentLang} profile={profile} />
              </>
            )}


            {activeTab === 'tv' && (
              <>
                <ContentRow title={t('trendingTvShows')} items={trendingShows} onItemClick={(item: any) => handleItemClick(item.id, 'tv')} onRemove={null} theme={effectiveTheme} t={t} language={currentLang} profile={profile} />
                <ContentRow title={t('popularTvShows')} items={popularShows} onItemClick={(item: any) => handleItemClick(item.id, 'tv')} onRemove={null} theme={effectiveTheme} t={t} language={currentLang} profile={profile} />
              </>
            )}


            {activeTab === 'mylist' && watchlist.length > 0 && (
              <ContentRow title={t('myLibrary')} items={watchlist} onItemClick={(item: any) => handleItemClick(item.tmdb_id, item.media_type)} onRemove={(id: number, title: string) => {
                setConfirmDelete({show: true, id, title, type: 'watchlist'});
              }} theme={effectiveTheme} t={t} language={currentLang} profile={profile} />
            )}


            {activeTab === 'mylist' && watchlist.length === 0 && (
              <div className="text-center py-20">
                <p className={`text-2xl ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Your library is empty. Add some content!</p>
              </div>
            )}
          </div>
        </div>
      </div>


      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-lg p-8 max-w-md w-full`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${textClass}`}>
                {showModal === 'changeName' && t('changeName')}
                {showModal === 'changeColor' && t('changeProfileColor')}
                {showModal === 'changeLanguage' && t('languageSelectorTitle')}
                {showModal === 'addPassword' && t('addPasscode')}
                {showModal === 'changePassword' && t('changePasscode')}
                {showModal === 'removePassword' && t('removePasscode')}
              </h2>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>


            {showModal === 'changeName' && (
              <input
                type="text"
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                placeholder={t('enterNewName')}
                className={`w-full px-4 py-3 4k:px-8 4k:py-6 4k:text-3xl rounded-lg 4k:rounded-2xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border ${textClass} placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 4k:mb-8`}
              />
            )}


            {showModal === 'changeColor' && (
              <div className="mb-4">
                <div className="grid grid-cols-8 gap-2 mb-3">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4', '#F43F5E', '#22C55E', '#EAB308', '#A855F7', '#EC407A'].map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-lg transition-all ${selectedColor === color ? 'ring-4 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-700"
                  />
                   <span className="text-gray-400 text-sm">{t('orPickCustomColor')}</span>
                </div>
              </div>
            )}


            {showModal === 'changeLanguage' && (
              <div className="mb-4 grid grid-cols-2 gap-3">
                {[
                  { code: 'en', label: t('langEn') },
                  { code: 'es', label: t('langEs') },
                  { code: 'it', label: t('langIt') },
                  { code: 'fr', label: t('langFr') },
                  { code: 'de', label: t('langDe') },
                  { code: 'pt', label: t('langPt') }
                ].map((lang: any) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`px-4 py-3 rounded-lg border transition-all text-sm font-medium ${selectedLanguage === lang.code ? 'bg-blue-600 border-blue-500 text-white' : (effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500' : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-400')}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}


            {showModal === 'addPassword' && (
              <>                 <input
                  type="password"
                  maxLength={4}
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('enterPasscode')}
                  className={`w-full px-4 py-3 4k:px-8 4k:py-6 rounded-lg 4k:rounded-2xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border ${textClass} text-center text-2xl 4k:text-6xl tracking-widest placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 4k:mb-8`}
                />
                <input
                  type="text"
                  value={modalInput2}
                  onChange={(e) => setModalInput2(e.target.value)}
                  placeholder={t('enterSecurityWord')}
                  className={`w-full px-4 py-3 4k:px-8 4k:py-6 4k:text-3xl rounded-lg 4k:rounded-2xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border ${textClass} placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 4k:mb-8`}
                />
                <p className="text-red-500 text-sm 4k:text-3xl mb-4 4k:mb-8">{t('securityWordWarning')}</p>

              </>
            )}


            {showModal === 'changePassword' && (
              <>                 <input
                  type="password"
                  maxLength={4}
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('enterOldPasscode')}
                  className={`w-full px-4 py-3 4k:px-8 4k:py-6 rounded-lg 4k:rounded-2xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border ${textClass} text-center text-2xl 4k:text-6xl tracking-widest placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 4k:mb-8`}
                />
                <input
                  type="password"
                  maxLength={4}
                  value={modalInput2}
                  onChange={(e) => setModalInput2(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('enterNewPasscode')}
                  className={`w-full px-4 py-3 4k:px-8 4k:py-6 rounded-lg 4k:rounded-2xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border ${textClass} text-center text-2xl 4k:text-6xl tracking-widest placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 4k:mb-8`}
                />

              </>
            )}


            {showModal === 'removePassword' && (               <input
                type="password"
                maxLength={4}
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value.replace(/\D/g, ''))}
                placeholder={t('enterPasscodeToConfirm')}
                className={`w-full px-4 py-3 4k:px-8 4k:py-6 rounded-lg 4k:rounded-2xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border ${textClass} text-center text-2xl 4k:text-6xl tracking-widest placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 4k:mb-8`}
              />
            )}


            <div className="flex gap-4">               <button
                onClick={submitModal}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('confirm')}
              </button>
              <button
                onClick={() => setShowModal(null)}
                className={`flex-1 px-6 py-3 ${effectiveTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} rounded-lg font-medium transition-colors`}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}




      {confirmDelete?.show && (
        <ConfirmDeleteModal
          title={confirmDelete.title}
          theme={effectiveTheme}
          onConfirm={() => {
            if (confirmDelete.type === 'watchlist') {
              handleConfirmDeleteWatchlist(confirmDelete.id);
            } else {
              handleConfirmDeleteContinue(confirmDelete.id);
            }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}


      {/* <Footer onShowAbout={onShowAbout} onShowTerms={onShowTerms} /> */}

      {showDonationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl`}>
            <button onClick={() => setShowDonationModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500">
              <X size={24} />
            </button>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                <Coffee size={32} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">Apoyar a WilStream</h2>
              <p className={`text-sm sm:text-base text-center mb-6 max-w-xs ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Si te gusta la app, un cafecito me ayuda un montón a seguir mejorándola y manteniendo los servidores.
              </p>
              
              <div className="w-full space-y-4">
                <div className={`p-4 rounded-xl border ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="font-bold text-sm text-green-500 mb-1">🍋 Lemon Cash Tag</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-medium">$wgastiab</span>
                    <button onClick={() => navigator.clipboard.writeText('$wgastiab')} className="text-blue-500 hover:text-blue-400 p-2 rounded-full hover:bg-blue-500/10">
                      <Copy size={20} />
                    </button>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="font-bold text-sm text-blue-400 mb-1">🤝 MercadoPago Alias</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-medium">wilfred.mp</span>
                    <button onClick={() => navigator.clipboard.writeText('wilfred.mp')} className="text-blue-500 hover:text-blue-400 p-2 rounded-full hover:bg-blue-500/10">
                      <Copy size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 w-full">
                <button
                  onClick={() => setShowDonationModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Entendido, ¡gracias!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


function MovieCard({ item, onItemClick, onRemove, theme, isContinueWatching, t, language, profile }: any) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const itemTitle = item.title || item.name;
  const posterPath = item.poster_path;
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const itemId = item.tmdb_id || item.id;

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    
    hoverTimerRef.current = setTimeout(async () => {
      try {
        const data = await tmdbFetch(`/${mediaType}/${itemId}/videos`, language);
        const trailer = data.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube' && v.key);
        if (trailer) {
          setTrailerKey(trailer.key);
          setShowTrailer(true);
        }
      } catch (error) {
        console.error('Error fetching trailer preview:', error);
      }
    }, 1200);
  };

  const handleMouseLeave = () => {
    setShowTrailer(false);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  const formatTime = (position?: number, duration?: number) => {
    if (position !== undefined && duration !== undefined && position > 0) {
      const hours = Math.floor(position / 3600);
      const minutes = Math.floor((position % 3600) / 60);
      const seconds = Math.floor(position % 60);
      return `${t('continueFrom')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return null;
  };

  const continueText = isContinueWatching ? formatTime(item.position, item.duration) : null;

  return (
    <div 
      className="flex-shrink-0 group relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button onClick={() => onItemClick(item)} className="cursor-pointer text-left">
        <div className="w-40 sm:w-48 4k:w-80 rounded-lg overflow-hidden transition-all duration-300 transform group-hover:scale-110 group-hover:shadow-2xl relative aspect-[2/3] bg-gray-800">
          {posterPath ? (
            <>
              <img
                src={getTMDBImageUrl(posterPath, 'w342')}
                alt={itemTitle}
                className={`w-full h-full object-cover transition-opacity duration-500 ${showTrailer ? 'opacity-0' : 'opacity-100'}`}
              />
              {showTrailer && trailerKey && (
                <div className="absolute inset-0 z-10 w-full h-full pointer-events-none scale-[1.5] overflow-hidden">
                   <iframe
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailerKey}&rel=0&iv_load_policy=3`}
                    className="w-full h-full object-cover"
                    allow="autoplay"
                    title="Trailer Preview"
                    sandbox={profile.safe_mode ? "allow-forms allow-scripts allow-same-origin allow-presentation" : undefined}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 4k:p-8">
              <div className="relative">
                <Film size={48} className="text-gray-600 mb-2 4k:w-24 4k:h-24" />
                <X size={24} className="text-gray-600 absolute -top-1 -right-1" />
              </div>
              <p className="text-gray-500 text-xs text-center mt-2">No thumbnail</p>
            </div>
          )}
        </div>
        
        <div className={`mt-2 4k:mt-4 px-1 transition-opacity duration-300 ${showTrailer ? 'opacity-0' : 'opacity-100'}`}>
          <p className={`text-sm 4k:text-2xl font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {itemTitle}
          </p>
          {continueText && (
            <p className="text-xs 4k:text-xl text-gray-400 mt-1">{continueText}</p>
          )}
        </div>
      </button>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(itemId, itemTitle);
          }}
          className="absolute top-2 4k:top-4 right-2 4k:right-4 p-2 4k:p-4 bg-red-600 hover:bg-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-20"
        >
          <X size={16} className="text-white 4k:w-8 4k:h-8" />
        </button>
      )}

    </div>
  );
}


function ContentRow({ title, items, onItemClick, onRemove, theme, isContinueWatching = false, t, language, profile }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3 4k:space-y-6">
      <h2 className={`text-xl sm:text-2xl 4k:text-5xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
      <div
        ref={scrollRef}
        className="flex gap-4 4k:gap-8 overflow-x-auto scrollbar-hide pb-4 4k:pb-8 scroll-smooth px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item: any) => (
          <MovieCard 
            key={item.id || `${item.tmdb_id}-${item.season}-${item.episode}`}
            item={item}
            onItemClick={onItemClick}
            onRemove={onRemove}
            theme={theme}
            isContinueWatching={isContinueWatching}
            t={t}
            language={language}
            profile={profile}
          />
        ))}
      </div>
    </div>
  );
}


