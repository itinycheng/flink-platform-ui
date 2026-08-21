import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { queryHandlers } from "@/mocks/handlers/query";
import { execQuery, getDatabases, getTables } from "@/api/query";

const server = setupServer(...queryHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("query envelope", () => {
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
