import { DEFAULT_PREFERENCES, SETTINGS_STORAGE_KEY } from "./types";
import type { SettingsPreferences } from "./types";

export function cloneDefaultPreferences(): SettingsPreferences {
  return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES)) as SettingsPreferences;
}

export function arePreferencesEqual(a: SettingsPreferences, b: SettingsPreferences): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function loadPreferences(): SettingsPreferences {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return cloneDefaultPreferences();
    return {
      ...cloneDefaultPreferences(),
      ...(JSON.parse(raw) as Partial<SettingsPreferences>),
    };
  } catch {
    return cloneDefaultPreferences();
  }
}

export function normalizePhoneInput(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return "";

  const withoutCountry = digitsOnly.startsWith("57") ? digitsOnly.slice(2) : digitsOnly;
  const localDigits = withoutCountry.slice(0, 10);
  return `+57${localDigits}`;
}

export function normalizeTaxIdInput(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "").slice(0, 11);
  if (digitsOnly.length <= 1) return digitsOnly;

  return `${digitsOnly.slice(0, -1)}-${digitsOnly.slice(-1)}`;
}
