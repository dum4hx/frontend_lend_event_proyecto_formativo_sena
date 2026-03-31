/**
 * CustomerDetailModal — Read-only detail view for a customer.
 * Shows all customer information without exposing raw _id values.
 */

import { Edit2 } from "lucide-react";
import { DetailModal, StatusBadge, type DetailField } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { Customer, DocumentTypeInfo } from "../../../../types/api";

interface CustomerDetailModalProps {
  /** The customer to display, or null if modal is closed. */
  customer: Customer | null;
  /** Whether the modal is open. */
  open: boolean;
  /** Close handler. */
  onClose: () => void;
  /** Document types for label lookup. */
  documentTypes: DocumentTypeInfo[];
  /** Callback to open edit modal from detail view. */
  onEdit: (customer: Customer) => void;
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

function formatAddress(customer: Customer): string {
  const addr = customer.address;
  if (!addr) return "—";

  const streetParts: string[] = [];
  if (addr.streetType) streetParts.push(addr.streetType);
  if (addr.primaryNumber) streetParts.push(addr.primaryNumber);
  if (addr.secondaryNumber) streetParts.push(`# ${addr.secondaryNumber}`);
  if (addr.complementaryNumber) streetParts.push(`- ${addr.complementaryNumber}`);

  const street = streetParts.join(" ");
  const locationParts = [addr.city, addr.department].filter(Boolean);
  const location = locationParts.join(", ");

  const lines = [street, addr.additionalDetails, location, addr.postalCode].filter(Boolean);
  return lines.join("\n") || "—";
}

export function CustomerDetailModal({
  customer,
  open,
  onClose,
  documentTypes,
  onEdit,
}: CustomerDetailModalProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  if (!customer) return null;

  const getDocTypeLabel = (code: string): string => {
    const dt = documentTypes.find((d) => d.value === code);
    return dt?.displayName ?? code.toUpperCase();
  };

  const fields: DetailField[] = [
    {
      label: isEs ? "Nombre completo" : "Full Name",
      value: formatFullName(customer),
    },
    {
      label: isEs ? "Correo electrónico" : "Email",
      value: customer.email,
    },
    {
      label: isEs ? "Teléfono" : "Phone",
      value: customer.phone,
    },
    {
      label: isEs ? "Tipo de documento" : "Document Type",
      value: getDocTypeLabel(customer.documentType),
    },
    {
      label: isEs ? "Número de documento" : "Document Number",
      value: customer.documentNumber,
    },
    {
      label: isEs ? "Estado" : "Status",
      value: <StatusBadge status={customer.status} />,
    },
    {
      label: isEs ? "Dirección" : "Address",
      value: (
        <span className="whitespace-pre-line">{formatAddress(customer)}</span>
      ),
    },
  ];

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" className="btn-secondary text-sm" onClick={onClose}>
        {isEs ? "Cerrar" : "Close"}
      </button>
      <button
        type="button"
        className="btn-primary text-sm inline-flex items-center gap-2"
        onClick={() => {
          onClose();
          onEdit(customer);
        }}
      >
        <Edit2 size={16} />
        {isEs ? "Editar" : "Edit"}
      </button>
    </div>
  );

  return (
    <DetailModal
      open={open}
      onClose={onClose}
      title={isEs ? "Detalle del Cliente" : "Customer Details"}
      fields={fields}
      size="md"
      footer={footer}
    />
  );
}
