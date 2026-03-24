import { useEffect, useMemo, useRef, useState } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  UserCircle2,
  RotateCcw,
  Languages,
} from "lucide-react";
import { StatCard } from "../components";
import { getOrganization, updateOrganization } from "../../../services/adminService";
import { ApiError } from "../../../lib/api";
import { usePermissions } from "../../../contexts/usePermissions";
import { useAuth } from "../../../contexts/useAuth";
import { useLanguage } from "../../../contexts/useLanguage";
import { useToast } from "../../../contexts/ToastContext";
import { useTheme } from "../../../contexts/useTheme";
import { ConfirmDialog } from "../../../components/ui";
import type { SupportedLanguage, TranslationKey } from "../../../i18n/translations";
import {
  validateEmail,
  validateLegalName,
  validateOrganizationName,
  validatePhone,
  validateTaxId,
} from "../../../utils/validators";

type SettingsModuleId = "notifications" | "security" | "appearance" | "account";
type AccountField = "name" | "email" | "phone" | "legalName" | "taxId";

const SETTINGS_STORAGE_KEY = "app_settings_preferences_v1";
const ACTIVE_MODULE_STORAGE_KEY = "app_settings_active_module_v1";
const LANGUAGE_OPTIONS: SupportedLanguage[] = ["es", "en"];

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

function cloneDefaultPreferences(): SettingsPreferences {
  return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES)) as SettingsPreferences;
}

function arePreferencesEqual(a: SettingsPreferences, b: SettingsPreferences): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizePhoneInput(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return "";

  const withoutCountry = digitsOnly.startsWith("57") ? digitsOnly.slice(2) : digitsOnly;
  const localDigits = withoutCountry.slice(0, 10);
  return `+57${localDigits}`;
}

function normalizeTaxIdInput(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "").slice(0, 11);
  if (digitsOnly.length <= 1) return digitsOnly;

  return `${digitsOnly.slice(0, -1)}-${digitsOnly.slice(-1)}`;
}

type Setting = {
  id: SettingsModuleId;
  categoryKey: TranslationKey;
  icon: React.ReactNode;
  descriptionKey: TranslationKey;
  requiredPermissions: string[];
};

