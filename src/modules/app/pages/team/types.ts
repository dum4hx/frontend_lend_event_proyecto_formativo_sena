/**
 * TeamMember local type used within the Team module.
 */
export type TeamMemberStatus = "active" | "inactive" | "invited";

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  roleName: string;
  roleId: string;
  status: TeamMemberStatus;
  locations: string[];
}

export interface TeamFormValues {
  firstName: string;
  firstSurname: string;
  email: string;
  phone: string;
  roleId: string;
  locations: string[];
}

export const TEAM_PHONE_PREFIX = "+57";

export function toColombianPhone(digits: string): string {
  return digits ? `${TEAM_PHONE_PREFIX}${digits}` : "";
}

export function formatPhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function normalizeRoleName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function isOwnerRoleName(roleName: string): boolean {
  const normalized = normalizeRoleName(roleName);
  return normalized === "propietario" || normalized === "owner";
}
