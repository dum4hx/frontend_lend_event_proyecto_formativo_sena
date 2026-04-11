/**
 * LocationsTable — Grid cards layout for warehouse locations
 */

import { MapPin, Zap, Eye, Edit2, Trash2 } from "lucide-react";
import type { WarehouseLocation } from "../../../../services/warehouseOperatorService";
import { StatusBadge, LoadingSpinner } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useActionPermission } from "../../../../hooks/useActionPermission";
import { getLocationStatusLabel } from "../../../../utils/statusLabels";
import { formatAddress, calculateLocationCapacity, calculateOccupied } from "./helpers";
import { LOCATION_STATUS_COLORS } from "./types";

interface LocationsTableProps {
  /** Locations to render */
  data: WarehouseLocation[];
  /** Whether data is loading */
  loading: boolean;
  /** Error message, if any */
  error?: string | null;
  /** Callback when "View" is clicked */
  onView: (location: WarehouseLocation) => void;
  /** Callback when "Edit" is clicked */
  onEdit: (location: WarehouseLocation) => void;
  /** Callback when "Delete" is clicked */
  onDelete: (locationId: string) => void;
  /** Whether the user has edit permission */
  canEdit: boolean;
  /** Whether the user has delete permission */
  canDelete: boolean;
}

export function LocationsTable({
  data,
  loading,
  error,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: LocationsTableProps) {
  const { language } = useLanguage();
  const isEs = language === "es";
  const { guard } = useActionPermission(isEs ? "es" : "en");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 py-8 text-center">{error}</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="mx-auto w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-400 text-lg mb-2">
          {isEs ? "No se encontraron ubicaciones" : "No locations found"}
        </p>
        <p className="text-gray-500 text-sm">
          {isEs
            ? "Intenta ajustar la búsqueda o crea una nueva ubicación"
            : "Try adjusting your search or create a new location"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {data.map((location) => {
        const capacity = calculateLocationCapacity(location);
        const occupied = calculateOccupied(location);
        const available = Math.max(0, capacity - occupied);

        return (
          <div
            key={location._id}
            className="group relative bg-gradient-to-br from-[#1a1a1a] to-[#121212] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#FFD700]/50 hover:shadow-lg hover:shadow-[#FFD700]/10 transition-all duration-300"
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <StatusBadge status={location.status} colorMap={LOCATION_STATUS_COLORS} label={getLocationStatusLabel(location.status as "available" | "full_capacity" | "maintenance" | "inactive", language as "en" | "es")} />
            </div>

            {/* Header */}
            <div className="mb-5 pr-24">
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#FFD700] transition-colors">
                {location.name}
              </h3>
              {location.code && (
                <p className="text-xs font-mono text-[#FFD700]/80 mb-2">{location.code}</p>
              )}
              <div className="flex items-start gap-2 text-gray-400">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-[#FFD700]/70" />
                <div className="text-sm leading-relaxed">
                  <p className="text-gray-300">{formatAddress(location.address)}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{location.address?.city || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#333] to-transparent mb-5" />

            {/* Capacity */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
                    <Zap size={16} className="text-[#FFD700]" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    {isEs ? "Capacidad" : "Capacity"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    {occupied}
                    <span className="text-gray-500">/{capacity}</span>
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {available} {isEs ? "disponible" : "available"}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            {location.address?.additionalDetails && (
              <div className="bg-[#0f0f0f] border border-[#222] rounded-lg p-3 mb-5">
                <p className="text-[#FFD700] text-xs font-semibold mb-1.5 uppercase tracking-wide">
                  {isEs ? "Info adicional" : "Additional Info"}
                </p>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                  {location.address.additionalDetails}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => onView(location)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:border-blue-500/50 hover:text-blue-400 transition-all duration-200 group/btn"
                title={isEs ? "Ver detalles" : "View details"}
              >
                <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                <span className="text-xs font-semibold">{isEs ? "Ver" : "View"}</span>
              </button>

              {canEdit && (
                <button
                  onClick={guard("locations:update", () => onEdit(location))}
                  aria-disabled={!canEdit}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-gray-300 hover:bg-[#FFD700]/10 hover:border-[#FFD700] hover:text-[#FFD700] transition-all duration-200 group/btn ${!canEdit ? "opacity-40 cursor-not-allowed" : ""}`}
                  title={isEs ? "Editar" : "Edit"}
                >
                  <Edit2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">{isEs ? "Editar" : "Edit"}</span>
                </button>
              )}

              {canDelete && (
                <button
                  onClick={guard("locations:delete", () => onDelete(location._id))}
                  aria-disabled={!canDelete}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-950/50 hover:border-red-500/50 hover:text-red-300 transition-all duration-200 group/btn ${!canDelete ? "opacity-40 cursor-not-allowed" : ""}`}
                  title={isEs ? "Eliminar" : "Delete"}
                >
                  <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
