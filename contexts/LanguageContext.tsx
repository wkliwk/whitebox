"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Locale, type TranslationKey } from "@/lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => translations.en[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("wb-locale") as Locale | null;
      if (stored === "en" || stored === "zh-HK") setLocaleState(stored);
    } catch { /* SSR safety */ }
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    try { localStorage.setItem("wb-locale", l); } catch { /* SSR safety */ }
  }

  function t(key: TranslationKey): string {
    return translations[locale][key] ?? translations.en[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
