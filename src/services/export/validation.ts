/**
 * Runtime validation for export payloads.
 *
 * Provides guards and assertion helpers that verify exported data
 * conforms to the expected schemas before being passed to adapters.
 * Uses strict TypeScript + runtime checks (no `any`).
 */

import type {
  ExportPayload,
  ExportMetadata,
  ExportConfig,
  ExportRow,
  ExportFormat,
  ExportModule,
} from '../../types/export';

// ─── Guard Helpers ─────────────────────────────────────────────────────────

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const VALID_FORMATS: ReadonlyArray<ExportFormat> = ['pdf', 'xlsx'];
const VALID_MODULES: ReadonlyArray<ExportModule> = [
  'user-management',
  'sales-overview',
  'plan-configuration',
  'organization-management',
  'billing-history',
];

// ─── Validation Results ────────────────────────────────────────────────────

/** Individual validation issue. */
export interface ValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

/** Result of a validation run. */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

function issue(path: string, message: string, severity: 'error' | 'warning' = 'error'): ValidationIssue {
  return { path, message, severity };
}

// ─── Metadata Validation ───────────────────────────────────────────────────

/** Validate an ExportMetadata object at runtime. */
export function validateMetadata(meta: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isObject(meta)) {
    return { valid: false, issues: [issue('metadata', 'Metadata must be an object')] };
  }

  const m = meta as Record<string, unknown>;

  if (!isNonEmptyString(m['exportId'])) {
    issues.push(issue('metadata.exportId', 'exportId is required and must be a non-empty string'));
  }

  if (!isNonEmptyString(m['timestamp'])) {
    issues.push(issue('metadata.timestamp', 'timestamp is required (ISO-8601)'));
  } else if (isNaN(Date.parse(m['timestamp'] as string))) {
    issues.push(issue('metadata.timestamp', 'timestamp must be a valid ISO-8601 date'));
  }

  if (!isNonEmptyString(m['initiatingUserHash'])) {
    issues.push(issue('metadata.initiatingUserHash', 'initiatingUserHash is required'));
  }

  if (!isNonEmptyString(m['module']) || !VALID_MODULES.includes(m['module'] as ExportModule)) {
    issues.push(issue('metadata.module', `module must be one of: ${VALID_MODULES.join(', ')}`));
  }

  if (typeof m['recordCount'] !== 'number' || m['recordCount'] < 0) {
    issues.push(issue('metadata.recordCount', 'recordCount must be a non-negative number'));
  }

  if (!isNonEmptyString(m['dataChecksum'])) {
    issues.push(issue('metadata.dataChecksum', 'dataChecksum is required'));
  }

  if (typeof m['fullExportRequested'] !== 'boolean') {
    issues.push(issue('metadata.fullExportRequested', 'fullExportRequested must be a boolean'));
  }

  if (!Array.isArray(m['includedFields'])) {
    issues.push(issue('metadata.includedFields', 'includedFields must be an array'));
  }

  if (!Array.isArray(m['redactedFields'])) {
    issues.push(issue('metadata.redactedFields', 'redactedFields must be an array'));
  }

  return { valid: issues.every((i) => i.severity !== 'error'), issues };
}

// ─── Config Validation ─────────────────────────────────────────────────────

/** Validate an ExportConfig object at runtime. */
export function validateConfig(config: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isObject(config)) {
    return { valid: false, issues: [issue('config', 'Config must be an object')] };
  }

  const c = config as Record<string, unknown>;

  if (!isNonEmptyString(c['format']) || !VALID_FORMATS.includes(c['format'] as ExportFormat)) {
    issues.push(issue('config.format', `format must be one of: ${VALID_FORMATS.join(', ')}`));
  }

  if (!isNonEmptyString(c['module']) || !VALID_MODULES.includes(c['module'] as ExportModule)) {
    issues.push(issue('config.module', `module must be one of: ${VALID_MODULES.join(', ')}`));
  }

  if (!Array.isArray(c['selectedFields']) || (c['selectedFields'] as unknown[]).length === 0) {
    issues.push(issue('config.selectedFields', 'At least one field must be selected'));
  }

  if (typeof c['includeAuditMetadata'] !== 'boolean') {
    issues.push(issue('config.includeAuditMetadata', 'includeAuditMetadata must be a boolean'));
  }

  if (typeof c['fullExport'] !== 'boolean') {
    issues.push(issue('config.fullExport', 'fullExport must be a boolean'));
  }

  return { valid: issues.every((i) => i.severity !== 'error'), issues };
}

