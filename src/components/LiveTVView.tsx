import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Play, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Profile, LiveChannel } from '../types';
import { LIVE_CHANNELS, CHANNEL_DESCRIPTIONS } from '../lib/liveChannels';
import { getWatchlist, addToWatchlist, removeFromWatchlist, generateId } from '../lib/storage';
import { useTheme } from '../context/ThemeContext';


interface LiveTVViewProps {
  profile: Profile;
  onBack: () => void;
  onPlay: (tmdbId: number, mediaType: 'movie' | 'tv' | 'live', season?: number, episode?: number, embedUrl?: string, channelName?: string) => void;
}


export function LiveTVView({ profile, onBack, onPlay }: LiveTVViewProps) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState<LiveChannel | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [playerActivated, setPlayerActivated] = useState(false);
  const reactivateTimerRef = useRef<any>(null);
  const { effectiveTheme } = useTheme();
  const channelListRef = useRef<HTMLDivElement>(null);

  const categories = ['All', 'Favorites', ...Array.from(new Set(LIVE_CHANNELS.map(ch => ch.category)))];

  function handleActivatePlayer() {
    setPlayerActivated(true);
    if (reactivateTimerRef.current) clearTimeout(reactivateTimerRef.current);
    reactivateTimerRef.current = setTimeout(() => {
      setPlayerActivated(false);
    }, 2500);
  }

  // Block popup attempts from the page itself
  useEffect(() => {
    const originalOpen = window.open;
    window.open = function() { return null; };
    return () => { window.open = originalOpen; };
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [profile.id]);


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


  function handlePlayChannel(channel: LiveChannel) {
    setActiveChannel(channel);
    // On mobile, collapse sidebar when playing
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  }

  function handlePlayFullscreen(channel: LiveChannel) {
    onPlay(0, 'live', undefined, undefined, channel.embed, channel.name);
  }


  let filteredChannels = selectedCategory === 'All'
    ? LIVE_CHANNELS
    : selectedCategory === 'Favorites'
    ? LIVE_CHANNELS.filter(ch => watchlist.includes(ch.name))
    : LIVE_CHANNELS.filter(ch => ch.category === selectedCategory);


  if (searchQuery.trim()) {
    filteredChannels = filteredChannels.filter(ch =>
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.channelNumber.toString().includes(searchQuery.trim())
    );
  }

  // Navigate channels
  const currentChannelIndex = activeChannel ? LIVE_CHANNELS.findIndex(ch => ch.channelNumber === activeChannel.channelNumber) : -1;
  
  function handlePrevChannel() {
    if (currentChannelIndex > 0) {
      handlePlayChannel(LIVE_CHANNELS[currentChannelIndex - 1]);
    }
  }
  function handleNextChannel() {
    if (currentChannelIndex < LIVE_CHANNELS.length - 1) {
      handlePlayChannel(LIVE_CHANNELS[currentChannelIndex + 1]);
    }
  }

  const isDark = effectiveTheme === 'dark';

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-100'} overflow-hidden`}>
      
      {/* Top Bar */}
      <div className={`flex items-center gap-3 px-4 py-3 ${isDark ? 'bg-[#12121a] border-b border-gray-800/50' : 'bg-white border-b border-gray-200'} flex-shrink-0 z-50`} style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <button onClick={onBack} className={`flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'} transition-colors`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>Live TV</h1>
          {activeChannel && (
            <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} truncate hidden sm:block`}>
              — {activeChannel.name}
            </span>
          )}
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
        >
          {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Content: Player + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Player Area */}
        <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'w-full' : ''}`}>
          {activeChannel ? (
            <>
              {/* Video Player */}
              <div className="flex-1 bg-black relative flex items-center justify-center">
                <iframe
                  src={activeChannel.embed}
                  width="100%"
                  height="100%"
                  style={{ border: 0, position: 'absolute', inset: 0 }}
                  allowFullScreen
                  title={`Live TV - ${activeChannel.name}`}
                />
                
                {!playerActivated && (
                  <div
                    className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
                    style={{ background: 'transparent' }}
                    onClick={handleActivatePlayer}
                    title="Toca para interactuar con el reproductor"
                  >
                    <div className="bg-black/50 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-3 pointer-events-none select-none border border-white/20">
                      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent" />
                      <span className="text-white text-sm font-medium">Toca para interactuar</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Player Controls Bar */}
              <div className={`flex items-center justify-between px-4 py-2.5 ${isDark ? 'bg-[#12121a] border-t border-gray-800/50' : 'bg-white border-t border-gray-200'} flex-shrink-0`}>
                <div className="flex items-center gap-3 min-w-0">
                  {activeChannel.image ? (
                    <img src={activeChannel.image} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                  ) : (
                    <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-600' : 'bg-blue-500'} text-white flex-shrink-0`}>
                      {activeChannel.channelNumber}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeChannel.name}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{activeChannel.category} · CH {activeChannel.channelNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handlePrevChannel()}
                    disabled={currentChannelIndex <= 0}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleNextChannel()}
                    disabled={currentChannelIndex >= LIVE_CHANNELS.length - 1}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleWatchlist(activeChannel)}
                    className={`p-2 rounded-lg transition-colors ${
                      watchlist.includes(activeChannel.name)
                        ? 'text-red-500 hover:bg-red-500/10'
                        : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${watchlist.includes(activeChannel.name) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handlePlayFullscreen(activeChannel)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-blue-600 hover:bg-blue-700 text-white`}
                  >
                    Fullscreen
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No channel selected - show welcome */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <Play className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Seleccioná un canal
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Elegí un canal de la lista para comenzar a ver TV en vivo
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Channel Sidebar */}
        <div
          className={`flex-shrink-0 flex flex-col transition-all duration-300 ${
            sidebarCollapsed 
              ? 'w-0 overflow-hidden opacity-0' 
              : 'w-full md:w-80 lg:w-96'
          } ${isDark ? 'bg-[#0e0e16] border-l border-gray-800/50' : 'bg-white border-l border-gray-200'}
          ${!sidebarCollapsed ? 'absolute md:relative inset-0 md:inset-auto z-40 md:z-auto' : ''}
          `}
          style={{ top: 0, bottom: 0 }}
        >
          {/* Sidebar Header */}
          <div className={`p-3 flex-shrink-0 border-b ${isDark ? 'border-gray-800/50' : 'border-gray-200'}`} style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
            {/* Mobile close button */}
            <div className="flex items-center justify-between mb-3 md:hidden">
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Canales</span>
              <button onClick={() => setSidebarCollapsed(true)} className={`p-1 rounded ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {/* Search */}
            <div className="relative mb-3">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Buscar canal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-800/80 text-white border-gray-700 placeholder-gray-500' : 'bg-gray-100 text-black border-gray-200 placeholder-gray-400'} border focus:outline-none focus:border-blue-500`}
              />
            </div>
            {/* Categories */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : isDark ? 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {cat === 'Favorites' ? '❤️ Favoritos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Channel List */}
          <div ref={channelListRef} className="flex-1 overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {filteredChannels.length === 0 ? (
              <div className="p-6 text-center">
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {selectedCategory === 'Favorites' ? 'No tenés canales favoritos aún' : 'No se encontraron canales'}
                </p>
              </div>
            ) : (
              filteredChannels.map((channel) => {
                const isActive = activeChannel?.channelNumber === channel.channelNumber;
                const isFav = watchlist.includes(channel.name);
                const desc = CHANNEL_DESCRIPTIONS[channel.name];

                return (
                  <button
                    key={channel.channelNumber}
                    onClick={() => handlePlayChannel(channel)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all border-l-2 ${
                      isActive
                        ? isDark
                          ? 'bg-blue-600/10 border-l-blue-500 text-white'
                          : 'bg-blue-50 border-l-blue-500 text-black'
                        : isDark
                          ? 'border-l-transparent hover:bg-gray-800/40 text-gray-300'
                          : 'border-l-transparent hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {/* Channel Logo / Number */}
                    <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      {channel.image ? (
                        <img src={channel.image} alt={channel.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <span className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {channel.channelNumber}
                        </span>
                      )}
                    </div>
                    
                    {/* Channel Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-semibold truncate ${isActive ? (isDark ? 'text-blue-400' : 'text-blue-600') : ''}`}>
                          {channel.name}
                        </p>
                        {isFav && <Heart className="w-3 h-3 text-red-500 fill-current flex-shrink-0" />}
                        {isActive && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />}
                      </div>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        CH {channel.channelNumber} · {channel.category}
                        {desc ? ` · ${desc.substring(0, 40)}...` : ''}
                      </p>
                    </div>

                    {/* Play indicator */}
                    {isActive ? (
                      <div className="flex gap-[2px] items-end h-4 flex-shrink-0">
                        <div className="w-[3px] bg-blue-500 rounded-full animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                        <div className="w-[3px] bg-blue-500 rounded-full animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                        <div className="w-[3px] bg-blue-500 rounded-full animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <Play className={`w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
