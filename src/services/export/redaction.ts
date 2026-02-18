/**
 * Redaction / pseudonymization engine for the export system.
 *
 * Applies the configured FieldRedactionAction to each cell value
 * before it reaches an export adapter. All transformations are
 * deterministic so repeated exports with the same data + policy
 * produce identical output.
 */

import { sha256 } from './checksum';
import type {
  ExportFieldConfig,
  ExportRow,
  FieldRedactionAction,
  RedactionPolicy,
  ExportModule,
} from '../../types/export';

// ─── Default Field Policies ────────────────────────────────────────────────

/**
 * Default redaction policy for UserManagement module.
 * Aggregated user analytics — no PII by nature.
 */
export const USER_MANAGEMENT_POLICY: RedactionPolicy = {
  module: 'user-management',
  requiresFullExportConfirmation: false,
  fields: [
    { key: 'category', label: 'Category', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'role', label: 'Role', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'status', label: 'Status', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'count', label: 'Count', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'period', label: 'Period', redaction: 'include', overridable: false, defaultSelected: true, category: 'metadata' },
    { key: 'newUsers', label: 'New Users', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'averageUsersPerOrganization', label: 'Avg Users / Org', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
  ],
};

/**
 * Default redaction policy for SalesOverview module.
 * Revenue/subscription metrics — no PII by nature.
 */
export const SALES_OVERVIEW_POLICY: RedactionPolicy = {
  module: 'sales-overview',
  requiresFullExportConfirmation: false,
  fields: [
    { key: 'plan', label: 'Plan', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'displayName', label: 'Display Name', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'billingModel', label: 'Billing Model', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'baseCost', label: 'Base Cost (cents)', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'pricePerSeat', label: 'Price Per Seat (cents)', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'maxSeats', label: 'Max Seats', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'maxCatalogItems', label: 'Max Catalog Items', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'count', label: 'Subscription Count', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'percentage', label: 'Percentage', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'revenue', label: 'Revenue', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'period', label: 'Period', redaction: 'include', overridable: false, defaultSelected: true, category: 'metadata' },
  ],
};

/**
 * Default redaction policy for PlanConfiguration module.
 * Configuration data — no PII.
 */
export const PLAN_CONFIGURATION_POLICY: RedactionPolicy = {
  module: 'plan-configuration',
  requiresFullExportConfirmation: false,
  fields: [
    { key: '_id', label: 'Plan ID (hashed)', redaction: 'hash', overridable: false, defaultSelected: true, category: 'identifier' },
    { key: 'plan', label: 'Plan Identifier', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'displayName', label: 'Display Name', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'description', label: 'Description', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'billingModel', label: 'Billing Model', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'baseCost', label: 'Base Cost (cents)', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'pricePerSeat', label: 'Price Per Seat (cents)', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'maxSeats', label: 'Max Seats', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'maxCatalogItems', label: 'Max Catalog Items', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'features', label: 'Features', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'sortOrder', label: 'Sort Order', redaction: 'include', overridable: false, defaultSelected: true, category: 'metadata' },
    { key: 'status', label: 'Status', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
  ],
};

/**
 * Default redaction policy for OrganizationManagement module.
 * Contains PII (name, email, phone) — hashed by default, overridable for full export.
 */
export const ORGANIZATION_MANAGEMENT_POLICY: RedactionPolicy = {
  module: 'organization-management',
  requiresFullExportConfirmation: true,
  fields: [
    { key: '_id', label: 'Organization ID (hashed)', redaction: 'hash', overridable: false, defaultSelected: true, category: 'identifier' },
    { key: 'name', label: 'Name', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'legalName', label: 'Legal Name', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'email', label: 'Email', redaction: 'mask', overridable: true, defaultSelected: true, category: 'attribute' },
    { key: 'phone', label: 'Phone', redaction: 'mask', overridable: true, defaultSelected: false, category: 'attribute' },
    { key: 'status', label: 'Status', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'plan', label: 'Plan', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'seatCount', label: 'Seat Count', redaction: 'include', overridable: false, defaultSelected: true, category: 'metric' },
    { key: 'country', label: 'Country', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'city', label: 'City', redaction: 'include', overridable: false, defaultSelected: true, category: 'attribute' },
    { key: 'createdAt', label: 'Created At', redaction: 'include', overridable: false, defaultSelected: true, category: 'metadata' },
  ],
};

/** Retrieve the default policy for a given module. */
export function getDefaultPolicy(module: ExportModule): RedactionPolicy {
  switch (module) {
    case 'user-management':
      return USER_MANAGEMENT_POLICY;
    case 'sales-overview':
      return SALES_OVERVIEW_POLICY;
    case 'plan-configuration':
      return PLAN_CONFIGURATION_POLICY;
    case 'organization-management':
      return ORGANIZATION_MANAGEMENT_POLICY;
  }
}

// ─── Redaction Engine ──────────────────────────────────────────────────────

/**
 * Resolve the effective redaction action for a field.
 * If fullExport is true and the field is overridable, action becomes 'include'.
 */
function resolveAction(field: ExportFieldConfig, fullExport: boolean): FieldRedactionAction {
  if (fullExport && field.overridable) {
    return 'include';
  }
  return field.redaction;
}

/** Mask a string value (show first and last char, mask middle). */
function maskValue(value: string): string {
  if (value.length <= 2) return '**';
  return value[0] + '*'.repeat(Math.min(value.length - 2, 8)) + value[value.length - 1];
}

/**
 * Resolve a dot-notation key from a nested object.
 * e.g., getNestedValue({ name: { firstName: 'John' } }, 'name.firstName') → 'John'
 */
function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Convert an unknown value to a string suitable for export cells. */
function valueToString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

/**
 * Apply redaction to a single cell value.
 */
async function redactValue(
  value: unknown,
  action: FieldRedactionAction,
): Promise<string | null> {
  const strVal = valueToString(value);

  switch (action) {
    case 'include':
      return strVal;
    case 'hash':
      if (!strVal) return '';
      return (await sha256(strVal)).slice(0, 16); // 16-char pseudonymous ID
    case 'mask':
      return maskValue(strVal);
    case 'exclude':
      return null;
  }
}

/**
 * Apply the redaction policy to a set of raw data records.
 *
 * @param rawData - Array of raw data objects (from API).
 * @param policy - The redaction policy for this module.
 * @param selectedFields - User-selected field keys to include.
 * @param fullExport - Whether the user explicitly requested full PII export.
 * @returns Redacted rows ready for export adapters, plus metadata about which fields were redacted.
 */
export async function applyRedaction(
  rawData: ReadonlyArray<Record<string, unknown>>,
  policy: RedactionPolicy,
  selectedFields: ReadonlyArray<string>,
  fullExport: boolean,
): Promise<{
  rows: ExportRow[];
  includedFields: string[];
  redactedFields: string[];
}> {
  const activeFields = policy.fields.filter((f) => selectedFields.includes(f.key));
  const includedFields: string[] = [];
  const redactedFields: string[] = [];

  for (const field of activeFields) {
    const action = resolveAction(field, fullExport);
    if (action === 'exclude') {
      redactedFields.push(field.key);
    } else if (action === 'hash' || action === 'mask') {
      includedFields.push(field.key);
      redactedFields.push(field.key);
    } else {
      includedFields.push(field.key);
    }
  }

  // Process rows in chunks for large datasets
  const CHUNK_SIZE = 500;
  const rows: ExportRow[] = [];

  for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
    const chunk = rawData.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async (record) => {
        const row: ExportRow = {};
        for (const field of activeFields) {
          const action = resolveAction(field, fullExport);
          const rawValue = getNestedValue(record as Record<string, unknown>, field.key);
          const redacted = await redactValue(rawValue, action);
          if (redacted !== null) {
            row[field.key] = redacted;
          }
        }
        return row;
      }),
    );
    rows.push(...chunkResults);

    // Yield to the event loop between chunks
    if (i + CHUNK_SIZE < rawData.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }

  return { rows, includedFields, redactedFields };
}
