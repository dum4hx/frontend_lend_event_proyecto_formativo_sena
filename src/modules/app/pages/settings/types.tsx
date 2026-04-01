import { Bell, Palette, Shield, UserCircle2 } from "lucide-react";
import type { TranslationKey } from "../../../../i18n/translations";
import type { SupportedLanguage } from "../../../../i18n/translations";

// ─── Module types ────────────────────────────────────────────────────────────

export type SettingsModuleId = "notifications" | "security" | "appearance" | "account";
export type AccountField = "name" | "email" | "phone" | "legalName" | "taxId";

export interface SettingsPreferences {
  notifications: {
    emailEvents: boolean;
    emailBilling: boolean;
    inAppAlerts: boolean;
    weeklySummary: boolean;
  };
  security: {
    requireMfa: boolean;
    sessionTimeoutMinutes: number;
    loginAlerts: boolean;
  };
  appearance: {
    compactMode: boolean;
    showAnimations: boolean;
    highContrast: boolean;
  };
}

export interface SettingModule {
  id: SettingsModuleId;
  categoryKey: TranslationKey;
  icon: React.ReactNode;
  descriptionKey: TranslationKey;
  requiredPermissions: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const SETTINGS_STORAGE_KEY = "app_settings_preferences_v1";
export const ACTIVE_MODULE_STORAGE_KEY = "app_settings_active_module_v1";
export const LANGUAGE_OPTIONS: SupportedLanguage[] = ["es", "en"];

export const DEFAULT_PREFERENCES: SettingsPreferences = {
  notifications: {
    emailEvents: true,
    emailBilling: true,
    inAppAlerts: true,
    weeklySummary: false,
  },
  security: {
    requireMfa: false,
    sessionTimeoutMinutes: 60,
    loginAlerts: true,
  },
  appearance: {
    compactMode: false,
    showAnimations: true,
    highContrast: false,
  },
};

export const SETTING_MODULES: SettingModule[] = [
  {
    id: "notifications",
    categoryKey: "settings.module.notifications",
    icon: <Bell size={28} />,
    descriptionKey: "settings.module.notificationsDescription",
    requiredPermissions: ["organization:read"],
  },
  {
    id: "security",
    categoryKey: "settings.module.security",
    icon: <Shield size={28} />,
    descriptionKey: "settings.module.securityDescription",
    requiredPermissions: ["users:update", "roles:update", "organization:update"],
  },
  {
    id: "appearance",
    categoryKey: "settings.module.appearance",
    icon: <Palette size={28} />,
    descriptionKey: "settings.module.appearanceDescription",
    requiredPermissions: ["organization:read"],
  },
  {
    id: "account",
    categoryKey: "settings.module.account",
    icon: <UserCircle2 size={28} />,
    descriptionKey: "settings.module.accountDescription",
    requiredPermissions: ["organization:update"],
  },
];
