import { describe, expect, it } from "vitest";
import { isOwnerRoleName, isRestrictedOwnerAction } from "../ownerRestrictions";

describe("ownerRestrictions", () => {
  describe("isOwnerRoleName", () => {
    it("returns true for owner labels in english and spanish", () => {
      expect(isOwnerRoleName("owner")).toBe(true);
      expect(isOwnerRoleName("Owner")).toBe(true);
      expect(isOwnerRoleName("propietario")).toBe(true);
      expect(isOwnerRoleName("Propietário")).toBe(true);
    });

    it("returns false for non-owner roles and empty values", () => {
      expect(isOwnerRoleName("manager")).toBe(false);
      expect(isOwnerRoleName("warehouse_operator")).toBe(false);
      expect(isOwnerRoleName("")).toBe(false);
      expect(isOwnerRoleName(undefined)).toBe(false);
      expect(isOwnerRoleName(null)).toBe(false);
    });
  });

  describe("isRestrictedOwnerAction", () => {
    it("blocks worker operational actions", () => {
      expect(isRestrictedOwnerAction("maintenance:resolve")).toBe(true);
      expect(isRestrictedOwnerAction("transfers:receive")).toBe(true);
      expect(isRestrictedOwnerAction("loans:return")).toBe(true);
      expect(isRestrictedOwnerAction("locations:update")).toBe(true);
    });

    it("keeps read and management actions available", () => {
      expect(isRestrictedOwnerAction("maintenance:read")).toBe(false);
      expect(isRestrictedOwnerAction("users:update")).toBe(false);
      expect(isRestrictedOwnerAction("roles:update")).toBe(false);
      expect(isRestrictedOwnerAction("subscription:manage")).toBe(false);
    });
  });
});
