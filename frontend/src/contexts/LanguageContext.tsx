'use client';

import React, { createContext, useContext, useSyncExternalStore, useCallback } from 'react';
import { translations, TranslationKey } from '@/i18n/translations';

export type Language = 'vi' | 'en';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (vi: string, en: string) => string;
  tk: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'vi',
  setLanguage: () => {},
  t: (vi) => vi,
  tk: (key) => key,
});

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

function getSnapshot(): Language {
  if (typeof window === 'undefined') return 'vi';
  const saved = localStorage.getItem('sw_language');
  return saved === 'en' ? 'en' : 'vi';
}

function getServerSnapshot(): Language {
  return 'vi';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('sw_language', lang);
    listeners.forEach((listener) => listener());
  }, []);

  const t = useCallback(
    (vi: string, en: string) => (language === 'vi' ? vi : en),
    [language]
  );

  const tk = useCallback(
    (key: TranslationKey): string => {
      const item = translations[key];
      if (!item) return key;
      return item[language] || item.vi || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tk }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}


