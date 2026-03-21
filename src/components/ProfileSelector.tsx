import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Profile } from '../types';
import { getProfiles, saveProfile, generateId } from '../lib/storage';
import { useTranslation } from '../context/LanguageContext';


interface ProfileSelectorProps {
  onSelectProfile: (profile: Profile) => void;
}


const AVATAR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#06B6D4', '#F43F5E', '#22C55E', '#EAB308', '#A855F7',
  '#EC407A'
];


export function ProfileSelector({ onSelectProfile }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { t, language } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileColor, setNewProfileColor] = useState(AVATAR_COLORS[0]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [securityWordInput, setSecurityWordInput] = useState('');


  useEffect(() => {
    loadProfiles();
  }, []);


  function loadProfiles() {
    const loadedProfiles = getProfiles();
    setProfiles(loadedProfiles);
  }


  function createProfile() {
    if (!newProfileName.trim()) return;


    const newProfile: Profile = {
      id: generateId(),
      name: newProfileName.trim(),
      avatar_color: newProfileColor,
      language: language,
      created_at: new Date().toISOString()
    };


    saveProfile(newProfile);
    setProfiles([...profiles, newProfile]);
    setNewProfileName('');
    setNewProfileColor(AVATAR_COLORS[0]);
    setIsCreating(false);
    showAlert(t('profileCreated'));
  }


  function handleProfileClick(profile: Profile) {
    if (profile.pin) {
      setSelectedProfile(profile);
      setPinInput('');
      setPinError(false);
      setShowForgotPin(false);
    } else {
      onSelectProfile(profile);
    }
  }


  function handlePinSubmit() {
    if (!selectedProfile) return;


    if (pinInput === selectedProfile.pin) {
      onSelectProfile(selectedProfile);
    } else {
      setPinError(true);
      setShowForgotPin(true);
    }
  }


  function handleForgotPin() {
    if (!selectedProfile || !securityWordInput) return;


    if (securityWordInput === selectedProfile.security_word) {
      showAlert(`${t('yourPasscodeIs')}${selectedProfile.pin}`);
      setShowForgotPin(false);
      setSecurityWordInput('');
    } else {
      showAlert(t('invalidSecurityWord'));
    }
  }


  function showAlert(message: string) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed top-4 right-4 z-[100] bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl animate-fade-in';
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
      alertDiv.remove();
    }, 2000);
  }


  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-black">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-80 scale-105"
        style={{ backgroundImage: 'url("/profile_bg.png")' }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>


       {selectedProfile && selectedProfile.pin ? (
        <div className="relative z-10 bg-black/40 backdrop-blur-lg p-8 rounded-xl border border-white/10 max-w-md w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{t('enterPasscodeFor')} {selectedProfile.name}</h2>
            <button
              onClick={() => setSelectedProfile(null)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <input
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setPinInput(value);
              setPinError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
            placeholder={t('enterPasscode')}
            className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border ${
              pinError ? 'border-red-500' : 'border-gray-700'
            } text-white text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4`}
            autoFocus
          />
          {pinError && (
            <p className="text-red-500 text-sm mb-2">{t('incorrectPasscode')}</p>
          )}
          <button
            onClick={handlePinSubmit}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mb-4"
          >
            {t('submit')}
          </button>
          {showForgotPin && (
            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">{t('forgotPasscode')}</h3>
              <p className="text-gray-300 text-sm mb-3">
                {t('forgotPasscodeText')}
              </p>
              <input
                type="text"
                value={securityWordInput}
                onChange={(e) => setSecurityWordInput(e.target.value)}
                placeholder={t('enterSecurityWordSimple')}
                className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-3"
              />
              <button
                onClick={handleForgotPin}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('recoverPasscode')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold text-white mb-12">{t('whosWatching')}</h1>


          <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileClick(profile)}
                className="flex flex-col items-center gap-4 group cursor-pointer transition-transform hover:scale-110"
              >
                <div
                  className="w-32 h-32 rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-2xl group-hover:shadow-blue-500/50 transition-all border-4 border-transparent group-hover:border-white"
                  style={{ backgroundColor: profile.avatar_color }}
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-xl font-medium group-hover:text-blue-300 transition-colors">
                  {profile.name}
                </span>
              </button>
            ))}


            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex flex-col items-center gap-4 group cursor-pointer transition-transform hover:scale-110"
              >
                <div className="w-32 h-32 rounded-lg flex items-center justify-center bg-gray-800/50 backdrop-blur-sm text-white shadow-2xl group-hover:shadow-blue-500/50 transition-all border-4 border-dashed border-gray-600 group-hover:border-white">
                  <Plus size={48} />
                </div>
                <span className="text-white text-xl font-medium group-hover:text-blue-300 transition-colors">
                  {t('addProfile')}
                </span>
              </button>
            )}
          </div>


           {isCreating && (
            <div className="mt-12 max-w-md mx-auto bg-black/40 backdrop-blur-lg p-8 rounded-xl border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">{t('createProfile')}</h2>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createProfile()}
                placeholder={t('profileNamePlaceholder')}
                className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4"
                autoFocus
              />
              <div className="mb-4">
                <label className="text-white text-sm mb-2 block">{t('chooseProfileColor')}</label>
                <div className="grid grid-cols-8 gap-2 mb-3">
                  {AVATAR_COLORS.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setNewProfileColor(color)}
                      className={`w-10 h-10 rounded-lg transition-all ${newProfileColor === color ? 'ring-4 ring-white scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newProfileColor}
                    onChange={(e) => setNewProfileColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-700"
                  />
                  <span className="text-gray-400 text-sm">{t('orPickCustomColor')}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={createProfile}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t('createProfile')}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewProfileName('');
                    setNewProfileColor(AVATAR_COLORS[0]);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


