/**
 * Export Service — client-side adapter pattern.
 *
 * Central API for producing downloadable PDF and Excel files
 * from module data. Orchestrates redaction, validation, metadata
 * generation, and adapter invocation.
 *
 * Usage:
 * ```ts
 * import { exportService } from './services/export';
 *
 * const result = await exportService.export(rawData, config, userId);
 * ```
 */

import type {
  ExportConfig,
  ExportFormat,
  ExportMetadata,
  ExportModule,
  ExportPayload,
  ExportProgress,
  ExportResult,
  ExportAdapter,
  ExportRow,
} from '../../types/export';
import { applyRedaction, getDefaultPolicy } from './redaction';
import { assertValidPayload, validateExportPayload } from './validation';
import { computeDataChecksum, generateExportId, sha256 } from './checksum';
import { pdfAdapter } from './adapters/pdfAdapter';
import { excelAdapter } from './adapters/excelAdapter';

// ─── Module Display Names ──────────────────────────────────────────────────

const MODULE_DISPLAY_NAMES: Record<ExportModule, string> = {
  'user-management': 'User Management',
  'sales-overview': 'Sales Overview',
  'plan-configuration': 'Plan Configuration',
  'organization-management': 'Organization Management',
  "billing-history": 'Billing History',
};

// ─── Adapter Registry ──────────────────────────────────────────────────────

const adapters = new Map<ExportFormat, ExportAdapter>();
adapters.set('pdf', pdfAdapter);
adapters.set('xlsx', excelAdapter);

// ─── Export Service ────────────────────────────────────────────────────────

/**
 * Build the ExportMetadata block for an export.
 */
async function buildMetadata(
  config: ExportConfig,
  rows: ExportRow[],
  userId: string,
  includedFields: string[],
  redactedFields: string[],
): Promise<ExportMetadata> {
  const exportId = generateExportId();
  const timestamp = new Date().toISOString();
  const initiatingUserHash = await sha256(userId);
  const dataChecksum = await computeDataChecksum(rows);

  return {
    exportId,
    timestamp,
    initiatingUserHash: initiatingUserHash.slice(0, 32),
    module: config.module,
    moduleDisplayName: MODULE_DISPLAY_NAMES[config.module],
    filtersUsed: config.filters ?? {},
    recordCount: rows.length,
    dataChecksum,
    fullExportRequested: config.fullExport,
    appVersion: '1.0.0',
    includedFields,
    redactedFields,
  };
}

export interface ExportServiceAPI {
  /**
   * Execute a full export pipeline: redact → validate → generate → download.
   *
   * @param rawData    Raw records from the API (pre-redaction).
   * @param config     Export configuration from the settings modal.
   * @param userId     Identifier of the initiating user (will be hashed).
   * @param onProgress Optional progress callback.
   * @param signal     Optional AbortSignal for cancellation.
   * @returns ExportResult discriminated union.
   */
  export(
    rawData: ReadonlyArray<Record<string, unknown>>,
    config: ExportConfig,
    userId: string,
    onProgress?: (progress: ExportProgress) => void,
    signal?: AbortSignal,
  ): Promise<ExportResult>;

  /**
   * Generate a preview of the export payload without triggering download.
   * Useful for the export preview feature.
   */
  preview(
    rawData: ReadonlyArray<Record<string, unknown>>,
    config: ExportConfig,
    userId: string,
  ): Promise<ExportPayload>;

  /**
   * Register a custom adapter for a format.
   * Allows swapping the PDF/Excel engine at runtime.
   */
  registerAdapter(adapter: ExportAdapter): void;
}

function createExportService(): ExportServiceAPI {
  return {
    async export(
      rawData,
      config,
      userId,
      onProgress,
      signal,
    ): Promise<ExportResult> {
      try {
        // 1. Resolve redaction policy
        const policy = getDefaultPolicy(config.module);

        onProgress?.({ percent: 5, message: 'Applying redaction policy…', cancellable: true });
        if (signal?.aborted) return { status: 'cancelled', reason: 'User cancelled' };

        // 2. Apply redaction
        const { rows, includedFields, redactedFields } = await applyRedaction(
          rawData,
          policy,
          config.selectedFields,
          config.fullExport,
        );

        if (signal?.aborted) return { status: 'cancelled', reason: 'User cancelled' };

        onProgress?.({ percent: 15, message: 'Generating metadata…', cancellable: true });

        // 3. Build metadata
        const metadata = await buildMetadata(
          config,
          rows,
          userId,
          includedFields,
          redactedFields,
        );

        // 4. Build payload
        const columns = policy.fields
          .filter((f) => includedFields.includes(f.key))
          .map((f) => ({ key: f.key, label: f.label }));

        const payload: ExportPayload = {
          config,
          metadata,
          columns,
          rows,
          additionalSheets: config.additionalSheets,
        };

        // 5. Validate
        const validation = validateExportPayload(payload);
        if (!validation.valid) {
          const errors = validation.issues
            .filter((i) => i.severity === 'error')
            .map((i) => `${i.path}: ${i.message}`)
            .join('; ');
          return { status: 'error', error: `Validation failed: ${errors}` };
        }

        // 6. Get adapter and generate
        const adapter = adapters.get(config.format);
        if (!adapter) {
          return { status: 'error', error: `No adapter registered for format: ${config.format}` };
        }

        const filename = await adapter.generate(payload, onProgress, signal);

        return { status: 'success', filename, metadata };
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('cancelled')) {
          return { status: 'cancelled', reason: err.message };
        }
        const message = err instanceof Error ? err.message : 'Unknown export error';
        return { status: 'error', error: message };
      }
    },

    async preview(rawData, config, userId): Promise<ExportPayload> {
      const policy = getDefaultPolicy(config.module);

      const { rows, includedFields, redactedFields } = await applyRedaction(
        rawData,
        policy,
        config.selectedFields,
        config.fullExport,
      );

      const metadata = await buildMetadata(
        config,
        rows,
        userId,
        includedFields,
        redactedFields,
      );

      const columns = policy.fields
        .filter((f) => includedFields.includes(f.key))
        .map((f) => ({ key: f.key, label: f.label }));

      const payload: ExportPayload = { config, metadata, columns, rows, additionalSheets: config.additionalSheets };
      assertValidPayload(payload);
      return payload;
    },

    registerAdapter(adapter: ExportAdapter): void {
      adapters.set(adapter.format, adapter);
    },
  };
}

/** Singleton export service instance. */
export const exportService = createExportService();
