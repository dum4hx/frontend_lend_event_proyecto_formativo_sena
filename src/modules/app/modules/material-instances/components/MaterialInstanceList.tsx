import React, { useEffect, useRef } from "react";
import { Eye, Edit, Printer, Trash2, Copy } from "lucide-react";
import type { MaterialInstance } from "../../../../../types/api";
import { AdminTable } from "../../../components";
import { MaterialBarcode } from "./MaterialBarcode";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { useCopyToClipboard } from "../../../../../hooks/useCopyToClipboard";
import { getMaterialInstanceStatusLabel } from "../../../../../utils/statusLabels";
import { PermissionGuardedButton } from "../../../../../components/ui";

interface MaterialInstanceListProps {
  instances: MaterialInstance[];
  selectedInstanceIds?: string[];
  onView: (instance: MaterialInstance) => void;
  onEdit?: (instance: MaterialInstance) => void;
  onDelete: (instance: MaterialInstance) => void;
  onPrint?: (instance: MaterialInstance) => void;
  showBarcodePreview?: boolean;
  onToggleSelect?: (instanceId: string) => void;
  onToggleSelectAll?: (instanceIds: string[]) => void;
}

export const MaterialInstanceList: React.FC<MaterialInstanceListProps> = ({
  instances,
  selectedInstanceIds = [],
  onView,
  onEdit,
  onDelete,
  onPrint,
  showBarcodePreview = false,
  onToggleSelect,
  onToggleSelectAll,
}) => {
  const { t, language } = useLanguage();
  const { copy } = useCopyToClipboard();
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "text-green-400",
      reserved: "text-blue-400",
      loaned: "text-yellow-400",
      returned: "text-purple-400",
      maintenance: "text-orange-400",
      damaged: "text-red-400",
      lost: "text-red-600",
      retired: "text-gray-500",
      in_use: "text-blue-400",
    };
    return colors[status] || "text-gray-400";
  };

  const selectedCount = instances.filter((instance) =>
    selectedInstanceIds.includes(instance._id),
  ).length;
  const allSelected = instances.length > 0 && selectedCount === instances.length;
  const someSelected = selectedCount > 0 && selectedCount < instances.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  if (instances.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>{t("materialInstances.list.emptyMessage")}</p>
      </div>
    );
  }

  return (
    <AdminTable>
      <thead className="bg-[#0f0f0f] border-b border-[#333]">
        <tr>
          <th className="py-4 px-4 w-12">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              onChange={() => onToggleSelectAll?.(instances.map((instance) => instance._id))}
              className="h-4 w-4 rounded border-[#555] bg-[#111] text-[#FFD700] focus:ring-[#FFD700]/40"
              aria-label="Select all visible material instances"
            />
          </th>
          <th className="text-left py-4 px-4 text-gray-400 font-semibold">
            {t("materialInstances.list.serialNumber")}
          </th>
          <th className="text-left py-4 px-4 text-gray-400 font-semibold">
            {showBarcodePreview
              ? t("materialInstances.list.barcodePreview")
              : t("materialInstances.list.barcode")}
          </th>
          <th className="text-left py-4 px-4 text-gray-400 font-semibold">
            {t("materialInstances.list.materialType")}
          </th>
          <th className="text-left py-4 px-4 text-gray-400 font-semibold">
            {t("materialInstances.list.location")}
          </th>
          <th className="text-left py-4 px-4 text-gray-400 font-semibold">
            {t("materialInstances.list.status")}
          </th>
          <th className="text-right py-4 px-4 text-gray-400 font-semibold">
            {t("materialInstances.list.actions")}
          </th>
        </tr>
      </thead>
      <tbody>
        {instances.map((instance) => (
          <tr
            key={instance._id}
            className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
          >
            <td className="py-4 px-4 align-top">
              <input
                type="checkbox"
                checked={selectedInstanceIds.includes(instance._id)}
                onChange={() => onToggleSelect?.(instance._id)}
                className="mt-1 h-4 w-4 rounded border-[#555] bg-[#111] text-[#FFD700] focus:ring-[#FFD700]/40"
                aria-label={`Select instance ${instance.serialNumber}`}
              />
            </td>
            <td className="py-4 px-4 text-white font-mono font-medium">
              <button
                onClick={() => copy(instance.serialNumber)}
                className="hover:text-[#FFD700] hover:underline transition-colors flex items-center gap-1 group/copy"
                title="Haz click para copiar"
              >
                {instance.serialNumber}
                <Copy size={13} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
              </button>
            </td>
            <td className="py-4 px-4 text-gray-300 font-mono align-top">
              {showBarcodePreview ? (
                <div className="space-y-2">
                  <MaterialBarcode
                    value={instance.barcode}
                    fallbackValue={instance.serialNumber}
                    height={34}
                    width={1.05}
                    compact
                  />
                  {!instance.barcode && (
                    <span className="inline-flex rounded-full border border-[#4a4330] bg-[#2b2412] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FFD700]">
                      {t("materialInstances.list.usingSerial")}
                    </span>
                  )}
                </div>
              ) : (
                instance.barcode || <span className="text-gray-600">-</span>
              )}
            </td>
            <td className="py-4 px-4 text-gray-400">{instance.model?.name || "Unknown"}</td>
            <td className="py-4 px-4 text-gray-400">{instance.locationId?.name || "Unknown"}</td>
            <td className="py-4 px-4">
              <span className={`font-semibold ${getStatusColor(instance.status)}`}>
                {getMaterialInstanceStatusLabel(instance.status, language)}
              </span>
            </td>
            <td className="py-4 px-4">
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => onView(instance)}
                  className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                  title={t("materialInstances.list.viewDetails")}
                  aria-label={t("materialInstances.list.viewDetailsAria", {
                    serial: instance.serialNumber,
                  })}
                >
                  <Eye size={18} />
                </button>
                {onEdit && (
                  <PermissionGuardedButton
                    icon={Edit}
                    intent="edit"
                    ariaLabel={t("materialInstances.list.editAria", {
                      serial: instance.serialNumber,
                    })}
                    requiredPermission="materials:update"
                    onClick={() => onEdit(instance)}
                  />
                )}
                {onPrint && (
                  <button
                    type="button"
                    onClick={() => onPrint(instance)}
                    className="p-2 text-gray-300 border border-[#3b3b3b] hover:bg-white/5 rounded-lg transition-colors"
                    title={t("materialInstances.list.printBarcode")}
                    aria-label={t("materialInstances.list.printBarcodeAria", {
                      serial: instance.serialNumber,
                    })}
                  >
                    <Printer size={18} />
                  </button>
                )}
                <PermissionGuardedButton
                  icon={Trash2}
                  intent="delete"
                  ariaLabel={t("materialInstances.list.deleteAria", {
                    serial: instance.serialNumber,
                  })}
                  requiredPermission="materials:delete"
                  onClick={() => onDelete(instance)}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
};
