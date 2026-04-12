/**
 * Owner frontend restrictions.
 *
 * These restrictions are UI-only and intentionally do NOT replace
 * backend authorization.
 *
 * Goal:
 * - Owners can still navigate and read all modules.
 * - Owners are blocked from selected operational actions that belong
 *   to worker day-to-day workflows.
 */

/**
 * Actions blocked for owner in UI, grouped by module.
 * Keep read permissions out of this policy to preserve module visibility.
 */
const OWNER_RESTRICTED_ACTIONS_BY_MODULE: Record<string, string[]> = {
  materials: [
    "materials:create",
    "materials:update",
    "materials:delete",
    "material_attributes:create",
    "material_attributes:update",
    "material_attributes:delete",
  ],
  warehouse: [
    "locations:create",
    "locations:update",
    "locations:delete",
    "inspections:create",
    "inspections:update",
    "maintenance:create",
    "maintenance:update",
    "maintenance:delete",
    "maintenance:resolve",
    "incidents:create",
    "incidents:update",
    "incidents:acknowledge",
    "incidents:resolve",
    "incidents:dismiss",
    "tickets:review",
    "tickets:approve",
    "tickets:reject",
    "tickets:cancel",
  ],
  commerceOperations: [
    "transfers:create",
    "transfers:update",
    "transfers:send",
    "transfers:accept",
    "transfers:receive",
    "loans:checkout",
    "loans:return",
    "requests:ready",
  ],
};

const OWNER_RESTRICTED_ACTIONS = new Set<string>(
  Object.values(OWNER_RESTRICTED_ACTIONS_BY_MODULE).flat(),
);

/** Normalize role labels from backend/localized values. */
function normalizeRoleName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** True when the role name maps to owner/propietario. */
export function isOwnerRoleName(roleName?: string | null): boolean {
  if (!roleName) return false;
  const normalized = normalizeRoleName(roleName);
  return normalized === "owner" || normalized === "propietario";
}

/** UI-only action restriction for owner role. */
export function isRestrictedOwnerAction(permissionKey: string): boolean {
  return OWNER_RESTRICTED_ACTIONS.has(permissionKey);
}
