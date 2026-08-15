import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { adminHandlers } from "@/mocks/handlers/admin";
import { getParams } from "./admin";

const server = setupServer(...adminHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("jobParam mock — backend-aligned shape", () => {
  it("returns paramName/paramValue + JobParamType + flowId for JOB_FLOW", async () => {
    const page = await getParams({ page: 1, pageSize: 20 });
    expect(page.data.length).toBeGreaterThan(0);
    for (const p of page.data) {
      expect(typeof p.paramName).toBe("string");
      expect(typeof p.paramValue).toBe("string");
      expect(["GLOBAL", "JOB_FLOW"]).toContain(p.type);
      if (p.type === "JOB_FLOW") expect(typeof p.flowId).toBe("string");
    }
  });
});
