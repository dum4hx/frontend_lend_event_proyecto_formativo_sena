/**
 * CustomerTable — DataTable for the customer list with action buttons.
 */

import { Edit2, Eye, Ban, UserX, RotateCcw, Trash2 } from "lucide-react";
import { DataTable, StatusBadge, type ColumnDef } from "../../../../components/ui";
import IconButton from "../../../../components/ui/IconButton";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { Customer, DocumentTypeInfo } from "../../../../types/api";

interface CustomerTableProps {
  /** Customer rows. */
  customers: Customer[];
  /** Whether data is loading. */
  loading: boolean;
  /** Document types for label lookup. */
  documentTypes: DocumentTypeInfo[];
  /** Open detail view for a customer. */
  onView: (customer: Customer) => void;
  /** Open edit modal for a customer. */
  onEdit: (customer: Customer) => void;
  /** Blacklist a customer. */
  onBlacklist: (customer: Customer) => void;
  /** Deactivate a customer. */
  onDeactivate: (customer: Customer) => void;
  /** Reactivate a customer. */
  onReactivate: (customer: Customer) => void;
  /** Delete a customer. */
  onDelete: (customer: Customer) => void;
}

function formatFullName(customer: Customer): string {
  const parts = [
    customer.name.firstName,
    customer.name.secondName,
    customer.name.firstSurname,
    customer.name.secondSurname,
  ].filter(Boolean);
  return parts.join(" ");
}

export function CustomerTable({
  customers,
  loading,
  documentTypes,
  onView,
  onEdit,
  onBlacklist,
  onDeactivate,
  onReactivate,
  onDelete,
}: CustomerTableProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const getDocTypeLabel = (code: string): string => {
    const dt = documentTypes.find((d) => d.value === code);
    return dt?.displayName ?? code.toUpperCase();
  };

  const columns: ColumnDef<Customer>[] = [
    {
      key: "name",
      header: isEs ? "Nombre" : "Name",
      render: (row) => <span className="font-medium text-white">{formatFullName(row)}</span>,
    },
    {
      key: "email",
      header: isEs ? "Correo" : "Email",
      hideBelow: "md",
      render: (row) => <span className="text-gray-400">{row.email}</span>,
    },
    {
      key: "phone",
      header: isEs ? "Teléfono" : "Phone",
      hideBelow: "lg",
      render: (row) => <span className="text-gray-400">{row.phone}</span>,
    },
    {
      key: "document",
      header: isEs ? "Documento" : "Document",
      hideBelow: "md",
      render: (row) => (
        <div className="text-xs">
          <div className="text-gray-500">{getDocTypeLabel(row.documentType)}</div>
          <div className="text-gray-300">{row.documentNumber}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: isEs ? "Estado" : "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "w-36",
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton
            icon={Eye}
            intent="view"
            onClick={() => onView(row)}
            ariaLabel={isEs ? "Ver detalle" : "View details"}
            title={isEs ? "Ver detalle" : "View details"}
          />
          <IconButton
            icon={Edit2}
            intent="edit"
            onClick={() => onEdit(row)}
            ariaLabel={isEs ? "Editar" : "Edit"}
            title={isEs ? "Editar" : "Edit"}
          />

          {row.status === "active" && (
            <>
              <IconButton
                icon={UserX}
                intent="reject"
                onClick={() => onDeactivate(row)}
                ariaLabel={isEs ? "Desactivar" : "Deactivate"}
                title={isEs ? "Desactivar" : "Deactivate"}
              />
              <IconButton
                icon={Ban}
                intent="reject"
                onClick={() => onBlacklist(row)}
                ariaLabel={isEs ? "Bloquear" : "Block"}
                title={isEs ? "Bloquear" : "Block"}
              />
            </>
          )}

          {(row.status === "inactive" || row.status === "blacklisted") && (
            <IconButton
              icon={RotateCcw}
              intent="approve"
              onClick={() => onReactivate(row)}
              ariaLabel={
                row.status === "blacklisted"
                  ? isEs
                    ? "Desbloquear"
                    : "Unblock"
                  : isEs
                    ? "Reactivar"
                    : "Reactivate"
              }
              title={
                row.status === "blacklisted"
                  ? isEs
                    ? "Desbloquear"
                    : "Unblock"
                  : isEs
                    ? "Reactivar"
                    : "Reactivate"
              }
            />
          )}

          <IconButton
            icon={Trash2}
            intent="delete"
            onClick={() => onDelete(row)}
            ariaLabel={isEs ? "Eliminar" : "Delete"}
            title={isEs ? "Eliminar" : "Delete"}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable<Customer>
      data={customers}
      columns={columns}
      loading={loading}
      onRowClick={onView}
      emptyMessage={isEs ? "No se encontraron clientes." : "No customers found."}
    />
  );
}
