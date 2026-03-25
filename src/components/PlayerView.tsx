import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { Profile, TMDBDetail, Episode, LiveChannel } from '../types';
import { tmdbFetch, EMBED_PROVIDERS } from '../lib/tmdb';
import { saveWatchHistory as saveHistory, generateId, getWatchlist, addToWatchlist, removeFromWatchlist, saveProfile } from '../lib/storage';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import { LIVE_CHANNELS } from '../lib/liveChannels';
import { createInjectedIframeContent, shouldBlockAds } from '../lib/ad-blocker';
import { CONFIG } from '../config';

interface PlayerViewProps {
  profile: Profile;
  tmdbId: number;
  mediaType: 'movie' | 'tv' | 'live';
  season?: number;
  episode?: number;
  embedUrl?: string;
  channelName?: string;
  onBack: () => void;
  onPlay: (tmdbId: number, mediaType: 'movie' | 'tv' | 'live', season?: number, episode?: number, embedUrl?: string, channelName?: string) => void;
  onProfileUpdate?: () => void;
}


export function PlayerView({
  profile,
  tmdbId,
  mediaType,
  season = 1,
  episode = 1,
  embedUrl,
  channelName,
  onBack,
  onPlay: onPlayProp,
  onProfileUpdate
}: PlayerViewProps) {
  const [detail, setDetail] = useState<TMDBDetail | null>(null);
  const [currentSeason, setCurrentSeason] = useState(season);
  const [currentEpisode, setCurrentEpisode] = useState(episode);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [server, setServer] = useState<'vidsrc' | 'vidlink' | '111movies' | 'videasy' | 'vidfast' | 'vidnest'>('vidsrc');
  const [playerUrl, setPlayerUrl] = useState('');
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const { effectiveTheme } = useTheme();
  const { t, language } = useTranslation();

  // Block popup attempts from the page itself using window.open override
  useEffect(() => {
    const originalOpen = window.open;
    // Override window.open to block unwanted popups
    (window as any).open = (url: string, ...args: any[]) => {
      // Allow only trusted internal calls (e.g., fullscreen), block everything else
      if (!url || url === '' || url === 'about:blank') {
        return originalOpen.call(window, url, ...args);
      }
      console.warn('[WilStream] Blocked popup:', url);
      return null;
    };
    return () => {
      (window as any).open = originalOpen;
    };
  }, []);

  useEffect(() => {
    let interval: any;
    import('@capacitor/core').then(({ Capacitor, registerPlugin }) => {
      if (Capacitor.isNativePlatform()) {
        const NativeApp = registerPlugin<any>('AdBlocker');
        // Aggressively enforce immersive mode to prevent the iframe's native video player from restoring the status bar
        interval = setInterval(() => {
          NativeApp.setImmersive({ immersive: true }).catch(() => {});
        }, 1000);
        
        // Initial enforcement
        NativeApp.setImmersive({ immersive: true }).catch(() => {});
      }
    });

    return () => {
      if (interval) clearInterval(interval);
      import('@capacitor/core').then(({ Capacitor, registerPlugin }) => {
        if (Capacitor.isNativePlatform()) {
          const NativeApp = registerPlugin<any>('AdBlocker');
          NativeApp.setImmersive({ immersive: false }).catch(() => {});
        }
      });
    };
  }, []);


  const currentChannel = mediaType === 'live' ? LIVE_CHANNELS.find(ch => ch.name === channelName) : null;
  const currentChannelIndex = currentChannel ? LIVE_CHANNELS.findIndex(ch => ch.channelNumber === currentChannel.channelNumber) : -1;
  const similarChannels = currentChannel ? LIVE_CHANNELS.filter(ch => ch.category === currentChannel.category && ch.channelNumber !== currentChannel.channelNumber).slice(0, 6) : [];


  useEffect(() => {
    if (mediaType !== 'live') {
      loadDetail();
    } else {
      loadWatchlist();
    }
    updatePlayerUrl();
  }, [tmdbId, mediaType]);


  useEffect(() => {
    if (mediaType === 'tv') {
      loadEpisodes();
    }
    updatePlayerUrl();
  }, [currentSeason, currentEpisode, server]);


  useEffect(() => {
    if (detail) {
      saveWatchHistory();
    }
  }, [currentSeason, currentEpisode, detail]);


  function loadWatchlist() {
    try {
      const list = getWatchlist(profile.id).filter(item => item.media_type === 'live');
      setWatchlist(list.map(item => item.title));
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  }


  function toggleWatchlist(channel: LiveChannel) {
    const isInWatchlist = watchlist.includes(channel.name);


    try {
      if (isInWatchlist) {
        const list = getWatchlist(profile.id);
        const item = list.find(w => w.title === channel.name && w.media_type === 'live');
        if (item?.tmdb_id !== undefined) {
          removeFromWatchlist(profile.id, item.tmdb_id);
        }
        setWatchlist(watchlist.filter(name => name !== channel.name));
      } else {
        addToWatchlist({
          id: generateId(),
          profile_id: profile.id,
          tmdb_id: undefined,
          media_type: 'live',
          title: channel.name,
          poster_path: undefined,
          embed_url: channel.embed,
          created_at: new Date().toISOString()
        });
        setWatchlist([...watchlist, channel.name]);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  }


  function handlePreviousChannel() {
    if (currentChannelIndex > 0) {
      const prevChannel = LIVE_CHANNELS[currentChannelIndex - 1];
      onPlayProp(0, 'live', undefined, undefined, prevChannel.embed, prevChannel.name);
    }
  }


  function handleNextChannel() {
    if (currentChannelIndex < LIVE_CHANNELS.length - 1) {
      const nextChannel = LIVE_CHANNELS[currentChannelIndex + 1];
      onPlayProp(0, 'live', undefined, undefined, nextChannel.embed, nextChannel.name);
    }
  }


  function handlePlayChannel(channel: LiveChannel) {
    onPlayProp(0, 'live', undefined, undefined, channel.embed, channel.name);
  }


  async function loadDetail() {
    try {
      const data = await tmdbFetch(`/${mediaType}/${tmdbId}`, language);
      setDetail(data);
    } catch (error) {
      console.error('Error loading detail:', error);
    }
  }


  async function loadEpisodes() {
    try {
      const data = await tmdbFetch(`/tv/${tmdbId}/season/${currentSeason}`, language);
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error('Error loading episodes:', error);
    }
  }


  async function updatePlayerUrl() {
    if (mediaType === 'live' && embedUrl) {
      setPlayerUrl(embedUrl);
    } else {
      setIsPlayerLoading(true);
      let finalUrl = (EMBED_PROVIDERS as any)[server](mediaType, tmdbId, currentSeason, currentEpisode, language);
      
      // Try to use the backend cleaner if we are using vidnest and backend is running
      if (server === 'vidnest') {
        try {
          const backendPath = mediaType === 'movie' 
            ? `/api/embed/vidnest/movie/${tmdbId}`
            : `/api/embed/vidnest/tv/${tmdbId}?season=${currentSeason}&episode=${currentEpisode}`;
          
          const res = await fetch(`${CONFIG.BACKEND_URL}${backendPath}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.video_url) {
              finalUrl = data.video_url;
            }
          }
        } catch (error) {
          console.warn('[WilStream] Backend embed cleaner failed, falling back to direct URL', error);
        }
      }

      // Apply Brave-style ad blocking if enabled (skip for live TV)
      const wrappedUrl = shouldBlockAds(profile, mediaType)
        ? createInjectedIframeContent(finalUrl)
        : finalUrl;
      setPlayerUrl(wrappedUrl);
      setIsPlayerLoading(false);
    }
  }


  function saveWatchHistory() {
    if (mediaType === 'live') return;


    try {
      saveHistory({
        id: generateId(),
        profile_id: profile.id,
        tmdb_id: tmdbId,
        media_type: mediaType,
        title: detail?.title || detail?.name || '',
        poster_path: detail?.poster_path || undefined,
        season: mediaType === 'tv' ? currentSeason : undefined,
        episode: mediaType === 'tv' ? currentEpisode : undefined,
        position: 0,
        duration: 0,
        last_watched: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving watch history:', error);
    }
  }


  function handlePreviousEpisode() {
    if (currentEpisode > 1) {
      setCurrentEpisode(currentEpisode - 1);
    } else if (currentSeason > 1) {
      setCurrentSeason(currentSeason - 1);
      setCurrentEpisode(999);
    }
  }


  function handleNextEpisode() {
    if (currentEpisode < episodes.length) {
      setCurrentEpisode(currentEpisode + 1);
    } else if (detail?.number_of_seasons && currentSeason < detail.number_of_seasons) {
      setCurrentSeason(currentSeason + 1);
      setCurrentEpisode(1);
    }
  }


  const title = channelName || detail?.title || detail?.name || 'Player';
  const bgClass = effectiveTheme === 'dark' ? 'bg-black' : 'bg-gray-50';
  const textClass = effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900';


  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      <div className={`fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] ${effectiveTheme === 'dark' ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-sm`}>
        <div className="max-w-[90%] 4xl:max-w-[2400px] mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-0">
            <button
              onClick={onBack}
              className={`flex items-center gap-2 sm:gap-3 ${textClass} hover:text-blue-400 transition-colors flex-shrink-0`}
            >
              <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
              <span className="font-medium text-base sm:text-xl lg:text-2xl">{t('back')}</span>
            </button>
            <div className="flex items-center gap-2 sm:gap-6 min-w-0">
              <h2 className={`text-base sm:text-2xl lg:text-4xl font-bold ${textClass} truncate`}>{title}</h2>
              {mediaType === 'tv' && (
                <span className={`text-sm sm:text-xl lg:text-2xl ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>S{currentSeason}:E{currentEpisode}</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 sm:gap-4">
            {mediaType !== 'live' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const updatedProfile = { ...profile, safe_mode: !profile.safe_mode };
                    saveProfile(updatedProfile);
                    if (onProfileUpdate) onProfileUpdate();
                  }}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-4 rounded border transition-all ${
                    profile.safe_mode 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/50' 
                      : (effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600')
                  }`}
                  title={profile.safe_mode ? "Desactivar Modo Seguro" : "Activar Modo Seguro"}
                >
                  <Check size={18} className={profile.safe_mode ? 'opacity-100' : 'opacity-20'} />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                    {profile.safe_mode ? 'Seguro ON' : 'Seguro OFF'}
                  </span>
                </button>

                <select
                  value={server}
                  onChange={(e) => setServer(e.target.value as any)}
                  className={`px-3 sm:px-6 py-2 sm:py-4 text-sm sm:text-lg lg:text-xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-200 border-gray-300 text-black'} rounded border focus:outline-none focus:border-blue-500`}
                >
                  <option value="vidsrc">Vidsrc (Global 🌎)</option>
                  <option value="vidlink">Vidlink (Global 🌎)</option>
                  <option value="vidnest">VidNest (Latino 🇨🇴)</option>
                  <option value="111movies">111Movies (EN 🇺🇸)</option>
                  <option value="videasy">Videasy (Global 🌎)</option>
                  <option value="vidfast">Vidfast (Global 🌎)</option>
                </select>
              </div>
            )}

          </div>
        </div>
      </div>


      <div className="pt-32 sm:pt-40 lg:pt-32 px-4 sm:px-8">
        <div className="max-w-[90%] 4xl:max-w-[2400px] mx-auto">
          {mediaType === 'live' && (
            <div className={`text-center mb-4 sm:mb-6 ${effectiveTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} font-medium text-sm sm:text-xl lg:text-2xl`}>
              Live TV Channel might take up to 35 seconds to load
            </div>
          )}
          {mediaType === 'live' ? (
            <div
              className="bg-black rounded-lg mb-6 sm:mb-8"
              style={{
                minHeight: '300px',
                height: '60vh',
                border: '3px solid #1a73e8',
                boxShadow: '0 0 20px #1a73e8aa'
              }}
            >
              <iframe
                src={playerUrl}
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                title={`Live TV - ${channelName}`}
              />
            </div>
          ) : (
            <div className="bg-black rounded-lg overflow-hidden mb-6 sm:mb-8 shadow-2xl relative" style={{ minHeight: '300px', height: '60vh' }}>
              <iframe
                key={playerUrl}
                src={playerUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                // When ad blocking is enabled, we need scripts to inject the ad blocker
                // Safe mode + ad blocking both need scripts for their functionality
                sandbox={profile.safe_mode || shouldBlockAds(profile, mediaType) ? "allow-forms allow-scripts allow-same-origin allow-presentation allow-popups" : undefined}
              />
              {/* Smart click guard: absorbs the invisible ad layers from the iframe but allows bottom controls to be clicked */}
              {shouldBlockAds(profile, mediaType) && typeof window !== 'undefined' && (
                <div 
                  className="absolute inset-x-0 top-0 h-[80%] z-10 cursor-pointer"
                  onClick={(e) => {
                    const target = e.currentTarget;
                    // Prevent the ad network's invisible div inside the iframe from receiving this first click
                    e.preventDefault();
                    e.stopPropagation();
                    // Briefly flash white to indicate the ad was blocked
                    target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    setTimeout(() => { target.style.backgroundColor = 'transparent'; }, 200);
                    // Disable the guard for 5 seconds to let the user double-tap or interact with the player center
                    target.style.pointerEvents = 'none';
                    setTimeout(() => {
                      if (target) target.style.pointerEvents = 'auto';
                    }, 5000);
                  }}
                  title="WilStream Escudo Activo: Toca para interactuar de forma segura"
                />
              )}
              {isPlayerLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-white font-medium">Buscando el mejor servidor...</p>
                </div>
              )}
            </div>
          )}


          {mediaType === 'live' && currentChannel && (
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6 sm:mb-8">
                <button
                  onClick={handlePreviousChannel}
                  disabled={currentChannelIndex === 0}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg lg:text-xl ${effectiveTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600' : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'} rounded-lg font-medium transition-colors flex items-center justify-center gap-2 sm:gap-3`}
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                  <span className="hidden sm:inline">Previous Channel</span>
                  <span className="sm:hidden">Previous</span>
                </button>
                <button
                  onClick={() => toggleWatchlist(currentChannel)}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg lg:text-xl rounded-lg font-medium transition-colors flex items-center justify-center gap-2 sm:gap-3 ${
                    watchlist.includes(currentChannel.name)
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : effectiveTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'
                  }`}
                >
                  {watchlist.includes(currentChannel.name) ? <Check className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />}
                  <span className="hidden sm:inline">{watchlist.includes(currentChannel.name) ? t('inLibrary') : t('addToLibrary')}</span>
                </button>
                <button
                  onClick={handleNextChannel}
                  disabled={currentChannelIndex === LIVE_CHANNELS.length - 1}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg lg:text-xl ${effectiveTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600' : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'} rounded-lg font-medium transition-colors flex items-center justify-center gap-2 sm:gap-3`}
                >
                  <span className="hidden sm:inline">Next Channel</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                </button>
              </div>


              {similarChannels.length > 0 && (
                <div>
                  <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 ${textClass}`}>Similar Channels</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
                    {similarChannels.map((channel) => (
                      <button
                        key={channel.channelNumber}
                        onClick={() => handlePlayChannel(channel)}
                        className={`group ${effectiveTheme === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-200'} rounded-lg p-3 sm:p-6 transition-all hover:ring-2 hover:ring-blue-500`}
                      >
                        <div className="mb-2 sm:mb-3">
                          <span className="inline-block bg-blue-600 text-white text-xs sm:text-sm lg:text-base font-bold px-2 sm:px-3 py-1 sm:py-2 rounded">
                            CH {channel.channelNumber}
                          </span>
                        </div>
                        <div className={`aspect-video ${effectiveTheme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'} rounded flex items-center justify-center p-2 sm:p-4 mb-2 sm:mb-3`}>
                          <span className={`text-xs sm:text-base lg:text-lg font-bold text-center ${textClass}`}>{channel.name}</span>
                        </div>
                        <p className={`text-xs sm:text-sm lg:text-base ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-center`}>{channel.category}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}


          {mediaType === 'tv' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button
                onClick={handlePreviousEpisode}
                disabled={currentSeason === 1 && currentEpisode === 1}
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg lg:text-xl ${effectiveTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600' : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'} rounded font-medium transition-colors flex items-center justify-center gap-2 sm:gap-3`}
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                <span className="hidden sm:inline">Previous Episode</span>
                <span className="sm:hidden">Previous</span>
              </button>
              <button
                onClick={handleNextEpisode}
                disabled={currentSeason === detail?.number_of_seasons && currentEpisode === episodes.length}
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg lg:text-xl ${effectiveTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600' : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'} rounded font-medium transition-colors flex items-center justify-center gap-2 sm:gap-3`}
              >
                <span className="hidden sm:inline">{t('playNext')}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              </button>
            </div>
          )}


          {mediaType === 'tv' && episodes.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${textClass}`}>{t('episodes')}</h3>
                <select
                  value={currentSeason}
                  onChange={(e) => setCurrentSeason(parseInt(e.target.value))}
                  className={`w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg lg:text-xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-200 border-gray-300 text-black'} rounded border focus:outline-none focus:border-blue-500`}
                >
                  {detail?.number_of_seasons && Array.from({ length: detail.number_of_seasons }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s}>
                      {t('season')} {s}
                    </option>
                  ))}
                </select>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => setCurrentEpisode(ep.episode_number)}
                    className={`text-left p-6 rounded-lg transition-all ${
                      currentEpisode === ep.episode_number
                        ? 'bg-blue-600 shadow-lg text-white'
                        : effectiveTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-40 h-24 bg-gray-900 rounded overflow-hidden">
                        {ep.still_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                            alt={ep.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-lg lg:text-xl mb-2 ${currentEpisode === ep.episode_number ? 'text-white' : textClass}`}>{ep.episode_number}. {ep.name}</div>
                        <p className={`text-base lg:text-lg ${currentEpisode === ep.episode_number ? 'text-gray-200' : effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>{ep.overview}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


