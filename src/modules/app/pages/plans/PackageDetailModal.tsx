import { X, ToggleLeft, ToggleRight } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import { PermissionGuardedButton } from "../../../../components/ui";
import { Pencil, Trash2 } from "lucide-react";
import type { Package } from "../../../../types/api";

interface PackageDetailModalProps {
  pkg: Package;
  onClose: () => void;
  onEdit: (pkg: Package) => void;
  onDelete: (pkg: Package) => void;
  onToggleActive: (pkg: Package) => void;
}

export default function PackageDetailModal({
  pkg,
  onClose,
  onEdit,
  onDelete,
  onToggleActive,
}: PackageDetailModalProps) {
  const { t } = useLanguage();
  const isActive = pkg.status !== "inactive";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-md w-full">
        <div className="border-b border-[#333] p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{pkg.name}</h2>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700/40 text-zinc-500"}`}
            >
              {isActive ? t("plans.active") : t("plans.inactive")}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {pkg.description && <p className="text-gray-400 text-sm">{pkg.description}</p>}

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">{t("plans.pricePerDay")}</span>
            <span className="text-[#FFD700] font-bold">
              {pkg.pricePerDay != null
                ? `$${pkg.pricePerDay.toFixed(2)}`
                : t("plans.detail.sumOfMaterials")}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              {t("plans.materialTypes")}
            </p>
            {pkg.items.length > 0 ? (
              <ul className="space-y-2">
                {pkg.items.map((m, i) => {
                  const mt = m.materialTypeId as unknown;
                  const mtRec =
                    mt && typeof mt === "object" ? (mt as Record<string, unknown>) : null;
                  const label =
                    typeof mt === "string"
                      ? mt
                      : mtRec
                        ? typeof mtRec.name === "string"
                          ? (mtRec.name as string)
                          : typeof mtRec._id === "string"
                            ? (mtRec._id as string)
                            : JSON.stringify(mtRec)
                        : String(mt);

                  const key =
                    typeof mt === "string"
                      ? mt
                      : mtRec && typeof mtRec._id === "string"
                        ? (mtRec._id as string)
                        : String(i);

                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="text-gray-300 font-mono text-xs truncate flex-1 mr-2">
                        {label}
                      </span>
                      <span className="bg-[#FFD700]/20 text-[#FFD700] px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">
                        × {m.quantity}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">{t("plans.detail.noMaterials")}</p>
            )}
          </div>

          <div className="pt-2 border-t border-[#333] flex items-center justify-between">
            <div className="flex items-center gap-1">
              <PermissionGuardedButton
                icon={isActive ? ToggleRight : ToggleLeft}
                intent="edit"
                ariaLabel={isActive ? t("plans.deactivate") : t("plans.activate")}
                requiredPermission="packages:update"
                onClick={() => onToggleActive(pkg)}
              />
              <PermissionGuardedButton
                icon={Trash2}
                intent="delete"
                ariaLabel={t("plans.deleteConfirm")}
                requiredPermission="packages:delete"
                onClick={() => onDelete(pkg)}
              />
            </div>
            <PermissionGuardedButton
              icon={Pencil}
              intent="edit"
              ariaLabel={t("plans.form.editPackage")}
              requiredPermission="packages:update"
              onClick={() => onEdit(pkg)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
