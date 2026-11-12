'use client';

import React, { createContext, useContext, useSyncExternalStore, useCallback } from 'react';
import { translations, TranslationKey } from '@/i18n/translations';

export type Language = 'vi' | 'en' | 'zh' | 'ja' | 'ko' | 'fr';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
  short: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'vi', label: 'Tiếng Việt', nativeLabel: 'Tiếng Việt', flag: '🇻🇳', short: 'VI' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', short: 'EN' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳', short: 'ZH' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵', short: 'JA' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷', short: 'KO' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷', short: 'FR' },
];

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  languages: LanguageOption[];
  t: (vi: string, en: string) => string;
  tk: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'vi',
  setLanguage: () => {},
  languages: SUPPORTED_LANGUAGES,
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
  const saved = localStorage.getItem('sw_language') as Language;
  const validLangs: Language[] = ['vi', 'en', 'zh', 'ja', 'ko', 'fr'];
  return validLangs.includes(saved) ? saved : 'vi';
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
    (viText: string, enText: string) => {
      if (language === 'vi') return viText;
      return enText || viText;
    },
    [language]
  );

  const tk = useCallback(
    (key: TranslationKey): string => {
      const item = translations[key];
      if (!item) return key;
      const dict = item as Record<string, string>;
      return dict[language] || dict.en || dict.vi || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: SUPPORTED_LANGUAGES, t, tk }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
