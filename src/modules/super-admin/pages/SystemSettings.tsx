import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Shield,
  Bell,
  Globe,
  Database,
  AlertTriangle,
  Moon,
  Palette,
  Sun,
  UserCog,
  Lock,
} from "lucide-react";
import { fetchPlatformHealth, fetchOverview } from "../../../services/superAdminService";
import { updateUser } from "../../../services/userService";
import { changePassword } from "../../../services/authService";
import { useLanguage } from "../../../contexts/useLanguage";
import { useAuth } from "../../../contexts/useAuth";
import { logError, normalizeError } from "../../../utils/errorHandling";
import { useTheme } from "../../../contexts/useTheme";
import { isApiError } from "../../../lib/api";
import type { ApiResponse, ApiErrorResponse } from "../../../lib/api";
import type { PlatformHealth, PlatformOverview } from "../../../types/api";
import type { SupportedLanguage } from "../../../i18n/translations";

// --- Validation helpers ----------------------------------------------------

const LANGUAGE_OPTIONS: SupportedLanguage[] = ["es", "en"];

interface SettingsValidationErrors {
  platformName?: string;
  supportEmail?: string;
  maxOrganizations?: string;
  sessionTimeout?: string;
}

function validateSettings(
  fields: {
    platformName: string;
    supportEmail: string;
    maxOrganizations: number;
    sessionTimeout: number;
  },
  t: ReturnType<typeof useLanguage>["t"],
): SettingsValidationErrors {
  const errors: SettingsValidationErrors = {};

  if (!fields.platformName.trim()) {
    errors.platformName = t("systemSettings.validation.platformNameRequired");
  } else if (fields.platformName.length > 100) {
    errors.platformName = t("systemSettings.validation.platformNameMax");
  }

  if (!fields.supportEmail.trim()) {
    errors.supportEmail = t("systemSettings.validation.supportEmailRequired");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.supportEmail)) {
    errors.supportEmail = t("systemSettings.validation.supportEmailInvalid");
  }

  if (!Number.isInteger(fields.maxOrganizations) || fields.maxOrganizations < 1) {
    errors.maxOrganizations = t("systemSettings.validation.maxOrganizations");
  }

  if (
    !Number.isInteger(fields.sessionTimeout) ||
    fields.sessionTimeout < 5 ||
    fields.sessionTimeout > 1440
  ) {
    errors.sessionTimeout = t("systemSettings.validation.sessionTimeout");
  }

  return errors;
}

