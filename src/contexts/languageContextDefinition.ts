import { createContext } from "react";
import type {
  SupportedLanguage,
  TranslateFunction,
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

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);