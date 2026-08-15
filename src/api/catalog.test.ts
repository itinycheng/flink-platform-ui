import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { adminHandlers } from "@/mocks/handlers/admin";
import { getCatalogs } from "./admin";
import { CATALOG_TYPES } from "@/constants/enums";

const server = setupServer(...adminHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("catalog mock — backend-aligned CatalogType", () => {
  it("returns a backend CatalogType and a createSql", async () => {
    const page = await getCatalogs({ page: 1, pageSize: 10 });
    expect(page.data.length).toBeGreaterThan(0);
    const c = page.data[0];
    expect(CATALOG_TYPES as readonly string[]).toContain(c.type);
    expect(typeof c.createSql).toBe("string");
  });
});
