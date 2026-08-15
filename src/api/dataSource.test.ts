import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { adminHandlers } from "@/mocks/handlers/admin";
import { getDataSources } from "./admin";

const server = setupServer(...adminHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("datasource mock — backend-aligned shape", () => {
  it("returns DbType types and structured DatasourceParam", async () => {
    const page = await getDataSources({ page: 1, pageSize: 10 });
    expect(page.data.length).toBeGreaterThan(0);
    const ds = page.data[0];
    // type is a backend DbType, not the old MySQL/PostgreSQL/... set
    expect(["CLICKHOUSE", "MYSQL", "HIVE"]).toContain(ds.type);
    // params is a structured object, not a JSON string
    expect(typeof ds.params).toBe("object");
    expect(typeof ds.params.url).toBe("string");
    expect(ds.params.properties).toBeTypeOf("object");
  });
});
