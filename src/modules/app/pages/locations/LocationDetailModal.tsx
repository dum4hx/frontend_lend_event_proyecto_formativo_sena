/**
 * LocationDetailModal — Read-only view of a location's full details
 */

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  Modal,
  SearchableSelect,
  StatusBadge,
  EntityLink,
  LinkedEntity,
  type SelectOption,
} from "../../../../components/ui";
import type { WarehouseLocation } from "../../../../services/warehouseOperatorService";
import { getUser } from "../../../../services/userService";
import type { MaterialType, MaterialCategory } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useInventoryReport } from "../../../../hooks/queries/useReportQueries";
import { getLocationStatusLabel } from "../../../../utils/statusLabels";
import { formatAddress, resolveCategoryName, filterMaterialTypes } from "./helpers";
import { LOCATION_STATUS_COLORS } from "./types";
import { formatManagerName, resolveLocationManager } from "./useLocationManagers";

interface LocationDetailModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** The location to display */
  location: WarehouseLocation | null;
  /** All material types */
  materialTypes: MaterialType[];
  /** All categories */
  categories: MaterialCategory[];
}

const ITEMS_PER_PAGE = 8;

export function LocationDetailModal({
  open,
  onClose,
  location,
  materialTypes,
  categories,
}: LocationDetailModalProps) {
  const { language, t } = useLanguage();
  const isEs = language === "es";
  const manager = resolveLocationManager(location);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data: inventoryReport, isFetching: isInventoryFetching } = useInventoryReport(
    location?._id ? { locationId: location._id } : {},
    { enabled: open && !!location?._id },
  );

  const availableByType = useMemo<Record<string, number>>(() => {
    if (!inventoryReport) return {};

    const map: Record<string, number> = {};

    const byMaterialType = (inventoryReport as { byMaterialType?: unknown[] }).byMaterialType;
    if (Array.isArray(byMaterialType)) {
      byMaterialType.forEach((item) => {
        const row = item as {
          materialTypeId?: string;
          _id?: string;
          statuses?: Array<{ status: string; count: number }>;
        };
        const materialTypeId = row.materialTypeId || row._id;
        if (!materialTypeId) return;
        const available = row.statuses?.find((status) => status.status === "available")?.count ?? 0;
        map[materialTypeId] = available;
      });
    }

    // Backward-compatible shape from older docs.
    const inventory = (inventoryReport as { inventory?: unknown[] }).inventory;
    if (Array.isArray(inventory)) {
      inventory.forEach((item) => {
        const row = item as {
          materialType?: { _id?: string };
          statusBreakdown?: Array<{ status: string; count: number }>;
        };
        const materialTypeId = row.materialType?._id;
        if (!materialTypeId) return;
        const available =
          row.statusBreakdown?.find((status) => status.status === "available")?.count ?? 0;
        map[materialTypeId] = available;
      });
    }

    return map;
  }, [inventoryReport]);

  const availabilityLoaded = !isInventoryFetching;
  const hasBackendAvailabilityData = !!inventoryReport;

  const categoryOptions: SelectOption[] = [
    { value: "", label: isEs ? "Todas las categorías" : "All Categories" },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  const filteredMaterials = filterMaterialTypes(
    materialTypes,
    categories,
    searchTerm,
    selectedCategory,
  );
  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE);
  const paginatedMaterials = filteredMaterials.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  if (!location) return null;

  const resolveCapacityByMaterialType = (materialTypeId: string) => {
    const capacity = (location.materialCapacities || []).find((entry) => {
      const entryTypeId =
        typeof entry.materialTypeId === "string"
          ? entry.materialTypeId
          : (entry.materialTypeId as { _id?: string })?._id;
      return entryTypeId === materialTypeId;
    }) as
      | {
          materialTypeId: string;
          maxQuantity?: number;
          currentQuantity?: number;
          availableQuantity?: number;
        }
      | undefined;

    const maxQuantity = Math.max(0, Number(capacity?.maxQuantity ?? 0));
    const currentQuantity = Math.max(0, Number(capacity?.currentQuantity ?? 0));
    const computedAvailable = Math.max(0, maxQuantity - currentQuantity);
    const availableQuantity = Math.max(
      0,
      Number(capacity?.availableQuantity ?? computedAvailable),
    );

    const availableFromBackend = availableByType[materialTypeId] ?? 0;
    const hasBackendAvailability = hasBackendAvailabilityData;

    return {
      maxQuantity,
      availableQuantity: hasBackendAvailability ? availableFromBackend : availableQuantity,
      hasInstances:
        hasBackendAvailability
          ? availableFromBackend > 0
          : currentQuantity > 0 || availableQuantity < maxQuantity,
      hasBackendAvailability,
    };
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEs ? "Detalles de ubicación" : "Location Details"}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <p className="text-gray-400 text-sm">{location.name}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic & Address Info */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#333]">
              <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                {isEs ? "Información básica" : "Basic Information"}
              </h3>
              <div className="space-y-4">
                {location.code && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      {isEs ? "C\u00f3digo" : "Code"}
                    </p>
                    <p className="text-white font-mono font-medium mt-1">{location.code}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    {isEs ? "Estado" : "Status"}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={location.status} colorMap={LOCATION_STATUS_COLORS} label={getLocationStatusLabel(location.status as "available" | "full_capacity" | "maintenance" | "inactive", language as "en" | "es")} className="!text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    {isEs ? "Gerente de sede" : "Site Manager"}
                  </p>
                  <div className="mt-1 space-y-1">
                    {manager ? (
                      <>
                        <LinkedEntity
                          type="user"
                          id={manager._id}
                          label={formatManagerName(manager)}
                          fetchFn={async (userId) => {
                            const res = await getUser(userId);
                            return {
                              ...res.data.user,
                              roleName:
                                res.data.user.roleName ||
                                manager.roleName ||
                                (isEs ? "Gerente de sede" : "Site Manager"),
                              roleId: res.data.user.roleId || manager.roleId || "",
                            };
                          }}
                          className="font-semibold text-sm"
                        />
                        <p className="text-xs text-gray-400">{manager.email}</p>
                      </>
                    ) : (
                      <p className="text-sm text-red-300">
                        {isEs ? "Sin gerente asignado" : "No manager assigned"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      {isEs ? "Creado" : "Created"}
                    </p>
                    <p className="text-white font-medium mt-1">
                      {location.createdAt
                        ? new Date(location.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      {isEs ? "Actualizado" : "Updated"}
                    </p>
                    <p className="text-white font-medium mt-1">
                      {location.updatedAt
                        ? new Date(location.updatedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#333]">
              <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                {isEs ? "Datos de dirección" : "Address Details"}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">
                      {isEs ? "País" : "Country"}
                    </p>
                    <p className="text-white text-sm bg-[#111] p-2 rounded-lg border border-[#2a2a2a] truncate">
                      Colombia
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">
                      {isEs ? "Departamento" : "Department"}
                    </p>
                    <p className="text-white text-sm bg-[#111] p-2 rounded-lg border border-[#2a2a2a] truncate">
                      {location.address?.department || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">
                      {isEs ? "Ciudad" : "City"}
                    </p>
                    <p className="text-white text-sm bg-[#111] p-2 rounded-lg border border-[#2a2a2a] truncate">
                      {location.address?.city || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">
                    {isEs ? "Dirección completa" : "Full Address"}
                  </p>
                  <p className="text-white text-sm bg-[#111] p-3 rounded-lg border border-[#2a2a2a] break-words">
                    {formatAddress(location.address)}
                  </p>
                </div>
                {location.address?.additionalDetails && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">
                      {isEs ? "Detalles adicionales" : "Additional Details"}
                    </p>
                    <p className="text-white text-sm bg-[#111] p-3 rounded-lg border border-[#2a2a2a] break-words">
                      {location.address.additionalDetails}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Material Capacities */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] flex flex-col h-full">
            <div className="p-4 border-b border-[#333]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  {isEs ? "Capacidades de material" : "Material Capacities"}
                </h3>
                <div className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-yellow-500/20 font-bold">
                  {filteredMaterials.length} / {materialTypes.length} {isEs ? "TIPOS" : "TYPES"}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <SearchableSelect
                  options={categoryOptions}
                  value={selectedCategory}
                  onChange={(v) => {
                    setSelectedCategory(v);
                    setPage(1);
                  }}
                  placeholder={isEs ? "Categoría" : "Category"}
                />
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    placeholder={isEs ? "Buscar material..." : "Search material..."}
                    className="w-full h-9 pl-8 pr-3 bg-[#111] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#1a1a1a] z-10 shadow-sm shadow-black/20">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {isEs ? "Tipo de material" : "Material Type"}
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">
                      {isEs ? "Disponibles" : "Available"}
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">
                      {isEs ? "Límite" : "Limit"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {paginatedMaterials.map((mt) => {
                    const cap = resolveCapacityByMaterialType(mt._id);
                    const categoryName = resolveCategoryName(mt.categoryId, categories);
                    return (
                      <tr key={mt._id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col">
                            <EntityLink
                              entityType="materialType"
                              entityId={mt._id}
                              label={mt.name}
                              className="text-sm font-semibold text-gray-100 hover:text-[#FFD700]"
                            />
                            <EntityLink
                              entityType="category"
                              entityId={
                                typeof mt.categoryId === "object"
                                  ? mt.categoryId._id
                                  : mt.categoryId
                              }
                              label={categoryName}
                              className="text-[10px] text-gray-400 hover:text-[#FFD700]"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 min-w-8 text-center">
                              {availabilityLoaded && cap.hasBackendAvailability
                                ? cap.availableQuantity
                                : "-"}
                            </span>
                            {availabilityLoaded && cap.hasBackendAvailability && !cap.hasInstances && (
                              <span className="text-[10px] text-gray-500">
                                {isEs ? "Sin instancias" : "No instances"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-sm font-mono font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                            {cap.maxQuantity}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 border-t border-[#333]">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded bg-[#111] hover:bg-[#222] disabled:opacity-30 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                        page === p
                          ? "bg-yellow-500 text-black"
                          : "bg-[#111] text-gray-400 hover:bg-[#222] hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded bg-[#111] hover:bg-[#222] disabled:opacity-30 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer handled by modal itself, adding close button */}
      <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-[#333]">
        <button
          onClick={onClose}
          className="px-8 py-2.5 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-[#222] transition-all border border-[#333] shadow-lg shadow-black/20 active:scale-95 text-sm uppercase tracking-wider"
        >
          {t("common.closeDetails")}
        </button>
      </div>
    </Modal>
  );
}
