import { useMemo } from "react";
import { useRoles } from "../../../../hooks/queries/useRoleQueries";
import { useUsers } from "../../../../hooks/queries/useUserQueries";
import type { SelectOption } from "../../../../components/ui";
import type { User, UsersQueryParams } from "../../../../types/api";
import type {
  WarehouseLocation,
  WarehouseLocationManager,
} from "../../../../services/warehouseOperatorService";

const MANAGER_ROLE_ALIASES = [
  "manager",
  "gerente",
  "gerente de sede",
  "site manager",
  "branch manager",
  "location manager",
  "warehouse manager",
];

function normalizeRoleName(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isLocationManagerRoleName(value: string | undefined): boolean {
  const normalized = normalizeRoleName(value);
  return MANAGER_ROLE_ALIASES.some((alias) => normalized === alias || normalized.includes(alias));
}

export function formatManagerName(user: Pick<User, "name"> | WarehouseLocationManager): string {
  const parts = [
    user.name.firstName,
    user.name.secondName,
    user.name.firstSurname,
    user.name.secondSurname,
  ].filter(Boolean);

  return parts.join(" ").trim();
}

export function resolveLocationManager(
  location: Pick<WarehouseLocation, "manager" | "managerId"> | null,
): WarehouseLocationManager | null {
  if (!location) return null;
  if (location.manager) return location.manager;
  if (location.managerId && typeof location.managerId === "object") {
    return location.managerId;
  }
  return null;
}

export function resolveLocationManagerId(
  location: Pick<WarehouseLocation, "manager" | "managerId"> | null,
): string {
  if (!location) return "";
  if (typeof location.managerId === "string") return location.managerId;
  if (location.managerId && typeof location.managerId === "object") return location.managerId._id;
  if (location.manager) return location.manager._id;
  return "";
}

export function useLocationManagerOptions() {
  const rolesQuery = useRoles();

  const managerRole = useMemo(
    () => rolesQuery.data?.items.find((role) => isLocationManagerRoleName(role.name)) ?? null,
    [rolesQuery.data],
  );

  const userQueryParams = useMemo<UsersQueryParams>(
    () => ({
      page: 1,
      limit: 100,
      ...(managerRole ? { roleId: managerRole._id } : {}),
    }),
    [managerRole],
  );

  const usersQuery = useUsers(userQueryParams);

  const managers = useMemo(() => {
    const users = usersQuery.data?.users ?? [];
    if (managerRole) {
      return users.filter((user) => user.roleId === managerRole._id);
    }
    return users.filter((user) => isLocationManagerRoleName(user.roleName));
  }, [managerRole, usersQuery.data]);

  const managerOptions = useMemo<SelectOption[]>(
    () =>
      managers.map((manager) => ({
        value: manager._id,
        label: `${formatManagerName(manager)} · ${manager.email}`,
      })),
    [managers],
  );

  return {
    managers,
    managerOptions,
    loading: rolesQuery.isLoading || usersQuery.isLoading,
    managerRoleFound: !!managerRole,
  };
}