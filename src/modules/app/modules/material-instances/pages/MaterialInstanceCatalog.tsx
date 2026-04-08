import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Barcode, Eye, Plus, Printer, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBarcodeScanner, useMaterialInstances } from "../hooks";
import { useMaterialTypes } from "../../material-types/hooks";
import {
  MaterialInstanceList,
  MaterialInstanceDetailModal,
  MaterialInstanceForm,
  BarcodePrintModal,
} from "../components";
import { AdminPagination } from "../../../components";
import { ExcelExportImport } from "../../../../../components/export/ExcelExportImport";
import { FEATURE_FLAGS } from "../../../../../config/featureFlags";
import { useToast } from "../../../../../contexts/ToastContext";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { usePermissions } from "../../../../../contexts/usePermissions";
import { useActionPermission } from "../../../../../hooks/useActionPermission";
import Unauthorized from "../../../../../pages/Unauthorized";
import {
  getLocations,
  type WarehouseLocation,
} from "../../../../../services/warehouseOperatorService";
import type {
  MaterialInstance,
  CreateMaterialInstancePayload,
  MaterialInstanceStatus,
} from "../../../../../types/api";

export const MaterialInstanceCatalog: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = usePermissions();
  const isEs = language === "es";
  const { guard, isAllowed } = useActionPermission(isEs ? "es" : "en");
  const navigate = useNavigate();
  const { instances, loading, error, removeInstance, addInstance, updateInstanceStatus, refetch } =
    useMaterialInstances();
  const { materialTypes } = useMaterialTypes();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedInstance, setSelectedInstance] = useState<MaterialInstance | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [isScannerEnabled, setIsScannerEnabled] = useState(true);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [formInitialData, setFormInitialData] = useState<
    Partial<CreateMaterialInstancePayload> | undefined
  >(undefined);
  const [showBarcodePreview, setShowBarcodePreview] = useState(false);
  const [isBarcodePrintModalOpen, setIsBarcodePrintModalOpen] = useState(false);
  const [barcodePrintSelection, setBarcodePrintSelection] = useState<MaterialInstance[]>([]);
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);
  const pageSize = 10;
  const searchInputId = "material-instances-search";
  const scannerInputId = "material-instances-scanner";

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await getLocations();
        setLocations(response.data.items || []);
      } catch (fetchError) {
        console.error("Error fetching locations:", fetchError);
      }
    };

    fetchLocations();
  }, []);

  const hasMaterialTypes = materialTypes.length > 0;
  const hasLocations = locations.length > 0;
  const canCreateInstance = hasMaterialTypes && hasLocations;

  const filteredInstances = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) {
      return instances;
    }

    return instances.filter((inst) => {
      const serial = inst.serialNumber.toLowerCase();
      const barcode = (inst.barcode ?? "").toLowerCase();
      const model = (inst.model?.name ?? "").toLowerCase();
      const location = (inst.locationId?.name ?? "").toLowerCase();
      return (
        serial.includes(normalizedTerm) ||
        barcode.includes(normalizedTerm) ||
        model.includes(normalizedTerm) ||
        location.includes(normalizedTerm)
      );
    });
  }, [instances, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredInstances.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedInstances = filteredInstances.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const selectedInstances = useMemo(
    () => filteredInstances.filter((instance) => selectedInstanceIds.includes(instance._id)),
    [filteredInstances, selectedInstanceIds],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(
    () =>
      filteredInstances.map((instance) => ({
        _id: instance._id,
        serialNumber: instance.serialNumber,
        barcode: instance.barcode ?? "",
        materialType: instance.model?.name ?? "",
        location: instance.locationId?.name ?? "",
        status: instance.status,
      })),
    [filteredInstances],
  );

  useEffect(() => {
    setSelectedInstanceIds((current) =>
      current.filter((instanceId) => instances.some((instance) => instance._id === instanceId)),
    );
  }, [instances]);

  const handleDelete = (instance: MaterialInstance) => {
    showToast(
      "warning",
      t("materialInstances.toast.deleteConfirm", { serial: instance.serialNumber }),
      t("materialInstances.toast.deleteConfirmTitle"),
      {
        duration: Infinity,
        action: {
          label: t("materialInstances.toast.deleteConfirmBtn"),
          onClick: async () => {
            try {
              await removeInstance(instance._id);
              showToast("success", t("materialInstances.toast.deleteSuccess"), t("common.success"));
            } catch (error: unknown) {
              showToast(
                "error",
                error instanceof Error ? error.message : t("materialInstances.toast.deleteError"),
                t("common.error"),
              );
            }
          },
        },
      },
    );
  };

  const handleCreateOrUpdate = async (data: CreateMaterialInstancePayload) => {
    try {
      await addInstance({
        ...data,
        serialNumber: data.serialNumber.trim(),
        barcode: data.barcode?.trim() || undefined,
      });
      showToast("success", t("materialInstances.toast.createSuccess"), t("common.success"));
      setIsFormModalOpen(false);
      setFormInitialData(undefined);
    } catch (error: unknown) {
      showToast(
        "error",
        error instanceof Error ? error.message : t("materialInstances.toast.saveError"),
        t("common.error"),
      );
    }
  };

  const handleOpenCreateModal = () => {
    if (!canCreateInstance) {
      setIsDependencyModalOpen(true);
      return;
    }
    setFormInitialData(undefined);
    setIsFormModalOpen(true);
  };

  const handleOpenBarcodePrintModal = (selection: MaterialInstance[]) => {
    setBarcodePrintSelection(selection);
    setIsBarcodePrintModalOpen(true);
  };

  const handleToggleInstanceSelection = (instanceId: string) => {
    setSelectedInstanceIds((current) =>
      current.includes(instanceId)
        ? current.filter((selectedId) => selectedId !== instanceId)
        : [...current, instanceId],
    );
  };

  const handleToggleSelectAllVisible = (instanceIds: string[]) => {
    setSelectedInstanceIds((current) => {
      const allVisibleSelected = instanceIds.every((instanceId) => current.includes(instanceId));
      if (allVisibleSelected) {
        return current.filter((selectedId) => !instanceIds.includes(selectedId));
      }

      const nextIds = new Set(current);
      instanceIds.forEach((instanceId) => nextIds.add(instanceId));
      return Array.from(nextIds);
    });
  };

  interface ImportRow {
    modelId?: string;
    serialNumber?: string;
    barcode?: string;
    locationId?: string;
  }

  const handleImportInstances = async (data: ImportRow[]) => {
    try {
      let successCount = 0;
      for (const item of data) {
        if (!item.modelId || !item.serialNumber || !item.locationId) {
          console.error("Skipping invalid import row (missing required fields):", item);
          continue;
        }
        try {
          const payload: CreateMaterialInstancePayload = {
            modelId: item.modelId,
            serialNumber: item.serialNumber,
            locationId: item.locationId,
            barcode: item.barcode?.trim() || undefined,
          };

          await addInstance(
            payload,
            true, // skipFetch: true, avoid refetching inside the loop
          );
          successCount++;
        } catch (itemError) {
          console.error("Error importing item:", item, itemError);
        }
      }

      // One single final refetch after all items are imported
      if (successCount > 0) {
        await refetch();
      }

      showToast(
        "success",
        t("materialInstances.toast.importSuccess", { success: successCount, total: data.length }),
        t("materialInstances.toast.importSuccessTitle"),
      );
    } catch (error: unknown) {
      showToast(
        "error",
        error instanceof Error ? error.message : t("materialInstances.toast.importError"),
        t("materialInstances.toast.importErrorTitle"),
      );
    }
  };

  const findInstanceByScannedCode = useCallback(
    (rawCode: string) => {
      const normalizedCode = rawCode.trim().toLowerCase();
      if (!normalizedCode) {
        return null;
      }

      return (
        instances.find((inst) => {
          const serial = inst.serialNumber.trim().toLowerCase();
          const barcode = (inst.barcode ?? "").trim().toLowerCase();
          return serial === normalizedCode || barcode === normalizedCode;
        }) ?? null
      );
    },
    [instances],
  );

  const handleScan = useCallback(
    (code: string) => {
      const cleanedCode = code.trim();
      if (!cleanedCode) {
        return;
      }

      setLastScannedCode(cleanedCode);
      setSearchTerm(cleanedCode);
      setPage(1);

      const matchedInstance = findInstanceByScannedCode(cleanedCode);
      if (matchedInstance) {
        setSelectedInstance(matchedInstance);
        showToast(
          "success",
          matchedInstance.barcode
            ? t("materialInstances.toast.scanFoundBarcode", {
                serial: matchedInstance.serialNumber,
                barcode: matchedInstance.barcode,
              })
            : t("materialInstances.toast.scanFound", { serial: matchedInstance.serialNumber }),
          t("materialInstances.toast.scanFoundTitle"),
        );
        return;
      }

      setFormInitialData({ barcode: cleanedCode });
      showToast(
        "warning",
        t("materialInstances.toast.scanNotFound", { code: cleanedCode }),
        t("materialInstances.toast.scanNotFoundTitle"),
        {
          duration: 8000,
          action: {
            label: t("materialInstances.toast.scanRegister"),
            onClick: () => {
              if (!canCreateInstance) {
                setIsDependencyModalOpen(true);
                return;
              }
              setIsFormModalOpen(true);
            },
          },
        },
      );
    },
    [canCreateInstance, findInstanceByScannedCode, showToast, t],
  );

  useBarcodeScanner({
    onScan: handleScan,
    enabled: isScannerEnabled,
  });

  const handleManualScan = () => {
    handleScan(scanInput);
    setScanInput("");
  };

  const handleQuickStatusChange = async (status: MaterialInstanceStatus) => {
    if (!selectedInstance) {
      return;
    }

    try {
      setStatusUpdateLoading(true);
      const updated = await updateInstanceStatus(selectedInstance._id, {
        status,
        notes: lastScannedCode
          ? `Updated from scanner flow using code ${lastScannedCode}`
          : "Updated from scanner flow",
      });
      setSelectedInstance(updated);
      showToast(
        "success",
        t("materialInstances.toast.statusUpdated", {
          status: status.toUpperCase(),
          serial: updated.serialNumber,
        }),
        t("materialInstances.toast.statusUpdatedTitle"),
      );
    } catch (statusError: unknown) {
      showToast(
        "error",
        statusError instanceof Error
          ? statusError.message
          : t("materialInstances.toast.statusError"),
        t("common.error"),
      );
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="mb-6 sm:mb-8 space-y-3">
            <div className="h-9 w-72 rounded bg-[#262626]" />
            <div className="h-4 w-96 rounded bg-[#222]" />
          </div>
          <div className="mb-6 h-14 rounded-lg bg-[#1a1a1a] border border-[#333]" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="h-28 rounded-lg bg-[#1a1a1a] border border-[#333]" />
            <div className="h-28 rounded-lg bg-[#1a1a1a] border border-[#333]" />
            <div className="h-28 rounded-lg bg-[#1a1a1a] border border-[#333]" />
            <div className="h-28 rounded-lg bg-[#1a1a1a] border border-[#333]" />
          </div>
          <div className="rounded-lg bg-[#1a1a1a] border border-[#333] p-6 space-y-3">
            <div className="h-12 rounded bg-[#232323]" />
            <div className="h-12 rounded bg-[#232323]" />
            <div className="h-12 rounded bg-[#232323]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="bg-[#1a1a1a] border border-red-900/70 rounded-xl p-6 max-w-lg w-full">
          <h2 className="text-xl font-semibold text-red-300 mb-2">
            {t("materialInstances.errorLoad")}
          </h2>
          <p className="text-sm text-red-200/80 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-4 py-2 rounded-lg border border-[#B88A00] text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors"
          >
            {t("materialInstances.retry")}
          </button>
        </div>
      </div>
    );
  }

  const statusCounts = instances.reduce(
    (acc, inst) => {
      acc[inst.status] = (acc[inst.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (!hasPermission("materials:read")) {
    return <Unauthorized />;
  }

  return (
    <div className="min-h-screen bg-[#121212] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div data-help-id="material-instances-title" className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t("materialInstances.title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-400">{t("materialInstances.description")}</p>
        </div>

        {/* Actions Bar */}
        <div data-help-id="material-instances-actions" className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <label htmlFor={searchInputId} className="sr-only">
              {t("materialInstances.searchLabel")}
            </label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              id={searchInputId}
              type="text"
              placeholder={t("materialInstances.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowBarcodePreview((prev) => !prev)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-[#333] bg-[#1a1a1a] text-gray-300 transition-colors hover:bg-[#202020] hover:text-white text-sm sm:text-base"
            >
              <Eye size={18} />
              <span className="hidden sm:inline">
                {showBarcodePreview
                  ? t("materialInstances.hideBarcodes")
                  : t("materialInstances.showBarcodes")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenBarcodePrintModal(filteredInstances)}
              disabled={filteredInstances.length === 0}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-[#FFD700]/35 bg-[#FFD700]/8 text-[#FFD700] font-semibold transition-colors hover:bg-[#FFD700]/14 disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">{t("materialInstances.printBarcodes")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenBarcodePrintModal(selectedInstances)}
              disabled={selectedInstances.length === 0}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-[#333] bg-[#1a1a1a] text-gray-300 transition-colors hover:bg-[#202020] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">
                {t("materialInstances.printSelected", { count: selectedInstances.length })}
              </span>
            </button>
            <ExcelExportImport
              data={exportRows}
              filename="material-instances"
              onImport={FEATURE_FLAGS.ENABLE_DATA_IMPORT ? handleImportInstances : undefined}
              importDisabled={
                FEATURE_FLAGS.ENABLE_DATA_IMPORT ? !isAllowed("materials:create") : undefined
              }
              onImportDenied={
                FEATURE_FLAGS.ENABLE_DATA_IMPORT ? guard("materials:create", () => {}) : undefined
              }
              showLabels={true}
            />
            <button
              onClick={guard("materials:create", handleOpenCreateModal)}
              aria-disabled={!isAllowed("materials:create")}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold rounded-lg transition-colors whitespace-nowrap gold-action-btn col-span-2 sm:col-span-1 text-sm sm:text-base ${!isAllowed("materials:create") ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Plus size={20} />
              {t("materialInstances.newInstance")}
            </button>
          </div>
        </div>

        {/* Barcode Scanner */}
        <div
          data-help-id="material-instances-scanner"
          className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 sm:p-5 mb-6 space-y-3 sm:space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Barcode size={18} className="text-[#FFD700]" />
              <h2 className="text-white font-semibold">{t("materialInstances.scannerTitle")}</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsScannerEnabled((prev) => !prev)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                isScannerEnabled
                  ? "border-green-600/40 text-green-300 bg-green-700/10"
                  : "border-[#555] text-gray-300 bg-[#202020]"
              }`}
            >
              {isScannerEnabled
                ? t("materialInstances.scannerEnabled")
                : t("materialInstances.scannerDisabled")}
            </button>
          </div>

          <p className="text-sm text-gray-400">{t("materialInstances.scannerDescription")}</p>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor={scannerInputId} className="sr-only">
                Scan code input
              </label>
              <input
                id={scannerInputId}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleManualScan();
                  }
                }}
                className="w-full px-4 py-2.5 bg-[#111] border border-[#333] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
                placeholder={t("materialInstances.scanPlaceholder")}
              />
            </div>
            <button
              type="button"
              onClick={handleManualScan}
              className="px-4 py-2.5 border border-[#B88A00] text-[#FFD700] hover:bg-[#FFD700]/10 rounded font-medium transition-colors"
            >
              {t("materialInstances.findCode")}
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-1">
            <p className="text-xs text-gray-500">
              {t("materialInstances.lastScanned")}{" "}
              <span className="text-gray-300 font-mono">{lastScannedCode || "-"}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!selectedInstance || statusUpdateLoading}
                onClick={guard("materials:update", () => void handleQuickStatusChange("loaned"))}
                className="px-3 py-1.5 text-xs rounded border border-yellow-600/40 text-yellow-300 bg-yellow-700/10 hover:bg-yellow-700/20 transition-colors disabled:opacity-50"
              >
                {t("materialInstances.markLoaned")}
              </button>
              <button
                type="button"
                disabled={!selectedInstance || statusUpdateLoading}
                onClick={guard("materials:update", () => void handleQuickStatusChange("returned"))}
                className="px-3 py-1.5 text-xs rounded border border-blue-600/40 text-blue-300 bg-blue-700/10 hover:bg-blue-700/20 transition-colors disabled:opacity-50"
              >
                {t("materialInstances.markReturned")}
              </button>
              <button
                type="button"
                disabled={!selectedInstance || statusUpdateLoading}
                onClick={guard("materials:update", () => void handleQuickStatusChange("available"))}
                className="px-3 py-1.5 text-xs rounded border border-green-600/40 text-green-300 bg-green-700/10 hover:bg-green-700/20 transition-colors disabled:opacity-50"
              >
                {t("materialInstances.markAvailable")}
              </button>
              <button
                type="button"
                disabled={!selectedInstance || statusUpdateLoading}
                onClick={guard(
                  "materials:update",
                  () => void handleQuickStatusChange("maintenance"),
                )}
                className="px-3 py-1.5 text-xs rounded border border-orange-600/40 text-orange-300 bg-orange-700/10 hover:bg-orange-700/20 transition-colors disabled:opacity-50"
              >
                {t("materialInstances.markMaintenance")}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          data-help-id="material-instances-stats"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6"
        >
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">{t("materialInstances.totalInstances")}</p>
            <p className="text-3xl font-bold text-white">{instances.length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">{t("materialInstances.available")}</p>
            <p className="text-3xl font-bold text-green-400">{statusCounts.available || 0}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">{t("materialInstances.inUse")}</p>
            <p className="text-3xl font-bold text-yellow-400">
              {(statusCounts.reserved || 0) + (statusCounts.loaned || 0)}
            </p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">{t("materialInstances.needsAttention")}</p>
            <p className="text-3xl font-bold text-red-400">
              {(statusCounts.maintenance || 0) + (statusCounts.damaged || 0)}
            </p>
          </div>
        </div>

        {/* Instance List */}
        <div
          data-help-id="material-instances-list"
          className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6"
        >
          {selectedInstances.length > 0 && (
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[#3b3320] bg-[#1b1710] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[#FFD700]">
                {t("materialInstances.selectedForPrint", { count: selectedInstances.length })}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenBarcodePrintModal(selectedInstances)}
                  className="rounded-lg border border-[#FFD700]/35 bg-[#FFD700]/10 px-3 py-2 font-semibold text-[#FFD700] transition-colors hover:bg-[#FFD700]/16"
                >
                  {t("materialInstances.printSelectedBtn")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInstanceIds([])}
                  className="rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-gray-300 transition-colors hover:bg-[#202020] hover:text-white"
                >
                  {t("materialInstances.clearSelection")}
                </button>
              </div>
            </div>
          )}

          <MaterialInstanceList
            instances={pagedInstances}
            selectedInstanceIds={selectedInstanceIds}
            onView={setSelectedInstance}
            onPrint={(instance) => handleOpenBarcodePrintModal([instance])}
            onEdit={() => {
              showToast(
                "info",
                t("materialInstances.toast.editComingSoon"),
                t("materialInstances.toast.editComingSoonTitle"),
              );
            }}
            onDelete={handleDelete}
            showBarcodePreview={showBarcodePreview}
            onToggleSelect={handleToggleInstanceSelection}
            onToggleSelectAll={handleToggleSelectAllVisible}
          />
          <div data-help-id="material-instances-pagination">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredInstances.length}
              pageSize={pageSize}
              itemLabel={t("materialInstances.paginationLabel")}
              onPageChange={setPage}
            />
          </div>
        </div>

        {/* Form Modal */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#121212] border border-[#333] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
                <h2 className="text-xl font-bold text-white">
                  {formInitialData?.barcode
                    ? t("materialInstances.registerBarcode")
                    : t("materialInstances.newInstanceModal")}
                </h2>
                <button
                  onClick={() => {
                    setIsFormModalOpen(false);
                    setFormInitialData(undefined);
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <MaterialInstanceForm
                  onSubmit={handleCreateOrUpdate}
                  onCancel={() => {
                    setIsFormModalOpen(false);
                    setFormInitialData(undefined);
                  }}
                  initialData={formInitialData}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dependency Modal */}
        {isDependencyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#121212] border border-[#333] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
                <h2 className="text-xl font-bold text-white">
                  {t("materialInstances.requirementsTitle")}
                </h2>
                <button
                  onClick={() => setIsDependencyModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-3 mb-5">
                  <AlertTriangle className="text-[#FFD700] mt-0.5" size={22} />
                  <div>
                    <p className="text-white font-semibold mb-2">
                      {t("materialInstances.requirementsMessage")}
                    </p>
                    <p className="text-gray-300 text-sm">
                      {t("materialInstances.requirementsHint")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {!hasMaterialTypes && (
                    <div className="text-sm text-red-300 bg-[#2a1f1f] border border-[#4a2a2a] rounded-lg px-3 py-2">
                      {t("materialInstances.missingTypes")}
                    </div>
                  )}
                  {!hasLocations && (
                    <div className="text-sm text-red-300 bg-[#2a1f1f] border border-[#4a2a2a] rounded-lg px-3 py-2">
                      {t("materialInstances.missingLocations")}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {!hasMaterialTypes && (
                    <button
                      onClick={() => {
                        setIsDependencyModalOpen(false);
                        navigate("/app/material-types");
                      }}
                      className="px-5 py-2.5 font-semibold rounded-lg transition-colors gold-action-btn"
                    >
                      {t("materialInstances.goToTypes")}
                    </button>
                  )}
                  {!hasLocations && (
                    <button
                      onClick={() => {
                        setIsDependencyModalOpen(false);
                        navigate("/app/locations");
                      }}
                      className="px-5 py-2.5 font-semibold rounded-lg transition-colors gold-action-btn"
                    >
                      {t("materialInstances.goToLocations")}
                    </button>
                  )}
                  <button
                    onClick={() => setIsDependencyModalOpen(false)}
                    className="px-5 py-2.5 bg-transparent text-gray-300 border border-[#333] rounded-lg hover:bg-[#222] transition-colors"
                  >
                    {t("common.close")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedInstance && (
          <MaterialInstanceDetailModal
            instance={selectedInstance}
            onClose={() => setSelectedInstance(null)}
          />
        )}

        <BarcodePrintModal
          isOpen={isBarcodePrintModalOpen}
          instances={barcodePrintSelection}
          onClose={() => {
            setIsBarcodePrintModalOpen(false);
            setBarcodePrintSelection([]);
          }}
        />
      </div>
    </div>
  );
};
