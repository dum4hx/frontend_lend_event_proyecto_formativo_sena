/**
 * Customers — Main orchestrator for the Customers page.
 * Composes filters, table, detail/create/edit modals, and pagination.
 * All data flows through TanStack Query hooks.
 */

import { useState, useCallback } from "react";
import { Users, UserCheck, UserX, ShieldOff } from "lucide-react";
import { PageHeader, Pagination } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import { usePermissions } from "../../../../contexts/usePermissions";
import { useConfirmModal } from "../../../../hooks/useConfirmModal";
import { useToast } from "../../../../hooks/useToast";
import {
  useCustomers,
  useDocumentTypes,
  useCreateCustomer,
  useUpdateCustomer,
  useBlacklistCustomer,
  useActivateCustomer,
  useDeactivateCustomer,
  useDeleteCustomer,
} from "../../../../hooks/queries/useCustomerQueries";
import type {
  Customer,
  CustomerStatus,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  DocumentType,
} from "../../../../types/api";
import { ApiError } from "../../../../lib/api";
import { CustomerFilters } from "./CustomerFilters";
import { CustomerTable } from "./CustomerTable";
import { CustomerDetailModal } from "./CustomerDetailModal";
import { CustomerCreateModal } from "./CustomerCreateModal";
import { CustomerEditModal } from "./CustomerEditModal";
import Unauthorized from "../../../../pages/Unauthorized";

const ITEMS_PER_PAGE = 10;

