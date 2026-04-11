import { createContext } from "react";
import {
  LANGUAGE_TO_LOCALE,
  translate,
  type SupportedLanguage,
  type TranslateFunction,
} from "../i18n/translations";

export interface LanguageContextValue {
  language: SupportedLanguage;
  locale: string;
  setLanguage: (language: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: TranslateFunction;
  formatDate: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
}

const DEFAULT_LANGUAGE: SupportedLanguage = "es";
const DEFAULT_LOCALE = LANGUAGE_TO_LOCALE[DEFAULT_LANGUAGE];

export const defaultLanguageContextValue: LanguageContextValue = {
  language: DEFAULT_LANGUAGE,
  locale: DEFAULT_LOCALE,
  setLanguage: () => undefined,
  toggleLanguage: () => undefined,
  t: (key, params) => translate(DEFAULT_LANGUAGE, key, params),
  formatDate: (value, options) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(date);
  },
  formatNumber: (value, options) => new Intl.NumberFormat(DEFAULT_LOCALE, options).format(value),
  formatCurrency: (value, currency = "USD") => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "COP" ? 0 : 2,
    }).format(value);
  },
};

export const LanguageContext = createContext<LanguageContextValue>(defaultLanguageContextValue);
