import {
  Check,
  X,
  RotateCcw,
  CreditCard,
  Truck,
  PackageCheck,
  CircleCheck,
  Eye,
  Banknote,
  Ban,
} from "lucide-react";
import { Button, IconButton, EntityLink, type ColumnDef } from "../../../../components/ui";
import { DataTable } from "../../../../components/ui";
import { Pagination } from "../../../../components/ui";
import { useActionPermission } from "../../../../hooks/useActionPermission";
import { getWorkflowStatusLabel } from "../../../../utils/statusLabels";
import type { OrderView } from "./types";
import { formatDate, getStatusBadgeStyle } from "./helpers";

interface OrdersTableProps {
  orders: OrderView[];
  loading: boolean;
  submitting: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onViewDetails: (order: OrderView) => void;
  onApprove: (requestId: string) => void;
  onReject: (order: OrderView) => void;
  onCancel: (order: OrderView) => void;
  onReactivate: (order: OrderView) => void;
  onRecordPayment: (order: OrderView) => void;
  onRecordRentalPayment: (order: OrderView) => void;
  onPrepare: (order: OrderView) => void;
  onShip: (order: OrderView) => void;
  onStartLoan: (requestId: string) => void;
  onCompleteLoan: (loanId: string) => void;
  canApproveRequest: boolean;
  canUpdateRequest: boolean;
  canCancelRequest: boolean;
  canReadyRequest: boolean;
  canCreateLoan: boolean;
  canReturnLoan: boolean;
  canRecordPayment: boolean;
  requireFullPaymentBeforeCheckout: boolean;
  isEs: boolean;
}

