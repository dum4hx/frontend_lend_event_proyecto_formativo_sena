import { getDashboardUrlByRole, getFirstAccessibleUrl } from "./roleRouting";

export const AUTH_SESSION_CLEARED_EVENT = "lendevent:auth-session-cleared";

const PUBLIC_AUTH_PATHS = new Set([
  "/",
  "/login",
  "/sign-up",
  "/password-recovery",
  "/accept-invite",
  "/verify-email",
  "/auth/verify-otp",
]);

export function isPrivatePath(pathname: string): boolean {
  return pathname.startsWith("/app") || pathname.startsWith("/super-admin");
}

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.has(pathname);
}

export function getAuthenticatedHomeUrl(
  permissions: string[],
  roleName?: string | null,
): string {
  const byPermissions = getFirstAccessibleUrl(permissions);
  if (byPermissions !== "/") {
    return byPermissions;
  }

  const byRole = roleName ? getDashboardUrlByRole(roleName) : "/";
  if (byRole !== "/") {
    return byRole;
  }

  return permissions.includes("platform:manage") ? "/super-admin" : "/app";
}

export function resolveSafePostAuthRedirect(
  redirectTo: string | null | undefined,
  permissions: string[],
  roleName?: string | null,
): string {
  const fallback = getAuthenticatedHomeUrl(permissions, roleName);

  if (!redirectTo) {
    return fallback;
  }

  try {
    const url = new URL(redirectTo, window.location.origin);
    if (url.origin !== window.location.origin) {
      return fallback;
    }

    const normalized = `${url.pathname}${url.search}${url.hash}`;
    if (!normalized || isPublicAuthPath(url.pathname)) {
      return fallback;
    }

    return normalized;
  } catch {
    return fallback;
  }
}