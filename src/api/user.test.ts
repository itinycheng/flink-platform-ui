import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { adminHandlers } from "@/mocks/handlers/admin";
import { getUsers } from "./admin";

const server = setupServer(...adminHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("user mock — backend-aligned UserRoles/UserStatus", () => {
  it("returns roles as UserRoles.global and UserStatus", async () => {
    const page = await getUsers({ page: 1, pageSize: 10 });
    expect(page.data.length).toBeGreaterThan(0);
    const u = page.data[0];
    expect(u.roles).toBeTypeOf("object");
    expect(["SUPER_ADMIN", "ADMIN", "DEVELOPER", "OPERATOR", "VIEWER"]).toContain(u.roles.global);
    expect(["NORMAL", "LOCKED"]).toContain(u.status);
  });
});
