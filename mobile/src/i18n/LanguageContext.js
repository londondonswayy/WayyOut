import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

const STORAGE_KEY = 'wayyout_lang';

function detectDeviceLang() {
  try {
    // expo-localization (if installed)
    const Localization = require('expo-localization');
    const locale = Localization.getLocales?.()[0]?.languageCode
      || Localization.locale;
    return locale?.startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

const LanguageContext = createContext({ lang: 'en', t: (key) => key, switchLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'fr') {
        setLang(stored);
      } else {
        setLang(detectDeviceLang());
      }
    });
  }, []);

  const t = (key, vars) => {
    const str = translations[lang]?.[key] ?? translations.en[key] ?? key;
    if (!vars) return str;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), str);
  };

  const switchLang = async (l) => {
    setLang(l);
    await AsyncStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, switchLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