// ─── Row Validation ────────────────────────────────────────────────────────

/** Validate that each row only contains expected field keys. */
export function validateRows(
  rows: unknown,
  expectedKeys: ReadonlyArray<string>,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(rows)) {
    return { valid: false, issues: [issue('rows', 'Rows must be an array')] };
  }

  if (rows.length === 0) {
    issues.push(issue('rows', 'Export contains no data rows', 'warning'));
  }

  // Sample-check first 10 rows for unexpected keys
  const sample = rows.slice(0, 10) as unknown[];
  for (let i = 0; i < sample.length; i++) {
    const row = sample[i];
    if (!isObject(row)) {
      issues.push(issue(`rows[${i}]`, 'Each row must be an object'));
      continue;
    }
    const rowKeys = Object.keys(row as Record<string, unknown>);
    for (const key of rowKeys) {
      if (!expectedKeys.includes(key)) {
        issues.push(issue(`rows[${i}].${key}`, `Unexpected field "${key}" in export row`, 'warning'));
      }
    }
  }

  return { valid: issues.every((i) => i.severity !== 'error'), issues };
}

// ─── Full Payload Validation ───────────────────────────────────────────────

/** Validate a complete ExportPayload before passing it to an adapter. */
export function validateExportPayload(payload: unknown): ValidationResult {
  const allIssues: ValidationIssue[] = [];

  if (!isObject(payload)) {
    return { valid: false, issues: [issue('payload', 'Payload must be an object')] };
  }

  const p = payload as Record<string, unknown>;

  // Validate config
  const configResult = validateConfig(p['config']);
  allIssues.push(...configResult.issues);

  // Validate metadata
  const metaResult = validateMetadata(p['metadata']);
  allIssues.push(...metaResult.issues);

  // Validate columns
  if (!Array.isArray(p['columns'])) {
    allIssues.push(issue('columns', 'columns must be an array'));
  } else {
    for (let i = 0; i < (p['columns'] as unknown[]).length; i++) {
      const col = (p['columns'] as unknown[])[i];
      if (!isObject(col) || !isNonEmptyString((col as Record<string, unknown>)['key'])) {
        allIssues.push(issue(`columns[${i}]`, 'Each column must have a key and label'));
      }
    }
  }

  // Validate rows
  if (Array.isArray(p['columns'])) {
    const expectedKeys = (p['columns'] as Array<{ key: string }>).map((c) => c.key);
    const rowsResult = validateRows(p['rows'], expectedKeys);
    allIssues.push(...rowsResult.issues);
  }

  return {
    valid: allIssues.every((i) => i.severity !== 'error'),
    issues: allIssues,
  };
}

/** Type assertion that throws if the payload is invalid. */
export function assertValidPayload(payload: unknown): asserts payload is ExportPayload {
  const result = validateExportPayload(payload);
  if (!result.valid) {
    const errorMessages = result.issues
      .filter((i) => i.severity === 'error')
      .map((i) => `${i.path}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid export payload: ${errorMessages}`);
  }
}

/** Type guard for ExportConfig. */
export function isValidExportConfig(value: unknown): value is ExportConfig {
  return validateConfig(value).valid;
}

/** Type guard for ExportMetadata. */
export function isValidExportMetadata(value: unknown): value is ExportMetadata {
  return validateMetadata(value).valid;
}

/** Type guard for ExportRow array. */
export function isValidExportRows(value: unknown, keys: ReadonlyArray<string>): value is ExportRow[] {
  return validateRows(value, keys).valid;
}
