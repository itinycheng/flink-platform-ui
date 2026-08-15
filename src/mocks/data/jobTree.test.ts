import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { workflowHandlers } from "@/mocks/handlers/job";
import { getJobGroups, getJobsByGroup, searchJobs } from "@/api/job";

const server = setupServer(...workflowHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("jobTree read endpoints", () => {
  it("roots returns only top-level groups, with childCount and no children", async () => {
    const roots = await getJobGroups();
    expect(roots.length).toBeGreaterThan(0);
    expect(roots.every((n) => n.kind === "group" && n.pid === "")).toBe(true);
    expect(roots.every((n) => n.children === undefined)).toBe(true);
    expect(roots.every((n) => typeof n.childCount === "number")).toBe(true);
  });

  it("children of a top-level group may include subgroups and leaves", async () => {
    const roots = await getJobGroups();
    // seed guarantees the first top group has at least one subgroup
    const children = await getJobsByGroup(roots[0].id);
    expect(children.some((n) => n.kind === "group")).toBe(true);
    const sub = children.find((n) => n.kind === "group")!;
    // a subgroup's children are leaves only
    const subChildren = await getJobsByGroup(sub.id);
    expect(subChildren.every((n) => n.kind !== "group")).toBe(true);
  });

  it("search matches backend JobType case-sensitively and groups results", async () => {
    const results = await searchJobs({ types: ["FLINK_SQL"] });
    const leaves = results.flatMap((g) => g.children ?? []);
    expect(leaves.length).toBeGreaterThan(0);
    expect(leaves.every((c) => c.jobType === "FLINK_SQL")).toBe(true);
  });
});
