import { useEffect, useMemo, useState } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Palette,
  Save,
  Shield,
  UserCircle2,
} from "lucide-react";
import { StatCard } from "../components";
import { getOrganization, updateOrganization } from "../../../services/adminService";
import { ApiError } from "../../../lib/api";
import { usePermissions } from "../../../contexts/usePermissions";
import { useAuth } from "../../../contexts/useAuth";
import { useToast } from "../../../contexts/ToastContext";

type SettingsModuleId = "notifications" | "security" | "appearance" | "account";

const SETTINGS_STORAGE_KEY = "app_settings_preferences_v1";

interface SettingsPreferences {
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

const DEFAULT_PREFERENCES: SettingsPreferences = {
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

type Setting = {
  id: SettingsModuleId;
  category: string;
  icon: React.ReactNode;
  description: string;
  requiredPermissions: string[];
};

const settings: Setting[] = [
  {
    id: "notifications",
    category: "Notifications",
    icon: <Bell size={28} />,
    description: "Manage notification preferences",
    requiredPermissions: ["organization:read"],
  },
  {
    id: "security",
    category: "Security",
    icon: <Shield size={28} />,
    description: "Configure authentication and access safeguards",
    requiredPermissions: ["users:update", "roles:update", "organization:update"],
  },
  {
    id: "appearance",
    category: "Appearance",
    icon: <Palette size={28} />,
    description: "Customize interface theme",
    requiredPermissions: ["organization:read"],
  },
  {
    id: "account",
    category: "Account",
    icon: <UserCircle2 size={28} />,
    description: "Manage organization profile and account information",
    requiredPermissions: ["organization:update"],
  },
];

function loadPreferences(): SettingsPreferences {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return {
      ...DEFAULT_PREFERENCES,
      ...(JSON.parse(raw) as Partial<SettingsPreferences>),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export default function Settings() {
  const { hasAnyPermission } = usePermissions();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orgData, setOrgData] = useState({
    name: "",
    email: "",
    phone: "",
    legalName: "",
    taxId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<SettingsPreferences>(loadPreferences);
  const [activeModule, setActiveModule] = useState<SettingsModuleId>("account");

  const moduleAccess = useMemo(() => {
    return settings.reduce<Record<SettingsModuleId, boolean>>((acc, item) => {
      acc[item.id] = hasAnyPermission(item.requiredPermissions);
      return acc;
    }, {} as Record<SettingsModuleId, boolean>);
  }, [hasAnyPermission]);

  const accessibleModules = useMemo(
    () => settings.filter((item) => moduleAccess[item.id]),
    [moduleAccess],
  );

  useEffect(() => {
    if (!moduleAccess[activeModule]) {
      const fallback = accessibleModules[0]?.id;
      if (fallback) setActiveModule(fallback);
    }
  }, [activeModule, moduleAccess, accessibleModules]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        setLoading(true);
        const response = await getOrganization();
        const org = response.data.organization;

        setOrgData({
          name: org?.name || "",
          email: org?.email || "",
          phone: org?.phone || "",
          legalName: org?.legalName || "",
          taxId: org?.taxId || "",
        });
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof ApiError ? err.message : "Failed to load organization data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, []);

  const handleSaveSettings = async () => {
    if (!moduleAccess[activeModule]) {
      showToast("error", "You do not have permission to update this settings module.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (activeModule === "account") {
        await updateOrganization({
          name: orgData.name,
          email: orgData.email,
          phone: orgData.phone,
          legalName: orgData.legalName,
          taxId: orgData.taxId,
        });
      }

      showToast(
        "success",
        `${settings.find((s) => s.id === activeModule)?.category ?? "Settings"} updated successfully.`,
      );
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Error updating settings";
      setError(message);
      showToast("error", message);
    } finally {
      setSaving(false);
    }
  };

  const activeSetting = settings.find((item) => item.id === activeModule)!;

  const renderModuleContent = () => {
    if (!moduleAccess[activeModule]) {
      return (
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-semibold text-white mb-2">No Access</h2>
          <p className="text-gray-400 text-sm">
            Your current role does not have permissions for this module.
          </p>
        </div>
      );
    }

    if (activeModule === "notifications") {
      return (
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
          <p className="text-gray-400 text-sm">Choose what your team should be notified about.</p>

          <label className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <span className="text-gray-200">Event updates by email</span>
            <input
              type="checkbox"
              checked={preferences.notifications.emailEvents}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, emailEvents: e.target.checked },
                }))
              }
            />
          </label>

          <label className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <span className="text-gray-200">Billing notifications by email</span>
            <input
              type="checkbox"
              checked={preferences.notifications.emailBilling}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, emailBilling: e.target.checked },
                }))
              }
            />
          </label>

          <label className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <span className="text-gray-200">In-app alerts</span>
            <input
              type="checkbox"
              checked={preferences.notifications.inAppAlerts}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, inAppAlerts: e.target.checked },
                }))
              }
            />
          </label>

          <label className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <span className="text-gray-200">Weekly summary report</span>
            <input
              type="checkbox"
              checked={preferences.notifications.weeklySummary}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, weeklySummary: e.target.checked },
                }))
              }
            />
          </label>
        </div>
      );
    }

    if (activeModule === "security") {
      return (
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Security Controls</h2>
          <p className="text-gray-400 text-sm">Apply baseline controls for your organization users.</p>

          <label className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <span className="text-gray-200">Require MFA for privileged actions</span>
            <input
              type="checkbox"
              checked={preferences.security.requireMfa}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  security: { ...prev.security, requireMfa: e.target.checked },
                }))
              }
            />
          </label>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <label className="block text-gray-300 text-sm mb-2">Session timeout (minutes)</label>
            <input
              type="number"
              min={15}
              max={480}
              value={preferences.security.sessionTimeoutMinutes}
              onChange={(e) =>
                setPreferences((prev) => ({
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

          <label className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <span className="text-gray-200">Notify on suspicious logins</span>
            <input
              type="checkbox"
              checked={preferences.security.loginAlerts}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  security: { ...prev.security, loginAlerts: e.target.checked },
                }))
              }
            />
          </label>
        </div>
      );
    }

    if (activeModule === "appearance") {
      return (
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Appearance</h2>
          <p className="text-gray-400 text-sm">Tune visual preferences for your workspace.</p>

          <label className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <span className="text-gray-200">Compact mode</span>
            <input
              type="checkbox"
              checked={preferences.appearance.compactMode}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  appearance: { ...prev.appearance, compactMode: e.target.checked },
                }))
              }
            />
          </label>

          <label className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <span className="text-gray-200">Enable interface animations</span>
            <input
              type="checkbox"
              checked={preferences.appearance.showAnimations}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  appearance: { ...prev.appearance, showAnimations: e.target.checked },
                }))
              }
            />
          </label>

          <label className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <span className="text-gray-200">High contrast mode</span>
            <input
              type="checkbox"
              checked={preferences.appearance.highContrast}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  appearance: { ...prev.appearance, highContrast: e.target.checked },
                }))
              }
            />
          </label>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Organization Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Organization Name</label>
              <input
                type="text"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="Your organization name"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Legal Name</label>
              <input
                type="text"
                value={orgData.legalName}
                onChange={(e) => setOrgData({ ...orgData, legalName: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="Legal business name"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Tax ID</label>
              <input
                type="text"
                value={orgData.taxId}
                onChange={(e) => setOrgData({ ...orgData, taxId: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="Tax identification number"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={orgData.email}
                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={orgData.phone}
                onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your preferences and account</p>
        </div>
        <div className="text-center text-gray-400 py-8">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your preferences and account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          label="Settings Sections"
          value={accessibleModules.length}
          icon={<SettingsIcon size={28} />}
        />
        <StatCard
          label="Current Role"
          value={user?.roleName ?? "N/A"}
          icon={<Lock size={28} />}
        />
      </div>

      {error && (
        <div className="bg-red-900 border border-red-600 rounded-lg p-4 text-red-200">{error}</div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Settings Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className={`bg-[#121212] border rounded-[12px] p-6 transition-all ${
                activeModule === setting.id
                  ? "border-[#FFD700]"
                  : "border-[#333] hover:border-[#FFD700]"
              } ${moduleAccess[setting.id] ? "cursor-pointer" : "opacity-55 cursor-not-allowed"}`}
              onClick={() => moduleAccess[setting.id] && setActiveModule(setting.id)}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-[#FFD700]">{setting.icon}</div>
                <h3 className="text-white font-semibold text-lg">{setting.category}</h3>
              </div>
              <p className="text-gray-400 text-sm">{setting.description}</p>
              <button
                className="mt-4 px-4 py-2 font-medium rounded-[8px] transition-all gold-action-btn"
                disabled={!moduleAccess[setting.id]}
              >
                {moduleAccess[setting.id] ? "Manage" : "No Access"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {renderModuleContent()}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition gold-action-btn disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? "Saving..." : `Save ${activeSetting.category}`}
        </button>
      </div>
    </div>
  );
}
