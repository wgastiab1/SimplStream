import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Plus, Star, Youtube, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Profile, TMDBDetail, CastMember } from '../types';
import { tmdbFetch, getTMDBImageUrl } from '../lib/tmdb';
import { getRating, saveRating, isInWatchlist, addToWatchlist, removeFromWatchlist, getWatchHistory, generateId } from '../lib/storage';
import { CastMemberModal } from './CastMemberModal';
import { useTranslation } from '../context/LanguageContext';


interface DetailViewProps {
  profile: Profile;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  onBack: () => void;
  onPlay: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => void;
  onShowDetail: (id: number, type: 'movie' | 'tv') => void;
}


export function DetailView({ profile, tmdbId, mediaType, onBack, onPlay, onShowDetail }: DetailViewProps) {
  const [detail, setDetail] = useState<TMDBDetail | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [similar, setSimilar] = useState<any[]>([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [continueFrom, setContinueFrom] = useState<any>(null);
  const [selectedCastMember, setSelectedCastMember] = useState<CastMember | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showHeroTrailer, setShowHeroTrailer] = useState(false);
  const { effectiveTheme } = useTheme();
  const { t, language } = useTranslation();


  useEffect(() => {
    setDetail(null);
    setShowHeroTrailer(false);
    loadDetail();
    loadUserRating();
    loadSimilar();
    checkWatchlist();
    loadWatchHistory();
  }, [tmdbId, mediaType, language]);

  useEffect(() => {
    if (detail) {
      const timer = setTimeout(() => {
        const hasVideo = !!detail.videos?.results?.some((v: any) => v.site === 'YouTube');
        console.log(`[WilStream] Checking trailer for ${detail.title || detail.name}: ${hasVideo ? 'Found!' : 'Not found'}`);
        setShowHeroTrailer(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [detail]);


  async function loadDetail() {
    try {
      setShowHeroTrailer(false);
      let data = await tmdbFetch(`/${mediaType}/${tmdbId}?append_to_response=videos,credits,content_ratings`, language);
      
      // Fallback: If no videos found in chosen language, try English
      if (!data.videos?.results?.length) {
        console.log('No videos in current language, falling back to English...');
        const enData = await tmdbFetch(`/${mediaType}/${tmdbId}/videos`, 'en');
        if (enData.results?.length) {
          data = { ...data, videos: enData };
        }
      }

      console.log('TMDB Data loaded. Videos found:', data.videos?.results?.length || 0);
      setDetail(data);
    } catch (error) {
      console.error('Error loading detail:', error);
    }
  }


  function loadUserRating() {
    try {
      const rating = getRating(profile.id, tmdbId, mediaType);
      if (rating) {
        setUserRating(rating.rating);
      }
    } catch (error) {
      console.error('Error loading rating:', error);
    }
  }


  async function loadSimilar() {
    try {
      const data = await tmdbFetch(`/${mediaType}/${tmdbId}/similar`, language);
      setSimilar(data.results?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error loading similar:', error);
    }
  }


  function checkWatchlist() {
    try {
      setInWatchlist(isInWatchlist(profile.id, tmdbId));
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  }


  function loadWatchHistory() {
    try {
      const history = getWatchHistory(profile.id)
        .filter(h => h.tmdb_id === tmdbId && h.media_type === mediaType)
        .sort((a, b) => new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime());


      if (history.length > 0) {
        setContinueFrom(history[0]);
      }
    } catch (error) {
      console.error('Error loading watch history:', error);
    }
  }


  function handleRating(rating: number) {
    try {
      saveRating({
        id: generateId(),
        profile_id: profile.id,
        tmdb_id: tmdbId,
        media_type: mediaType,
        rating,
        genres: detail?.genres || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setUserRating(rating);
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  }


  function toggleWatchlist() {
    try {
      if (inWatchlist) {
        removeFromWatchlist(profile.id, tmdbId);
        setInWatchlist(false);
      } else {
        addToWatchlist({
          id: generateId(),
          profile_id: profile.id,
          tmdb_id: tmdbId,
          media_type: mediaType,
          title: detail?.title || detail?.name || '',
          poster_path: detail?.poster_path || undefined,
          created_at: new Date().toISOString()
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  }


  if (!detail) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">{t('loading')}</div>
      </div>
    );
  }


  const title = detail.title || detail.name;
  const releaseDate = detail.release_date || detail.first_air_date;
  const trailer = detail.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || 
                  detail.videos?.results?.find((v: any) => v.type === 'Teaser' && v.site === 'YouTube') ||
                  detail.videos?.results?.find((v: any) => v.site === 'YouTube');


  const bgClass = effectiveTheme === 'dark' ? 'bg-black' : 'bg-gray-50';
  const textClass = effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900';


  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      <div className={`fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] ${effectiveTheme === 'dark' ? 'bg-gradient-to-b from-black via-black/95 to-transparent' : 'bg-gradient-to-b from-white via-white/95 to-transparent'}`}>
        <div className="max-w-[90%] 4xl:max-w-[2400px] mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 sm:gap-3 ${textClass} hover:text-blue-400 transition-colors`}
          >
            <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
            <span className="font-medium text-lg sm:text-xl lg:text-2xl">{t('back')}</span>
          </button>
        </div>
      </div>


      <div className="pt-16 sm:pt-20">
        <div className="relative h-[50vh] sm:h-[70vh] overflow-hidden">
            <div
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${showHeroTrailer && trailer ? 'opacity-0' : 'opacity-100'}`}
              style={{
                backgroundImage: `url(${getTMDBImageUrl(detail.backdrop_path, 'original')})`,
              }}
            />
            {showHeroTrailer && trailer && (
              <div className="absolute inset-0 z-10 pointer-events-none scale-[1.2] sm:scale-[1.5] overflow-hidden transition-opacity duration-1000">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailer.key}&rel=0&iv_load_policy=3&origin=${window.location.origin}`}
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.8 }}
                  allow="autoplay"
                  title="Hero Trailer"
                  sandbox={profile.safe_mode ? "allow-forms allow-scripts allow-same-origin allow-presentation" : undefined}
                />
              </div>
            )}
            <div className={`absolute inset-0 z-20 ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-black via-black/60 to-transparent' : 'bg-gradient-to-r from-white via-white/60 to-transparent'}`}></div>
            <div className={`absolute inset-0 z-20 ${effectiveTheme === 'dark' ? 'bg-gradient-to-t from-black via-transparent to-transparent' : 'bg-gradient-to-t from-white via-transparent to-transparent'}`}></div>

            <div className="relative z-30 h-full flex items-end max-w-[90%] 4xl:max-w-[2400px] mx-auto px-4 sm:px-8 pb-8 sm:pb-16">
              <div className="max-w-5xl">
                <h1 className={`text-3xl sm:text-6xl lg:text-8xl font-bold mb-3 sm:mb-6 drop-shadow-2xl ${textClass}`}>{title}</h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm sm:text-2xl lg:text-3xl mb-3 sm:mb-6">
                  <span className="flex items-center gap-1 sm:gap-3">
                    <Star className="w-4 h-4 sm:w-7 sm:h-7 lg:w-9 lg:h-9" fill="#EAB308" stroke="#EAB308" />
                    <span className="text-yellow-400 font-bold">{detail.vote_average.toFixed(1)}/10</span>
                  </span>
                  <span className={textClass}>{releaseDate?.slice(0, 4)}</span>
                  {mediaType === 'tv' && detail.number_of_seasons && (
                    <span className={textClass}>{detail.number_of_seasons} {detail.number_of_seasons > 1 ? t('seasons') : t('season')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[90%] 4xl:max-w-[2400px] mx-auto px-4 sm:px-8 py-6 sm:py-10">
          <div className="flex flex-wrap gap-3 sm:gap-6 mb-6 sm:mb-10">
            <button
              onClick={() => onPlay(tmdbId, mediaType, continueFrom?.season || 1, continueFrom?.episode || 1)}
              className={`flex-1 sm:flex-none px-6 sm:px-10 py-3 sm:py-5 text-sm sm:text-xl lg:text-2xl ${effectiveTheme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} rounded font-bold transition-all flex items-center justify-center gap-2 sm:gap-3`}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" fill="currentColor" />
              <span>{continueFrom && continueFrom.position ? (() => {
                const hours = Math.floor(continueFrom.position / 3600);
                const minutes = Math.floor((continueFrom.position % 3600) / 60);
                return `${t('continueFrom')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              })() : t('play')}</span>
            </button>
            <button
              onClick={toggleWatchlist}
              className={`flex-1 sm:flex-none px-6 sm:px-10 py-3 sm:py-5 text-sm sm:text-xl lg:text-2xl rounded font-bold transition-all flex items-center justify-center gap-2 sm:gap-3 ${
                inWatchlist
                  ? `${effectiveTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} ${textClass}`
                  : `${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} backdrop-blur-sm ${textClass}`
              }`}
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
              <span>{inWatchlist ? (window.innerWidth < 640 ? 'Saved' : t('inLibrary')) : (window.innerWidth < 640 ? 'Add' : t('addToLibrary'))}</span>
            </button>
            {trailer && (
              <button
                onClick={() => setShowTrailer(true)}
                className={`w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-5 text-sm sm:text-xl lg:text-2xl ${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} backdrop-blur-sm rounded font-bold transition-all flex items-center justify-center gap-2 sm:gap-3 ${textClass}`}
              >
                <Youtube className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                <span>{t('watchTrailer')}</span>
              </button>
            )}
          </div>


          <div className="mb-6 sm:mb-10">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">{t('rateThis')} {mediaType === 'movie' ? t('movies').toLowerCase() : t('tvShows').toLowerCase()}</h3>
            <div className="flex gap-2 sm:gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 transition-colors"
                    fill={star <= userRating ? '#EAB308' : 'none'}
                    stroke={star <= userRating ? '#EAB308' : '#6B7280'}
                  />
                </button>
              ))}
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 mb-10 sm:mb-16">
            <div className="lg:col-span-2">
              <p className={`text-base sm:text-xl lg:text-2xl ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-6 sm:mb-8 leading-relaxed`}>{detail.overview}</p>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {detail.genres && detail.genres.length > 0 && (
                <div>
                  <h4 className={`text-lg sm:text-xl lg:text-2xl ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2 sm:mb-3`}>{t('genres')}</h4>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {detail.genres.map((genre) => (
                      <span key={genre.id} className={`px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base lg:text-lg ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded-full`}>
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>


          {detail.credits?.cast && detail.credits.cast.length > 0 && (
            <div className="mb-10 sm:mb-16">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">{t('cast')}</h3>
              <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4">
                {detail.credits.cast.slice(0, 10).map((actor) => (
                  <button
                    key={actor.id}
                    onClick={() => setSelectedCastMember(actor)}
                    className="flex-shrink-0 w-32 sm:w-44 lg:w-52 group cursor-pointer transition-transform hover:scale-105"
                  >
                    <img
                      src={getTMDBImageUrl(actor.profile_path, 'w185')}
                      alt={actor.name}
                      className="w-full h-32 sm:h-44 lg:h-52 object-cover rounded-lg mb-2 sm:mb-3 group-hover:ring-2 group-hover:ring-blue-500"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=random&color=fff`;
                      }}
                    />
                    <p className="font-medium text-sm sm:text-base lg:text-lg group-hover:text-blue-400 truncate">{actor.name}</p>
                    <p className="text-gray-400 text-xs sm:text-sm lg:text-base truncate">{actor.character}</p>
                  </button>
                ))}
              </div>
            </div>
          )}


          {selectedCastMember && (
            <CastMemberModal
              castMember={selectedCastMember}
              onClose={() => setSelectedCastMember(null)}
            />
          )}


          {showTrailer && trailer && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
              <div className={`${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-lg overflow-hidden max-w-5xl w-full`}>
                <div className="flex justify-between items-center p-4 border-b ${effectiveTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'}">
                  <h3 className={`text-xl font-bold ${textClass}`}>Trailer</h3>
                  <button onClick={() => setShowTrailer(false)} className={`${effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
                    <X size={24} />
                  </button>
                </div>
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailer.key}`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    sandbox={profile.safe_mode ? "allow-forms allow-scripts allow-same-origin allow-presentation" : undefined}
                  />
                </div>
              </div>
            </div>
          )}


          {similar.length > 0 && (
            <div>
              <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 ${textClass}`}>{t('moreLikeThis')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-6">
                {similar.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onShowDetail(item.id, mediaType)}
                    className="group cursor-pointer text-left"
                  >
                    <div className="rounded-lg overflow-hidden transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-2xl">
                      <img
                        src={getTMDBImageUrl(item.poster_path, 'w342')}
                        alt={item.title || item.name}
                        className="w-full h-60 sm:h-80 lg:h-96 object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
}


