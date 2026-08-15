import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { adminHandlers } from "@/mocks/handlers/admin";
import { getTags } from "./admin";

const server = setupServer(...adminHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("tag mock — backend-aligned TagType/Status", () => {
  it("returns TagType JOB_FLOW, Status enum, and a code", async () => {
    const page = await getTags({ page: 1, pageSize: 10 });
    expect(page.data.length).toBeGreaterThan(0);
    const tag = page.data[0];
    expect(tag.type).toBe("JOB_FLOW");
    expect(["ENABLE", "DISABLE", "DELETED"]).toContain(tag.status);
    expect(typeof tag.code).toBe("string");
  });
});
