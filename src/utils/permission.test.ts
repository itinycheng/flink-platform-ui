import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS } from "@/constants/enums";
import { roleHasPermission, computeEffectivePermissions } from "./permission";

describe("RBAC permission derivation", () => {
  it("ROLE_PERMISSIONS mirrors backend (spot checks)", () => {
    expect(ROLE_PERMISSIONS.SUPER_ADMIN).toContain("SYSTEM_MANAGE");
    expect(ROLE_PERMISSIONS.ADMIN).not.toContain("SYSTEM_MANAGE");
    expect(ROLE_PERMISSIONS.VIEWER).toEqual(["WORKSPACE_VIEW", "TASK_VIEW"]);
    expect(roleHasPermission("OPERATOR", "TASK_EXEC")).toBe(true);
    expect(roleHasPermission("VIEWER", "TASK_EDIT")).toBe(false);
  });
  it("computeEffectivePermissions unions global + current-workspace role", () => {
    expect(computeEffectivePermissions({ global: "SUPER_ADMIN", workspaces: {} }, 1)).toContain("SYSTEM_MANAGE");
    const p = computeEffectivePermissions({ workspaces: { 1: "VIEWER", 2: "DEVELOPER" } }, 2);
    expect(p).toContain("TASK_EDIT");
    expect(p).not.toContain("TASK_PURGE");
    expect(computeEffectivePermissions({ workspaces: { 1: "VIEWER" } }, 2)).toEqual([]); // no role in ws 2
  });
});