const settings: Setting[] = [
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

function loadPreferences(): SettingsPreferences {
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

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
      <span className="text-gray-200 text-sm sm:text-base">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[#FFD700]" : "bg-[#333]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-black transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

export default function Settings() {
  const { hasAnyPermission } = usePermissions();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();

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
  const [savedPreferences, setSavedPreferences] = useState<SettingsPreferences>(loadPreferences);
  const [activeModule, setActiveModule] = useState<SettingsModuleId>("account");
  const [savedOrgData, setSavedOrgData] = useState(orgData);
  const [accountTouched, setAccountTouched] = useState<Partial<Record<AccountField, boolean>>>({});
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmModuleSwitchOpen, setConfirmModuleSwitchOpen] = useState(false);
  const [pendingModule, setPendingModule] = useState<SettingsModuleId | null>(null);
  const restoredActiveModuleRef = useRef(false);

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
    if (restoredActiveModuleRef.current) return;

    const storedModule = localStorage.getItem(ACTIVE_MODULE_STORAGE_KEY) as SettingsModuleId | null;
    if (storedModule && moduleAccess[storedModule]) {
      setActiveModule(storedModule);
    }
    restoredActiveModuleRef.current = true;
  }, [moduleAccess]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_MODULE_STORAGE_KEY, activeModule);
  }, [activeModule]);

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
        setSavedOrgData({
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
      showToast("error", t("settings.toast.noPermission"));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (activeModule === "account") {
        if (!isAccountValid) {
          setAccountTouched({
            name: true,
            email: true,
            phone: true,
            legalName: true,
            taxId: true,
          });
          showToast("error", t("settings.toast.fixErrors"));
          setSaving(false);
          return;
        }

        await updateOrganization({
          name: orgData.name,
          email: orgData.email,
          phone: orgData.phone,
          legalName: orgData.legalName,
          taxId: orgData.taxId,
        });
        setSavedOrgData(orgData);
      } else {
        setSavedPreferences(preferences);
      }

      showToast(
        "success",
        t("settings.toast.updateSuccess", {
          module: t(settings.find((s) => s.id === activeModule)?.categoryKey ?? "settings.title"),
        }),
      );
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : t("settings.toast.updateError");
      setError(message);
      showToast("error", message);
    } finally {
      setSaving(false);
    }
  };

  const activeSetting = settings.find((item) => item.id === activeModule)!;
  const activeSettingLabel = t(activeSetting.categoryKey);

  const accountErrors = useMemo(() => {
    const next: Partial<Record<AccountField, string>> = {};

    const orgName = validateOrganizationName(orgData.name);
    if (!orgName.isValid) next.name = orgName.message;

    const legalName = validateLegalName(orgData.legalName);
    if (!legalName.isValid) next.legalName = legalName.message;

    const emailValidation = validateEmail(orgData.email);
    if (!emailValidation.isValid) next.email = emailValidation.message;

    const taxValue = orgData.taxId.trim();
    if (taxValue) {
      const taxValidation = validateTaxId(taxValue);
      if (!taxValidation.isValid) next.taxId = taxValidation.message;
    }

    const phoneValidation = validatePhone(orgData.phone || undefined);
    if (!phoneValidation.isValid) next.phone = phoneValidation.message;

    return next;
  }, [orgData]);

  const isAccountValid = useMemo(() => Object.keys(accountErrors).length === 0, [accountErrors]);

  const hasUnsavedChanges = useMemo(() => {
    if (activeModule === "account") {
      return JSON.stringify(orgData) !== JSON.stringify(savedOrgData);
    }

    return !arePreferencesEqual(preferences, savedPreferences);
  }, [activeModule, orgData, savedOrgData, preferences, savedPreferences]);

  const handleResetActiveModule = () => {
    if (activeModule === "account") {
      setOrgData(savedOrgData);
      setAccountTouched({});
      return;
    }

    if (activeModule === "notifications") {
      setPreferences((prev) => ({
        ...prev,
        notifications: cloneDefaultPreferences().notifications,
      }));
      return;
    }

    if (activeModule === "security") {
      setPreferences((prev) => ({
        ...prev,
        security: cloneDefaultPreferences().security,
      }));
      return;
    }

    if (activeModule === "appearance") {
      setPreferences((prev) => ({
        ...prev,
        appearance: cloneDefaultPreferences().appearance,
      }));
    }
  };

  const canSave = hasUnsavedChanges && (!saving && (activeModule !== "account" || isAccountValid));

  const handleModuleChange = (targetModule: SettingsModuleId) => {
    if (!moduleAccess[targetModule]) return;
    if (targetModule === activeModule) return;

    if (hasUnsavedChanges) {
      setPendingModule(targetModule);
      setConfirmModuleSwitchOpen(true);
      return;
    }

    setActiveModule(targetModule);
  };

  const renderModuleContent = () => {
    if (!moduleAccess[activeModule]) {
      return (
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-semibold text-white mb-2">{t("settings.noAccessTitle")}</h2>
          <p className="text-gray-400 text-sm">
            {t("settings.noAccessDescription")}
          </p>
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
              setPreferences((prev) => ({
                ...prev,
                notifications: { ...prev.notifications, emailEvents: value },
              }))
            }
          />

          <ToggleRow
            label={t("settings.notifications.emailBilling")}
            checked={preferences.notifications.emailBilling}
            onChange={(value) =>
              setPreferences((prev) => ({
                ...prev,
                notifications: { ...prev.notifications, emailBilling: value },
              }))
            }
          />

          <ToggleRow
            label={t("settings.notifications.inAppAlerts")}
            checked={preferences.notifications.inAppAlerts}
            onChange={(value) =>
              setPreferences((prev) => ({
                ...prev,
                notifications: { ...prev.notifications, inAppAlerts: value },
              }))
            }
          />

          <ToggleRow
            label={t("settings.notifications.weeklySummary")}
            checked={preferences.notifications.weeklySummary}
            onChange={(value) =>
              setPreferences((prev) => ({
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
              setPreferences((prev) => ({
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

          <ToggleRow
            label={t("settings.security.loginAlerts")}
            checked={preferences.security.loginAlerts}
            onChange={(value) =>
              setPreferences((prev) => ({
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
            <p className="text-gray-500 text-xs mt-2">{t("settings.appearance.appliedImmediately")}</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-200 mb-3 text-sm font-medium">
              <Languages size={16} className="text-[#FFD700]" />
              <span>{t("settings.appearance.languageTitle")}</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">{t("settings.appearance.languageDescription")}</p>
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
              setPreferences((prev) => ({
                ...prev,
                appearance: { ...prev.appearance, compactMode: value },
              }))
            }
          />

          <ToggleRow
            label={t("settings.appearance.showAnimations")}
            checked={preferences.appearance.showAnimations}
            onChange={(value) =>
              setPreferences((prev) => ({
                ...prev,
                appearance: { ...prev.appearance, showAnimations: value },
              }))
            }
          />

          <ToggleRow
            label={t("settings.appearance.highContrast")}
            checked={preferences.appearance.highContrast}
            onChange={(value) =>
              setPreferences((prev) => ({
                ...prev,
                appearance: { ...prev.appearance, highContrast: value },
              }))
            }
          />
        </div>
      );
    }

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
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                onBlur={() => setAccountTouched((prev) => ({ ...prev, name: true }))}
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
                onChange={(e) => setOrgData({ ...orgData, legalName: e.target.value })}
                onBlur={() => setAccountTouched((prev) => ({ ...prev, legalName: true }))}
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
                  setOrgData({ ...orgData, taxId: normalizeTaxIdInput(e.target.value) })
                }
                onBlur={() => setAccountTouched((prev) => ({ ...prev, taxId: true }))}
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
                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                onBlur={() => setAccountTouched((prev) => ({ ...prev, email: true }))}
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
                  setOrgData({ ...orgData, phone: normalizePhoneInput(e.target.value) })
                }
                onBlur={() => setAccountTouched((prev) => ({ ...prev, phone: true }))}
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
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("settings.title")}</h1>
          <p className="text-gray-400">{t("settings.loadingDescription")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="card h-[96px] animate-pulse">
              <div className="h-4 bg-[#1a1a1a] rounded w-1/2 mb-3" />
              <div className="h-7 bg-[#1a1a1a] rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="card space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-12 bg-[#1a1a1a] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">{t("settings.title")}</h1>
        <p className="text-gray-400">{t("settings.description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          label={t("settings.sections")}
          value={accessibleModules.length}
          icon={<SettingsIcon size={28} />}
        />
        <StatCard
          label={t("settings.currentRole")}
          value={user?.roleName ?? "N/A"}
          icon={<Lock size={28} />}
        />
      </div>

      {error && <div className="card bg-red-900/20 border-red-600/70 p-4 text-red-200">{error}</div>}

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">{t("settings.modulesTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className={`bg-[#121212] border rounded-[12px] p-6 transition-all ${
                activeModule === setting.id
                  ? "border-[#FFD700]"
                  : "border-[#333] hover:border-[#FFD700]"
              } ${moduleAccess[setting.id] ? "cursor-pointer" : "opacity-55 cursor-not-allowed"}`}
              onClick={() => handleModuleChange(setting.id)}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-[#FFD700]">{setting.icon}</div>
                <h3 className="text-white font-semibold text-lg">{t(setting.categoryKey)}</h3>
              </div>
              <p className="text-gray-400 text-sm">{t(setting.descriptionKey)}</p>
              <button
                type="button"
                className="mt-4 px-4 py-2 font-medium rounded-[8px] transition-all gold-action-btn"
                disabled={!moduleAccess[setting.id]}
              >
                {moduleAccess[setting.id] ? t("common.manage") : t("common.noAccess")}
              </button>
            </div>
          ))}
        </div>
      </div>

      {renderModuleContent()}

      <ConfirmDialog
        isOpen={confirmModuleSwitchOpen}
        title={t("settings.discardTitle")}
        message={t("settings.discardMessage")}
        confirmText={t("settings.discardConfirm")}
        cancelText={t("settings.stayHere")}
        variant="warning"
        onConfirm={() => {
          if (pendingModule) {
            setActiveModule(pendingModule);
          }
          setPendingModule(null);
          setConfirmModuleSwitchOpen(false);
        }}
        onClose={() => {
          setPendingModule(null);
          setConfirmModuleSwitchOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={confirmResetOpen}
        title={
          activeModule === "account"
            ? t("settings.revertAccountTitle")
            : t("settings.resetModuleTitle")
        }
        message={
          activeModule === "account"
            ? t("settings.revertAccountMessage")
            : t("settings.resetModuleMessage", { module: activeSettingLabel })
        }
        confirmText={activeModule === "account" ? t("settings.revertButton") : t("settings.resetButton")}
        cancelText={t("common.cancel")}
        variant="warning"
        onConfirm={() => {
          handleResetActiveModule();
          setConfirmResetOpen(false);
        }}
        onClose={() => setConfirmResetOpen(false)}
      />

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="text-sm text-gray-400">
          {hasUnsavedChanges ? t("settings.unsaved") : t("settings.savedState")}
        </div>
        <div className="flex items-center gap-2">
          {activeModule !== "account" && (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              disabled={!hasUnsavedChanges}
              className="flex items-center gap-2 px-4 py-2 font-medium rounded-lg border border-[#333] text-gray-300 hover:bg-[#1a1a1a] transition"
            >
              <RotateCcw size={16} />
              {t("settings.resetButton")}
            </button>
          )}
          {activeModule === "account" && (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              disabled={!hasUnsavedChanges}
              className="flex items-center gap-2 px-4 py-2 font-medium rounded-lg border border-[#333] text-gray-300 hover:bg-[#1a1a1a] transition"
            >
              <RotateCcw size={16} />
              {t("settings.revertButton")}
            </button>
          )}
          <button
            onClick={handleSaveSettings}
            disabled={!canSave}
            className="flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition gold-action-btn disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? t("common.loadingEllipsis") : t("settings.saveCategory", { module: activeSettingLabel })}
          </button>
        </div>
      </div>
    </div>
  );
}
