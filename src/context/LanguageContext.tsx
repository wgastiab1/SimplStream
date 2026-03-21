
import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, getLanguage } from '../lib/translations';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  t: (key: keyof typeof translations['en']) => string;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    setLanguageState(getLanguage());
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: keyof typeof translations['en']) => {
    const translation = translations[language] as any;
    const fallback = translations['en'] as any;
    return translation[key] || fallback[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
