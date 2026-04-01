import { Languages, Moon, Sun } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useTheme } from "../../../../contexts/useTheme";
import { normalizePhoneInput, normalizeTaxIdInput } from "./helpers";
import ToggleRow from "./ToggleRow";
import { LANGUAGE_OPTIONS } from "./types";
import type { SettingsModuleId, SettingsPreferences, AccountField } from "./types";

interface OrgData {
  name: string;
  email: string;
  phone: string;
  legalName: string;
  taxId: string;
}

interface SettingsModulePanelProps {
  /** Which module is active. */
  activeModule: SettingsModuleId;
  /** Whether the user has access to the active module. */
  hasAccess: boolean;
  /** Current preferences state. */
  preferences: SettingsPreferences;
  /** Setter for preferences (partial update via callback). */
  onPreferencesChange: React.Dispatch<React.SetStateAction<SettingsPreferences>>;
  /** Current organization data. */
  orgData: OrgData;
  /** Setter for organization data. */
  onOrgDataChange: React.Dispatch<React.SetStateAction<OrgData>>;
  /** Field-level touched state for account module. */
  accountTouched: Partial<Record<AccountField, boolean>>;
  /** Setter for account touched state. */
  onAccountTouchedChange: React.Dispatch<
    React.SetStateAction<Partial<Record<AccountField, boolean>>>
  >;
  /** Per-field validation errors for the account module. */
  accountErrors: Partial<Record<AccountField, string>>;
}

