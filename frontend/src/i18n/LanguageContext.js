import React, { createContext, useContext, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

function detectBrowserLang() {
  const nav = navigator.language || navigator.userLanguage || 'en';
  return nav.startsWith('fr') ? 'fr' : 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('wayyout_lang') || detectBrowserLang();
  });

  const t = (key, vars) => {
    const str = translations[lang]?.[key] ?? translations.en[key] ?? key;
    if (!vars) return str;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), str);
  };

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('wayyout_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, switchLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
