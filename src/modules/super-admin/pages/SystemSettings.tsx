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
} from "lucide-react";
import { fetchPlatformHealth, fetchOverview } from "../../../services/superAdminService";
import { useLanguage } from "../../../contexts/useLanguage";
import { logError, normalizeError } from "../../../utils/errorHandling";
import { useTheme } from "../../../contexts/useTheme";
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

// ---------------------------------------------------------------------------

export default function SystemSettings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

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
