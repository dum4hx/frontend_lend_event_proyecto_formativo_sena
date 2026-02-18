/**
 * Export system types.
 *
 * Covers export configuration, metadata, redaction policies,
 * adapter contracts, and runtime validation schemas.
 * These types are consumed by the export service and UI components.
 */

// ─── Export Format ─────────────────────────────────────────────────────────

/** Supported export output formats. */
export type ExportFormat = 'pdf' | 'xlsx';

/** Identifies which module is triggering the export. */
export type ExportModule =
  | 'user-management'
  | 'sales-overview'
  | 'plan-configuration'
  | 'organization-management';

// ─── Redaction Policy ──────────────────────────────────────────────────────

/** How a single field should be handled during export. */
export type FieldRedactionAction =
  | 'include'       // Keep value as-is (non-PII fields only)
  | 'hash'          // Replace with a stable pseudonymous hash
  | 'exclude'       // Omit entirely from export
  | 'mask';         // Partially mask (e.g., "j***@e***.com")

/** Configuration for one field in the export schema. */
export interface ExportFieldConfig {
  /** Original field key/path (dot-notation supported). */
  key: string;
  /** Human-readable label for column header. */
  label: string;
  /** Redaction/pseudonymization action. */
  redaction: FieldRedactionAction;
  /** Whether the user can override the default redaction. */
  overridable: boolean;
  /** Whether this field is selected for export by default. */
  defaultSelected: boolean;
  /** Category for grouping in UI. */
  category: 'identifier' | 'attribute' | 'metric' | 'metadata';
}

/** Complete redaction policy for a module. */
export interface RedactionPolicy {
  /** Module this policy applies to. */
  module: ExportModule;
  /** Ordered list of field configs. */
  fields: ExportFieldConfig[];
  /** When true, warn user that PII may be included. */
  requiresFullExportConfirmation: boolean;
}

// ─── Export Metadata (Audit) ───────────────────────────────────────────────

/** Metadata block embedded in every export for traceability. */
export interface ExportMetadata {
  /** Unique identifier for this export instance (UUIDv4). */
  exportId: string;
  /** ISO-8601 timestamp when export was initiated. */
  timestamp: string;
  /** SHA-256 hash of the initiating user's identifier. */
  initiatingUserHash: string;
  /** Module that produced this export. */
  module: ExportModule;
  /** Human-readable module display name. */
  moduleDisplayName: string;
  /** Filters/query parameters active at time of export. */
  filtersUsed: Record<string, string | number | boolean | undefined>;
  /** Total number of records exported. */
  recordCount: number;
  /** SHA-256 checksum of the data payload for verification. */
  dataChecksum: string;
  /** Whether "full export" (including PII) was explicitly requested. */
  fullExportRequested: boolean;
  /** App version or build identifier. */
  appVersion: string;
  /** Fields included in this export (by key). */
  includedFields: string[];
  /** Fields that were redacted/hashed. */
  redactedFields: string[];
}

// ─── Export Configuration ──────────────────────────────────────────────────

/** Date range filter for exports. */
export interface ExportDateRange {
  from: string | undefined;
  to: string | undefined;
}

/** User-facing export configuration (passed to the service). */
export interface ExportConfig {
  /** Output format. */
  format: ExportFormat;
  /** Module being exported. */
  module: ExportModule;
  /** Date range filter (optional). */
  dateRange?: ExportDateRange;
  /** User-selected field keys to include. */
  selectedFields: string[];
  /** Whether to embed audit metadata in the export. */
  includeAuditMetadata: boolean;
  /** Whether the user requested a full (PII-included) export. */
  fullExport: boolean;
  /** Additional module-specific filters. */
  filters?: Record<string, string | number | boolean | undefined>;
  /** Optional pre-formatted additional sheets (bypass redaction). */
  additionalSheets?: ExportSheet[];
}

// ─── Export Row / Data ─────────────────────────────────────────────────────

/** A single row in the export data table. Values are always strings post-redaction. */
export type ExportRow = Record<string, string | number | boolean | null>;

/** A named sheet with its own columns and rows (used for multi-sheet exports). */
export interface ExportSheet {
  /** Sheet / section name (e.g. "Totals"). */
  name: string;
  /** Column definitions for this sheet. */
  columns: Array<{ key: string; label: string }>;
  /** Data rows for this sheet. */
  rows: ExportRow[];
}

/** Complete export payload ready for adapter consumption. */
export interface ExportPayload {
  /** Configuration used. */
  config: ExportConfig;
  /** Audit metadata. */
  metadata: ExportMetadata;
  /** Column definitions (ordered). */
  columns: Array<{ key: string; label: string }>;
  /** Data rows. */
  rows: ExportRow[];
  /** Optional additional named sheets (rendered after the main Data sheet). */
  additionalSheets?: ExportSheet[];
}

// ─── Export Adapter Contract ───────────────────────────────────────────────

/** Progress callback emitted by adapters during file generation. */
export interface ExportProgress {
  /** 0–100 percentage. */
  percent: number;
  /** Human-readable status message. */
  message: string;
  /** Whether the export can still be cancelled at this point. */
  cancellable: boolean;
}

/** An abort handle returned by adapters for cancellation support. */
export interface ExportAbortHandle {
  abort: () => void;
}

/**
 * Adapter interface — one per output format.
 * Implementations wrap the actual PDF/Excel generation engine.
 */
export interface ExportAdapter {
  /** Unique adapter key matching the ExportFormat it handles. */
  readonly format: ExportFormat;
  /**
   * Generate the export file and trigger a browser download.
   * @returns A promise that resolves with the generated filename.
   */
  generate(
    payload: ExportPayload,
    onProgress?: (progress: ExportProgress) => void,
    signal?: AbortSignal,
  ): Promise<string>;
}

// ─── Export Result ─────────────────────────────────────────────────────────

/** Discriminated union for export outcomes. */
export type ExportResult =
  | { status: 'success'; filename: string; metadata: ExportMetadata }
  | { status: 'cancelled'; reason: string }
  | { status: 'error'; error: string };

// ─── Export Settings Modal Props ───────────────────────────────────────────

/** Props for the ExportSettingsModal component. */
export interface ExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
  module: ExportModule;
  policy: RedactionPolicy;
  exporting: boolean;
  progress?: ExportProgress;
  allowedFormats?: ExportFormat[];
}

// ─── i18n Keys ─────────────────────────────────────────────────────────────

/** Label map for internationalization of export UI strings. */
export const EXPORT_I18N: Record<string, string> = {
  'export.title': 'Export Data',
  'export.format': 'Format',
  'export.format.pdf': 'PDF Document',
  'export.format.xlsx': 'Excel Spreadsheet',
  'export.fields': 'Fields to Include',
  'export.fields.selectAll': 'Select All',
  'export.fields.deselectAll': 'Deselect All',
  'export.dateRange': 'Date Range',
  'export.dateRange.from': 'From',
  'export.dateRange.to': 'To',
  'export.audit': 'Include Audit Metadata',
  'export.fullExport': 'Full Export (includes PII)',
  'export.fullExport.warning':
    'This export will include personally identifiable information. This action will be logged for audit purposes.',
  'export.preview': 'Preview',
  'export.download': 'Download',
  'export.cancel': 'Cancel',
  'export.exporting': 'Exporting…',
  'export.success': 'Export completed successfully',
  'export.error': 'Export failed',
  'export.cancelled': 'Export cancelled',
  'alert.dismiss': 'Dismiss',
  'alert.success': 'Success',
  'alert.info': 'Information',
  'alert.warning': 'Warning',
  'alert.error': 'Error',
};