export default function SettingsModulePanel({
  activeModule,
  hasAccess,
  preferences,
  onPreferencesChange,
  orgData,
  onOrgDataChange,
  accountTouched,
  onAccountTouchedChange,
  accountErrors,
}: SettingsModulePanelProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  if (!hasAccess) {
    return (
      <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
        <h2 className="text-xl font-semibold text-white mb-2">{t("settings.noAccessTitle")}</h2>
        <p className="text-gray-400 text-sm">{t("settings.noAccessDescription")}</p>
      </div>
    );
  }

  if (activeModule === "notifications") {
    return (
      <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">{t("settings.notifications.title")}</h2>
        <p className="text-gray-400 text-sm">{t("settings.notifications.description")}</p>

        <ToggleRow
          label={t("settings.notifications.emailEvents")}
          checked={preferences.notifications.emailEvents}
          onChange={(value) =>
            onPreferencesChange((prev) => ({
              ...prev,
              notifications: { ...prev.notifications, emailEvents: value },
            }))
          }
        />
        <ToggleRow
          label={t("settings.notifications.emailBilling")}
          checked={preferences.notifications.emailBilling}
          onChange={(value) =>
            onPreferencesChange((prev) => ({
              ...prev,
              notifications: { ...prev.notifications, emailBilling: value },
            }))
          }
        />
        <ToggleRow
          label={t("settings.notifications.inAppAlerts")}
          checked={preferences.notifications.inAppAlerts}
          onChange={(value) =>
            onPreferencesChange((prev) => ({
              ...prev,
              notifications: { ...prev.notifications, inAppAlerts: value },
            }))
          }
        />
        <ToggleRow
          label={t("settings.notifications.weeklySummary")}
          checked={preferences.notifications.weeklySummary}
          onChange={(value) =>
            onPreferencesChange((prev) => ({
              ...prev,
              notifications: { ...prev.notifications, weeklySummary: value },
            }))
          }
        />
      </div>
    );
  }

  if (activeModule === "security") {
    return (
      <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">{t("settings.security.title")}</h2>
        <p className="text-gray-400 text-sm">{t("settings.security.description")}</p>

        <ToggleRow
          label={t("settings.security.requireMfa")}
          checked={preferences.security.requireMfa}
          onChange={(value) =>
            onPreferencesChange((prev) => ({
              ...prev,
              security: { ...prev.security, requireMfa: value },
            }))
          }
        />

        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <label className="block text-gray-300 text-sm mb-2">
            {t("settings.security.sessionTimeout")}
          </label>
          <input
            type="number"
            min={15}
            max={480}
            value={preferences.security.sessionTimeoutMinutes}
            onChange={(e) =>
              onPreferencesChange((prev) => ({
                ...prev,
                security: {
                  ...prev.security,
                  sessionTimeoutMinutes: Math.max(15, Number(e.target.value) || 15),
                },
              }))
            }
            className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
          />
        </div>

        <ToggleRow
          label={t("settings.security.loginAlerts")}
          checked={preferences.security.loginAlerts}
          onChange={(value) =>
            onPreferencesChange((prev) => ({
              ...prev,
              security: { ...prev.security, loginAlerts: value },
            }))
          }
        />
      </div>
    );
  }

  if (activeModule === "appearance") {
    return (
      <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">{t("settings.appearance.title")}</h2>
        <p className="text-gray-400 text-sm">{t("settings.appearance.description")}</p>

        {/* Theme toggle */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <p className="text-gray-200 mb-3 text-sm font-medium">
            {t("settings.appearance.interfaceTheme")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                theme === "dark"
                  ? "border-[#FFD700] bg-[rgba(255,215,0,0.1)] text-[#FFD700]"
                  : "border-[#333] text-gray-400 hover:border-[#FFD700]/50"
              }`}
            >
              <Moon size={15} />
              {t("common.dark")}
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                theme === "light"
                  ? "border-[#FFD700] bg-[rgba(255,215,0,0.1)] text-[#FFD700]"
                  : "border-[#333] text-gray-400 hover:border-[#FFD700]/50"
              }`}
            >
              <Sun size={15} />
              {t("common.light")}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {t("settings.appearance.appliedImmediately")}
          </p>
        </div>

        {/* Language selector */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-200 mb-3 text-sm font-medium">
            <Languages size={16} className="text-[#FFD700]" />
            <span>{t("settings.appearance.languageTitle")}</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {t("settings.appearance.languageDescription")}
          </p>
          <div className="flex gap-3 flex-wrap">
            {LANGUAGE_OPTIONS.map((option) => {
              const isActive = language === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLanguage(option)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                    isActive
                      ? "border-[#FFD700] bg-[rgba(255,215,0,0.1)] text-[#FFD700]"
                      : "border-[#333] text-gray-400 hover:border-[#FFD700]/50"
                  }`}
                >
                  {option === "es" ? t("common.spanish") : t("common.english")}
                </button>
              );
            })}
          </div>
        </div>

        <ToggleRow
          label={t("settings.appearance.compactMode")}
          checked={preferences.appearance.compactMode}
          onChange={(value) =>
            onPreferencesChange((prev) => ({
              ...prev,
              appearance: { ...prev.appearance, compactMode: value },
            }))
          }
        />
        <ToggleRow
          label={t("settings.appearance.showAnimations")}
          checked={preferences.appearance.showAnimations}
          onChange={(value) =>
            onPreferencesChange((prev) => ({
              ...prev,
              appearance: { ...prev.appearance, showAnimations: value },
            }))
          }
        />
        <ToggleRow
          label={t("settings.appearance.highContrast")}
          checked={preferences.appearance.highContrast}
          onChange={(value) =>
            onPreferencesChange((prev) => ({
              ...prev,
              appearance: { ...prev.appearance, highContrast: value },
            }))
          }
        />
      </div>
    );
  }

  // Account module
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {t("settings.account.organizationInfo")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.organizationName")}
            </label>
            <input
              type="text"
              value={orgData.name}
              onChange={(e) => onOrgDataChange((prev) => ({ ...prev, name: e.target.value }))}
              onBlur={() => onAccountTouchedChange((prev) => ({ ...prev, name: true }))}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                accountTouched.name && accountErrors.name ? "border-red-500" : "border-[#333]"
              }`}
              placeholder={t("settings.account.organizationPlaceholder")}
            />
            {accountTouched.name && accountErrors.name && (
              <p className="text-red-400 text-xs mt-1">{accountErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.legalName")}
            </label>
            <input
              type="text"
              value={orgData.legalName}
              onChange={(e) => onOrgDataChange((prev) => ({ ...prev, legalName: e.target.value }))}
              onBlur={() => onAccountTouchedChange((prev) => ({ ...prev, legalName: true }))}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                accountTouched.legalName && accountErrors.legalName
                  ? "border-red-500"
                  : "border-[#333]"
              }`}
              placeholder={t("settings.account.legalNamePlaceholder")}
            />
            {accountTouched.legalName && accountErrors.legalName && (
              <p className="text-red-400 text-xs mt-1">{accountErrors.legalName}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.taxId")}
            </label>
            <input
              type="text"
              value={orgData.taxId}
              onChange={(e) =>
                onOrgDataChange((prev) => ({
                  ...prev,
                  taxId: normalizeTaxIdInput(e.target.value),
                }))
              }
              onBlur={() => onAccountTouchedChange((prev) => ({ ...prev, taxId: true }))}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                accountTouched.taxId && accountErrors.taxId ? "border-red-500" : "border-[#333]"
              }`}
              placeholder={t("settings.account.taxIdPlaceholder")}
            />
            <p className="text-gray-500 text-xs mt-1">{t("settings.account.taxIdHelp")}</p>
            {accountTouched.taxId && accountErrors.taxId && (
              <p className="text-red-400 text-xs mt-1">{accountErrors.taxId}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {t("settings.account.contactInfo")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.email")}
            </label>
            <input
              type="email"
              value={orgData.email}
              onChange={(e) => onOrgDataChange((prev) => ({ ...prev, email: e.target.value }))}
              onBlur={() => onAccountTouchedChange((prev) => ({ ...prev, email: true }))}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                accountTouched.email && accountErrors.email ? "border-red-500" : "border-[#333]"
              }`}
              placeholder={t("settings.account.emailPlaceholder")}
            />
            {accountTouched.email && accountErrors.email && (
              <p className="text-red-400 text-xs mt-1">{accountErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.phone")}
            </label>
            <input
              type="tel"
              value={orgData.phone}
              onChange={(e) =>
                onOrgDataChange((prev) => ({
                  ...prev,
                  phone: normalizePhoneInput(e.target.value),
                }))
              }
              onBlur={() => onAccountTouchedChange((prev) => ({ ...prev, phone: true }))}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                accountTouched.phone && accountErrors.phone ? "border-red-500" : "border-[#333]"
              }`}
              placeholder={t("settings.account.phonePlaceholder")}
            />
            {accountTouched.phone && accountErrors.phone && (
              <p className="text-red-400 text-xs mt-1">{accountErrors.phone}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
