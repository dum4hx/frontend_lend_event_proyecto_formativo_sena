/**
 * Locations — Main warehouse-locations page (orchestrator)
 *
 * Handles: data fetching, import/export, delete, and modal orchestration.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Download, Upload } from "lucide-react";
import { FEATURE_FLAGS } from "../../../../config/featureFlags";
import * as XLSX from "xlsx-js-style";
import { pageVariants } from "../../../../lib/animations";
import { ConfirmDialog, PageHeader } from "../../../../components/ui";
import { ExportSettingsModal } from "../../../../components/export/ExportSettingsModal";
import { exportService, LOCATIONS_POLICY } from "../../../../services/export";
import {
  getLocations as getApiLocations,
  deleteLocation as apiDeleteLocation,
  createLocation as apiCreateLocation,
} from "../../../../services/warehouseOperatorService";
import type {
  WarehouseLocation,
  LocationCreatePayload,
} from "../../../../services/warehouseOperatorService";
import { getMaterialTypes, getMaterialCategories } from "../../../../services/materialService";
import type { MaterialType, MaterialCategory } from "../../../../types/api";
import type { ExportConfig, ExportProgress } from "../../../../types/export";
import { usePermissions } from "../../../../contexts/usePermissions";
import { useAuth } from "../../../../contexts/useAuth";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useToast } from "../../../../contexts/ToastContext";
import { useActionPermission } from "../../../../hooks/useActionPermission";
import Unauthorized from "../../../../pages/Unauthorized";

import { LocationsFilters } from "./LocationsFilters";
import { LocationsTable } from "./LocationsTable";
import { LocationDetailModal } from "./LocationDetailModal";
import { LocationCreateModal } from "./LocationCreateModal";
import { LocationEditModal } from "./LocationEditModal";
import {
  calculateLocationCapacity,
  filterLocations,
  buildExportRows,
  parseCSVLine,
} from "./helpers";
import type { LocationFilterOptions } from "./types";

export function Locations() {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === "es";
  const { showToast } = useToast();
  const { guard, isAllowed } = useActionPermission(isEs ? "es" : "en");

  // ---- Data ----
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Filters ----
  const [filters, setFilters] = useState<LocationFilterOptions>({ search: "", status: "" });

  // ---- Modals ----
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WarehouseLocation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLocation, setDetailLocation] = useState<WarehouseLocation | null>(null);

  // ---- Delete ----
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ---- Export ----
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | undefined>();
  const exportAbort = useRef<AbortController | null>(null);

  // ---- Import ----
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Pagination ----
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // ---- Setup data ----
  useEffect(() => {
    const load = async () => {
      try {
        const [typesRes, catsRes] = await Promise.all([
          getMaterialTypes({ limit: 100 }),
          getMaterialCategories(),
        ]);
        setMaterialTypes(typesRes.data.materialTypes || []);
        setCategories(catsRes.data.categories || []);
      } catch {
        // silent — materialTypes needed for modals
      }
    };
    void load();
  }, []);

  // ---- Fetch locations ----
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApiLocations({ page: 1, limit: 100 });
      const items = res.data.items;
      if (items) {
        const normalized = items
          .map((loc: WarehouseLocation & { occupied?: number }) => ({
            ...loc,
            occupied:
              (loc.materialCapacities as Array<{ currentQuantity?: number }>)?.reduce(
                (sum, cap) => sum + (cap.currentQuantity || 0),
                0,
              ) || 0,
            id: loc.id || (loc as unknown as { _id?: string })._id || "",
          }))
          .filter((loc) => loc.id);
        setLocations(normalized as WarehouseLocation[]);
      } else {
        setLocations([]);
      }
    } catch (err) {
      setError((err as Error)?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPermission("locations:read")) void fetchLocations();
  }, [hasPermission, fetchLocations]);

  // ---- Filtered + paginated ----
  const filtered = useMemo(
    () => filterLocations(locations, filters.search, filters.status),
    [locations, filters],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedLocations = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  // ---- Stats ----
  const totalCapacity = useMemo(
    () => locations.reduce((s, l) => s + calculateLocationCapacity(l), 0),
    [locations],
  );
  const totalOccupied = useMemo(
    () =>
      locations.reduce((s, l) => s + ((l as unknown as { occupied?: number })?.occupied ?? 0), 0),
    [locations],
  );
  const utilization = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  // ---- Delete handlers ----
  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await apiDeleteLocation(deleteTargetId);
      showToast("success", isEs ? "Ubicación eliminada" : "Location deleted");
      await fetchLocations();
    } catch (err) {
      showToast("error", (err as Error).message ?? "Error");
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      setDeleteLoading(false);
    }
  };

  // ---- Export ----
  const handleExport = useCallback(
    async (config: ExportConfig) => {
      const abort = new AbortController();
      exportAbort.current = abort;
      setExporting(true);
      setExportProgress(undefined);

      try {
        const rows = buildExportRows(locations);
        if (rows.length === 0) {
          showToast("warning", isEs ? "Sin ubicaciones" : "No locations to export");
          return;
        }

        const result = await exportService.export(
          rows,
          config,
          user?._id ?? "anonymous",
          (p: ExportProgress) => setExportProgress(p),
          abort.signal,
        );

        if (result.status === "success") {
          showToast(
            "success",
            isEs
              ? `Exportadas ${result.metadata.recordCount} ubicaciones`
              : `Exported ${result.metadata.recordCount} locations`,
          );
          setExportOpen(false);
        } else if (result.status === "cancelled") {
          showToast("info", result.reason);
        } else {
          showToast("error", result.error);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          showToast("error", (err as Error).message ?? "Export failed");
        }
      } finally {
        setExporting(false);
        setExportProgress(undefined);
        exportAbort.current = null;
      }
    },
    [locations, showToast, user, isEs],
  );

  const handleCancelExport = useCallback(() => {
    exportAbort.current?.abort();
    setExporting(false);
    setExportProgress(undefined);
    exportAbort.current = null;
  }, []);

  // ---- Import ----
  const handleImport = async () => {
    if (!importFile) {
      showToast("warning", isEs ? "Selecciona un archivo" : "Please select a file");
      return;
    }

    setImporting(true);
    try {
      const ext = importFile.name.toLowerCase().split(".").pop();
      const isExcel = ext === "xlsx" || ext === "xls";

      let headers: string[] = [];
      let rows: string[][] = [];

      if (isExcel) {
        const buf = await importFile.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
        if (data.length < 2) {
          showToast("error", isEs ? "Archivo vacío o inválido" : "Empty or invalid file");
          setImporting(false);
          return;
        }
        headers = data[0].map((h) => String(h || ""));
        rows = data.slice(1).map((row) => headers.map((_, idx) => String(row[idx] || "")));
      } else {
        const text = await importFile.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          showToast("error", isEs ? "Archivo vacío o inválido" : "Empty or invalid file");
          setImporting(false);
          return;
        }
        headers = parseCSVLine(lines[0]);
        rows = lines.slice(1).map((l) => parseCSVLine(l));
      }

      const isLegacyFormat = headers.includes("name") && headers.includes("organizationId");
      const isTemplateFormat = headers[0] === "Name" && headers[1] === "Street Type";

      if (!isLegacyFormat && !isTemplateFormat) {
        showToast("error", isEs ? "Formato inválido" : "Invalid file format");
        setImporting(false);
        return;
      }

      // Build material type header index
      const mtIndices: Record<string, number> = {};
      materialTypes.forEach((mt) => {
        const idx = headers.findIndex(
          (h) => h.toLowerCase().trim() === mt.name.toLowerCase().trim(),
        );
        if (idx !== -1) mtIndices[mt._id] = idx;
      });

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        if (!row[0]?.trim()) continue;
        try {
          const rowCaps = materialTypes.map((mt) => {
            const idx = mtIndices[mt._id];
            const val = idx !== undefined ? row[idx] : "";
            const num = val ? parseInt(val) : 0;
            return { materialTypeId: mt._id, maxQuantity: isNaN(num) ? 0 : num };
          });

          let payload: LocationCreatePayload;

          if (isLegacyFormat) {
            const h = (name: string) => headers.indexOf(name);
            const street = row[h("street")]?.trim() || "";
            let parsedStreetType = "";
            let parsedPrimary = street;
            let parsedSecondary = row[h("propertyNumber")]?.trim() || "";
            let parsedComp = "";
            const m = street.match(/^(.+?)\s+(\S+)\s*#\s*(\S+)(?:-(\S+))?/);
            if (m) {
              parsedStreetType = m[1].trim();
              parsedPrimary = m[2];
              parsedSecondary = m[3];
              parsedComp = m[4] || "";
            }
            payload = {
              code: row[h("code")]?.trim().toUpperCase() || "",
              name: row[h("name")]?.trim() || "",
              organizationId: user?.organizationId ?? "",
              materialCapacities: rowCaps,
              address: {
                streetType: parsedStreetType,
                primaryNumber: parsedPrimary,
                secondaryNumber: parsedSecondary,
                complementaryNumber: parsedComp,
                department: row[h("state")]?.trim() || "",
                city: row[h("city")]?.trim() || "",
              },
            };
          } else {
            payload = {
              code: row[0]?.trim().toUpperCase() || "",
              name: row[1]?.trim() || "",
              organizationId: user?.organizationId ?? "",
              materialCapacities: rowCaps,
              address: {
                streetType: row[2]?.trim() || "",
                primaryNumber: row[3]?.trim() || "",
                secondaryNumber: row[4]?.trim() || "",
                complementaryNumber: row[5]?.trim() || "",
                department: row[6]?.trim() || "",
                city: row[7]?.trim() || "",
                additionalDetails: row[8]?.trim() || undefined,
              },
            };
          }

          await apiCreateLocation(payload);
          successCount++;
        } catch {
          errorCount++;
        }
      }

      if (successCount > 0) {
        showToast(
          "success",
          isEs ? `Importadas ${successCount} ubicaciones` : `Imported ${successCount} location(s)`,
        );
        await fetchLocations();
      }
      if (errorCount > 0) {
        showToast("warning", isEs ? `Fallaron ${errorCount}` : `Failed: ${errorCount}`);
      }
      if (successCount === 0 && errorCount === 0) {
        showToast("warning", isEs ? "Sin filas válidas" : "No valid rows found");
      }

      setShowImportModal(false);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      showToast("error", (err as Error).message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  // ---- Permission gate ----
  if (!hasPermission("locations:read")) return <Unauthorized />;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="page-container">
        <div data-help-id="locations-title">
          <PageHeader
            title={isEs ? "Ubicaciones del almacén" : "Warehouse Locations"}
            subtitle={
              isEs
                ? "Gestiona zonas y ubicaciones de almacén"
                : "Manage warehouse zones and storage locations"
            }
            actions={
              <div className="flex items-center gap-3">
                <button
                  onClick={guard("locations:read", () => setExportOpen(true))}
                  aria-disabled={!isAllowed("locations:read")}
                  className={`export-btn flex items-center gap-2 ${!isAllowed("locations:read") ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Download size={18} />
                  {isEs ? "Exportar" : "Export"}
                </button>
                {FEATURE_FLAGS.ENABLE_DATA_IMPORT && (
                  <button
                    onClick={guard("locations:create", () => setShowImportModal(true))}
                    aria-disabled={!isAllowed("locations:create")}
                    className={`flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] text-gray-300 rounded-lg hover:bg-[#222] hover:border-[#444] hover:text-white transition-all ${!isAllowed("locations:create") ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Upload size={18} />
                    {isEs ? "Importar" : "Import"}
                  </button>
                )}
                {hasPermission("locations:create") && (
                  <button
                    onClick={guard("locations:create", () => setCreateOpen(true))}
                    aria-disabled={!isAllowed("locations:create")}
                    className={`flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#FFC107] transition-all ${!isAllowed("locations:create") ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Plus size={20} />
                    {isEs ? "Agregar ubicación" : "Add Location"}
                  </button>
                )}
              </div>
            }
          />
        </div>

        {/* Stats */}
        <div data-help-id="locations-stats" className="stat-grid">
          <div className="depth-card p-4">
            <p className="text-gray-400 text-sm">
              {isEs ? "Ubicaciones totales" : "Total Locations"}
            </p>
            <p className="text-white text-2xl font-bold">{locations.length}</p>
          </div>
          <div className="depth-card p-4">
            <p className="text-gray-400 text-sm">{isEs ? "Capacidad total" : "Total Capacity"}</p>
            <p className="text-white text-2xl font-bold">{totalCapacity}</p>
          </div>
          <div className="depth-card p-4">
            <p className="text-gray-400 text-sm">{isEs ? "Ocupado" : "Occupied"}</p>
            <p className="text-white text-2xl font-bold">{totalOccupied}</p>
          </div>
          <div className="depth-card p-4">
            <p className="text-gray-400 text-sm">{isEs ? "Utilización" : "Utilization"}</p>
            <p className="text-white text-2xl font-bold">{utilization}%</p>
          </div>
        </div>

        {/* Filters */}
        <div data-help-id="locations-filters">
          <LocationsFilters
            search={filters.search}
            onSearchChange={(search) => {
              setFilters((prev) => ({ ...prev, search }));
              setPage(1);
            }}
            statusFilter={filters.status}
            onStatusFilterChange={(status) => {
              setFilters((prev) => ({ ...prev, status }));
              setPage(1);
            }}
          />
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="text-center py-12 text-gray-400">
            {isEs ? "Cargando ubicaciones..." : "Loading locations..."}
          </div>
        )}
        {error && (
          <div className="text-center py-12 text-red-400">
            {error}
            <button onClick={() => void fetchLocations()} className="ml-4 text-[#FFD700] underline">
              {isEs ? "Reintentar" : "Retry"}
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div data-help-id="locations-table">
              <LocationsTable
                data={paginatedLocations}
                loading={false}
                onView={(loc) => {
                  setDetailLocation(loc);
                  setDetailOpen(true);
                }}
                onEdit={(loc) => {
                  setEditingLocation(loc);
                  setEditOpen(true);
                }}
                onDelete={(id) => handleDelete(id)}
                canEdit={hasPermission("locations:update")}
                canDelete={hasPermission("locations:delete")}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                data-help-id="locations-pagination"
                className="flex justify-center items-center gap-2 pt-4"
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-white border border-[#333] rounded disabled:opacity-30"
                >
                  {isEs ? "Anterior" : "Previous"}
                </button>
                <span className="text-sm text-gray-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-white border border-[#333] rounded disabled:opacity-30"
                >
                  {isEs ? "Siguiente" : "Next"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ---- Modals ---- */}

        {/* Create */}
        <LocationCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => void fetchLocations()}
          materialTypes={materialTypes}
          categories={categories}
        />

        {/* Edit */}
        <LocationEditModal
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            setEditingLocation(null);
          }}
          onUpdated={() => void fetchLocations()}
          location={editingLocation}
          materialTypes={materialTypes}
          categories={categories}
        />

        {/* Detail */}
        <LocationDetailModal
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setDetailLocation(null);
          }}
          location={detailLocation}
          materialTypes={materialTypes}
          categories={categories}
        />

        {/* Delete confirm */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeleteTargetId(null);
          }}
          title={isEs ? "Confirmar eliminación" : "Confirm Deletion"}
          message={
            isEs
              ? "¿Estás seguro de que deseas eliminar esta ubicación? Esta acción no se puede deshacer."
              : "Are you sure you want to delete this location? This action cannot be undone."
          }
          confirmText={isEs ? "Eliminar" : "Delete"}
          onConfirm={() => void confirmDelete()}
          isLoading={deleteLoading}
          variant="danger"
        />

        {/* Export */}
        <ExportSettingsModal
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          onExport={(config) => void handleExport(config)}
          onCancel={handleCancelExport}
          module="locations"
          policy={LOCATIONS_POLICY}
          exporting={exporting}
          progress={exportProgress}
        />

        {/* Import modal */}
        {FEATURE_FLAGS.ENABLE_DATA_IMPORT && showImportModal && (
          <div
            data-help-id="locations-import-modal"
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4">
                {isEs ? "Importar ubicaciones" : "Import Locations"}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {isEs
                  ? "Sube un archivo CSV o Excel con los datos de las ubicaciones."
                  : "Upload a CSV or Excel file with location data."}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#FFD700] file:text-black hover:file:bg-[#FFC700]"
              />
              {importFile && (
                <p className="text-xs text-gray-500 mt-2">
                  {isEs ? "Archivo:" : "File:"} {importFile.name}
                </p>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  onClick={() => void handleImport()}
                  disabled={!importFile || importing}
                  className="px-6 py-2 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC700] disabled:opacity-50"
                >
                  {importing
                    ? isEs
                      ? "Importando..."
                      : "Importing..."
                    : isEs
                      ? "Importar"
                      : "Import"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
