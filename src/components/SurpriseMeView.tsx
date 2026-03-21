import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Plus, Info, X, Film } from 'lucide-react';
import { Profile } from '../types';
import { generateRecommendations } from '../lib/recommendations';
import { getTMDBImageUrl } from '../lib/tmdb';
import { addToWatchlist, isInWatchlist } from '../lib/storage';
import { useTheme } from '../context/ThemeContext';


interface SurpriseMeViewProps {
  profile: Profile;
  onBack: () => void;
  onShowDetail: (id: number, type: 'movie' | 'tv') => void;
}


export function SurpriseMeView({ profile, onBack, onShowDetail }: SurpriseMeViewProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hero, setHero] = useState<any | null>(null);
  const { effectiveTheme } = useTheme();


  useEffect(() => {
    loadRecommendations();
  }, [profile.id]);


  async function loadRecommendations() {
    setLoading(true);
    try {
      const recs = await generateRecommendations(profile);
      setRecommendations(recs);
      if (recs.length > 0) {
        setHero(recs[0]);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  }


  function handleAddToWatchlist(item: any) {
    const watchlistItem = {
      id: `${Date.now()}`,
      profile_id: profile.id,
      tmdb_id: item.id,
      media_type: item.media_type,
      title: item.title || item.name,
      poster_path: item.poster_path || undefined,
      created_at: new Date().toISOString()
    };
    addToWatchlist(watchlistItem);
    showAlert('Added to My List!');
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


  const getTitle = (item: any) => item.title || item.name;
  const bgClass = effectiveTheme === 'dark' ? 'bg-black' : 'bg-gray-50';
  const textClass = effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900';


  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass} flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-xl">Generating recommendations...</p>
        </div>
      </div>
    );
  }


  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      <button
        onClick={onBack}
        className="fixed bottom-6 left-6 z-50 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all shadow-2xl flex items-center gap-2 text-base md:text-lg"
      >
        <ArrowLeft size={20} />
        Return to Normal
      </button>


      {hero && (
        <div className="relative h-[70vh] md:h-[85vh] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getTMDBImageUrl(hero.backdrop_path || hero.poster_path, 'original')})` }}
          >
            <div className={`absolute inset-0 ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-black via-black/70 to-transparent' : 'bg-gradient-to-r from-white via-white/70 to-transparent'}`}></div>
            <div className={`absolute inset-0 ${effectiveTheme === 'dark' ? 'bg-gradient-to-t from-black via-transparent to-transparent' : 'bg-gradient-to-t from-white via-transparent to-transparent'}`}></div>
          </div>


          <div className="relative z-10 h-full flex items-center max-w-7xl mx-auto px-4 md:px-6">
            <div className="max-w-2xl">
              <div className="mb-4">
                <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm md:text-base font-bold">Recommended for you</span>
              </div>
              <h1 className={`text-3xl md:text-6xl font-bold mb-4 drop-shadow-2xl ${textClass}`}>{getTitle(hero)}</h1>
              <p className={`text-sm md:text-lg mb-6 line-clamp-3 drop-shadow-lg ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{hero.overview}</p>
              <div className="flex flex-wrap gap-2 md:gap-4">
                <button
                  onClick={() => onShowDetail(hero.id, hero.media_type)}
                  className={`px-4 md:px-8 py-2 md:py-3 ${effectiveTheme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} rounded-lg font-bold transition-all flex items-center gap-2 shadow-xl text-sm md:text-base`}
                >
                  <Play size={20} fill="currentColor" />
                  Play
                </button>
                {!isInWatchlist(profile.id, hero.id) && (
                  <button
                    onClick={() => handleAddToWatchlist(hero)}
                    className={`px-4 md:px-8 py-2 md:py-3 ${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} backdrop-blur-sm rounded-lg font-bold transition-all flex items-center gap-2 shadow-xl text-sm md:text-base`}
                  >
                    <Plus size={20} />
                    My List
                  </button>
                )}
                <button
                  onClick={() => onShowDetail(hero.id, hero.media_type)}
                  className={`px-4 md:px-8 py-2 md:py-3 ${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} backdrop-blur-sm rounded-lg font-bold transition-all flex items-center gap-2 shadow-xl text-sm md:text-base`}
                >
                  <Info size={20} />
                  More Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="relative z-10 px-4 md:px-6 pb-20 -mt-20 md:-mt-32">
        <div className="max-w-7xl mx-auto">
          <ContentRow
            title="More recommendations for you"
            items={recommendations.slice(1)}
            onItemClick={(item: any) => onShowDetail(item.id, item.media_type)}
            theme={effectiveTheme}
          />
        </div>
      </div>
    </div>
  );
}


function ContentRow({ title, items, onItemClick, theme }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);


  return (
    <div className="space-y-3">
      <h2 className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item: any) => {
          const itemTitle = item.title || item.name;
          const posterPath = item.poster_path;


          return (
            <div key={item.id} className="flex-shrink-0 group relative">
              <button
                onClick={() => onItemClick(item)}
                className="cursor-pointer"
              >
                <div className="w-40 md:w-48 rounded-lg overflow-hidden transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-2xl">
                  {posterPath ? (
                    <img
                      src={getTMDBImageUrl(posterPath, 'w342')}
                      alt={itemTitle}
                      className="w-full h-56 md:h-72 object-cover"
                    />
                  ) : (
                    <div className="w-full h-56 md:h-72 bg-gray-800 flex flex-col items-center justify-center p-4">
                      <div className="relative">
                        <Film size={48} className="text-gray-600 mb-2" />
                        <X size={24} className="text-gray-600 absolute -top-1 -right-1" />
                      </div>
                      <p className="text-gray-500 text-xs text-center mt-2">No thumbnail available</p>
                    </div>
                  )}
                </div>
                {itemTitle && (
                  <div className="mt-2 px-1">
                    <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {itemTitle}
                    </p>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


