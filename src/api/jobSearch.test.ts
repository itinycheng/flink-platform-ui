import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { workflowHandlers } from "@/mocks/handlers/job";
import { jobFlowHandlers } from "@/mocks/handlers/jobFlow";
import { searchJobs } from "./job";

const server = setupServer(...workflowHandlers, ...jobFlowHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("searchJobs", () => {
  it("matches backend JobType values case-sensitively against seeded tree nodes", async () => {
    const results = await searchJobs({ types: ["FLINK_SQL"] });
    const allChildren = results.flatMap((group) => group.children ?? []);
    expect(allChildren.length).toBeGreaterThan(0);
    expect(allChildren.every((child) => child.jobType === "FLINK_SQL")).toBe(true);
  });

  it("returns no matches for a type filter that isn't a real JobType value", async () => {
    const results = await searchJobs({ types: ["flink_sql"] });
    const allChildren = results.flatMap((group) => group.children ?? []);
    expect(allChildren.length).toBe(0);
  });
});
