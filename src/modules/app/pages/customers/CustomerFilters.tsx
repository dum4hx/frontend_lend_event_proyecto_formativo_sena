/**
 * CustomerFilters — Search, status filter, and document type filter bar.
 */

import { Plus } from "lucide-react";
import {
  SearchInput,
  SearchableSelect,
  type SelectOption,
} from "../../../../components/ui";
import Button from "../../../../components/ui/Button";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { DocumentTypeInfo } from "../../../../types/api";

interface CustomerFiltersProps {
  /** Current search query. */
  search: string;
  /** Emit debounced search changes. */
  onSearchChange: (value: string) => void;
  /** Current status filter value ("" for all). */
  statusFilter: string;
  /** Emit status filter changes. */
  onStatusChange: (value: string) => void;
  /** Current document type filter value ("" for all). */
  documentTypeFilter: string;
  /** Emit document type filter changes. */
  onDocumentTypeChange: (value: string) => void;
  /** Available document types from the API. */
  documentTypes: DocumentTypeInfo[];
  /** Callback when the "New Customer" button is clicked. */
  onCreateClick: () => void;
}

const STATUS_OPTIONS_EN: SelectOption[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blacklisted", label: "Blocked" },
];

const STATUS_OPTIONS_ES: SelectOption[] = [
  { value: "", label: "Todos los estados" },
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "blacklisted", label: "Bloqueado" },
];

export function CustomerFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  documentTypeFilter,
  onDocumentTypeChange,
  documentTypes,
  onCreateClick,
}: CustomerFiltersProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const statusOptions = isEs ? STATUS_OPTIONS_ES : STATUS_OPTIONS_EN;

  const docTypeOptions: SelectOption[] = [
    { value: "", label: isEs ? "Todos los tipos" : "All types" },
    ...documentTypes.map((dt) => ({ value: dt.value, label: dt.displayName })),
  ];

  return (
    <div className="filter-bar">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={
          isEs
            ? "Buscar por nombre, correo o documento..."
            : "Search by name, email, or document..."
        }
        className="flex-1 min-w-[200px]"
      />

      <SearchableSelect
        options={statusOptions}
        value={statusFilter}
        onChange={onStatusChange}
        placeholder={isEs ? "Todos los estados" : "All statuses"}
        label={isEs ? "Estado" : "Status"}
        className="w-48"
      />

      <SearchableSelect
        options={docTypeOptions}
        value={documentTypeFilter}
        onChange={onDocumentTypeChange}
        placeholder={isEs ? "Todos los tipos" : "All types"}
        label={isEs ? "Tipo Doc." : "Doc. Type"}
        className="w-48"
      />

      <Button variant="primary" onClick={onCreateClick} className="whitespace-nowrap">
        <Plus size={18} className="mr-1.5" />
        {isEs ? "Nuevo Cliente" : "New Customer"}
      </Button>
    </div>
  );
}
