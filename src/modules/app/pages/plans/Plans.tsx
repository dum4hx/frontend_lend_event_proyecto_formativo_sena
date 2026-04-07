import { useState } from "react";
import {
  Plus,
  Eye,
  Search,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useActionPermission } from "../../../../hooks/useActionPermission";
import { usePermissions } from "../../../../contexts/usePermissions";
import { useToast } from "../../../../contexts/ToastContext";
import { PageHeader, ConfirmDialog, PermissionGuardedButton } from "../../../../components/ui";
import {
  getPackages,
  deletePackage,
  activatePackage,
  deactivatePackage,
} from "../../../../services/materialService";
import type { Package } from "../../../../types/api";
import Unauthorized from "../../../../pages/Unauthorized";
import CreatePackageModal from "./CreatePackageModal";
import PackageDetailModal from "./PackageDetailModal";

export default function MaterialPlans() {
  const { t, language } = useLanguage();
  const { guard, isAllowed } = useActionPermission(language === "es" ? "es" : "en");
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const { data, isLoading, error, refetch } = useApiQuery(() => getPackages(), {
    context: "MaterialPlans",
  });
  const packages = data?.data?.packages ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [viewPkg, setViewPkg] = useState<Package | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!packageToDelete) return;
    try {
      await deletePackage(packageToDelete._id);
      showToast("success", t("plans.deleteSuccess"));
      setIsDeleteDialogOpen(false);
      setPackageToDelete(null);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      showToast("error", message);
    }
  };

  const handleToggleActive = async (pkg: Package) => {
    setTogglingId(pkg._id);
    try {
      if (pkg.status === "inactive") {
        await activatePackage(pkg._id);
        showToast("success", t("plans.activateSuccess"));
      } else {
        await deactivatePackage(pkg._id);
        showToast("success", t("plans.deactivateSuccess"));
      }
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      showToast("error", message);
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#FFD700]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="text-red-400" size={32} />
        <p className="text-red-400 text-sm">{error.message}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#333] text-gray-300 rounded-lg hover:border-[#FFD700] text-sm transition"
        >
          {t("plans.retry")}
        </button>
      </div>
    );
  }

  if (!hasPermission("packages:read")) return <Unauthorized />;

  return (
    <div className="page-container">
      <div data-help-id="plans-title">
        <PageHeader
          title={t("plans.title")}
          subtitle={t("plans.subtitle")}
          actions={
            <button
              onClick={guard("packages:create", () => setShowCreate(true))}
              aria-disabled={!isAllowed("packages:create")}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] font-semibold transition-all gold-action-btn ${!isAllowed("packages:create") ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Plus size={20} />
              {t("plans.addPlan")}
            </button>
          }
        />
      </div>

      {/* Search */}
      <div data-help-id="plans-search" className="flex-1 max-w-sm relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          size={20}
        />
        <input
          type="text"
          placeholder={t("plans.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
        />
      </div>

      {/* Plans Grid */}
      <div
        data-help-id="plans-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
      >
        {filtered.map((pkg) => {
          const isActive = pkg.status !== "inactive";
          return (
            <div
              key={pkg._id}
              data-help-id="plans-card"
              className={`bg-[#1a1a1a] border rounded-[12px] p-6 transition-all ${isActive ? "border-[#333] hover:border-[#FFD700]" : "border-[#333]/50 opacity-60"}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white truncate">{pkg.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700/40 text-zinc-500"}`}
                    >
                      {isActive ? t("plans.active") : t("plans.inactive")}
                    </span>
                  </div>
                  {pkg.description && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{pkg.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <PermissionGuardedButton
                    icon={Eye}
                    intent="view"
                    ariaLabel={t("plans.detail.title")}
                    requiredPermission="packages:read"
                    onClick={() => setViewPkg(pkg)}
                  />
                  <PermissionGuardedButton
                    icon={Pencil}
                    intent="edit"
                    ariaLabel={t("plans.form.editPackage")}
                    requiredPermission="packages:update"
                    onClick={() => setEditingPkg(pkg)}
                  />
                  <span data-help-id="plans-toggle-active">
                    <PermissionGuardedButton
                      icon={isActive ? ToggleRight : ToggleLeft}
                      intent="edit"
                      ariaLabel={isActive ? t("plans.deactivate") : t("plans.activate")}
                      requiredPermission="packages:update"
                      onClick={() => handleToggleActive(pkg)}
                    />
                  </span>
                  <span data-help-id="plans-delete">
                    <PermissionGuardedButton
                      icon={Trash2}
                      intent="delete"
                      ariaLabel={t("plans.deleteConfirm")}
                      requiredPermission="packages:delete"
                      onClick={() => {
                        setPackageToDelete(pkg);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 border-t border-[#333] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">{t("plans.pricePerDay")}</span>
                  <span className="text-[#FFD700] font-bold text-lg">
                    {pkg.pricePerDay != null
                      ? `$${pkg.pricePerDay.toFixed(2)}`
                      : t("plans.priceAuto")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">{t("plans.materialTypes")}</span>
                  <span className="bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-sm font-semibold">
                    {pkg.items.length}
                  </span>
                </div>
              </div>

              {/* Toggle loading indicator */}
              {togglingId === pkg._id && (
                <div className="mt-2 flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#FFD700]" size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">{t("plans.noPlansFound")}</p>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreatePackageModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            showToast("success", t("plans.createSuccess"));
            void refetch();
          }}
        />
      )}
      {editingPkg && (
        <CreatePackageModal
          initialPackage={editingPkg}
          onClose={() => setEditingPkg(null)}
          onSaved={() => {
            setEditingPkg(null);
            showToast("success", t("plans.updateSuccess"));
            void refetch();
          }}
        />
      )}
      {viewPkg && (
        <PackageDetailModal
          pkg={viewPkg}
          onClose={() => setViewPkg(null)}
          onEdit={(pkg) => {
            setViewPkg(null);
            setEditingPkg(pkg);
          }}
          onDelete={(pkg) => {
            setViewPkg(null);
            setPackageToDelete(pkg);
            setIsDeleteDialogOpen(true);
          }}
          onToggleActive={(pkg) => {
            setViewPkg(null);
            handleToggleActive(pkg);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <div data-help-id="plans-delete-confirm">
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title={t("plans.deleteTitle")}
          message={t("plans.deleteMessage", { name: packageToDelete?.name ?? "" })}
          confirmText={t("plans.deleteConfirm")}
          variant="danger"
        />
      </div>
    </div>
  );
}
