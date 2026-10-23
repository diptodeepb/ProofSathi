import React, { createContext, useContext, useState, useEffect } from "react";
import { AppLanguage, getMessage, TranslationKey } from "../i18n/messages";
import { api } from "../lib/api";

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
  hasOnboarded: boolean;
  completeOnboarding: (lang: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("proofsathi_language") as AppLanguage;
    return saved && ["en", "hi", "bn"].includes(saved) ? saved : "en";
  });

  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    return localStorage.getItem("proofsathi_onboarded") === "true";
  });

  useEffect(() => {
    localStorage.setItem("proofsathi_language", language);
    document.documentElement.lang = language;
    // Sync with backend asynchronously
    api.setPreferences(language).catch(() => {});
  }, [language]);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
  };

  const completeOnboarding = (lang: AppLanguage) => {
    setLanguageState(lang);
    setHasOnboarded(true);
    localStorage.setItem("proofsathi_onboarded", "true");
    localStorage.setItem("proofsathi_language", lang);
  };

  const t = (key: TranslationKey): string => {
    return getMessage(language, key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, hasOnboarded, completeOnboarding }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
