import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { authHandlers } from "@/mocks/handlers/auth";
import { queryHandlers } from "@/mocks/handlers/query";
import { login } from "@/api/auth";
import { execQuery, getDatabases, getTables } from "@/api/query";

const server = setupServer(...authHandlers, ...queryHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("auth/query envelope", () => {
  it("login unwraps to token+user", async () => {
    const res = await login({ username: "admin", password: "123456" });
    expect(typeof res.token).toBe("string");
    expect(res.user.username).toBe("admin");
  });
  it("login failure still rejects (401)", async () => {
    await expect(login({ username: "admin", password: "wrong" })).rejects.toBeTruthy();
  });
  it("execQuery unwraps to a QueryResult", async () => {
    const r = await execQuery({ datasourceId: "1", sql: "select 1" } as never);
    expect(r).toHaveProperty("columns");
    expect(r).toHaveProperty("rows");
    expect(typeof r.success).toBe("boolean");
  });
  it("databases/tables unwrap to arrays", async () => {
    expect(Array.isArray(await getDatabases("1"))).toBe(true);
    expect(Array.isArray(await getTables("1", "ods"))).toBe(true);
  });
});
