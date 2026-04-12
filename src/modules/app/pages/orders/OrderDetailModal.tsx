import { X } from "lucide-react";
import { IconButton, EntityLink } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import { getWorkflowStatusLabel } from "../../../../utils/statusLabels";
import type { OrderView } from "./types";
import { WORKFLOW_STEPS } from "./types";
import { formatDate, getStatusBadgeStyle, getStepIndex } from "./helpers";

interface OrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  order: OrderView;
}

export function OrderDetailModal({ open, onClose, order }: OrderDetailModalProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  if (!open) return null;

  const activeStepIndex = getStepIndex(order.workflowStatus);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-5xl max-h-[92vh] overflow-hidden">
        <div className="modal-header">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isEs ? "Detalles del Pedido" : "Order Details"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {isEs
                ? "Revise los datos completos del pedido y el paso actual del flujo."
                : "Review full order data and current workflow step."}
            </p>
          </div>
          <IconButton
            icon={X}
            onClick={onClose}
            ariaLabel={isEs ? "Cerrar modal de detalles" : "Close order details modal"}
            intent="secondary"
          />
        </div>

        <div className="modal-body p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
            <div className="p-6 md:p-7 space-y-5 max-h-[calc(92vh-84px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">
                    {isEs ? "Código de Solicitud" : "Request Code"}
                  </p>
                  <p className="text-white font-semibold break-all">
                    {order.request.code ?? order.request._id}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{isEs ? "Cliente" : "Customer"}</p>
                  <EntityLink
                    entityType="customer"
                    entityId={order.request.customerId?._id ?? ""}
                    label={order.customerName}
                    className="font-semibold"
                  />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{isEs ? "Fecha de Inicio" : "Start Date"}</p>
                  <p className="text-gray-300">{formatDate(order.request.startDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{isEs ? "Fecha de Fin" : "End Date"}</p>
                  <p className="text-gray-300">{formatDate(order.request.endDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-2">
                  {isEs ? "Productos / Servicios" : "Products / Services"}
                </p>
                <div className="space-y-2">
                  {order.displayItems.map((itemLabel) => (
                    <div
                      key={itemLabel}
                      className="text-gray-200 text-sm border border-[#333] rounded-lg px-3 py-2 bg-[#1a1a1a]"
                    >
                      {itemLabel}
                    </div>
                  ))}
                </div>
              </div>

              {(order.request.totalAmount != null ||
                order.request.subtotal != null ||
                order.request.depositAmount != null) && (
                <div className="border border-[#2a2a2a] rounded-lg p-4 bg-[#1a1a1a] space-y-3">
                  <p className="text-xs font-semibold text-[#FFD700] uppercase tracking-wider">
                    {isEs ? "Resumen Financiero" : "Financial Summary"}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {order.request.totalDays != null && (
                      <div>
                        <p className="text-gray-500 text-xs">
                          {isEs ? "Días totales" : "Total Days"}
                        </p>
                        <p className="text-white font-semibold">{order.request.totalDays}</p>
                      </div>
                    )}
                    {order.request.subtotal != null && (
                      <div>
                        <p className="text-gray-500 text-xs">{isEs ? "Subtotal" : "Subtotal"}</p>
                        <p className="text-white font-semibold">
                          ${order.request.subtotal.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {(order.request.discountAmount ?? 0) > 0 && (
                      <div>
                        <p className="text-gray-500 text-xs">{isEs ? "Descuento" : "Discount"}</p>
                        <p className="text-green-400 font-semibold">
                          -${order.request.discountAmount!.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {order.request.totalAmount != null && (
                      <div>
                        <p className="text-gray-500 text-xs">{isEs ? "Total" : "Total Amount"}</p>
                        <p className="text-white font-bold text-base">
                          ${order.request.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {order.request.depositAmount != null && (
                      <div>
                        <p className="text-gray-500 text-xs">
                          {isEs ? "Depósito requerido" : "Required Deposit"}
                        </p>
                        <p className="text-white font-semibold">
                          ${order.request.depositAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {order.request.depositPaidAt != null && (
                      <div>
                        <p className="text-gray-500 text-xs">
                          {isEs ? "Depósito pagado" : "Deposit Paid"}
                        </p>
                        <p className="text-green-400 font-semibold">
                          {formatDate(order.request.depositPaidAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {order.loan && (
                <div className="border border-[#2a2a2a] rounded-lg p-4 bg-[#1a1a1a] space-y-3">
                  <p className="text-xs font-semibold text-[#FFD700] uppercase tracking-wider">
                    {isEs ? "Estado del Préstamo" : "Loan Status"}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {order.loan.preparedBy && (
                      <div>
                        <p className="text-gray-500 text-xs">{isEs ? "Preparado por" : "Prepared By"}</p>
                        <p className="text-gray-300 text-sm">{order.loan.preparedBy.name ? `${order.loan.preparedBy.name.firstName} ${order.loan.preparedBy.name.firstSurname}`.trim() : order.loan.preparedBy.email}</p>
                      </div>
                    )}
                    {order.loan.preparedAt && (
                      <div>
                        <p className="text-gray-500 text-xs">{isEs ? "Fecha de Preparación" : "Preparation Date"}</p>
                        <p className="text-gray-300 text-sm">{formatDate(order.loan.preparedAt)}</p>
                      </div>
                    )}
                    {order.loan.totalAmount != null && (
                      <div>
                        <p className="text-gray-500 text-xs">{isEs ? "Total" : "Total Amount"}</p>
                        <p className="text-white font-semibold">
                          ${order.loan.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {order.loan.deposit?.amount != null && (
                      <div>
                        <p className="text-gray-500 text-xs">{isEs ? "Depósito" : "Deposit"}</p>
                        <p className="text-white font-semibold">
                          ${order.loan.deposit.amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {(order.loan.damageFees ?? 0) > 0 && (
                      <div>
                        <p className="text-gray-500 text-xs">
                          {isEs ? "Cargos por daño" : "Damage Fees"}
                        </p>
                        <p className="text-red-400 font-semibold">
                          ${order.loan.damageFees!.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {(order.loan.lateFees ?? 0) > 0 && (
                      <div>
                        <p className="text-gray-500 text-xs">
                          {isEs ? "Cargos por mora" : "Late Fees"}
                        </p>
                        <p className="text-red-400 font-semibold">
                          ${order.loan.lateFees!.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {order.loan.deposit?.status && (
                      <div>
                        <p className="text-gray-500 text-xs">
                          {isEs ? "Estado depósito" : "Deposit Status"}
                        </p>
                        <p className="text-gray-300 text-sm capitalize">
                          {order.loan.deposit.status.replace(/_/g, " ")}
                        </p>
                      </div>
                    )}
                    {order.loan.deposit?.refundAvailable && (
                      <div>
                        <p className="text-gray-500 text-xs">
                          {isEs ? "Devolución disponible" : "Refundable Amount"}
                        </p>
                        <p className="text-green-400 font-semibold">
                          ${(order.loan.deposit.refundableAmount ?? 0).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {order.request.notes && (
                <div>
                  <p className="text-gray-500 text-sm">{isEs ? "Notas" : "Notes"}</p>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{order.request.notes}</p>
                </div>
              )}
            </div>

            <aside className="border-t lg:border-t-0 lg:border-l border-[#333] bg-[#151515] p-6 space-y-4">
              <div>
                <p className="text-gray-500 text-sm mb-2">
                  {isEs ? "Seguimiento del Flujo" : "Workflow Tracking"}
                </p>
                <div className="space-y-2">
                  {WORKFLOW_STEPS.map((step, index) => {
                    const reached = index <= activeStepIndex;
                    return (
                      <div
                        key={step.status}
                        className={`px-3 py-2 rounded-lg border text-sm ${
                          reached
                            ? "border-[#FFD700]/50 bg-[#FFD700]/10 text-[#FFD700]"
                            : "border-[#333] text-gray-500"
                        }`}
                      >
                        {isEs ? step.labelEs : step.labelEn}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border border-[#333] rounded-lg p-3 bg-[#1a1a1a]">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {isEs ? "Estado Actual" : "Current Status"}
                </p>
                <span
                  className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(order.workflowStatus)}`}
                >
                  {getWorkflowStatusLabel(order.workflowStatus, language as "en" | "es")}
                </span>
              </div>

              {(order.workflowStatus === "order_rejected" ||
                order.workflowStatus === "order_cancelled") && (
                <p className="text-red-300 text-sm">
                  {isEs
                    ? `Este pedido está en estado terminal: ${getWorkflowStatusLabel(order.workflowStatus, "es")}`
                    : `This order is in a terminal state: ${getWorkflowStatusLabel(order.workflowStatus, "en")}`}
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
