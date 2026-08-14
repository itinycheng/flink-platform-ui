import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { pickerHandlers } from "@/mocks/handlers/picker";
import { listWorkers, listDatasources, listCatalogs, listResourceFiles } from "./picker";

const server = setupServer(...pickerHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("picker API + mocks", () => {
  it("listWorkers returns backend-shaped workers", async () => {
    const workers = await listWorkers();
    expect(Array.isArray(workers)).toBe(true);
    expect(workers.length).toBeGreaterThan(0);
    const w = workers[0];
    expect(typeof w.id).toBe("number");
    expect(typeof w.name).toBe("string");
    expect(typeof w.ip).toBe("string");
    expect(w.status).not.toBe("DELETED"); // list excludes deleted
    // Assert no DELETED workers in result
    expect(workers.some((w) => w.status === "DELETED")).toBe(false);
    // Assert DELETED worker fixture (id 99) is filtered out
    expect(workers.some((w) => w.id === 99)).toBe(false);
    // Assert returned length is less than total fixture count (6 total, 5 returned)
    expect(workers.length).toBeLessThan(6);
  });

  it("listDatasources filters by the JobType's dbType", async () => {
    const mysql = await listDatasources("MYSQL_SQL");
    expect(mysql.every((d) => d.type === "MYSQL")).toBe(true);
    const all = await listDatasources();
    expect(all.length).toBeGreaterThanOrEqual(mysql.length);
  });

  it("listCatalogs returns catalogs", async () => {
    const cats = await listCatalogs();
    expect(cats.length).toBeGreaterThan(0);
    expect(typeof cats[0].id).toBe("number");
  });

  it("listResourceFiles filters FILE resources by name suffix", async () => {
    const jars = await listResourceFiles("jar");
    expect(jars.length).toBeGreaterThan(0);
    expect(jars.every((r) => r.type === "FILE" && r.name.endsWith("jar"))).toBe(true);
  });
});
