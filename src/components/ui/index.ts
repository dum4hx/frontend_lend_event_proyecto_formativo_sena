/**
 * Centralized exports for reusable UI components.
 * Makes imports cleaner throughout the application.
 */

// ── Existing components ──────────────────────────────────────────────────
export { ConfirmDialog } from "./ConfirmDialog";
export type { ConfirmDialogProps } from "./ConfirmDialog";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export { LoadingSpinner } from "./LoadingSpinner";
export type { LoadingSpinnerProps } from "./LoadingSpinner";

export { ErrorDisplay } from "./ErrorDisplay";
export type { ErrorDisplayProps } from "./ErrorDisplay";

export { AlertCard, AlertContainer } from "./AlertCard";
export type { AlertCardProps, AlertContainerProps, AlertItem, AlertType } from "./AlertCard";

export { AlertModal } from "./AlertModal";
export type { AlertModalProps, AlertModalType } from "./AlertModal";

export { StatCard } from "./StatCard";
export type { StatCardProps } from "./StatCard";

export { default as Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { default as IconButton } from "./IconButton";
export type { IconButtonProps, IconButtonIntent } from "./IconButton";

export { default as HeroButton } from "./HeroButton";
export type { HeroButtonProps, HeroButtonVariant } from "./HeroButton";

export { MaterialSelector } from "./MaterialSelector";
export type { MaterialSelectorProps } from "./MaterialSelector";

// ── New shared components ────────────────────────────────────────────────
export { AnimatedPage } from "./AnimatedPage";
export type { AnimatedPageProps } from "./AnimatedPage";

export { Modal } from "./Modal";
export type { ModalProps, ModalSize } from "./Modal";

export { FormModal } from "./FormModal";
export type { FormModalProps } from "./FormModal";

export { DetailModal } from "./DetailModal";
export type { DetailModalProps, DetailField } from "./DetailModal";

export { QuickCreateModal } from "./QuickCreateModal";
export type { QuickCreateModalProps } from "./QuickCreateModal";

export { DataTable } from "./DataTable";
export type { DataTableProps, ColumnDef } from "./DataTable";

export { SearchableSelect } from "./SearchableSelect";
export type { SearchableSelectProps, SelectOption } from "./SearchableSelect";

export { SearchInput } from "./SearchInput";
export type { SearchInputProps } from "./SearchInput";

export { StatusBadge } from "./StatusBadge";
export type { StatusBadgeProps } from "./StatusBadge";

export { TruncatedText } from "./TruncatedText";
export type { TruncatedTextProps } from "./TruncatedText";

export { PageHeader } from "./PageHeader";
export type { PageHeaderProps } from "./PageHeader";

export { Pagination } from "./Pagination";
export type { PaginationProps } from "./Pagination";

export { LinkedEntity } from "./LinkedEntity";
export type { LinkedEntityProps } from "./LinkedEntity";

export { EntityLink } from "./EntityLink";
export type { EntityLinkProps } from "./EntityLink";

export { PermissionGuardedButton } from "./PermissionGuardedButton";
export type { PermissionGuardedButtonProps } from "./PermissionGuardedButton";

export { ToastContainer } from "./ToastContainer";
export type { Toast, ToastType } from "./ToastContainer";

export { GreetingCard } from "./GreetingCard";
export type { GreetingCardProps } from "./GreetingCard";

export { BackupCodesModal } from "./BackupCodesModal";