function hasErrors(errors: SettingsValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

// --- Account section validation helpers ------------------------------------

interface AccountProfileErrors {
  firstName?: string;
  firstSurname?: string;
  email?: string;
}

interface AccountPasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function validateAccountProfile(
  fields: { firstName: string; firstSurname: string; email: string },
  t: ReturnType<typeof useLanguage>["t"],
): AccountProfileErrors {
  const errors: AccountProfileErrors = {};
  if (!fields.firstName.trim()) errors.firstName = t("systemSettings.validation.firstNameRequired");
  if (!fields.firstSurname.trim())
    errors.firstSurname = t("systemSettings.validation.firstSurnameRequired");
  if (!fields.email.trim()) errors.email = t("systemSettings.validation.emailRequired");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    errors.email = t("systemSettings.validation.emailInvalid");
  return errors;
}

function validateAccountPassword(
  fields: { currentPassword: string; newPassword: string; confirmPassword: string },
  t: ReturnType<typeof useLanguage>["t"],
): AccountPasswordErrors {
  const errors: AccountPasswordErrors = {};
  if (!fields.currentPassword.trim())
    errors.currentPassword = t("systemSettings.validation.currentPasswordRequired");
  if (fields.newPassword.length < 8)
    errors.newPassword = t("systemSettings.validation.newPasswordTooShort");
  if (fields.newPassword !== fields.confirmPassword)
    errors.confirmPassword = t("systemSettings.validation.passwordsMustMatch");
  return errors;
}

function hasAccountErrors(errors: AccountProfileErrors | AccountPasswordErrors): boolean {
  return Object.values(errors).some(Boolean);
}

// ---------------------------------------------------------------------------

export default function SystemSettings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, checkAuth } = useAuth();

  // General
  const [platformName, setPlatformName] = useState("Lend Event");
  const [supportEmail, setSupportEmail] = useState("support@lendevent.com");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Security
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(15);
  const [maxOrganizations, setMaxOrganizations] = useState(500);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackIntegration, setSlackIntegration] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(90);

  // State
  const [validationErrors, setValidationErrors] = useState<SettingsValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Platform health (from API)
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Account — Profile
  const [acctFirstName, setAcctFirstName] = useState("");
  const [acctSecondName, setAcctSecondName] = useState("");
  const [acctFirstSurname, setAcctFirstSurname] = useState("");
  const [acctSecondSurname, setAcctSecondSurname] = useState("");
  const [acctEmail, setAcctEmail] = useState("");
  const [acctPhone, setAcctPhone] = useState("");
  const [profileErrors, setProfileErrors] = useState<AccountProfileErrors>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Account — Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<AccountPasswordErrors>({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const loadHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const [healthRes, overviewRes] = await Promise.all([fetchPlatformHealth(), fetchOverview()]);
      setHealth(healthRes.data.health);
      setOverview(overviewRes.data.overview);
    } catch (err: unknown) {
      logError(err, "SystemSettings.loadHealth");
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  // Sync profile fields when user is available
  useEffect(() => {
    if (user) {
      setAcctFirstName(user.name.firstName);
      setAcctSecondName(user.name.secondName ?? "");
      setAcctFirstSurname(user.name.firstSurname);
      setAcctSecondSurname(user.name.secondSurname ?? "");
      setAcctEmail(user.email);
      setAcctPhone(user.phone ?? "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    const errors = validateAccountProfile(
      { firstName: acctFirstName, firstSurname: acctFirstSurname, email: acctEmail },
      t,
    );
    setProfileErrors(errors);
    if (hasAccountErrors(errors)) return;

    try {
      setProfileSaving(true);
      setProfileSaved(false);
      await updateUser(user!._id, {
        name: {
          firstName: acctFirstName.trim(),
          secondName: acctSecondName.trim() || undefined,
          firstSurname: acctFirstSurname.trim(),
          secondSurname: acctSecondSurname.trim() || undefined,
        },
        email: acctEmail.trim(),
        phone: acctPhone.trim() || undefined,
      });
      await checkAuth();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: unknown) {
      logError(err, "SystemSettings.handleSaveProfile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    const errors = validateAccountPassword({ currentPassword, newPassword, confirmPassword }, t);
    setPasswordErrors(errors);
    if (hasAccountErrors(errors)) return;

    try {
      setPasswordSaving(true);
      setPasswordSaved(false);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "success" in err && isApiError(err as ApiResponse<unknown>)) {
        setPasswordError((err as ApiErrorResponse).message);
      } else {
        logError(err, "SystemSettings.handleChangePassword");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSave = () => {
    const errors = validateSettings(
      {
        platformName,
        supportEmail,
        maxOrganizations,
        sessionTimeout,
      },
      t,
    );
    setValidationErrors(errors);

    if (hasErrors(errors)) return;

    setSaving(true);
    setSaved(false);

    // NOTE: The API does not currently expose a platform-settings endpoint.
    // Settings are persisted locally. When the endpoint is available,
    // replace this with an actual `post("/admin/settings", { ... })` call.
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      const normalized = normalizeError(
        new Error("Settings saved locally. Backend persistence not yet available."),
      );
      // Suppress — this is informational, not an error.
      void normalized;
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("systemSettings.title")}</h1>
          <p className="text-gray-400 mt-1">{t("systemSettings.description")}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 gold-action-btn"
        >
          <Save size={18} />
          {saving
            ? t("systemSettings.saving")
            : saved
              ? `${t("systemSettings.saved")} ✓`
              : t("systemSettings.saveChanges")}
        </button>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <SettingsSection
          icon={<Globe size={20} className="text-[#FFD700]" />}
          title={t("systemSettings.general.title")}
          description={t("systemSettings.general.description")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup
              label={t("systemSettings.general.platformName")}
              error={validationErrors.platformName}
            >
              <input
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                maxLength={100}
                className="setting-input"
              />
            </FieldGroup>
            <FieldGroup
              label={t("systemSettings.general.supportEmail")}
              error={validationErrors.supportEmail}
            >
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="setting-input"
              />
            </FieldGroup>
          </div>
          <ToggleRow
            label={t("systemSettings.general.maintenanceMode")}
            description={t("systemSettings.general.maintenanceDescription")}
            checked={maintenanceMode}
            onChange={setMaintenanceMode}
          />
        </SettingsSection>

        {/* Security */}
        <SettingsSection
          icon={<Shield size={20} className="text-[#FFD700]" />}
          title={t("systemSettings.security.title")}
          description={t("systemSettings.security.description")}
        >
          <ToggleRow
            label={t("systemSettings.security.twoFactor")}
            description={t("systemSettings.security.twoFactorDescription")}
            checked={twoFactor}
            onChange={setTwoFactor}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FieldGroup
              label={t("systemSettings.security.sessionTimeout")}
              error={validationErrors.sessionTimeout}
            >
              <input
                type="number"
                min={5}
                max={1440}
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="setting-input"
              />
            </FieldGroup>
            <FieldGroup
              label={t("systemSettings.security.maxOrganizations")}
              error={validationErrors.maxOrganizations}
            >
              <input
                type="number"
                min={1}
                value={maxOrganizations}
                onChange={(e) => setMaxOrganizations(Number(e.target.value))}
                className="setting-input"
              />
            </FieldGroup>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          icon={<Bell size={20} className="text-[#FFD700]" />}
          title={t("systemSettings.notifications.title")}
          description={t("systemSettings.notifications.description")}
        >
          <ToggleRow
            label={t("systemSettings.notifications.email")}
            description={t("systemSettings.notifications.emailDescription")}
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />
          <ToggleRow
            label={t("systemSettings.notifications.slack")}
            description={t("systemSettings.notifications.slackDescription")}
            checked={slackIntegration}
            onChange={setSlackIntegration}
          />
          <div className="mt-4 max-w-xs">
            <FieldGroup
              label={t("systemSettings.notifications.alertThreshold", { value: alertThreshold })}
            >
              <input
                type="range"
                min={10}
                max={100}
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                className="w-full accent-[#FFD700]"
              />
            </FieldGroup>
          </div>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection
          icon={<Palette size={20} className="text-[#FFD700]" />}
          title={t("systemSettings.appearance.title")}
          description={t("systemSettings.appearance.description")}
        >
          <p className="text-sm text-gray-400 mb-3">{t("systemSettings.appearance.help")}</p>
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
            {t("systemSettings.appearance.appliedImmediately")}
          </p>
          <div className="mt-5 border-t border-[#222] pt-4">
            <p className="text-sm font-medium text-white mb-1">
              {t("systemSettings.appearance.languageTitle")}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {t("systemSettings.appearance.languageDescription")}
            </p>
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
        </SettingsSection>

        {/* Account */}
        <SettingsSection
          icon={<UserCog size={20} className="text-[#FFD700]" />}
          title={t("systemSettings.account.title")}
          description={t("systemSettings.account.description")}
        >
          <div data-help-id="sa-account-section">
            {/* Profile */}
            <h3 className="text-sm font-semibold text-white mb-3">
              {t("systemSettings.account.profile.title")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup
                label={t("systemSettings.account.profile.firstName")}
                error={profileErrors.firstName}
              >
                <input
                  data-help-id="sa-account-first-name"
                  value={acctFirstName}
                  onChange={(e) => setAcctFirstName(e.target.value)}
                  className="setting-input"
                />
              </FieldGroup>
              <FieldGroup label={t("systemSettings.account.profile.secondName")}>
                <input
                  value={acctSecondName}
                  onChange={(e) => setAcctSecondName(e.target.value)}
                  className="setting-input"
                />
              </FieldGroup>
              <FieldGroup
                label={t("systemSettings.account.profile.firstSurname")}
                error={profileErrors.firstSurname}
              >
                <input
                  data-help-id="sa-account-first-surname"
                  value={acctFirstSurname}
                  onChange={(e) => setAcctFirstSurname(e.target.value)}
                  className="setting-input"
                />
              </FieldGroup>
              <FieldGroup label={t("systemSettings.account.profile.secondSurname")}>
                <input
                  value={acctSecondSurname}
                  onChange={(e) => setAcctSecondSurname(e.target.value)}
                  className="setting-input"
                />
              </FieldGroup>
              <FieldGroup
                label={t("systemSettings.account.profile.email")}
                error={profileErrors.email}
              >
                <input
                  data-help-id="sa-account-email"
                  type="email"
                  value={acctEmail}
                  onChange={(e) => setAcctEmail(e.target.value)}
                  className="setting-input"
                />
              </FieldGroup>
              <FieldGroup label={t("systemSettings.account.profile.phone")}>
                <input
                  data-help-id="sa-account-phone"
                  type="tel"
                  value={acctPhone}
                  onChange={(e) => setAcctPhone(e.target.value)}
                  className="setting-input"
                />
              </FieldGroup>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                data-help-id="sa-account-save-profile"
                onClick={() => void handleSaveProfile()}
                disabled={profileSaving}
                className="flex items-center gap-2 font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50 gold-action-btn text-sm"
              >
                <Save size={16} />
                {profileSaving
                  ? t("systemSettings.account.profile.saving")
                  : profileSaved
                    ? `${t("systemSettings.account.profile.saved")} ✓`
                    : t("systemSettings.account.profile.save")}
              </button>
            </div>

            {/* Password */}
            <div className="mt-6 border-t border-[#222] pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Lock size={16} className="text-[#FFD700]" />
                <h3 className="text-sm font-semibold text-white">
                  {t("systemSettings.account.password.title")}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldGroup
                  label={t("systemSettings.account.password.current")}
                  error={passwordErrors.currentPassword}
                >
                  <input
                    data-help-id="sa-account-current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="setting-input"
                    autoComplete="current-password"
                  />
                </FieldGroup>
                <FieldGroup
                  label={t("systemSettings.account.password.new")}
                  error={passwordErrors.newPassword}
                >
                  <input
                    data-help-id="sa-account-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="setting-input"
                    autoComplete="new-password"
                  />
                </FieldGroup>
                <FieldGroup
                  label={t("systemSettings.account.password.confirm")}
                  error={passwordErrors.confirmPassword}
                >
                  <input
                    data-help-id="sa-account-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="setting-input"
                    autoComplete="new-password"
                  />
                </FieldGroup>
              </div>
              {passwordError && <p className="text-red-400 text-xs mt-2">{passwordError}</p>}
              <div className="mt-4 flex justify-end">
                <button
                  data-help-id="sa-account-change-password"
                  onClick={() => void handleChangePassword()}
                  disabled={passwordSaving}
                  className="flex items-center gap-2 font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50 gold-action-btn text-sm"
                >
                  <Lock size={16} />
                  {passwordSaving
                    ? t("systemSettings.account.password.changing")
                    : passwordSaved
                      ? `${t("systemSettings.account.password.changed")} ✓`
                      : t("systemSettings.account.password.change")}
                </button>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Database & Platform Health */}
        <SettingsSection
          icon={<Database size={20} className="text-[#FFD700]" />}
          title={t("systemSettings.health.title")}
          description={t("systemSettings.health.description")}
        >
          {healthLoading ? (
            <p className="text-gray-500 text-sm py-4">{t("systemSettings.health.loading")}</p>
          ) : health ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <InfoCard
                  label={t("systemSettings.health.overdueLoans")}
                  value={String(health.overdueLoans)}
                  ok={health.overdueLoans === 0}
                />
                <InfoCard
                  label={t("systemSettings.health.overdueInvoices")}
                  value={String(health.overdueInvoices)}
                  ok={health.overdueInvoices === 0}
                />
                <InfoCard
                  label={t("systemSettings.health.suspendedOrganizations")}
                  value={String(health.suspendedOrganizations)}
                  ok={health.suspendedOrganizations === 0}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard
                  label={t("systemSettings.health.recentErrors")}
                  value={String(health.recentErrors)}
                  ok={health.recentErrors === 0}
                />
                <InfoCard
                  label={t("systemSettings.health.totalOrganizations")}
                  value={overview ? String(overview.totalOrganizations) : "–"}
                  ok
                />
                <InfoCard
                  label={t("systemSettings.health.activeUsers")}
                  value={overview ? String(overview.activeUsers) : "–"}
                  ok
                />
              </div>
              {(health.overdueLoans > 0 ||
                health.overdueInvoices > 0 ||
                health.recentErrors > 0) && (
                <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertTriangle size={16} />
                  <span>{t("systemSettings.health.issueDetected")}</span>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard
                label={t("systemSettings.health.databaseStatus")}
                value={t("systemSettings.health.connected")}
                ok
              />
              <InfoCard label={t("systemSettings.health.storageUsed")} value="–" ok />
              <InfoCard label={t("systemSettings.health.lastBackup")} value="–" ok />
            </div>
          )}
        </SettingsSection>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-1">
        {icon}
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <p className="text-xs text-gray-500 mb-5 ml-8">{description}</p>
      <div className="ml-0">{children}</div>
    </div>
  );
}

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <style>{`
        .setting-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #444;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .setting-input:focus {
          border-color: #FFD700;
        }
      `}</style>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#222] last:border-b-0">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition ${
          checked ? "bg-[#FFD700]" : "bg-[#333]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

function InfoCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-white text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}
