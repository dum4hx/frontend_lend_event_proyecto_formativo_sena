import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X, CreditCard } from "lucide-react";
import { Button, IconButton, PageHeader } from "../../../../components/ui";
import type {
  Customer,
  CreateLoanRequestPayload,
  LoanRequest,
  MaterialCategory,
  MaterialInstance,
  MaterialType,
  Package,
} from "../../../../types/api";
import {
  createRequest,
  getRequests,
  approveRequest,
  rejectRequest,
  updateRequest,
  markRequestReady,
  createLoanFromRequest,
  returnLoan,
  recordPayment,
  recordRentalPayment,
} from "../../../../services/loanService";
import { getCustomers } from "../../../../services/customerService";
import { getOrganizationSettings } from "../../../../services/organizationService";
import {
  getMaterialCategories,
  getMaterialInstances,
  getMaterialTypes,
  getPackages,
} from "../../../../services/materialService";
import { useAlertModal } from "../../../../hooks/useAlertModal";
import { useActionPermission } from "../../../../hooks/useActionPermission";
import { usePermissions } from "../../../../contexts/usePermissions";
import { useLanguage } from "../../../../contexts/useLanguage";
import PrepareOrderModal from "../PrepareOrderModal";
import Unauthorized from "../../../../pages/Unauthorized";

import type { OrderView, WorkflowFilter } from "./types";
import {
  buildOrderViewModel,
  extractMaterialTypeIdFromPackageEntry,
  toBackendRequestStatusFilter,
} from "./helpers";
import { OrdersFilters } from "./OrdersFilters";
import { OrdersTable } from "./OrdersTable";
import { CreateOrderModal } from "./CreateOrderModal";
import { OrderDetailModal } from "./OrderDetailModal";

