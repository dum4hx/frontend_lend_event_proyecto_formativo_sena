import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LANGUAGE_TO_LOCALE,
  translate,
  type SupportedLanguage,
  type TranslationKey,
  type TranslationParams,
} from "../i18n/translations";
import { LanguageContext } from "./languageContextDefinition";

const LANGUAGE_STORAGE_KEY = "lendevent_language";

function getBrowserLanguage(): SupportedLanguage {
  // Spanish is the default language for this deployment.
  // Browser language detection is kept for compatibility but always returns "es".
  if (typeof navigator === "undefined") return "es";
  return "es";
}

function getStoredLanguage(): SupportedLanguage {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === "en" || raw === "es") return raw;
  } catch {
    /* ignore */
  }

  return getBrowserLanguage();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(getStoredLanguage);

  const setLanguage = useCallback((nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "es" : "en");
  }, [language, setLanguage]);

  const locale = LANGUAGE_TO_LOCALE[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(language, key, params),
    [language],
  );

  const formatDate = useCallback(
    (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => {
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(locale, options).format(date);
    },
    [locale],
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    [locale],
  );

  const formatCurrency = useCallback(
    (value: number, currency = language === "es" ? "COP" : "USD") => {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: currency === "COP" ? 0 : 2,
      }).format(value);
    },
    [language, locale],
  );

  const contextValue = useMemo(
    () => ({
      language,
      locale,
      setLanguage,
      toggleLanguage,
      t,
      formatDate,
      formatNumber,
      formatCurrency,
    }),
    [formatCurrency, formatDate, formatNumber, language, locale, setLanguage, t, toggleLanguage],
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}
