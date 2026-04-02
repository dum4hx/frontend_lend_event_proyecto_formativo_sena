import { useEffect, useMemo, useRef, useState } from "react";
import { Settings as SettingsIcon, Lock, Save, RotateCcw } from "lucide-react";
import { StatCard } from "../../components";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { getOrganization, updateOrganization } from "../../../../services/adminService";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from "../../../../services/organizationService";
import type { OrganizationSettings } from "../../../../types/api";
import { ApiError } from "../../../../lib/api";
import { usePermissions } from "../../../../contexts/usePermissions";
import { useAuth } from "../../../../contexts/useAuth";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useToast } from "../../../../contexts/ToastContext";
import { ConfirmDialog } from "../../../../components/ui";
import {
  validateEmail,
  validateLegalName,
  validateOrganizationName,
  validatePhone,
  validateTaxId,
} from "../../../../utils/validators";
import { loadPreferences, cloneDefaultPreferences, arePreferencesEqual } from "./helpers";
import SettingsModulePanel from "./SettingsModulePanel";
import { SETTING_MODULES, SETTINGS_STORAGE_KEY, ACTIVE_MODULE_STORAGE_KEY } from "./types";
import type { SettingsModuleId, SettingsPreferences, AccountField } from "./types";

export default function Settings() {
  const { hasAnyPermission } = usePermissions();
  const { user } = useAuth();
  const { t } = useLanguage();
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
  const [savedPreferences, setSavedPreferences] = useState<SettingsPreferences>(loadPreferences);
  const [activeModule, setActiveModule] = useState<SettingsModuleId>("account");
  const [savedOrgData, setSavedOrgData] = useState(orgData);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);
  const [savedOrgSettings, setSavedOrgSettings] = useState<OrganizationSettings | null>(null);
  const [orgSettingsLoading, setOrgSettingsLoading] = useState(false);
  const [accountTouched, setAccountTouched] = useState<Partial<Record<AccountField, boolean>>>({});
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmModuleSwitchOpen, setConfirmModuleSwitchOpen] = useState(false);
  const [pendingModule, setPendingModule] = useState<SettingsModuleId | null>(null);
  const restoredActiveModuleRef = useRef(false);

  // ─── Module access ─────────────────────────────────────────────────────────

  const moduleAccess = useMemo(() => {
    return SETTING_MODULES.reduce<Record<SettingsModuleId, boolean>>(
      (acc, item) => {
        acc[item.id] = hasAnyPermission(item.requiredPermissions);
        return acc;
      },
      {} as Record<SettingsModuleId, boolean>,
    );
  }, [hasAnyPermission]);

  const accessibleModules = useMemo(
    () => SETTING_MODULES.filter((item) => moduleAccess[item.id]),
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

  // ─── Data fetching ─────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!moduleAccess.organization) return;

    const fetchOrgSettings = async () => {
      try {
        setOrgSettingsLoading(true);
        const response = await getOrganizationSettings();
        const settings = response.data.settings;
        setOrgSettings(settings);
        setSavedOrgSettings(settings);
      } catch (err: unknown) {
        const message =
          err instanceof ApiError ? err.message : "Failed to load organization settings";
        setError(message);
      } finally {
        setOrgSettingsLoading(false);
      }
    };

    fetchOrgSettings();
  }, [moduleAccess.organization]);

  // ─── Validation ────────────────────────────────────────────────────────────

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
    if (activeModule === "organization") {
      return JSON.stringify(orgSettings) !== JSON.stringify(savedOrgSettings);
    }
    return !arePreferencesEqual(preferences, savedPreferences);
  }, [
    activeModule,
    orgData,
    savedOrgData,
    orgSettings,
    savedOrgSettings,
    preferences,
    savedPreferences,
  ]);

  // ─── Actions ───────────────────────────────────────────────────────────────

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
      } else if (activeModule === "organization" && orgSettings) {
        await updateOrganizationSettings(orgSettings);
        setSavedOrgSettings(orgSettings);
      } else {
        setSavedPreferences(preferences);
      }

      showToast(
        "success",
        t("settings.toast.updateSuccess", {
          module: t(
            SETTING_MODULES.find((s) => s.id === activeModule)?.categoryKey ?? "settings.title",
          ),
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
      return;
    }
    if (activeModule === "organization") {
      setOrgSettings(savedOrgSettings);
    }
  };

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

  const canSave = hasUnsavedChanges && !saving && (activeModule !== "account" || isAccountValid);

  const activeSetting = SETTING_MODULES.find((item) => item.id === activeModule)!;
  const activeSettingLabel = t(activeSetting.categoryKey);

  // ─── Render ────────────────────────────────────────────────────────────────

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
    <div className="page-container">
      <div data-help-id="settings-title">
        <PageHeader title={t("settings.title")} subtitle={t("settings.description")} />
      </div>

      <div data-help-id="settings-stats" className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {error && (
        <div className="card bg-red-900/20 border-red-600/70 p-4 text-red-200">{error}</div>
      )}

      <div data-help-id="settings-modules">
        <h2 className="text-xl font-semibold text-white mb-4">{t("settings.modulesTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SETTING_MODULES.map((setting) => (
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

      <div data-help-id="settings-panel">
        <SettingsModulePanel
          activeModule={activeModule}
          hasAccess={moduleAccess[activeModule]}
          preferences={preferences}
          onPreferencesChange={setPreferences}
          orgData={orgData}
          onOrgDataChange={setOrgData}
          accountTouched={accountTouched}
          onAccountTouchedChange={setAccountTouched}
          accountErrors={accountErrors}
          orgSettings={orgSettings}
          orgSettingsLoading={orgSettingsLoading}
          onOrgSettingsChange={setOrgSettings}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmModuleSwitchOpen}
        title={t("settings.unsavedTitle")}
        message={t("settings.unsavedMessage")}
        confirmText={t("settings.discardChanges")}
        cancelText={t("common.cancel")}
        variant="warning"
        onConfirm={() => {
          if (pendingModule) {
            handleResetActiveModule();
            setActiveModule(pendingModule);
          }
          setConfirmModuleSwitchOpen(false);
          setPendingModule(null);
        }}
        onClose={() => {
          setConfirmModuleSwitchOpen(false);
          setPendingModule(null);
        }}
      />

      <ConfirmDialog
        isOpen={confirmResetOpen}
        title={t("settings.resetTitle")}
        message={t("settings.resetMessage")}
        confirmText={t("settings.resetConfirm")}
        cancelText={t("common.cancel")}
        variant="warning"
        onConfirm={() => {
          handleResetActiveModule();
          setConfirmResetOpen(false);
        }}
        onClose={() => setConfirmResetOpen(false)}
      />

      {/* Save Button */}
      <div data-help-id="settings-actions" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
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
            {saving
              ? t("common.loadingEllipsis")
              : t("settings.saveCategory", { module: activeSettingLabel })}
          </button>
        </div>
      </div>
    </div>
  );
}
