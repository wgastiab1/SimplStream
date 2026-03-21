import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CastMember } from '../types';
import { tmdbFetch, getTMDBImageUrl } from '../lib/tmdb';
import { useTranslation } from '../context/LanguageContext';


interface CastMemberModalProps {
  castMember: CastMember;
  onClose: () => void;
}


interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  also_known_as: string[];
  combined_credits?: {
    cast: Array<{
      id: number;
      title?: string;
      name?: string;
      poster_path: string | null;
      release_date?: string;
      first_air_date?: string;
      media_type: 'movie' | 'tv';
    }>;
  };
}


export function CastMemberModal({ castMember, onClose }: CastMemberModalProps) {
  const { language, t } = useTranslation();
  const [personDetail, setPersonDetail] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadPersonDetail();
  }, [castMember.id, language]);


  async function loadPersonDetail() {
    try {
      console.log(`[WilStream] Loading bio for ${castMember.name} in language: ${language}`);
      const data = await tmdbFetch(`/person/${castMember.id}?append_to_response=combined_credits`, language);
      setPersonDetail(data);
    } catch (error) {
      console.error('Error loading person detail:', error);
    } finally {
      setLoading(false);
    }
  }


  const calculateAge = (birthday: string | null) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center z-10">
          <h2 className="text-3xl font-bold text-white">{castMember.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
          >
            <X size={24} />
          </button>
        </div>


        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="text-white text-xl">{t('loading')}</div>
          </div>
        ) : personDetail ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-1">
                <img
                  src={getTMDBImageUrl(personDetail.profile_path, 'w500')}
                  alt={personDetail.name}
                  className="w-full rounded-lg shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(personDetail.name)}&background=random&color=fff&size=500`;
                  }}
                />
                <div className="mt-4 space-y-3">
                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-1">{t('knownFor')}</h4>
                    <p className="text-white">{personDetail.known_for_department}</p>
                  </div>
                  {personDetail.birthday && (
                    <div>
                      <h4 className="text-gray-400 text-sm font-medium mb-1">{t('age')}</h4>
                      <p className="text-white">
                        {calculateAge(personDetail.birthday)} {t('yearsOld')}
                        <span className="text-gray-400 text-sm ml-2">
                          ({new Date(personDetail.birthday).toLocaleDateString(language === 'en' ? 'en-US' : language, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })})
                        </span>
                      </p>
                    </div>
                  )}
                  {personDetail.place_of_birth && (
                    <div>
                      <h4 className="text-gray-400 text-sm font-medium mb-1">{t('placeOfBirth')}</h4>
                      <p className="text-white">{personDetail.place_of_birth}</p>
                    </div>
                  )}
                  {personDetail.also_known_as && personDetail.also_known_as.length > 0 && (
                    <div>
                      <h4 className="text-gray-400 text-sm font-medium mb-1">{t('alsoKnownAs')}</h4>
                      <div className="space-y-1">
                        {personDetail.also_known_as.slice(0, 5).map((name, index) => (
                          <p key={index} className="text-white text-sm">{name}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>


              <div className="md:col-span-2 space-y-6">
                {personDetail.biography && (
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">{t('biography')}</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {personDetail.biography}
                    </p>
                  </div>
                )}


                {personDetail.combined_credits && personDetail.combined_credits.cast.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">{t('knownFor')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {personDetail.combined_credits.cast
                        .sort((a, b) => {
                          const dateA = a.release_date || a.first_air_date || '0';
                          const dateB = b.release_date || b.first_air_date || '0';
                          return dateB.localeCompare(dateA);
                        })
                        .slice(0, 12)
                        .map((credit) => (
                          <div key={credit.id} className="group cursor-pointer">
                            <div className="rounded-lg overflow-hidden transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-2xl">
                              <img
                                src={getTMDBImageUrl(credit.poster_path, 'w342')}
                                alt={credit.title || credit.name}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/342x513?text=No+Poster';
                                }}
                              />
                            </div>
                            <div className="mt-2">
                              <p className="text-white text-sm font-medium line-clamp-2">
                                {credit.title || credit.name}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {(credit.release_date || credit.first_air_date || '').slice(0, 4)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">Failed to load cast member details</p>
          </div>
        )}
      </div>
    </div>
  );
}