export function Orders() {
  const { showError, showSuccess, AlertModal } = useAlertModal();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { language } = useLanguage();
  const isEs = language === "es";
  const { guard } = useActionPermission(isEs ? "es" : "en");

  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([]);
  const [materialInstances, setMaterialInstances] = useState<MaterialInstance[]>([]);
  const [inventoryDataAvailable, setInventoryDataAvailable] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadWarning, setLoadWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<WorkflowFilter>("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderView | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OrderView | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<OrderView | null>(null);
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [prepareTargetOrder, setPrepareTargetOrder] = useState<OrderView | null>(null);
  const [prepareRequiredTypes, setPrepareRequiredTypes] = useState<
    Array<{ materialTypeId: string; materialTypeName: string; quantity: number }>
  >([]);
  const [rejectReason, setRejectReason] = useState("");
  const [reactivateReason, setReactivateReason] = useState("");
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<OrderView | null>(null);
  const [showRentalPaymentModal, setShowRentalPaymentModal] = useState(false);
  const [rentalPaymentTarget, setRentalPaymentTarget] = useState<OrderView | null>(null);
  const [requireFullPayment, setRequireFullPayment] = useState(false);

  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsPageSize] = useState(20);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);
  const [requestsTotal, setRequestsTotal] = useState(0);

  const canCreateRequest = hasPermission("requests:create");
  const canApproveRequest = hasPermission("requests:approve");
  const canUpdateRequest = hasPermission("requests:update");
  const canAssignRequest = hasPermission("requests:assign");
  const canCreateLoan = hasAnyPermission(["loans:create", "loans:checkout"]);
  const canReturnLoan = hasPermission("loans:return");
  const canRecordPayment = hasPermission("requests:update");

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        requestsRes,
        customersRes,
        categoriesRes,
        instancesRes,
        packagesRes,
        materialTypesRes,
        orgSettingsRes,
      ] = await Promise.allSettled([
        getRequests({
          page: requestsPage,
          limit: requestsPageSize,
          status: toBackendRequestStatusFilter(selectedStatus),
        }),
        getCustomers({ page: 1, limit: 50 }),
        getMaterialCategories(),
        getMaterialInstances(),
        getPackages({ page: 1, limit: 100 }),
        getMaterialTypes(),
        getOrganizationSettings(),
      ]);

      let requestsFailed = requestsRes.status === "rejected";
      let customersFailed = customersRes.status === "rejected";
      const categoriesFailed = categoriesRes.status === "rejected";
      const instancesFailed = instancesRes.status === "rejected";
      const packagesFailed = packagesRes.status === "rejected";
      const materialTypesFailed = materialTypesRes.status === "rejected";

      if (requestsRes.status === "fulfilled") {
        setRequests(requestsRes.value.data.requests ?? []);
        setRequestsTotalPages(Math.max(1, requestsRes.value.data.totalPages ?? 1));
        setRequestsTotal(requestsRes.value.data.total ?? 0);
      } else {
        try {
          const fallback = await getRequests({
            page: requestsPage,
            limit: requestsPageSize,
          });
          setRequests(fallback.data.requests ?? []);
          setRequestsTotalPages(Math.max(1, fallback.data.totalPages ?? 1));
          setRequestsTotal(fallback.data.total ?? 0);
          requestsFailed = false;
        } catch {
          /* keep previous state */
        }
      }

      if (customersRes.status === "fulfilled") {
        setCustomers(customersRes.value.data.customers ?? []);
      } else {
        try {
          const fallback = await getCustomers({ page: 1, limit: 10 });
          setCustomers(fallback.data.customers ?? []);
          customersFailed = false;
        } catch {
          /* keep previous state */
        }
      }

      if (categoriesRes.status === "fulfilled") {
        setMaterialCategories(categoriesRes.value.data.categories ?? []);
      }
      if (instancesRes.status === "fulfilled") {
        setMaterialInstances(instancesRes.value.data.instances ?? []);
        setInventoryDataAvailable(true);
      } else {
        setInventoryDataAvailable(false);
      }
      if (packagesRes.status === "fulfilled") {
        setPackages(packagesRes.value.data.packages ?? []);
      }
      if (materialTypesRes.status === "fulfilled") {
        setMaterialTypes(materialTypesRes.value.data.materialTypes ?? []);
      }
      if (orgSettingsRes.status === "fulfilled") {
        setRequireFullPayment(
          orgSettingsRes.value.data.settings.requireFullPaymentBeforeCheckout ?? false,
        );
      }

      const failures: Array<{ source: string; reason: unknown }> = [];
      if (requestsFailed)
        failures.push({
          source: "orders",
          reason: requestsRes.status === "rejected" ? requestsRes.reason : null,
        });
      if (customersFailed)
        failures.push({
          source: "customers",
          reason: customersRes.status === "rejected" ? customersRes.reason : null,
        });
      if (categoriesFailed)
        failures.push({
          source: "categories",
          reason: categoriesRes.status === "rejected" ? categoriesRes.reason : null,
        });
      if (instancesFailed)
        failures.push({
          source: "inventory",
          reason: instancesRes.status === "rejected" ? instancesRes.reason : null,
        });
      if (packagesFailed)
        failures.push({
          source: "packages",
          reason: packagesRes.status === "rejected" ? packagesRes.reason : null,
        });
      if (materialTypesFailed)
        failures.push({
          source: "material types",
          reason: materialTypesRes.status === "rejected" ? materialTypesRes.reason : null,
        });

      if (failures.length > 0) {
        const firstFailure = failures[0];
        const reasonMessage =
          firstFailure.reason instanceof Error ? firstFailure.reason.message : "Request failed";
        setLoadWarning(
          `Some data could not be loaded: ${failures.map((e) => e.source).join(", ")}. ${reasonMessage}`,
        );
      } else {
        setLoadWarning("");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load orders";
      setLoadWarning(`Orders view could not load completely: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [requestsPage, requestsPageSize, selectedStatus]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    setRequestsPage(1);
  }, [selectedStatus]);

  const allOrders = useMemo(
    () => buildOrderViewModel(requests, [], customers, packages, materialTypes, language as "en" | "es"),
    [requests, customers, packages, materialTypes, language],
  );

  const filteredOrders = useMemo(
    () =>
      allOrders.filter((order) => {
        const lower = searchTerm.toLowerCase();
        return (
          order.request._id.toLowerCase().includes(lower) ||
          order.customerName.toLowerCase().includes(lower)
        );
      }),
    [allOrders, searchTerm],
  );

  /* ── Action handlers ────────────────────────────────── */

  const handleCreateOrder = async (payload: CreateLoanRequestPayload) => {
    setSubmitting(true);
    try {
      const createResponse = await createRequest(payload);
      const createdRequest = createResponse.data.request;
      if (createdRequest) {
        setRequests((prev) => {
          const exists = prev.some((entry) => entry._id === createdRequest._id);
          return exists ? prev : [createdRequest, ...prev];
        });
      }
      showSuccess(
        isEs ? "Pedido creado correctamente." : "Order created successfully.",
        isEs ? "Pedido registrado" : "Order Registered",
      );
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create order";
      showError(message, "Order Creation Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveOrder = async (requestId: string) => {
    setSubmitting(true);
    try {
      await approveRequest(requestId, "Approved from Orders module");
      showSuccess("Order approved.", "Order Updated");
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve order";
      showError(message, "Approval Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRejectModal = (order: OrderView) => {
    setRejectTarget(order);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleOpenReactivateModal = (order: OrderView) => {
    setReactivateTarget(order);
    setReactivateReason("");
    setShowReactivateModal(true);
  };

  const handleRejectOrder = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showError("Rejection reason is required.", "Validation Error");
      return;
    }
    setSubmitting(true);
    try {
      await rejectRequest(rejectTarget.request._id, rejectReason.trim());
      showSuccess("Order rejected.", "Order Updated");
      setShowRejectModal(false);
      setRejectTarget(null);
      setRejectReason("");
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject order";
      showError(message, "Rejection Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivateOrder = async () => {
    if (!reactivateTarget) return;
    const reason = reactivateReason.trim();
    if (!reason) {
      showError("Reactivation reason is required.", "Validation Error");
      return;
    }
    setSubmitting(true);
    try {
      await updateRequest(reactivateTarget.request._id, {
        status: "pending",
        notes: `Reactivated from rejected state. Reason: ${reason}`,
      });
      showSuccess("Order reactivated and moved back to pending.", "Order Reactivated");
      setShowReactivateModal(false);
      setReactivateTarget(null);
      setReactivateReason("");
      await refreshData();
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Failed to reactivate order";
      const notSupportedMessage = rawMessage.toLowerCase().includes("not found")
        ? "Reactivation is not available in the current backend yet. Please ask backend to enable request status updates from rejected to pending."
        : rawMessage;
      showError(notSupportedMessage, "Reactivation Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartLoan = async (requestId: string) => {
    setSubmitting(true);
    try {
      await createLoanFromRequest(requestId);
      showSuccess("Loan started successfully.", "Loan Created");
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start loan";
      showError(message, "Loan Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteLoan = async (loanId: string) => {
    setSubmitting(true);
    try {
      await returnLoan(loanId);
      showSuccess("Order marked as completed.", "Loan Returned");
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete loan";
      showError(message, "Completion Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRecordPaymentModal = (order: OrderView) => {
    setPaymentTarget(order);
    setShowRecordPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    if (!paymentTarget) return;
    setSubmitting(true);
    try {
      await recordPayment(paymentTarget.request._id);
      showSuccess(
        isEs ? "Depósito registrado como pagado." : "Deposit recorded as paid.",
        isEs ? "Pago registrado" : "Payment Recorded",
      );
      setShowRecordPaymentModal(false);
      setPaymentTarget(null);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to record payment";
      showError(message, isEs ? "Error de pago" : "Payment Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRentalPaymentModal = (order: OrderView) => {
    setRentalPaymentTarget(order);
    setShowRentalPaymentModal(true);
  };

  const handleRecordRentalPayment = async () => {
    if (!rentalPaymentTarget) return;
    setSubmitting(true);
    try {
      await recordRentalPayment(rentalPaymentTarget.request._id);
      showSuccess(
        isEs ? "Pago de renta registrado." : "Rental fee recorded as paid.",
        isEs ? "Pago registrado" : "Payment Recorded",
      );
      setShowRentalPaymentModal(false);
      setRentalPaymentTarget(null);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to record rental payment";
      showError(message, isEs ? "Error de pago" : "Payment Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShipOrder = async (order: OrderView) => {
    if (!canAssignRequest) {
      showError(
        isEs
          ? "Necesita el permiso requests:assign para despachar pedidos."
          : "You need the requests:assign permission to ship orders.",
        isEs ? "Permiso requerido" : "Permission Required",
      );
      return;
    }
    setSubmitting(true);
    try {
      await markRequestReady(order.request._id);
      showSuccess(
        isEs ? "Pedido marcado como listo para despacho." : "Order marked as ready for checkout.",
        isEs ? "Pedido actualizado" : "Order Updated",
      );
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to ship order";
      showError(message, isEs ? "Error de despacho" : "Ship Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrepareOrder = (order: OrderView) => {
    if (!canAssignRequest) {
      showError(
        "You need the requests:assign permission to prepare orders.",
        "Permission Required",
      );
      return;
    }

    const requiredByMaterialType = new Map<string, number>();

    order.request.items.forEach((item) => {
      const itemQty = Math.max(1, Number(item.quantity) || 1);
      const directMaterialId =
        item.materialTypeId ?? (item.type === "material" ? item.referenceId : undefined);

      if (directMaterialId) {
        requiredByMaterialType.set(
          directMaterialId,
          (requiredByMaterialType.get(directMaterialId) ?? 0) + itemQty,
        );
        return;
      }

      const packageId = item.packageId ?? (item.type === "package" ? item.referenceId : undefined);
      if (!packageId) return;

      const pkg = packages.find((entry) => entry._id === packageId);
      const entries = (pkg?.items?.length ? pkg.items : pkg?.materialTypes) ?? [];
      entries.forEach((entry) => {
        const materialTypeId = extractMaterialTypeIdFromPackageEntry(entry);
        if (!materialTypeId) return;
        const requiredQty = itemQty * Math.max(1, Number(entry.quantity) || 1);
        requiredByMaterialType.set(
          materialTypeId,
          (requiredByMaterialType.get(materialTypeId) ?? 0) + requiredQty,
        );
      });
    });

    const types = Array.from(requiredByMaterialType.entries()).map(
      ([materialTypeId, quantity]) => ({
        materialTypeId,
        materialTypeName:
          materialTypes.find((t) => t._id === materialTypeId)?.name ?? materialTypeId,
        quantity,
      }),
    );

    setPrepareRequiredTypes(types);
    setPrepareTargetOrder(order);
    setShowPrepareModal(true);
  };

  const handleViewDetails = (order: OrderView) => {
    setActiveOrder(order);
    setShowDetailsModal(true);
  };

  if (!hasPermission("requests:read")) return <Unauthorized />;

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="page-container">
      <div data-help-id="orders-header">
        <PageHeader
          title={isEs ? "Pedidos" : "Orders"}
          subtitle={
            isEs
              ? "Cree, apruebe y rastree el ciclo de vida de los pedidos desde un solo lugar"
              : "Create, approve, and track order lifecycle from one place"
          }
          actions={
            <div data-help-id="orders-create-action">
              <Button
                leftIcon={Plus}
                onClick={guard("requests:create", () => setShowCreateModal(true))}
                aria-disabled={!canCreateRequest}
                variant="outline"
                className={`w-full sm:w-auto border-[#FFD700]/40 text-[#FFD700] bg-[#FFD700]/8 hover:bg-[#FFD700]/16 ${!canCreateRequest ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isEs ? "Nuevo Pedido" : "New Order"}
              </Button>
            </div>
          }
        />
      </div>

      {loadWarning && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          {loadWarning}
        </div>
      )}

      <div data-help-id="orders-filters">
        <OrdersFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          isEs={isEs}
        />
      </div>

      <div data-help-id="orders-table">
        <OrdersTable
          orders={filteredOrders}
          loading={loading}
          submitting={submitting}
          page={requestsPage}
          totalPages={requestsTotalPages}
          total={requestsTotal}
          onPageChange={setRequestsPage}
          onViewDetails={handleViewDetails}
          onApprove={(requestId) => handleApproveOrder(requestId)}
          onReject={handleOpenRejectModal}
          onReactivate={handleOpenReactivateModal}
          onRecordPayment={handleOpenRecordPaymentModal}
          onRecordRentalPayment={handleOpenRentalPaymentModal}
          onPrepare={handlePrepareOrder}
          onShip={handleShipOrder}
          onStartLoan={(requestId) => handleStartLoan(requestId)}
          onCompleteLoan={(loanId) => handleCompleteLoan(loanId)}
          canApproveRequest={canApproveRequest}
          canUpdateRequest={canUpdateRequest}
          canAssignRequest={canAssignRequest}
          canCreateLoan={canCreateLoan}
          canReturnLoan={canReturnLoan}
          canRecordPayment={canRecordPayment}
          requireFullPaymentBeforeCheckout={requireFullPayment}
          isEs={isEs}
        />
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        customers={customers}
        materialCategories={materialCategories}
        materialInstances={materialInstances}
        materialTypes={materialTypes}
        packages={packages}
        inventoryDataAvailable={inventoryDataAvailable}
        onSubmit={handleCreateOrder}
        submitting={submitting}
      />

      {/* Detail Modal */}
      {activeOrder && (
        <OrderDetailModal
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          order={activeOrder}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && rejectTarget && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowRejectModal(false)}
        >
          <div className="modal-content max-w-2xl overflow-hidden">
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isEs ? "Rechazar Pedido" : "Reject Order"}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {isEs
                    ? "Proporcione una razón clara que pueda compartirse con el cliente."
                    : "Provide a clear reason that can be shared with the customer."}
                </p>
              </div>
              <IconButton
                icon={X}
                onClick={() => setShowRejectModal(false)}
                ariaLabel={isEs ? "Cerrar modal de rechazo" : "Close reject order modal"}
                intent="secondary"
              />
            </div>

            <div className="modal-body space-y-4">
              <p className="text-gray-300 text-sm">
                {isEs
                  ? "Proporcione una razón de rechazo para la solicitud"
                  : "Provide a rejection reason for request"}{" "}
                <span className="text-white font-semibold">
                  {rejectTarget.request.code ?? rejectTarget.request._id}
                </span>
                .
              </p>
              <div className="form-group">
                <label className="form-label">{isEs ? "Razón *" : "Reason *"}</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input min-h-[130px]"
                  placeholder={
                    isEs
                      ? "Ejemplo: Los artículos requeridos no están disponibles en el inventario"
                      : "Example: Required items are not available in stock"
                  }
                />
              </div>
            </div>

            <div className="modal-footer">
              <Button
                variant="secondary"
                onClick={() => setShowRejectModal(false)}
                disabled={submitting}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button variant="danger" onClick={handleRejectOrder} loading={submitting}>
                {isEs ? "Rechazar Pedido" : "Reject Order"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Modal */}
      {showReactivateModal && reactivateTarget && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowReactivateModal(false)}
        >
          <div className="modal-content max-w-2xl overflow-hidden">
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isEs ? "Reactivar Pedido" : "Reactivate Order"}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {isEs
                    ? "Explique por qué esta solicitud rechazada debería volver a pendiente."
                    : "Explain why this rejected request should be moved back to pending."}
                </p>
              </div>
              <IconButton
                icon={X}
                onClick={() => setShowReactivateModal(false)}
                ariaLabel={isEs ? "Cerrar modal de reactivación" : "Close reactivate order modal"}
                intent="secondary"
              />
            </div>

            <div className="modal-body space-y-4">
              <p className="text-gray-300 text-sm">
                {isEs
                  ? "Proporcione una razón de reactivación para la solicitud"
                  : "Provide a reactivation reason for request"}{" "}
                <span className="text-white font-semibold">
                  {reactivateTarget.request.code ?? reactivateTarget.request._id}
                </span>
                .
              </p>
              <div className="form-group">
                <label className="form-label">{isEs ? "Razón *" : "Reason *"}</label>
                <textarea
                  value={reactivateReason}
                  onChange={(e) => setReactivateReason(e.target.value)}
                  className="input min-h-[130px]"
                  placeholder={
                    isEs
                      ? "Ejemplo: El cliente confirmó fechas actualizadas y el stock ahora está disponible"
                      : "Example: Customer confirmed updated dates and stock is now available"
                  }
                />
              </div>
            </div>

            <div className="modal-footer">
              <Button
                variant="secondary"
                onClick={() => setShowReactivateModal(false)}
                disabled={submitting}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                onClick={handleReactivateOrder}
                loading={submitting}
                className="bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/45 hover:bg-[#FFD700]/20"
              >
                {submitting
                  ? isEs
                    ? "Reactivando..."
                    : "Reactivating..."
                  : isEs
                    ? "Reactivar Pedido"
                    : "Reactivate Order"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Prepare Order Modal */}
      {prepareTargetOrder && (
        <PrepareOrderModal
          isOpen={showPrepareModal}
          requestId={prepareTargetOrder.request._id}
          customerName={prepareTargetOrder.customerName}
          requiredMaterialTypes={prepareRequiredTypes}
          onClose={() => {
            setShowPrepareModal(false);
            setPrepareTargetOrder(null);
          }}
          onSuccess={refreshData}
        />
      )}

      {/* Record Payment Modal */}
      {showRecordPaymentModal && paymentTarget && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowRecordPaymentModal(false)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-2">
              {isEs ? "Registrar Pago del Depósito" : "Record Deposit Payment"}
            </h2>
            <p className="text-zinc-400 text-sm mb-4">
              {isEs ? "¿Marcar el depósito del pedido" : "Mark the deposit for order"}{" "}
              <span className="text-white font-medium">
                {paymentTarget.request.code ??
                  `#${paymentTarget.request._id.slice(-6).toUpperCase()}`}
              </span>{" "}
              {isEs ? "como pagado?" : "as paid?"}
            </p>
            {paymentTarget.request.depositAmount != null && (
              <p className="text-orange-300 text-sm mb-6">
                {isEs ? "Monto del depósito:" : "Deposit amount:"}{" "}
                <span className="font-semibold">
                  ${paymentTarget.request.depositAmount.toFixed(2)}
                </span>
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRecordPaymentModal(false);
                  setPaymentTarget(null);
                }}
                disabled={submitting}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                leftIcon={CreditCard}
                onClick={handleRecordPayment}
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white border-transparent"
              >
                {submitting
                  ? isEs
                    ? "Registrando..."
                    : "Recording..."
                  : isEs
                    ? "Registrar Pago"
                    : "Record Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Rental Fee Payment Modal */}
      {showRentalPaymentModal && rentalPaymentTarget && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowRentalPaymentModal(false)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-2">
              {isEs ? "Registrar Pago de Renta" : "Record Rental Fee Payment"}
            </h2>
            <p className="text-zinc-400 text-sm mb-4">
              {isEs
                ? "¿Registrar el pago de la tarifa de renta del pedido"
                : "Record the rental fee payment for order"}{" "}
              <span className="text-white font-medium">
                {rentalPaymentTarget.request.code ??
                  `#${rentalPaymentTarget.request._id.slice(-6).toUpperCase()}`}
              </span>
              {isEs ? " como pagado?" : " as paid?"}
            </p>
            {rentalPaymentTarget.request.totalAmount != null &&
              rentalPaymentTarget.request.totalAmount > 0 && (
                <p className="text-purple-300 text-sm mb-6">
                  {isEs ? "Monto total de renta:" : "Total rental amount:"}{" "}
                  <span className="font-semibold">
                    ${rentalPaymentTarget.request.totalAmount.toFixed(2)}
                  </span>
                </p>
              )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRentalPaymentModal(false);
                  setRentalPaymentTarget(null);
                }}
                disabled={submitting}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                leftIcon={CreditCard}
                onClick={handleRecordRentalPayment}
                disabled={submitting}
                className="bg-purple-500 hover:bg-purple-600 text-white border-transparent"
              >
                {submitting
                  ? isEs
                    ? "Registrando..."
                    : "Recording..."
                  : isEs
                    ? "Registrar Pago"
                    : "Record Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertModal />
    </div>
  );
}
