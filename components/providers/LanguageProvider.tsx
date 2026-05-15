"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Locale } from "@/lib/translations";
import { translations } from "@/lib/translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("sk");

  useEffect(() => {
    const saved = localStorage.getItem("lexxbrush-locale") as Locale;
    if (saved && (saved === "en" || saved === "sk")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("lexxbrush-locale", newLocale);
  }, []);

  const t = useCallback(
    (path: string): string => {
      const keys = path.split(".");
      let result: unknown = translations[locale];
      for (const key of keys) {
        if (result && typeof result === "object" && key in result) {
          result = (result as Record<string, unknown>)[key];
        } else {
          return path;
        }
      }
      return result as string;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
