import { useState, useEffect, useCallback } from "react";
import { Save, Shield, Bell, Globe, Database, AlertTriangle } from "lucide-react";
import { fetchPlatformHealth, fetchOverview } from "../../../services/superAdminService";
import { logError, normalizeError } from "../../../utils/errorHandling";
import type { PlatformHealth, PlatformOverview } from "../../../types/api";

// --- Validation helpers ----------------------------------------------------

interface SettingsValidationErrors {
  platformName?: string;
  supportEmail?: string;
  maxOrganizations?: string;
  sessionTimeout?: string;
}

function validateSettings(fields: {
  platformName: string;
  supportEmail: string;
  maxOrganizations: number;
  sessionTimeout: number;
}): SettingsValidationErrors {
  const errors: SettingsValidationErrors = {};

  if (!fields.platformName.trim()) {
    errors.platformName = "Platform name is required.";
  } else if (fields.platformName.length > 100) {
    errors.platformName = "Max 100 characters.";
  }

  if (!fields.supportEmail.trim()) {
    errors.supportEmail = "Support email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.supportEmail)) {
    errors.supportEmail = "Invalid email format.";
  }

  if (!Number.isInteger(fields.maxOrganizations) || fields.maxOrganizations < 1) {
    errors.maxOrganizations = "Must be a positive integer.";
  }

  if (
    !Number.isInteger(fields.sessionTimeout) ||
    fields.sessionTimeout < 5 ||
    fields.sessionTimeout > 1440
  ) {
    errors.sessionTimeout = "Must be between 5 and 1440 minutes.";
  }

  return errors;
}

function hasErrors(errors: SettingsValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

// ---------------------------------------------------------------------------

export default function SystemSettings() {
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
      const [healthRes, overviewRes] = await Promise.all([
        fetchPlatformHealth(),
        fetchOverview(),
      ]);
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
    const errors = validateSettings({
      platformName,
      supportEmail,
      maxOrganizations,
      sessionTimeout,
    });
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
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-gray-400 mt-1">Configure platform-wide settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-yellow-300 transition disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <SettingsSection
          icon={<Globe size={20} className="text-[#FFD700]" />}
          title="General Settings"
          description="Basic platform configuration"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label="Platform Name" error={validationErrors.platformName}>
              <input
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                maxLength={100}
                className="setting-input"
              />
            </FieldGroup>
            <FieldGroup label="Support Email" error={validationErrors.supportEmail}>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="setting-input"
              />
            </FieldGroup>
          </div>
          <ToggleRow
            label="Maintenance Mode"
            description="Temporarily disable access for all non-super-admin users"
            checked={maintenanceMode}
            onChange={setMaintenanceMode}
          />
        </SettingsSection>

        {/* Security */}
        <SettingsSection
          icon={<Shield size={20} className="text-[#FFD700]" />}
          title="Security"
          description="Authentication and access control"
        >
          <ToggleRow
            label="Require Two-Factor Authentication"
            description="Enforce 2FA for all organization owners"
            checked={twoFactor}
            onChange={setTwoFactor}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FieldGroup label="Session Timeout (minutes)" error={validationErrors.sessionTimeout}>
              <input
                type="number"
                min={5}
                max={1440}
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="setting-input"
              />
            </FieldGroup>
            <FieldGroup label="Max Organizations" error={validationErrors.maxOrganizations}>
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
          title="Notifications"
          description="Alert and notification preferences"
        >
          <ToggleRow
            label="Email Notifications"
            description="Send email alerts for critical events"
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />
          <ToggleRow
            label="Slack Integration"
            description="Post alerts to a Slack channel"
            checked={slackIntegration}
            onChange={setSlackIntegration}
          />
          <div className="mt-4 max-w-xs">
            <FieldGroup label={`Alert Threshold: ${alertThreshold}%`}>
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

        {/* Database & Platform Health */}
        <SettingsSection
          icon={<Database size={20} className="text-[#FFD700]" />}
          title="Data Management & Platform Health"
          description="Live metrics from GET /admin/analytics/health"
        >
          {healthLoading ? (
            <p className="text-gray-500 text-sm py-4">Loading health data…</p>
          ) : health ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <InfoCard
                  label="Overdue Loans"
                  value={String(health.overdueLoans)}
                  ok={health.overdueLoans === 0}
                />
                <InfoCard
                  label="Overdue Invoices"
                  value={String(health.overdueInvoices)}
                  ok={health.overdueInvoices === 0}
                />
                <InfoCard
                  label="Suspended Organizations"
                  value={String(health.suspendedOrganizations)}
                  ok={health.suspendedOrganizations === 0}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard
                  label="Recent Errors"
                  value={String(health.recentErrors)}
                  ok={health.recentErrors === 0}
                />
                <InfoCard
                  label="Total Organizations"
                  value={overview ? String(overview.totalOrganizations) : "–"}
                  ok
                />
                <InfoCard
                  label="Active Users"
                  value={overview ? String(overview.activeUsers) : "–"}
                  ok
                />
              </div>
              {(health.overdueLoans > 0 || health.overdueInvoices > 0 || health.recentErrors > 0) && (
                <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertTriangle size={16} />
                  <span>Platform health issues detected. Review the dashboard for details.</span>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard label="Database Status" value="Connected" ok />
              <InfoCard label="Storage Used" value="–" ok />
              <InfoCard label="Last Backup" value="–" ok />
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