export function OrdersTable({
  orders,
  loading,
  submitting,
  page,
  totalPages,
  total,
  onPageChange,
  onViewDetails,
  onApprove,
  onReject,
  onCancel,
  onReactivate,
  onRecordPayment,
  onRecordRentalPayment,
  onPrepare,
  onShip,
  onStartLoan,
  onCompleteLoan,
  canApproveRequest,
  canUpdateRequest,
  canCancelRequest,
  canReadyRequest,
  canCreateLoan,
  canReturnLoan,
  canRecordPayment,
  requireFullPaymentBeforeCheckout,
  isEs,
}: OrdersTableProps) {
  const { guard } = useActionPermission(isEs ? "es" : "en");

  const renderActions = (order: OrderView) => (
    <div
      className="flex max-w-full flex-wrap items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        icon={Eye}
        onClick={() => onViewDetails(order)}
        intent="secondary"
        ariaLabel={isEs ? "Ver detalles del pedido" : "View order details"}
        className="h-8 w-8 rounded-md border border-[#3a3a3a] bg-[#161616] text-gray-400 hover:border-[#565656] hover:bg-[#1f1f1f] hover:text-white"
      />

      {order.request.status === "pending" && canApproveRequest && (
        <Button
          size="sm"
          leftIcon={Check}
          onClick={guard("requests:approve", () => onApprove(order.request._id))}
          disabled={submitting}
          variant="outline"
          className="h-8 rounded-md border-emerald-500/35 bg-emerald-500/8 px-2.5 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/15"
        >
          {isEs ? "Aprobar" : "Approve"}
        </Button>
      )}

      {order.request.status === "pending" && canUpdateRequest && (
        <Button
          size="sm"
          leftIcon={X}
          onClick={guard("requests:update", () => onReject(order))}
          disabled={submitting}
          variant="outline"
          className="h-8 rounded-md border-red-500/40 bg-red-500/8 px-2.5 text-[11px] font-semibold text-red-300 hover:bg-red-500/15"
        >
          {isEs ? "Rechazar" : "Reject"}
        </Button>
      )}

      {order.request.status === "rejected" && canUpdateRequest && (
        <Button
          size="sm"
          leftIcon={RotateCcw}
          onClick={guard("requests:update", () => onReactivate(order))}
          disabled={submitting}
          variant="outline"
          className="h-8 rounded-md border-[#FFD700]/40 bg-[#FFD700]/8 px-2.5 text-[11px] font-semibold text-[#FFD700] hover:bg-[#FFD700]/14"
        >
          {isEs ? "Reactivar" : "Reactivate"}
        </Button>
      )}

      {["pending", "approved", "deposit_pending", "assigned", "ready"].includes(
        order.request.status,
      ) &&
        canCancelRequest && (
          <Button
            size="sm"
            leftIcon={Ban}
            onClick={guard("requests:cancel", () => onCancel(order))}
            disabled={submitting}
            variant="outline"
            className="h-8 rounded-md border-red-500/40 bg-red-500/8 px-2.5 text-[11px] font-semibold text-red-300 hover:bg-red-500/15"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
        )}

      {canRecordPayment &&
        order.request.depositAmount != null &&
        order.request.depositAmount > 0 &&
        !order.request.depositPaidAt &&
        ["approved", "deposit_pending", "assigned", "ready"].includes(order.request.status) && (
          <Button
            size="sm"
            leftIcon={CreditCard}
            onClick={guard("requests:update", () => onRecordPayment(order))}
            disabled={submitting}
            variant="outline"
            className="h-8 rounded-md border-orange-500/40 bg-orange-500/8 px-2.5 text-[11px] font-semibold text-orange-300 hover:bg-orange-500/15"
          >
            {isEs ? "Registrar pago" : "Record Payment"}
          </Button>
        )}

      {canRecordPayment &&
        requireFullPaymentBeforeCheckout &&
        order.request.totalAmount != null &&
        order.request.totalAmount > 0 &&
        !order.request.rentalFeePaidAt &&
        ["approved", "deposit_pending", "assigned", "ready"].includes(order.request.status) && (
          <Button
            size="sm"
            leftIcon={Banknote}
            onClick={guard("requests:update", () => onRecordRentalPayment(order))}
            disabled={submitting}
            variant="outline"
            className="h-8 rounded-md border-purple-500/40 bg-purple-500/8 px-2.5 text-[11px] font-semibold text-purple-300 hover:bg-purple-500/15"
          >
            {isEs ? "Pago de renta" : "Rental Payment"}
          </Button>
        )}

      {!order.loan && order.request.status === "approved" && canReadyRequest && (
        <Button
          size="sm"
          leftIcon={Check}
          onClick={guard("requests:ready", () => onPrepare(order))}
          disabled={submitting}
          variant="outline"
          className="h-8 rounded-md border-sky-500/40 bg-sky-500/8 px-2.5 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/15"
        >
          {isEs ? "Preparar" : "Prepare"}
        </Button>
      )}

      {!order.loan && order.request.status === "assigned" && canReadyRequest && (
        <Button
          size="sm"
          leftIcon={PackageCheck}
          onClick={guard("requests:ready", () => onShip(order))}
          disabled={submitting}
          variant="outline"
          className="h-8 rounded-md border-indigo-500/40 bg-indigo-500/8 px-2.5 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/15"
        >
          {isEs ? "Despachar" : "Ship"}
        </Button>
      )}

      {!order.loan && order.request.status === "ready" && canCreateLoan && (
        <Button
          size="sm"
          leftIcon={Truck}
          onClick={guard("loans:create", () => onStartLoan(order.request._id))}
          disabled={submitting}
          variant="outline"
          className="h-8 rounded-md border-blue-500/40 bg-blue-500/8 px-2.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/15"
        >
          {isEs ? "Iniciar préstamo" : "Start Loan"}
        </Button>
      )}

      {order.loan &&
        (order.loan.status === "active" || order.loan.status === "overdue") &&
        canReturnLoan && (
          <Button
            size="sm"
            leftIcon={CircleCheck}
            onClick={guard("loans:return", () => onCompleteLoan(order.loan!._id))}
            disabled={submitting}
            variant="outline"
            className="h-8 rounded-md border-cyan-500/40 bg-cyan-500/8 px-2.5 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/15"
          >
            {isEs ? "Completar" : "Complete"}
          </Button>
        )}
    </div>
  );

  const columns: ColumnDef<OrderView>[] = [
    {
      key: "requestId",
      header: isEs ? "Código Solicitud" : "Request Code",
      render: (order) => (
        <span
          className="block max-w-full truncate font-semibold text-white"
          title={order.request.code ?? order.request._id}
        >
          {order.request.code ?? order.request._id}
        </span>
      ),
    },
    {
      key: "customer",
      header: isEs ? "Cliente" : "Customer",
      render: (order) => (
        <EntityLink
          entityType="customer"
          entityId={order.request.customerId?._id ?? ""}
          label={order.customerName}
        />
      ),
    },
    {
      key: "dateRange",
      header: isEs ? "Rango de fechas" : "Date Range",
      hideBelow: "md",
      render: (order) => (
        <div className="text-gray-400 text-sm">
          <span className="block leading-relaxed">{formatDate(order.request.startDate)}</span>
          <span className="block leading-relaxed text-gray-500">{isEs ? "a" : "to"}</span>
          <span className="block leading-relaxed">{formatDate(order.request.endDate)}</span>
        </div>
      ),
    },
    {
      key: "items",
      header: isEs ? "Productos / Servicios" : "Products / Services",
      render: (order) => (
        <span className="text-gray-300 text-sm">
          <span className="bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-xs font-semibold mr-2">
            {order.itemCount}
          </span>
          {isEs ? "artículos" : "items"}
        </span>
      ),
    },
    {
      key: "status",
      header: isEs ? "Estado" : "Status",
      render: (order) => (
        <span
          className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(order.workflowStatus)}`}
        >
          {getWorkflowStatusLabel(order.workflowStatus, isEs ? "es" : "en")}
        </span>
      ),
    },
    {
      key: "actions",
      header: isEs ? "Acciones" : "Actions",
      render: (order) => renderActions(order),
    },
  ];

  return (
    <>
      <DataTable<OrderView>
        data={orders}
        columns={columns}
        loading={loading}
        emptyMessage={isEs ? "No se encontraron pedidos" : "No orders found"}
        onRowClick={onViewDetails}
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      <p className="text-center text-sm text-gray-500 mt-1">
        {total} {isEs ? "solicitudes en total" : "total requests"}
      </p>
    </>
  );
}
