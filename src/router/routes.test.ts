import { describe, it, expect } from "vitest";
import { getRoutePermission } from "./routes";

describe("getRoutePermission", () => {
  it("longest-prefix matches admin sub-pages over the /admin fallback", () => {
    expect(getRoutePermission("/admin/users")).toBe("WORKSPACE_MANAGE");
    expect(getRoutePermission("/admin/users/42")).toBe("WORKSPACE_MANAGE");
    expect(getRoutePermission("/admin/sys-configs")).toBe("WORKSPACE_MANAGE");
    expect(getRoutePermission("/admin/workspaces")).toBe("WORKSPACE_VIEW");
    expect(getRoutePermission("/admin/workers")).toBe("WORKSPACE_VIEW");
    expect(getRoutePermission("/admin/resources")).toBe("TASK_VIEW");
    expect(getRoutePermission("/admin")).toBe("WORKSPACE_VIEW");
  });

  it("maps top-level pages", () => {
    expect(getRoutePermission("/dashboard")).toBe("WORKSPACE_VIEW");
    expect(getRoutePermission("/audit-logs")).toBe("WORKSPACE_VIEW");
    expect(getRoutePermission("/studio")).toBe("TASK_VIEW");
    expect(getRoutePermission("/studio/list")).toBe("TASK_VIEW");
    expect(getRoutePermission("/jobs")).toBe("TASK_VIEW");
    expect(getRoutePermission("/workflow")).toBe("TASK_VIEW");
    expect(getRoutePermission("/query")).toBe("TASK_VIEW");
    expect(getRoutePermission("/runs")).toBe("TASK_VIEW");
    expect(getRoutePermission("/monitor")).toBe("TASK_VIEW");
  });

  it("returns undefined for unmapped paths", () => {
    expect(getRoutePermission("/unknown")).toBeUndefined();
    expect(getRoutePermission("/")).toBeUndefined();
  });
});
