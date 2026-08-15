import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { alertRuleHandlers } from "@/mocks/handlers/alert";
import { getAlertRules } from "./alert";

const server = setupServer(...alertRuleHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("alertRule mock — backend-aligned AlertType + polymorphic config", () => {
  it("returns AlertType and only FEI_SHU carries webhook config", async () => {
    const page = await getAlertRules({ page: 1, pageSize: 20 });
    expect(page.data.length).toBeGreaterThan(0);
    for (const r of page.data) {
      expect(["EMAIL", "FEI_SHU", "DING_DING", "SMS"]).toContain(r.type);
      if (r.type === "FEI_SHU") expect(typeof r.config?.webhook).toBe("string");
      else expect(r.config).toBeUndefined();
    }
  });
});
