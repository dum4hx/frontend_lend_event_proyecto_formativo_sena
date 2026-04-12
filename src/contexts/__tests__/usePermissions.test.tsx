import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext } from "../AuthContext";
import { usePermissions } from "../usePermissions";
import type { User } from "../../types/api";

interface WrapperProps {
  children: ReactNode;
}

function createUser(roleName: string): User {
  return {
    _id: "u-1",
    email: "user@example.com",
    name: { firstName: "Test", firstSurname: "User" },
    roleName,
    roleId: "r-1",
    status: "active",
  };
}

function createWrapper(roleName: string) {
  const value = {
    user: createUser(roleName),
    isLoggedIn: true,
    isLoading: false,
    permissions: ["maintenance:resolve", "maintenance:read", "users:update"],
    checkAuth: async () => ({
      user: createUser(roleName),
      permissions: ["maintenance:resolve", "maintenance:read", "users:update"],
    }),
  };

  return function Wrapper({ children }: WrapperProps) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };
}

describe("usePermissions owner policy", () => {
  it("blocks restricted operational actions for owner", () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper("owner"),
    });

    expect(result.current.hasPermission("maintenance:resolve")).toBe(false);
    expect(result.current.hasPermission("maintenance:read")).toBe(true);
    expect(result.current.hasPermission("users:update")).toBe(true);
  });

  it("keeps permissions unchanged for non-owner roles", () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper("manager"),
    });

    expect(result.current.hasPermission("maintenance:resolve")).toBe(true);
    expect(result.current.hasPermission("maintenance:read")).toBe(true);
    expect(result.current.hasAnyPermission(["maintenance:resolve", "unknown:permission"])).toBe(true);
  });
});
