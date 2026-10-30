'use client';

import React, { createContext, useContext, useState } from 'react';
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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Lazy initializer: đọc localStorage một lần khi component mount (tránh gọi setState trong effect)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sw_language');
      if (saved === 'vi' || saved === 'en') return saved;
    }
    return 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sw_language', lang);
  };

  const t = (vi: string, en: string) => (language === 'vi' ? vi : en);

  const tk = (key: TranslationKey): string => {
    const item = translations[key];
    if (!item) return key;
    return item[language] || item.vi || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tk }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

