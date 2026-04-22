import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, Search, Play, Heart, Monitor, 
  Gamepad2, Music2, Baby, Film, Radio, 
  LayoutGrid, Maximize, Settings, X, Save
} from 'lucide-react';
import { Profile, LiveChannel } from '../types';
import { getWatchlist, addToWatchlist, generateId } from '../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';

import { RefreshCw } from 'lucide-react';
import { CONFIG } from '../config';
import { isHlsStream } from '../lib/hlsUtils';

interface LiveTVViewProps {
  profile: Profile;
  onBack: () => void;
  onPlay: (tmdbId: number, mediaType: 'movie' | 'tv' | 'live', season?: number, episode?: number, embedUrl?: string, channelName?: string) => void;
  channels: LiveChannel[];
  isLoading: boolean;
  onRefresh: () => void;
  channelError?: string | null;
}

export function LiveTVView({ profile, onBack, onPlay, channels, isLoading, onRefresh, channelError }: LiveTVViewProps) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState<LiveChannel | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isHoveringPlayer, setIsHoveringPlayer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const [testStatus, setTestStatus] = useState('');
  const [iptvConfig, setIptvConfig] = useState({
    server: localStorage.getItem('iptv_server') || 'https://tv.m3uts.xyz',
    user: localStorage.getItem('iptv_user') || 'm',
    pass: localStorage.getItem('iptv_pass') || 'm'
  });
  const hideTimerRef = useRef<any>(null);

  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
       const lastChannel = localStorage.getItem('WilStream_last_live_channel');
       const saved = lastChannel ? channels.find(c => c.name === lastChannel) : null;
       setActiveChannel(saved || channels[0]);
    }
  }, [channels]);

  // Save last channel when it change
  useEffect(() => {
    if (activeChannel) {
      localStorage.setItem('WilStream_last_live_channel', activeChannel.name);
    }
  }, [activeChannel]);

  useEffect(() => {
    loadWatchlist();
  }, []);

  // Categories with Icons
  const categories = useMemo(() => {
    const baseCats = Array.from(new Set(channels.map((ch: LiveChannel) => ch.category)));
    return [
      { id: 'All', name: 'Todos', icon: LayoutGrid },
      { id: 'Favorites', name: 'Favoritos', icon: Heart },
      ...baseCats.map((cat: string) => ({
        id: cat,
        name: cat,
        icon: cat.toLowerCase().includes('sports') ? Gamepad2 :
              cat.toLowerCase().includes('movies') ? Film :
              cat.toLowerCase().includes('kids') ? Baby :
              cat.toLowerCase().includes('music') ? Music2 : 
              cat.toLowerCase().includes('news') ? Radio : Monitor
      }))
    ];
  }, [channels]);

  // Filter Logic
  const filteredChannels = useMemo(() => {
    let list = selectedCategory === 'All'
      ? channels
      : selectedCategory === 'Favorites'
      ? channels.filter((ch: LiveChannel) => watchlist.includes(ch.name))
      : channels.filter((ch: LiveChannel) => ch.category === selectedCategory);

    if (searchQuery.trim()) {
      list = list.filter((ch: LiveChannel) =>
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ch.channelNumber || '').toString().includes(searchQuery.trim())
      );
    }

    return list;
  }, [selectedCategory, searchQuery, watchlist, channels]);

  useEffect(() => {
    loadWatchlist();
  }, [profile.id]);

  useEffect(() => {
    // Auto-hide controls after inactivity
    const resetTimer = () => {
      setIsHoveringPlayer(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        if (!sidebarOpen) setIsHoveringPlayer(false);
      }, 5000);
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [sidebarOpen]);

  function loadWatchlist() {
    const list = getWatchlist(profile.id).filter(item => item.media_type === 'live');
    setWatchlist(list.map(item => item.title));
  }

  function toggleWatchlist(channel: LiveChannel) {
    const isInWatchlist = watchlist.includes(channel.name);
    if (isInWatchlist) {
      // In a real app we'd need the ID, here we use name for simplicity in Watchlist logic
      setWatchlist(watchlist.filter((name: string) => name !== channel.name));
    } else {
      addToWatchlist({
        id: generateId(),
        profile_id: profile.id,
        media_type: 'live',
        title: channel.name,
        embed_url: channel.embed,
        created_at: new Date().toISOString()
      });
      setWatchlist([...watchlist, channel.name]);
    }
  }

  return (
    <div className={`fixed inset-0 flex bg-black text-white font-sans overflow-hidden select-none`}>
      {/* Background Video Player */}
      <div className="absolute inset-0 z-0">
        {activeChannel && (
          <div className="w-full h-full relative">
            {isHlsStream(activeChannel.embed) ? (
              <div className="w-full h-full relative">
                <video
                  id="live-player"
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full bg-black"
                  style={{ objectFit: 'contain' }}
                />
                <HlsLoader 
                  videoId="live-player" 
                  source={activeChannel.embed}
                  proxySource={`${CONFIG.BACKEND_URL}/api/proxy/?url=${encodeURIComponent(activeChannel.embed)}`}
                  key={`${activeChannel.embed}-${playerKey}`}
                />
              </div>
            ) : (
              <iframe
                key={`${activeChannel.embed}-${playerKey}`}
                src={activeChannel.embed}
                className="w-full h-full border-0 pointer-events-auto"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        )}
        
        {/* Dark Vignette Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none transition-opacity duration-700 ${!isHoveringPlayer && !sidebarOpen ? 'opacity-0' : 'opacity-100'}`} />
      </div>

      {/* Top Header Controls */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: (isHoveringPlayer || sidebarOpen) ? 0 : -100 }}
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
      >
        <div className="flex items-center gap-6 pointer-events-auto">
          <button 
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all active:scale-95 group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
              <h1 className="text-xl font-bold tracking-tight">WilFlix Live</h1>
            </div>
            {activeChannel && (
              <p className="text-sm text-white/60 font-medium">CH {activeChannel.channelNumber} • {activeChannel.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button 
            onClick={() => setPlayerKey(prev => prev + 1)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all active:scale-95"
            title="Recargar Reproductor"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all active:scale-95"
            title="Configuración de IPTV"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-md border transition-all ${sidebarOpen ? 'bg-blue-600 border-blue-400' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-sm font-semibold">Canales</span>
          </button>
        </div>
      </motion.div>

      {/* Main UI Components (Sidebar) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[400px] z-40 flex flex-col pt-24 pb-12 px-6"
          >
            {/* Glass Container */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl border-l border-white/10" />
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Buscar canal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                />
              </div>

              {/* Category Scroller */}
              <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
                {categories.map((cat: any) => {
                  const Icon = cat.icon;
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2.5 px-track py-2.5 px-4 rounded-xl whitespace-nowrap transition-all border ${
                        active 
                        ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : ''}`} />
                      <span className="text-sm font-bold">{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* IPTV Provider Error Banner */}
              {channelError && (
                <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 text-base mt-0.5 flex-shrink-0">⚠️</span>
                    <p className="text-xs text-amber-300/80 leading-relaxed">{channelError}</p>
                  </div>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="self-start text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
                  >
                    Configurar proveedor →
                  </button>
                </div>
              )}

              {/* Channel List */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {filteredChannels.map((channel: LiveChannel, idx: number) => {
                    const active = activeChannel?.name === channel.name;
                    return (
                      <motion.button
                        key={channel.name + idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setActiveChannel(channel)}
                        className={`w-full group relative flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                          active 
                          ? 'bg-gradient-to-r from-blue-600/30 to-blue-600/10 border-blue-500/50 shadow-inner' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        {/* Status line */}
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                        )}
                        
                        {/* Channel Icon/Logo */}
                        <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 ${active ? 'bg-blue-600/20' : 'bg-black/40'}`}>
                          {channel.image ? (
                            <img 
                              src={channel.image} 
                              alt="" 
                              className="w-10 h-10 object-contain drop-shadow-md" 
                              onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as any).src = "https://www.google.com/s2/favicons?domain=tv.m3uts.xyz&sz=64";
                                (e.target as any).onerror = null; // Prevent infinite loop
                              }}
                            />
                          ) : (
                            <Monitor className="w-6 h-6 text-white/40" />
                          )}
                        </div>

                        {/* Channel Metadata */}
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-sm font-bold truncate transition-colors ${active ? 'text-blue-400' : 'text-white/90 group-hover:text-white'}`}>
                            {channel.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] uppercase font-heavy tracking-widest text-white/40">CH {channel.channelNumber}</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className="text-xs text-white/60 font-medium truncate">{channel.category}</span>
                          </div>
                          
                          {/* Live Progress Bar (Mock) */}
                          <div className="mt-2.5 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${active ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-white/30'}`}
                              style={{ width: `${Math.floor(20 + Math.random() * 60)}%` }}
                            />
                          </div>
                        </div>

                        {/* Indicator */}
                        <div className="flex-shrink-0 pr-1">
                          {active ? (
                            <div className="flex gap-1 items-end h-3">
                              {[0.2, 0.4, 0.3].map((val, i) => (
                                <motion.div 
                                  key={i}
                                  animate={{ height: ['4px', '12px', '4px'] }}
                                  transition={{ repeat: Infinity, duration: 0.6, delay: val }}
                                  className="w-[3px] bg-blue-500 rounded-full"
                                />
                              ))}
                            </div>
                          ) : (
                            <Play className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                  
                  {filteredChannels.length === 0 && (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-white/20" />
                      </div>
                      <p className="text-white/40 font-medium">No se encontraron canales</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Player Controller */}
      <motion.div
        initial={{ y: 200 }}
        animate={{ y: (isHoveringPlayer || sidebarOpen) ? 0 : 200 }}
        className="absolute bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-black to-transparent"
      >
        <div className="max-w-6xl mx-auto flex items-end justify-between gap-6 overflow-visible">
          {/* Active Program Info */}
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-3 mb-2">
                <div className="px-2 py-0.5 rounded bg-blue-600 text-[10px] font-bold tracking-wider uppercase">En Vivo</div>
                <div className="text-sm font-medium text-white/60">Canal {activeChannel?.channelNumber}</div>
             </div>
             <h2 className="text-3xl font-black tracking-tight mb-1 truncate drop-shadow-lg">{activeChannel?.name}</h2>
             <p className="text-base text-white/70 line-clamp-1 max-w-2xl font-medium">Disfrutando de la mejor programación de {activeChannel?.category} en WilFlix.</p>
          </div>

          {/* Player Quick Controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => activeChannel && toggleWatchlist(activeChannel)}
              className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
            >
              <Heart className={`w-6 h-6 ${watchlist.includes(activeChannel?.name || '') ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button 
              onClick={() => activeChannel && onPlay(0, 'live', undefined, undefined, activeChannel.embed, activeChannel.name)}
              className="px-8 h-14 rounded-2xl bg-white text-black font-heavy flex items-center gap-3 hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)]"
            >
              <Maximize className="w-5 h-5 fill-current" />
              <span className="text-base uppercase tracking-widest font-black">Pantalla Completa</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Startup Loading */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-center gap-8"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-24 h-24 rounded-full border-t-4 border-r-4 border-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-8 h-8 text-blue-500 fill-current ml-1" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black uppercase tracking-widest text-white/90 mb-2">WilFlix Live</h3>
              <p className="text-white/40 text-sm font-bold tracking-wider animate-pulse uppercase">Sintonizando canales...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#12121a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold">Proveedor IPTV</h3>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/40">URL del Servidor</label>
                    <input 
                      type="text" 
                      value={iptvConfig.server}
                      onChange={(e) => setIptvConfig({...iptvConfig, server: e.target.value})}
                      placeholder="http://example.com:8080"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-white/40">Usuario</label>
                      <input 
                        type="text" 
                        value={iptvConfig.user}
                        onChange={(e) => setIptvConfig({...iptvConfig, user: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-white/40">Contraseña</label>
                      <input 
                        type="password" 
                        value={iptvConfig.pass}
                        onChange={(e) => setIptvConfig({...iptvConfig, pass: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={async () => {
                        setTestStatus('testing');
                        try {
                          const { XtreamService } = await import('../lib/xtream');
                          const svc = new XtreamService(iptvConfig.server, iptvConfig.user, iptvConfig.pass);
                          const result = await svc.testConnection();
                          if (result.ok) {
                            setTestStatus(`ok:${result.streams} canales en ${result.categories} categorías`);
                          } else {
                            setTestStatus(`fail:${result.error || 'Sin canales — verificá las credenciales'}`);
                          }
                        } catch (e: any) {
                          setTestStatus(`fail:${e?.message || 'Error de conexión'}`);
                        }
                      }}
                      disabled={testStatus === 'testing'}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {testStatus === 'testing' 
                        ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Probando...</>
                        : <><RefreshCw className="w-4 h-4" /> Probar Conexión</>
                      }
                    </button>

                    {testStatus && testStatus !== 'testing' && (
                      <div className={`px-4 py-3 rounded-xl text-sm font-medium ${testStatus.startsWith('ok:') ? 'bg-green-600/20 border border-green-500/30 text-green-400' : 'bg-red-600/20 border border-red-500/30 text-red-400'}`}>
                        {testStatus.startsWith('ok:') ? `✅ Conectado — ${testStatus.slice(3)}` : `❌ ${testStatus.slice(5)}`}
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        localStorage.setItem('iptv_server', iptvConfig.server);
                        localStorage.setItem('iptv_user', iptvConfig.user);
                        localStorage.setItem('iptv_pass', iptvConfig.pass);
                        setShowSettings(false);
                        setTestStatus('');
                        onRefresh();
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
                    >
                      <Save className="w-5 h-5" />
                      Guardar y Recargar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


function HlsLoader({ videoId, source, proxySource }: { videoId: string; source: string; proxySource?: string }) {
  useEffect(() => {
    let hls: any;
    
    async function init() {
      const video = document.getElementById(videoId) as HTMLVideoElement;
      if (!video) return;

      video.pause();
      video.removeAttribute('src');
      video.load();

      const loadHlsScript = () => {
        return new Promise<void>((resolve) => {
          if ((window as any).Hls) { resolve(); return; }
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      };

      await loadHlsScript();
      const Hls = (window as any).Hls;

      // Try proxy first (bypasses CORS/geo-blocks), fallback to direct
      const sourcesToTry = proxySource ? [proxySource, source] : [source];

      const trySource = async (src: string, isLast: boolean) => {
        if (hls) { hls.destroy(); hls = null; }

        if (Hls.isSupported()) {
          hls = new Hls({ 
            enableWorker: true, 
            lowLatencyMode: true, 
            backBufferLength: 60,
            manifestLoadingTimeOut: 45000,
            manifestLoadingMaxRetry: 10,
            manifestLoadingRetryDelay: 2000,
            levelLoadingTimeOut: 45000,
            fragLoadingTimeOut: 45000,
            fragLoadingMaxRetry: 10,
            startLevel: -1
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => console.warn('[WilStream] Autoplay blocked'));
          });
          hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
            if (data.fatal) {
              if (!isLast && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                console.warn('[WilStream HLS] Proxy failed, trying direct source...');
                trySource(source, true);
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                console.error('[WilStream HLS] Fatal error, cannot recover:', data);
                hls.destroy();
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS (Safari/iOS)
          video.src = src;
          video.play().catch(() => {});
        }
      };

      await trySource(sourcesToTry[0], sourcesToTry.length === 1);
    }

    init();

    return () => {
      if (hls) hls.destroy();
    };
  }, [source, proxySource, videoId]);

  return null;
}
