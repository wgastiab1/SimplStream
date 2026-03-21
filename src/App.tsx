import { useState, useEffect, useRef } from 'react';
import { Profile } from './types';
import { ProfileSelector } from './components/ProfileSelector';
import { HomeView } from './components/HomeView';
import { DetailView } from './components/DetailView';
import { PlayerView } from './components/PlayerView';
import { LiveTVView } from './components/LiveTVView';
import { AboutView } from './components/AboutView';
import { TermsView } from './components/TermsView';
import { SurpriseMeView } from './components/SurpriseMeView';
import { StartupAnimation } from './components/StartupAnimation';
import { getProfiles } from './lib/storage';
import { useTranslation } from './context/LanguageContext';
import { getLanguage } from './lib/translations';


type View =
  | { type: 'profiles' }
  | { type: 'home' }
  | { type: 'livetv' }
  | { type: 'about' }
  | { type: 'terms' }
  | { type: 'surprise' }
  | { type: 'detail'; tmdbId: number; mediaType: 'movie' | 'tv' }
  | { type: 'player'; tmdbId: number; mediaType: 'movie' | 'tv' | 'live'; season?: number; episode?: number; embedUrl?: string; channelName?: string };


import { App as CapApp } from '@capacitor/app';
import { registerPlugin, Capacitor } from '@capacitor/core';

const AdBlocker = registerPlugin<any>('AdBlocker');

