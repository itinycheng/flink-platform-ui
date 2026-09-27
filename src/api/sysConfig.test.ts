import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { adminHandlers } from "@/mocks/handlers/admin";
import { getSysConfigs } from "./admin";

const server = setupServer(...adminHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("sysConfig mock — backend-aligned Flink config + /config/page", () => {
  it("returns configs with a backend Status and polymorphic config", async () => {
    const page = await getSysConfigs({ page: 1, pageSize: 10 });
    expect(page.data.length).toBeGreaterThan(0);
    const cfg = page.data[0];
    expect(["ENABLE", "DISABLE", "DELETED"]).toContain(cfg.status);
    expect(typeof cfg.version).toBe("string");
    expect(cfg.type).toBe("FLINK");
    expect(cfg.config.type).toBe("FLINK");
    expect(typeof cfg.config.commandPath).toBe("string");
  });
});