/** Stat card shown in the summary row. */
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-4 shadow-lg flex items-center gap-4">
      <div className={`p-3 rounded-xl ${accent}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

export default function Customers() {
  const { language } = useLanguage();
  const isEs = language === "es";
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const { showConfirm, ConfirmModal } = useConfirmModal();

  // --- Filter & pagination state ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "">("");
  const [docTypeFilter, setDocTypeFilter] = useState<DocumentType | "">("");
  const [currentPage, setCurrentPage] = useState(1);

  // --- Modal state ---
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // --- TanStack Query hooks ---
  const queryParams = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: search || undefined,
    status: statusFilter || undefined,
    documentType: docTypeFilter || undefined,
  };

  const { data, isLoading: customersLoading, error: customersError } = useCustomers(queryParams);
  const { data: documentTypes = [], isLoading: docTypesLoading } = useDocumentTypes();

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const blacklistMutation = useBlacklistCustomer();
  const activateMutation = useActivateCustomer();
  const deactivateMutation = useDeactivateCustomer();
  const deleteMutation = useDeleteCustomer();

  const customers = data?.customers ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  // Derive counts from current page data — a rough overview
  const activeCount = customers.filter((c) => c.status === "active").length;
  const inactiveCount = customers.filter((c) => c.status === "inactive").length;
  const blacklistedCount = customers.filter((c) => c.status === "blacklisted").length;

  // --- Helpers ---
  const formatFullName = (c: Customer) =>
    [c.name.firstName, c.name.secondName, c.name.firstSurname, c.name.secondSurname]
      .filter(Boolean)
      .join(" ");

  const errorMessage = (err: unknown, fallbackEs: string, fallbackEn: string) =>
    err instanceof ApiError ? err.message : isEs ? fallbackEs : fallbackEn;

  // --- Filter handlers (reset page on filter change) ---
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((v: string) => {
    setStatusFilter(v as CustomerStatus | "");
    setCurrentPage(1);
  }, []);

  const handleDocTypeChange = useCallback((v: string) => {
    setDocTypeFilter(v as DocumentType | "");
    setCurrentPage(1);
  }, []);

  // --- CRUD handlers ---
  const handleCreate = async (payload: CreateCustomerPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      setShowCreate(false);
      showToast("success", isEs ? "Cliente creado exitosamente" : "Customer created successfully");
    } catch (err) {
      showToast(
        "error",
        errorMessage(err, "No se pudo crear el cliente", "Failed to create customer"),
      );
      throw err; // let modal keep open
    }
  };

  const handleUpdate = async (id: string, payload: UpdateCustomerPayload) => {
    try {
      await updateMutation.mutateAsync({ id, payload });
      setEditCustomer(null);
      showToast("success", isEs ? "Cliente actualizado" : "Customer updated successfully");
    } catch (err) {
      showToast(
        "error",
        errorMessage(err, "No se pudo actualizar el cliente", "Failed to update customer"),
      );
      throw err;
    }
  };

  const handleBlacklist = async (customer: Customer) => {
    const name = formatFullName(customer);
    const confirmed = await showConfirm({
      title: isEs ? `¿Bloquear a ${name}?` : `Block ${name}?`,
      message: isEs
        ? "Esto impedirá usar este cliente en nuevos alquileres."
        : "This will prevent the customer from being used in new rentals.",
      confirmText: isEs ? "Bloquear" : "Block",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await blacklistMutation.mutateAsync(customer._id);
      showToast("success", isEs ? "Cliente bloqueado" : "Customer blocked");
    } catch (err) {
      showToast(
        "error",
        errorMessage(err, "No se pudo bloquear el cliente", "Failed to block customer"),
      );
    }
  };

  const handleDeactivate = async (customer: Customer) => {
    const name = formatFullName(customer);
    const confirmed = await showConfirm({
      title: isEs ? `¿Desactivar a ${name}?` : `Deactivate ${name}?`,
      message: isEs
        ? "Esto desactivará temporalmente al cliente."
        : "This will temporarily deactivate the customer.",
      confirmText: isEs ? "Desactivar" : "Deactivate",
      variant: "warning",
    });
    if (!confirmed) return;
    try {
      await deactivateMutation.mutateAsync(customer._id);
      showToast("success", isEs ? "Cliente desactivado" : "Customer deactivated");
    } catch (err) {
      showToast(
        "error",
        errorMessage(err, "No se pudo desactivar el cliente", "Failed to deactivate customer"),
      );
    }
  };

  const handleReactivate = async (customer: Customer) => {
    const name = formatFullName(customer);
    const confirmed = await showConfirm({
      title: isEs ? `¿Activar a ${name}?` : `Activate ${name}?`,
      message: isEs
        ? "Esto restaurará al cliente a estado activo."
        : "This will restore the customer to active status.",
      confirmText: isEs ? "Activar" : "Activate",
      variant: "info",
    });
    if (!confirmed) return;
    try {
      await activateMutation.mutateAsync(customer._id);
      showToast("success", isEs ? "Cliente activado" : "Customer activated");
    } catch (err) {
      showToast(
        "error",
        errorMessage(err, "No se pudo activar el cliente", "Failed to activate customer"),
      );
    }
  };

  const handleDelete = async (customer: Customer) => {
    const name = formatFullName(customer);
    const confirmed = await showConfirm({
      title: isEs ? `¿Eliminar a ${name}?` : `Delete ${name}?`,
      message: isEs
        ? "Esta acción es destructiva y no se puede deshacer. El cliente se eliminará de las operaciones activas."
        : "This action is destructive and cannot be undone. The customer will be removed from active operations.",
      confirmText: isEs ? "Eliminar permanentemente" : "Delete permanently",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(customer._id);
      showToast("success", isEs ? "Cliente eliminado" : "Customer deleted");
    } catch (err) {
      showToast(
        "error",
        errorMessage(err, "No se pudo eliminar el cliente", "Failed to delete customer"),
      );
    }
  };

  // --- Render ----------------------------------------------------------------
  const loading = customersLoading || docTypesLoading;

  if (!hasPermission("customers:read")) return <Unauthorized />;

  return (
    <div className="page-container">
      {/* Header */}
      <div data-help-id="customers-title">
        <PageHeader
          title={isEs ? "Clientes" : "Customers"}
          titleAccent=""
          subtitle={
            isEs
              ? "Gestiona los clientes de tu organización"
              : "Manage your organization's customers"
          }
        />
      </div>

      {/* Stat Cards */}
      <div data-help-id="customers-stat-cards" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label={isEs ? "Total" : "Total"}
          value={total}
          accent="bg-yellow-400/10 text-yellow-400"
        />
        <StatCard
          icon={UserCheck}
          label={isEs ? "Activos" : "Active"}
          value={activeCount}
          accent="bg-emerald-400/10 text-emerald-400"
        />
        <StatCard
          icon={UserX}
          label={isEs ? "Inactivos" : "Inactive"}
          value={inactiveCount}
          accent="bg-orange-400/10 text-orange-400"
        />
        <StatCard
          icon={ShieldOff}
          label={isEs ? "Bloqueados" : "Blocked"}
          value={blacklistedCount}
          accent="bg-red-400/10 text-red-400"
        />
      </div>

      {/* API error banner */}
      {customersError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400">
            {customersError instanceof ApiError
              ? customersError.message
              : isEs
                ? "Error al cargar clientes"
                : "Error loading customers"}
          </p>
        </div>
      )}

      {/* Filters */}
      <div data-help-id="customers-filters">
        <CustomerFilters
          search={search}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          documentTypeFilter={docTypeFilter}
          onDocumentTypeChange={handleDocTypeChange}
          documentTypes={documentTypes}
          onCreateClick={() => setShowCreate(true)}
        />
      </div>

      {/* Table / Loading / Empty */}
      {loading ? (
        <div className="depth-card flex flex-col items-center justify-center py-12">
          <div className="spinner w-8 h-8" />
          <p className="mt-4 text-gray-400">
            {isEs ? "Cargando clientes..." : "Loading customers..."}
          </p>
        </div>
      ) : customers.length === 0 ? (
        <div data-help-id="customers-table" className="depth-card text-center py-12">
          <p className="text-gray-500 text-sm">
            {isEs ? "No se encontraron clientes" : "No customers found"}
          </p>
        </div>
      ) : (
        <div data-help-id="customers-table" className="depth-card">
          <CustomerTable
            customers={customers}
            loading={loading}
            documentTypes={documentTypes}
            onView={(c) => setViewCustomer(c)}
            onEdit={(c) => setEditCustomer(c)}
            onDeactivate={(c) => void handleDeactivate(c)}
            onBlacklist={(c) => void handleBlacklist(c)}
            onReactivate={(c) => void handleReactivate(c)}
            onDelete={(c) => void handleDelete(c)}
          />
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div data-help-id="customers-pagination">
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* ----- Modals ----- */}
      <CustomerDetailModal
        open={!!viewCustomer}
        onClose={() => setViewCustomer(null)}
        customer={viewCustomer}
        documentTypes={documentTypes}
        onEdit={(c) => {
          setViewCustomer(null);
          setEditCustomer(c);
        }}
      />

      <CustomerCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        documentTypes={documentTypes}
        onSubmit={handleCreate}
        loading={createMutation.isPending}
      />

      <CustomerEditModal
        open={!!editCustomer}
        onClose={() => setEditCustomer(null)}
        customer={editCustomer}
        documentTypes={documentTypes}
        onSubmit={handleUpdate}
        loading={updateMutation.isPending}
      />

      {/* Confirm dialog for destructive actions */}
      <ConfirmModal />
    </div>
  );
}