function App() {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const { setLanguage } = useTranslation();
  const [currentView, setCurrentView] = useState<View>({ type: 'profiles' });
  const [previousView, setPreviousView] = useState<View | null>(null);
  const currentViewRef = useRef(currentView);
  const previousViewRef = useRef(previousView);

  useEffect(() => {
    currentViewRef.current = currentView;
    previousViewRef.current = previousView;
  }, [currentView, previousView]);
  const [showStartup, setShowStartup] = useState(() => {
    const hasSeenStartup = sessionStorage.getItem('WilStream_startup_seen');
    return !hasSeenStartup;
  });


  useEffect(() => {
    console.log('[WilStream] Initializing Back Button Listener');
    const backButtonHandler = CapApp.addListener('backButton', () => {
      const view = currentViewRef.current;
      console.log('[WilStream] Back Button Pressed. View:', view.type);
      
      if (showStartup) {
        CapApp.exitApp();
        return;
      }

      if (view.type === 'profiles') {
        CapApp.exitApp();
        return;
      }

      if (view.type === 'detail' || view.type === 'player' || view.type === 'livetv' || view.type === 'surprise' || view.type === 'about' || view.type === 'terms') {
        handleBack();
      } else if (view.type === 'home') {
        handleLogout();
      }
    });

    const handleNativeBack = () => {
      const view = currentViewRef.current;
      console.log('[WilStream] Native Back Button Event Received. View:', view.type);
      if (view.type === 'profiles') {
        CapApp.exitApp();
      } else if (view.type === 'detail' || view.type === 'player' || view.type === 'livetv' || view.type === 'surprise' || view.type === 'about' || view.type === 'terms') {
        handleBack();
      } else if (view.type === 'home') {
        handleLogout();
      }
    };

    window.addEventListener('nativeBackButton', handleNativeBack);

    return () => {
      backButtonHandler.then(h => h.remove());
      window.removeEventListener('nativeBackButton', handleNativeBack);
    };
  }, [showStartup]);


  useEffect(() => {
    console.log('--- WILSTREAM v1.8.2 LOADED ---');
    if (!showStartup) {
      // alert('DEBUG: WILSTREAM v1.5.0 LOADED');
      sessionStorage.setItem('WilStream_startup_seen', 'true');
    }
  }, [showStartup]);


  useEffect(() => {
    if (currentProfile && Capacitor.isNativePlatform()) {
      const isLiveTV = currentView.type === 'livetv' || (currentView.type === 'player' && currentView.mediaType === 'live');
      const shouldEnableAdBlock = !!currentProfile.ads_removed && !isLiveTV;
      console.log('[WilStream] Syncing AdBlocker status:', shouldEnableAdBlock);
      AdBlocker.setEnabled({ enabled: shouldEnableAdBlock }).catch(() => {});
    }
  }, [currentProfile, currentView]);


  function handleSelectProfile(profile: Profile) {
    setCurrentProfile(profile);
    setLanguage(profile.language || getLanguage());
    setCurrentView({ type: 'home' });
  }


  function handleProfileUpdate() {
    if (currentProfile) {
      const profiles = getProfiles();
      const updated = profiles.find(p => p.id === currentProfile.id);
      if (updated) {
        setCurrentProfile(updated);
      }
    }
  }


  function handleLogout() {
    setCurrentProfile(null);
    setCurrentView({ type: 'profiles' });
    setPreviousView(null);
  }


  function handleShowDetail(tmdbId: number, mediaType: 'movie' | 'tv') {
    setPreviousView(currentView);
    setCurrentView({ type: 'detail', tmdbId, mediaType });
  }


  function handleShowLiveTV() {
    setPreviousView(currentView);
    setCurrentView({ type: 'livetv' });
  }


  function handlePlay(tmdbId: number, mediaType: 'movie' | 'tv' | 'live', season?: number, episode?: number, embedUrl?: string, channelName?: string) {
    setPreviousView(currentView);
    setCurrentView({ type: 'player', tmdbId, mediaType, season, episode, embedUrl, channelName });
  }


  function handleShowAbout() {
    setPreviousView(currentView);
    setCurrentView({ type: 'about' });
  }


  function handleShowTerms() {
    setPreviousView(currentView);
    setCurrentView({ type: 'terms' });
  }


  function handleShowSurprise() {
    setPreviousView(currentView);
    setCurrentView({ type: 'surprise' });
  }


  function handleBack() {
    if (previousView) {
      setCurrentView(previousView);
      setPreviousView(null);
    } else if (currentView.type !== 'home') {
      setCurrentView({ type: 'home' });
    }
  }


  if (showStartup) {
    return <StartupAnimation onComplete={() => setShowStartup(false)} />;
  }


  if (currentView.type === 'profiles') {
    return <ProfileSelector onSelectProfile={handleSelectProfile} />;
  }


  if (!currentProfile) {
    return <ProfileSelector onSelectProfile={handleSelectProfile} />;
  }


  if (currentView.type === 'home') {
    return (
      <HomeView
        profile={currentProfile}
        onLogout={handleLogout}
        onShowDetail={handleShowDetail}
        onShowLiveTV={handleShowLiveTV}
        onProfileUpdate={handleProfileUpdate}
        onShowAbout={handleShowAbout}
        onShowTerms={handleShowTerms}
        onShowSurprise={handleShowSurprise}
      />
    );
  }


  if (currentView.type === 'surprise') {
    return (
      <SurpriseMeView
        profile={currentProfile}
        onBack={handleBack}
        onShowDetail={handleShowDetail}
      />
    );
  }


  if (currentView.type === 'about') {
    return <AboutView onBack={handleBack} />;
  }


  if (currentView.type === 'terms') {
    return <TermsView onBack={handleBack} />;
  }


  if (currentView.type === 'livetv') {
    return (
      <LiveTVView
        profile={currentProfile}
        onBack={handleBack}
        onPlay={handlePlay}
      />
    );
  }


  if (currentView.type === 'detail') {
    return (
      <DetailView
        profile={currentProfile}
        tmdbId={currentView.tmdbId}
        mediaType={currentView.mediaType}
        onBack={handleBack}
        onPlay={handlePlay}
        onShowDetail={handleShowDetail}
      />
    );
  }


  if (currentView.type === 'player') {
    return (
      <PlayerView
        profile={currentProfile}
        tmdbId={currentView.tmdbId}
        mediaType={currentView.mediaType}
        season={currentView.season}
        episode={currentView.episode}
        embedUrl={currentView.embedUrl}
        channelName={currentView.channelName}
        onBack={handleBack}
        onPlay={handlePlay}
        onProfileUpdate={handleProfileUpdate}
      />
    );
  }


  return null;
}


export default App;


