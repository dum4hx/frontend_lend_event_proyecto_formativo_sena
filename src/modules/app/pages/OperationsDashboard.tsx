/**
 * OperationsDashboard — Location-scoped operations hub for Warehouse Operators.
 *
 * Shows a KPI snapshot followed by all actionable queues.
 * If the user has multiple locations, a selector is provided.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, MapPin } from "lucide-react";
import { useAuth } from "../../../contexts/useAuth";
import { useLanguage } from "../../../contexts/useLanguage";
import { LoadingSpinner, SearchableSelect, PageHeader } from "../../../components/ui";
import { pageVariants } from "../../../lib/animations";
import { getLocation as fetchLocationById } from "../../../services/warehouseOperatorService";
import type { WarehouseLocation } from "../../../services/warehouseOperatorService";
import {
  useOpsOverview,
  useOpsInspections,
  useOpsOverdueFinancials,
  useOpsInventoryIssues,
  useOpsTransfers,
  useOpsLoanDeadlines,
  useOpsDamages,
  useOpsTasks,
} from "../../../hooks/queries/useOperationsQueries";
import { OpsKpiGrid } from "./operations/OpsKpiGrid";
import { OpsTaskList } from "./operations/OpsTaskList";
import { OpsInspectionPanel } from "./operations/OpsInspectionPanel";
import { OpsFinancialsPanel } from "./operations/OpsFinancialsPanel";
import { OpsInventoryPanel } from "./operations/OpsInventoryPanel";
import { OpsTransfersPanel } from "./operations/OpsTransfersPanel";
import { OpsDeadlinesPanel } from "./operations/OpsDeadlinesPanel";
import { OpsDamagesPanel } from "./operations/OpsDamagesPanel";
import { useQueryClient } from "@tanstack/react-query";
import { OPERATIONS_KEYS } from "../../../hooks/queries/useOperationsQueries";

type TabKey =
  | "overview"
  | "inspections"
  | "financials"
  | "inventory"
  | "transfers"
  | "deadlines"
  | "damages";

interface TabDef {
  key: TabKey;
  labelEn: string;
  labelEs: string;
}

const TABS: TabDef[] = [
  { key: "overview", labelEn: "Overview", labelEs: "Vista General" },
  { key: "inspections", labelEn: "Inspections", labelEs: "Inspecciones" },
  { key: "financials", labelEn: "Financials", labelEs: "Finanzas" },
  { key: "inventory", labelEn: "Inventory", labelEs: "Inventario" },
  { key: "transfers", labelEn: "Transfers", labelEs: "Transferencias" },
  { key: "deadlines", labelEn: "Deadlines", labelEs: "Vencimientos" },
  { key: "damages", labelEn: "Damages", labelEs: "Daños" },
];

function NoLocationState({ isEs }: { isEs: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <MapPin size={40} className="text-zinc-600" />
      <h3 className="text-lg font-semibold text-zinc-300">
        {isEs ? "Sin ubicación asignada" : "No Location Assigned"}
      </h3>
      <p className="text-sm text-zinc-500 text-center max-w-sm">
        {isEs
          ? "Tu cuenta no tiene ubicaciones asignadas. Contacta a un administrador."
          : "Your account has no assigned locations. Contact an administrator."}
      </p>
    </div>
  );
}

export default function OperationsDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === "es";
  const queryClient = useQueryClient();

  // If user has multiple locations, let them pick one
  const locationIds: string[] = user?.locations ?? [];
  const [selectedLocation, setSelectedLocation] = useState<string>(locationIds[0] ?? "");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch location names for the selector
  const [locationMap, setLocationMap] = useState<Record<string, string>>({});
  useEffect(() => {
    if (locationIds.length === 0) return;
    let cancelled = false;
    const load = async () => {
      const entries: Record<string, string> = {};
      await Promise.all(
        locationIds.map(async (id) => {
          try {
            const res = await fetchLocationById(id);
            const loc = res.data as WarehouseLocation;
            entries[id] = loc.name || id;
          } catch {
            entries[id] = id;
          }
        }),
      );
      if (!cancelled) setLocationMap(entries);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [locationIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Queries — only fire when locationId is set
  const overview = useOpsOverview(selectedLocation);
  const inspections = useOpsInspections(selectedLocation);
  const financials = useOpsOverdueFinancials(selectedLocation);
  const inventory = useOpsInventoryIssues(selectedLocation);
  const transfers = useOpsTransfers(selectedLocation);
  const deadlines = useOpsLoanDeadlines(selectedLocation);
  const damages = useOpsDamages(selectedLocation);
  const tasks = useOpsTasks(selectedLocation);

  const isInitialLoading = overview.isLoading || tasks.isLoading;

  async function handleRefresh() {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: OPERATIONS_KEYS.all(selectedLocation) });
    setIsRefreshing(false);
  }

  if (!locationIds.length) {
    return <NoLocationState isEs={isEs} />;
  }

  const locationOptions = locationIds.map((id) => ({
    value: id,
    label: locationMap[id] || id,
  }));

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-container"
    >
      <div data-help-id="operations-header">
        <PageHeader
          title={isEs ? "Panel de Operaciones" : "Operations Dashboard"}
          subtitle={
            isEs
              ? "Vista en tiempo real de las operaciones de tu ubicación."
              : "Real-time view of your location's operations."
          }
          actions={
            <div className="flex items-center gap-3" data-help-id="operations-actions">
              {locationIds.length > 1 && (
                <div className="w-52">
                  <SearchableSelect
                    options={locationOptions}
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    placeholder={isEs ? "Seleccionar ubicación" : "Select location"}
                  />
                </div>
              )}
              {locationIds.length === 1 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg depth-card text-sm text-zinc-300">
                  <MapPin size={14} className="text-yellow-400" />
                  <span className="text-xs font-medium">
                    {locationMap[selectedLocation] || selectedLocation}
                  </span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 rounded-lg depth-card text-sm text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {isEs ? "Actualizar" : "Refresh"}
              </button>
            </div>
          }
        />
      </div>

      {/* KPI Bar — always visible */}
      {isInitialLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : overview.data ? (
        <div data-help-id="operations-kpis">
          <OpsKpiGrid data={overview.data} />
        </div>
      ) : null}

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none" data-help-id="operations-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-yellow-400 text-zinc-900 shadow-lg shadow-yellow-400/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            {isEs ? tab.labelEs : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          data-help-id="operations-panels"
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tasks full-width at the top */}
              <div className="lg:col-span-2">
                {tasks.isLoading ? (
                  <div className="depth-card rounded-xl p-8 flex justify-center">
                    <LoadingSpinner />
                  </div>
                ) : tasks.data ? (
                  <OpsTaskList data={tasks.data} />
                ) : null}
              </div>
              {/* Quick previews of the most critical panels */}
              {inspections.data ? (
                <OpsInspectionPanel data={inspections.data} />
              ) : inspections.isLoading ? (
                <div className="depth-card rounded-xl p-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : null}
              {financials.data ? (
                <OpsFinancialsPanel data={financials.data} />
              ) : financials.isLoading ? (
                <div className="depth-card rounded-xl p-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : null}
            </div>
          )}

          {activeTab === "inspections" && (
            <div className="max-w-2xl">
              {inspections.isLoading ? (
                <div className="depth-card rounded-xl p-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : inspections.data ? (
                <OpsInspectionPanel data={inspections.data} />
              ) : null}
            </div>
          )}

          {activeTab === "financials" && (
            <div className="max-w-2xl">
              {financials.isLoading ? (
                <div className="depth-card rounded-xl p-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : financials.data ? (
                <OpsFinancialsPanel data={financials.data} />
              ) : null}
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="max-w-2xl">
              {inventory.isLoading ? (
                <div className="depth-card rounded-xl p-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : inventory.data ? (
                <OpsInventoryPanel data={inventory.data} />
              ) : null}
            </div>
          )}

          {activeTab === "transfers" && (
            <div className="max-w-2xl">
              {transfers.isLoading ? (
                <div className="depth-card rounded-xl p-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : transfers.data ? (
                <OpsTransfersPanel data={transfers.data} />
              ) : null}
            </div>
          )}

          {activeTab === "deadlines" && (
            <div className="max-w-2xl">
              {deadlines.isLoading ? (
                <div className="depth-card rounded-xl p-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : deadlines.data ? (
                <OpsDeadlinesPanel data={deadlines.data} />
              ) : null}
            </div>
          )}

          {activeTab === "damages" && (
            <div className="max-w-2xl">
              {damages.isLoading ? (
                <div className="depth-card rounded-xl p-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : damages.data ? (
                <OpsDamagesPanel data={damages.data} />
              ) : null}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
