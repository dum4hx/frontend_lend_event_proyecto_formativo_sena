import { useContext } from "react";
import { LanguageContext } from "./languageContextDefinition";

export function useLanguage() {
  return useContext(LanguageContext);
}