/**
 * LinkedEntity — Clickable text that opens a detail modal for a related entity.
 *
 * Use inside tables or detail views to render foreign-key references as
 * interactive links.  When clicked, the component fetches the referenced
 * entity (if not already provided) and displays it in a read-only DetailModal.
 *
 * Supports: customer, user, materialType, invoice, loan.
 *
 * @example
 * ```tsx
 * <LinkedEntity type="customer" id={loan.customerId} label="John Doe" />
 * ```
 */

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { DetailModal, type DetailField } from "./DetailModal";
import { StatusBadge } from "./StatusBadge";
import { LoadingSpinner } from "./LoadingSpinner";
import type {
  Customer,
  User,
  MaterialType,
  Invoice,
  Loan,
  PersonName,
  InvoiceCustomer,
} from "../../types/api";

// ─── Supported entity types ────────────────────────────────────────────────

type EntityType = "customer" | "user" | "materialType" | "invoice" | "loan";

// ─── Props ─────────────────────────────────────────────────────────────────

export interface LinkedEntityProps {
  /** The kind of entity being referenced. */
  type: EntityType;
  /** The foreign-key ID (used to fetch when needed). */
  id: string;
  /** Display text — when omitted, the truncated ID is shown. */
  label?: string;
  /** Pre-loaded entity data (avoids an extra fetch). */
  preloaded?: Customer | User | MaterialType | Invoice | Loan;
  /** Optional fetchFn override; receives the ID and returns the entity. */
  fetchFn?: (id: string) => Promise<Customer | User | MaterialType | Invoice | Loan>;
  /** Extra CSS classes on the root element. */
  className?: string;
}

// ─── Name formatting helpers ───────────────────────────────────────────────

function formatPersonName(name: PersonName): string {
  const parts: string[] = [name.firstName];
  if (name.secondName) parts.push(name.secondName);
  parts.push(name.firstSurname);
  if (name.secondSurname) parts.push(name.secondSurname);
  return parts.join(" ");
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function shortId(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

// ─── Entity → DetailField[] builders ───────────────────────────────────────

function customerFields(c: Customer): DetailField[] {
  return [
    { label: "Name", value: formatPersonName(c.name) },
    { label: "Email", value: c.email },
    { label: "Phone", value: c.phone },
    { label: "Document", value: `${c.documentType.toUpperCase()} ${c.documentNumber}` },
    { label: "Status", value: <StatusBadge status={c.status} /> },
    {
      label: "Address",
      value: c.address
        ? [c.address.department, c.address.city].filter(Boolean).join(", ") || "—"
        : "—",
    },
  ];
}

function userFields(u: User): DetailField[] {
  return [
    { label: "Name", value: formatPersonName(u.name) },
    { label: "Email", value: u.email },
    { label: "Role", value: u.roleName },
    { label: "Status", value: <StatusBadge status={u.status} /> },
    { label: "Phone", value: u.phone ?? "—" },
  ];
}

function materialTypeFields(mt: MaterialType): DetailField[] {
  const categoryName =
    typeof mt.categoryId === "object" && mt.categoryId !== null
      ? mt.categoryId.name
      : String(mt.categoryId);
  return [
    { label: "Name", value: mt.name },
    { label: "Description", value: mt.description || "—" },
    { label: "Category", value: categoryName },
    { label: "Price / Day", value: `$${mt.pricePerDay.toLocaleString()}` },
    { label: "Attributes", value: `${mt.attributes.length} defined` },
  ];
}

function invoiceFields(inv: Invoice): DetailField[] {
  const customerName =
    typeof inv.customerId === "object" && inv.customerId !== null
      ? formatPersonName((inv.customerId as InvoiceCustomer).name)
      : shortId(inv.customerId as string);
  return [
    { label: "Invoice #", value: inv.invoiceNumber },
    { label: "Customer", value: customerName },
    { label: "Type", value: inv.type },
    { label: "Status", value: <StatusBadge status={inv.status} /> },
    {
      label: "Total",
      value: `$${inv.totalAmount.toLocaleString()}`,
    },
    {
      label: "Amount Due",
      value: `$${inv.amountDue.toLocaleString()}`,
    },
    { label: "Due Date", value: formatDate(inv.dueDate) },
  ];
}

function loanFields(loan: Loan): DetailField[] {
  const customerLabel =
    typeof loan.customerId === "object" && loan.customerId !== null
      ? formatPersonName((loan.customerId as Customer).name)
      : shortId(loan.customerId as string);
  return [
    { label: "Loan ID", value: shortId(loan._id) },
    { label: "Customer", value: customerLabel },
    { label: "Status", value: <StatusBadge status={loan.status} /> },
    { label: "Start", value: formatDate(loan.startDate) },
    { label: "End", value: formatDate(loan.endDate) },
    {
      label: "Deposit",
      value: `$${loan.deposit.amount.toLocaleString()} (${loan.deposit.status})`,
    },
  ];
}

function buildFields(
  type: EntityType,
  entity: Customer | User | MaterialType | Invoice | Loan,
): DetailField[] {
  switch (type) {
    case "customer":
      return customerFields(entity as Customer);
    case "user":
      return userFields(entity as User);
    case "materialType":
      return materialTypeFields(entity as MaterialType);
    case "invoice":
      return invoiceFields(entity as Invoice);
    case "loan":
      return loanFields(entity as Loan);
    default:
      return [];
  }
}

const entityTitles: Record<EntityType, string> = {
  customer: "Customer Details",
  user: "User Details",
  materialType: "Material Type Details",
  invoice: "Invoice Details",
  loan: "Loan Details",
};

// ─── Component ─────────────────────────────────────────────────────────────

export function LinkedEntity({
  type,
  id,
  label,
  preloaded,
  fetchFn,
  className = "",
}: LinkedEntityProps) {
  const [open, setOpen] = useState(false);
  const [entity, setEntity] = useState<Customer | User | MaterialType | Invoice | Loan | null>(
    preloaded ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click when inside a DataTable

    if (preloaded) {
      setEntity(preloaded);
      setOpen(true);
      return;
    }

    if (entity) {
      setOpen(true);
      return;
    }

    if (!fetchFn) {
      // No fetch function provided — just open with the ID shown
      setOpen(true);
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);
      const result = await fetchFn(id);
      setEntity(result);
      setOpen(true);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load entity");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const displayText = label ?? shortId(id);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-1 text-[#FFD700] hover:text-[#FFC700] hover:underline underline-offset-2 transition-colors text-sm font-medium disabled:opacity-50 ${className}`}
        title={`View ${type} details`}
      >
        {loading ? <LoadingSpinner size="xs" /> : <ExternalLink className="w-3 h-3 opacity-60" />}
        <span className="truncate max-w-[180px]">{displayText}</span>
      </button>

      <DetailModal
        open={open}
        onClose={() => setOpen(false)}
        title={entityTitles[type]}
        size="md"
        fields={
          fetchError
            ? [{ label: "Error", value: fetchError }]
            : entity
              ? buildFields(type, entity)
              : [{ label: "ID", value: id }]
        }
      />
    </>
  );
}
