import React, { useEffect, useRef } from "react";
import { Eye, Edit, Printer, Trash2 } from "lucide-react";
import { type MaterialInstance, MATERIAL_INSTANCE_STATUS_LABELS } from "../../../../../types/api";
import { AdminTable } from "../../../components";
import { MaterialBarcode } from "./MaterialBarcode";

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

  const selectedCount = instances.filter((instance) => selectedInstanceIds.includes(instance._id)).length;
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
        <p>No material instances found. Create your first instance to get started.</p>
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
          <th className="text-left py-4 px-4 text-gray-400 font-semibold">Serial Number</th>
          <th className="text-left py-4 px-4 text-gray-400 font-semibold">
            {showBarcodePreview ? "Barcode Preview" : "Barcode"}
          </th>
          <th className="text-left py-4 px-4 text-gray-400 font-semibold">Material Type</th>
          <th className="text-left py-4 px-4 text-gray-400 font-semibold">Location</th>
          <th className="text-left py-4 px-4 text-gray-400 font-semibold">Status</th>
          <th className="text-right py-4 px-4 text-gray-400 font-semibold">Actions</th>
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
            <td className="py-4 px-4 text-white font-mono font-medium">{instance.serialNumber}</td>
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
                      Using serial
                    </span>
                  )}
                </div>
              ) : (
                instance.barcode || <span className="text-gray-600">-</span>
              )}
            </td>
            <td className="py-4 px-4 text-gray-400">{instance.modelId?.name || "Unknown"}</td>
            <td className="py-4 px-4 text-gray-400">{instance.locationId?.name || "Unknown"}</td>
            <td className="py-4 px-4">
              <span className={`font-semibold ${getStatusColor(instance.status)}`}>
                {MATERIAL_INSTANCE_STATUS_LABELS[instance.status]}
              </span>
            </td>
            <td className="py-4 px-4">
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => onView(instance)}
                  className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                  title="View Details"
                  aria-label={`View details for instance ${instance.serialNumber}`}
                >
                  <Eye size={18} />
                </button>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(instance)}
                    className="p-2 text-[#FFD700] hover:bg-[#FFD700]/10 rounded-lg transition-colors"
                    title="Edit Status"
                    aria-label={`Edit instance ${instance.serialNumber}`}
                  >
                    <Edit size={18} />
                  </button>
                )}
                {onPrint && (
                  <button
                    type="button"
                    onClick={() => onPrint(instance)}
                    className="p-2 text-gray-300 border border-[#3b3b3b] hover:bg-white/5 rounded-lg transition-colors"
                    title="Print Barcode"
                    aria-label={`Print barcode for instance ${instance.serialNumber}`}
                  >
                    <Printer size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(instance)}
                  className="p-2 text-red-300 border border-red-500/40 hover:bg-red-500/15 rounded-lg transition-colors"
                  title="Delete Instance"
                  aria-label={`Delete instance ${instance.serialNumber}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
};
