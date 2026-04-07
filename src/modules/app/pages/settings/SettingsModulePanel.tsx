import { useState } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useAuth } from "../../../../contexts/useAuth";
import { useTheme } from "../../../../contexts/useTheme";
import { AlertCard } from "../../../../components/ui";
import { normalizePhoneInput, normalizeTaxIdInput } from "./helpers";
import ToggleRow from "./ToggleRow";
import { LANGUAGE_OPTIONS } from "./types";
import type { SettingsModuleId, SettingsPreferences, AccountField, OrgProfileField } from "./types";

import type { OrganizationSettings } from "../../../../types/api";

// ─── Appearance sub-panel ─────────────────────────────────────────────────

interface AppearancePanelProps {
  preferences: SettingsPreferences;
  onPreferencesChange: React.Dispatch<React.SetStateAction<SettingsPreferences>>;
}

function AppearancePanel({ preferences, onPreferencesChange }: AppearancePanelProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [showLightModeNotice, setShowLightModeNotice] = useState(false);

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
          {/* Light mode — upcoming feature */}
          <button
            type="button"
            onClick={() => setShowLightModeNotice(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition border-dashed border-[#555] text-gray-600 hover:border-gray-500 hover:text-gray-500 cursor-not-allowed"
            aria-disabled="true"
          >
            <Sun size={15} />
            {t("common.light")}
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">{t("settings.appearance.appliedImmediately")}</p>
      </div>

      {/* Upcoming feature notice */}
      {showLightModeNotice && (
        <AlertCard
          type="info"
          title={t("settings.appearance.lightModeUpcomingTitle")}
          message={t("settings.appearance.lightModeUpcomingMessage")}
          onDismiss={() => setShowLightModeNotice(false)}
        />
      )}

      {/* Language selector */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-200 mb-3 text-sm font-medium">
          <Languages size={16} className="text-[#FFD700]" />
          <span>{t("settings.appearance.languageTitle")}</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">{t("settings.appearance.languageDescription")}</p>
        <div className="flex gap-3 flex-wrap">
          {LANGUAGE_OPTIONS.map((option) => {
            {
              /*
              [DESHABILITADO] El botón del idioma inglés está comentado.
              El español es el único idioma de visualización soportado en este despliegue.
              La compatibilidad con inglés se mantiene completamente en el sistema de
              traducciones — para reactivar el botón, eliminar el bloque `if` a continuación.
            */
            }
            if (option === "en") return null;
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

interface OrgData {
  name: string;
  email: string;
  phone: string;
  legalName: string;
  taxId: string;
}

interface UserData {
  firstName: string;
  secondName: string;
  firstSurname: string;
  secondSurname: string;
  email: string;
  phone: string;
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
  /** Current user profile data (Account panel). */
  userData: UserData;
  /** Setter for user profile data. */
  onUserDataChange: React.Dispatch<React.SetStateAction<UserData>>;
  /** Field-level touched state for user profile fields. */
  userTouched: Partial<Record<AccountField, boolean>>;
  /** Setter for user profile touched state. */
  onUserTouchedChange: React.Dispatch<React.SetStateAction<Partial<Record<AccountField, boolean>>>>;
  /** Per-field validation errors for user profile. */
  accountErrors: Partial<Record<AccountField, string>>;
  /** Current organization data (Organization panel). */
  orgData: OrgData;
  /** Setter for organization data. */
  onOrgDataChange: React.Dispatch<React.SetStateAction<OrgData>>;
  /** Field-level touched state for org profile fields. */
  orgProfileTouched: Partial<Record<OrgProfileField, boolean>>;
  /** Setter for org profile touched state. */
  onOrgProfileTouchedChange: React.Dispatch<React.SetStateAction<Partial<Record<OrgProfileField, boolean>>>>;
  /** Per-field validation errors for org profile. */
  orgProfileErrors: Partial<Record<OrgProfileField, string>>;
  /** Current organization settings from the API. */
  orgSettings: OrganizationSettings | null;
  /** Whether organization settings are loading. */
  orgSettingsLoading: boolean;
  /** Setter for organization settings (partial update via callback). */
  onOrgSettingsChange: React.Dispatch<React.SetStateAction<OrganizationSettings | null>>;
  /** Whether the user holds the organization:update permission. */
  canEditOrganization: boolean;
  /** Whether the user can edit their own profile (users:update). */
  canEditAccount: boolean;
}

export default function SettingsModulePanel({
  activeModule,
  hasAccess,
  preferences,
  onPreferencesChange,
  userData,
  onUserDataChange,
  userTouched,
  onUserTouchedChange,
  accountErrors,
  orgData,
  onOrgDataChange,
  orgProfileTouched,
  onOrgProfileTouchedChange,
  orgProfileErrors,
  orgSettings,
  orgSettingsLoading,
  onOrgSettingsChange,
  canEditOrganization,
  canEditAccount,
}: SettingsModulePanelProps) {
  const { t } = useLanguage();

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
    return <AppearancePanel preferences={preferences} onPreferencesChange={onPreferencesChange} />;
  }

  if (activeModule === "organization") {
    return (
      <div className="space-y-6" data-help-id="org-settings-panel">
        {/* ─── Organization profile ─────────────────────────────────── */}
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">{t("settings.organization.title")}</h2>
          <p className="text-gray-400 text-sm">{t("settings.organization.description")}</p>

          {!canEditOrganization && (
            <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3">
              <span className="text-yellow-400 mt-0.5" aria-hidden="true">⚠</span>
              <p className="text-yellow-200 text-sm">{t("settings.organization.readOnlyNotice")}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization name */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                {t("settings.account.organizationName")}
              </label>
              <input
                type="text"
                value={orgData.name}
                onChange={(e) => onOrgDataChange((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => onOrgProfileTouchedChange((prev) => ({ ...prev, name: true }))}
                disabled={!canEditOrganization}
                className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                  orgProfileTouched.name && orgProfileErrors.name ? "border-red-500" : "border-[#333]"
                } ${!canEditOrganization ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder={t("settings.account.organizationPlaceholder")}
              />
              {orgProfileTouched.name && orgProfileErrors.name && (
                <p className="text-red-400 text-xs mt-1">{orgProfileErrors.name}</p>
              )}
            </div>

            {/* Legal name */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                {t("settings.account.legalName")}
              </label>
              <input
                type="text"
                value={orgData.legalName}
                onChange={(e) => onOrgDataChange((prev) => ({ ...prev, legalName: e.target.value }))}
                onBlur={() => onOrgProfileTouchedChange((prev) => ({ ...prev, legalName: true }))}
                disabled={!canEditOrganization}
                className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                  orgProfileTouched.legalName && orgProfileErrors.legalName ? "border-red-500" : "border-[#333]"
                } ${!canEditOrganization ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder={t("settings.account.legalNamePlaceholder")}
              />
              {orgProfileTouched.legalName && orgProfileErrors.legalName && (
                <p className="text-red-400 text-xs mt-1">{orgProfileErrors.legalName}</p>
              )}
            </div>

            {/* Tax ID */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                {t("settings.account.taxId")}
              </label>
              <input
                type="text"
                value={orgData.taxId}
                onChange={(e) =>
                  onOrgDataChange((prev) => ({ ...prev, taxId: normalizeTaxIdInput(e.target.value) }))
                }
                onBlur={() => onOrgProfileTouchedChange((prev) => ({ ...prev, taxId: true }))}
                disabled={!canEditOrganization}
                className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                  orgProfileTouched.taxId && orgProfileErrors.taxId ? "border-red-500" : "border-[#333]"
                } ${!canEditOrganization ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder={t("settings.account.taxIdPlaceholder")}
              />
              <p className="text-gray-500 text-xs mt-1">{t("settings.account.taxIdHelp")}</p>
              {orgProfileTouched.taxId && orgProfileErrors.taxId && (
                <p className="text-red-400 text-xs mt-1">{orgProfileErrors.taxId}</p>
              )}
            </div>

            {/* Contact email */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                {t("settings.account.email")}
              </label>
              <input
                type="email"
                value={orgData.email}
                onChange={(e) => onOrgDataChange((prev) => ({ ...prev, email: e.target.value }))}
                onBlur={() => onOrgProfileTouchedChange((prev) => ({ ...prev, email: true }))}
                disabled={!canEditOrganization}
                className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                  orgProfileTouched.email && orgProfileErrors.email ? "border-red-500" : "border-[#333]"
                } ${!canEditOrganization ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder={t("settings.account.emailPlaceholder")}
              />
              {orgProfileTouched.email && orgProfileErrors.email && (
                <p className="text-red-400 text-xs mt-1">{orgProfileErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm font-medium mb-2">
                {t("settings.account.phone")}
              </label>
              <input
                type="tel"
                value={orgData.phone}
                onChange={(e) =>
                  onOrgDataChange((prev) => ({ ...prev, phone: normalizePhoneInput(e.target.value) }))
                }
                onBlur={() => onOrgProfileTouchedChange((prev) => ({ ...prev, phone: true }))}
                disabled={!canEditOrganization}
                className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                  orgProfileTouched.phone && orgProfileErrors.phone ? "border-red-500" : "border-[#333]"
                } ${!canEditOrganization ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder={t("settings.account.phonePlaceholder")}
              />
              {orgProfileTouched.phone && orgProfileErrors.phone && (
                <p className="text-red-400 text-xs mt-1">{orgProfileErrors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Organization policies ────────────────────────────────── */}
        {orgSettingsLoading ? (
          <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 space-y-4">
            <div className="h-6 bg-[#1a1a1a] rounded w-1/3 animate-pulse" />
            <div className="h-14 bg-[#1a1a1a] rounded animate-pulse" />
            <div className="h-14 bg-[#1a1a1a] rounded animate-pulse" />
          </div>
        ) : orgSettings ? (
          <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {t("settings.organization.policiesTitle")}
            </h3>

            <div
              className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4"
              data-help-id="org-damage-due-days"
            >
              <label className="block text-gray-300 text-sm mb-2">
                {t("settings.organization.damageDueDaysLabel")}
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={orgSettings.damageDueDays}
                disabled={!canEditOrganization}
                onChange={(e) => {
                  const value = Math.min(365, Math.max(1, Number(e.target.value) || 1));
                  onOrgSettingsChange((prev) => (prev ? { ...prev, damageDueDays: value } : prev));
                }}
                className={`w-full px-4 py-2 bg-[#121212] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700] ${
                  !canEditOrganization ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
              <p className="text-gray-500 text-xs mt-1">
                {t("settings.organization.damageDueDaysHelp")}
              </p>
            </div>

            <ToggleRow
              label={t("settings.organization.requireFullPaymentLabel")}
              checked={orgSettings.requireFullPaymentBeforeCheckout}
              disabled={!canEditOrganization}
              onChange={(value) =>
                onOrgSettingsChange((prev) =>
                  prev ? { ...prev, requireFullPaymentBeforeCheckout: value } : prev,
                )
              }
            />
            <p className="text-gray-500 text-xs -mt-2 px-4">
              {t("settings.organization.requireFullPaymentHelp")}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  // Account module — user profile
  return (
    <AccountModulePanel
      canEditAccount={canEditAccount}
      userData={userData}
      onUserDataChange={onUserDataChange}
      userTouched={userTouched}
      onUserTouchedChange={onUserTouchedChange}
      accountErrors={accountErrors}
      t={t}
    />
  );
}

interface AccountModulePanelProps {
  canEditAccount: boolean;
  userData: UserData;
  onUserDataChange: React.Dispatch<React.SetStateAction<UserData>>;
  userTouched: Partial<Record<AccountField, boolean>>;
  onUserTouchedChange: React.Dispatch<React.SetStateAction<Partial<Record<AccountField, boolean>>>>;
  accountErrors: Partial<Record<AccountField, string>>;
  t: (key: string) => string;
}

function AccountModulePanel({
  canEditAccount,
  userData,
  onUserDataChange,
  userTouched,
  onUserTouchedChange,
  accountErrors,
  t,
}: AccountModulePanelProps) {
  const { user } = useAuth();
  const displayName = user ? `${user.name.firstName} ${user.name.firstSurname}` : "";

  return (
    <div className="space-y-6" data-help-id="account-panel">
      {/* Profile card (read-only) */}
      <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0">
          <span className="text-black font-bold text-xl">
            {user?.name.firstName.charAt(0).toUpperCase()}
            {user?.name.firstSurname.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-white text-lg font-semibold">{displayName}</p>
          <p className="text-zinc-400 text-sm">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-medium">
            {user?.roleName}
          </span>
        </div>
      </div>

      {/* Permission notice */}
      {!canEditAccount && (
        <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-600/50 rounded-xl p-4">
          <span className="text-yellow-400 mt-0.5" aria-hidden="true">⚠️</span>
          <p className="text-yellow-300 text-sm">{t("settings.account.readOnlyNotice")}</p>
        </div>
      )}

      {/* Editable fields */}
      <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {t("settings.account.personalInfo")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First name */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.firstName")}
            </label>
            <input
              type="text"
              value={userData.firstName}
              onChange={(e) => onUserDataChange((prev) => ({ ...prev, firstName: e.target.value }))}
              onBlur={() => onUserTouchedChange((prev) => ({ ...prev, firstName: true }))}
              disabled={!canEditAccount}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                userTouched.firstName && accountErrors.firstName ? "border-red-500" : "border-[#333]"
              } ${!canEditAccount ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder={t("settings.account.firstNamePlaceholder")}
            />
            {userTouched.firstName && accountErrors.firstName && (
              <p className="text-red-400 text-xs mt-1">{accountErrors.firstName}</p>
            )}
          </div>

          {/* Second name (optional) */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.secondName")}
              <span className="text-gray-500 ml-1 text-xs">{t("common.optional")}</span>
            </label>
            <input
              type="text"
              value={userData.secondName}
              onChange={(e) => onUserDataChange((prev) => ({ ...prev, secondName: e.target.value }))}
              disabled={!canEditAccount}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700] ${
                !canEditAccount ? "opacity-60 cursor-not-allowed" : ""
              }`}
              placeholder={t("settings.account.secondNamePlaceholder")}
            />
          </div>

          {/* First surname */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.firstSurname")}
            </label>
            <input
              type="text"
              value={userData.firstSurname}
              onChange={(e) => onUserDataChange((prev) => ({ ...prev, firstSurname: e.target.value }))}
              onBlur={() => onUserTouchedChange((prev) => ({ ...prev, firstSurname: true }))}
              disabled={!canEditAccount}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                userTouched.firstSurname && accountErrors.firstSurname ? "border-red-500" : "border-[#333]"
              } ${!canEditAccount ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder={t("settings.account.firstSurnamePlaceholder")}
            />
            {userTouched.firstSurname && accountErrors.firstSurname && (
              <p className="text-red-400 text-xs mt-1">{accountErrors.firstSurname}</p>
            )}
          </div>

          {/* Second surname (optional) */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.secondSurname")}
              <span className="text-gray-500 ml-1 text-xs">{t("common.optional")}</span>
            </label>
            <input
              type="text"
              value={userData.secondSurname}
              onChange={(e) => onUserDataChange((prev) => ({ ...prev, secondSurname: e.target.value }))}
              disabled={!canEditAccount}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700] ${
                !canEditAccount ? "opacity-60 cursor-not-allowed" : ""
              }`}
              placeholder={t("settings.account.secondSurnamePlaceholder")}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.email")}
            </label>
            <input
              type="email"
              value={userData.email}
              onChange={(e) => onUserDataChange((prev) => ({ ...prev, email: e.target.value }))}
              onBlur={() => onUserTouchedChange((prev) => ({ ...prev, email: true }))}
              disabled={!canEditAccount}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                userTouched.email && accountErrors.email ? "border-red-500" : "border-[#333]"
              } ${!canEditAccount ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder={t("settings.account.emailPlaceholder")}
            />
            {userTouched.email && accountErrors.email && (
              <p className="text-red-400 text-xs mt-1">{accountErrors.email}</p>
            )}
          </div>

          {/* Phone (optional) */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {t("settings.account.phone")}
              <span className="text-gray-500 ml-1 text-xs">{t("common.optional")}</span>
            </label>
            <input
              type="tel"
              value={userData.phone}
              onChange={(e) =>
                onUserDataChange((prev) => ({ ...prev, phone: normalizePhoneInput(e.target.value) }))
              }
              onBlur={() => onUserTouchedChange((prev) => ({ ...prev, phone: true }))}
              disabled={!canEditAccount}
              className={`w-full px-4 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
                userTouched.phone && accountErrors.phone ? "border-red-500" : "border-[#333]"
              } ${!canEditAccount ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder={t("settings.account.phonePlaceholder")}
            />
            {userTouched.phone && accountErrors.phone && (
              <p className="text-red-400 text-xs mt-1">{accountErrors.phone}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
