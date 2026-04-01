import { Check, X, RotateCcw, CreditCard, Truck, CircleCheck, Eye } from "lucide-react";
import { Button, IconButton, type ColumnDef } from "../../../../components/ui";
import { DataTable } from "../../../../components/ui";
import { Pagination } from "../../../../components/ui";
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
  onReactivate: (order: OrderView) => void;
  onRecordPayment: (order: OrderView) => void;
  onPrepare: (order: OrderView) => void;
  onStartLoan: (requestId: string) => void;
  onCompleteLoan: (loanId: string) => void;
  canApproveRequest: boolean;
  canUpdateRequest: boolean;
  canAssignRequest: boolean;
  canCreateLoan: boolean;
  canReturnLoan: boolean;
  canRecordPayment: boolean;
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
  onReactivate,
  onRecordPayment,
  onPrepare,
  onStartLoan,
  onCompleteLoan,
  canApproveRequest,
  canUpdateRequest,
  canAssignRequest,
  canCreateLoan,
  canReturnLoan,
  canRecordPayment,
  isEs,
}: OrdersTableProps) {
  const renderActions = (order: OrderView) => (
    <div className="flex max-w-full flex-wrap items-center gap-1.5">
      <IconButton
        icon={Eye}
        onClick={() => onViewDetails(order)}
        intent="secondary"
        ariaLabel={isEs ? "Ver detalles del pedido" : "View order details"}
        className="h-8 w-8 rounded-md border border-[#3a3a3a] bg-[#161616] text-gray-400 hover:border-[#565656] hover:bg-[#1f1f1f] hover:text-white"
      />

      {order.request.status === "pending" && (
        <Button
          size="sm"
          leftIcon={Check}
          onClick={() => onApprove(order.request._id)}
          disabled={submitting || !canApproveRequest}
          variant="outline"
          className="h-8 rounded-md border-emerald-500/35 bg-emerald-500/8 px-2.5 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/15"
        >
          {isEs ? "Aprobar" : "Approve"}
        </Button>
      )}

      {order.request.status === "pending" && (
        <Button
          size="sm"
          leftIcon={X}
          onClick={() => onReject(order)}
          disabled={submitting || !canUpdateRequest}
          variant="outline"
          className="h-8 rounded-md border-red-500/40 bg-red-500/8 px-2.5 text-[11px] font-semibold text-red-300 hover:bg-red-500/15"
        >
          {isEs ? "Rechazar" : "Reject"}
        </Button>
      )}

      {order.request.status === "rejected" && (
        <Button
          size="sm"
          leftIcon={RotateCcw}
          onClick={() => onReactivate(order)}
          disabled={submitting || !canUpdateRequest}
          variant="outline"
          className="h-8 rounded-md border-[#FFD700]/40 bg-[#FFD700]/8 px-2.5 text-[11px] font-semibold text-[#FFD700] hover:bg-[#FFD700]/14"
        >
          {isEs ? "Reactivar" : "Reactivate"}
        </Button>
      )}

      {order.request.depositAmount != null &&
        order.request.depositAmount > 0 &&
        !order.request.depositPaidAt &&
        ["approved", "deposit_pending", "assigned", "ready"].includes(order.request.status) && (
          <Button
            size="sm"
            leftIcon={CreditCard}
            onClick={() => onRecordPayment(order)}
            disabled={submitting || !canRecordPayment}
            variant="outline"
            className="h-8 rounded-md border-orange-500/40 bg-orange-500/8 px-2.5 text-[11px] font-semibold text-orange-300 hover:bg-orange-500/15"
          >
            {isEs ? "Registrar pago" : "Record Payment"}
          </Button>
        )}

      {!order.loan && order.request.status === "approved" && (
        <Button
          size="sm"
          leftIcon={Check}
          onClick={() => onPrepare(order)}
          disabled={submitting || !canAssignRequest}
          variant="outline"
          className="h-8 rounded-md border-sky-500/40 bg-sky-500/8 px-2.5 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/15"
        >
          {isEs ? "Preparar" : "Prepare"}
        </Button>
      )}

      {!order.loan && order.request.status === "ready" && (
        <Button
          size="sm"
          leftIcon={Truck}
          onClick={() => onStartLoan(order.request._id)}
          disabled={submitting || !canCreateLoan}
          variant="outline"
          className="h-8 rounded-md border-blue-500/40 bg-blue-500/8 px-2.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/15"
        >
          {isEs ? "Iniciar préstamo" : "Start Loan"}
        </Button>
      )}

      {order.loan && (order.loan.status === "active" || order.loan.status === "overdue") && (
        <Button
          size="sm"
          leftIcon={CircleCheck}
          onClick={() => onCompleteLoan(order.loan!._id)}
          disabled={submitting || !canReturnLoan}
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
      header: isEs ? "ID Solicitud" : "Request ID",
      render: (order) => (
        <span
          className="block max-w-full truncate font-semibold text-white"
          title={order.request._id}
        >
          {order.request._id}
        </span>
      ),
    },
    {
      key: "customer",
      header: isEs ? "Cliente" : "Customer",
      render: (order) => <span className="text-gray-300">{order.customerName}</span>,
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
          {order.workflowLabel}
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
