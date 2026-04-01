import { X } from "lucide-react";
import { IconButton } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { OrderView } from "./types";
import { WORKFLOW_STEPS } from "./types";
import { formatDate, getStatusBadgeStyle, getStepIndex } from "./helpers";

interface OrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  order: OrderView;
}

export function OrderDetailModal({
  open,
  onClose,
  order,
}: OrderDetailModalProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  if (!open) return null;

  const activeStepIndex = getStepIndex(order.workflowStatus);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
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
            ariaLabel={
              isEs
                ? "Cerrar modal de detalles"
                : "Close order details modal"
            }
            intent="secondary"
          />
        </div>

        <div className="modal-body p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
            <div className="p-6 md:p-7 space-y-5 max-h-[calc(92vh-84px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">
                    {isEs ? "ID de Solicitud" : "Request ID"}
                  </p>
                  <p className="text-white font-semibold break-all">
                    {order.request._id}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">
                    {isEs ? "Cliente" : "Customer"}
                  </p>
                  <p className="text-white font-semibold">
                    {order.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">
                    {isEs ? "Fecha de Inicio" : "Start Date"}
                  </p>
                  <p className="text-gray-300">
                    {formatDate(order.request.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">
                    {isEs ? "Fecha de Fin" : "End Date"}
                  </p>
                  <p className="text-gray-300">
                    {formatDate(order.request.endDate)}
                  </p>
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

              {order.request.notes && (
                <div>
                  <p className="text-gray-500 text-sm">
                    {isEs ? "Notas" : "Notes"}
                  </p>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">
                    {order.request.notes}
                  </p>
                </div>
              )}
            </div>

            <aside className="border-t lg:border-t-0 lg:border-l border-[#333] bg-[#151515] p-6 space-y-4">
              <div>
                <p className="text-gray-500 text-sm mb-2">
                  {isEs
                    ? "Seguimiento del Flujo"
                    : "Workflow Tracking"}
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
                        {step.label}
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
                  {order.workflowLabel}
                </span>
              </div>

              {(order.workflowStatus === "order_rejected" ||
                order.workflowStatus === "order_cancelled") && (
                <p className="text-red-300 text-sm">
                  {isEs
                    ? `Este pedido está en estado terminal: ${order.workflowLabel}`
                    : `This order is in a terminal state: ${order.workflowLabel}`}
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
