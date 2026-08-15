import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { adminHandlers } from "@/mocks/handlers/admin";
import { getWorkers } from "./admin";

const server = setupServer(...adminHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("worker mock — backend-aligned shape", () => {
  it("returns WorkerStatus role, string port, grpcPort and environments", async () => {
    const page = await getWorkers({ page: 1, pageSize: 10 });
    expect(page.data.length).toBeGreaterThan(0);
    const w = page.data[0];
    expect(["ACTIVE", "INACTIVE", "DELETED"]).toContain(w.role);
    expect(typeof w.port).toBe("string");
    expect(typeof w.grpcPort).toBe("number");
    expect(Array.isArray(w.environments)).toBe(true);
    expect(w.environments?.[0]).toHaveProperty("name");
    expect(w.environments?.[0]).toHaveProperty("value");
  });
});
