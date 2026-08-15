import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { workflowHandlers } from "@/mocks/handlers/job";
import {
  createJobGroup,
  createJobInfo,
  deleteJobGroup,
  deleteTreeNode,
  getJobGroups,
  getJobsByGroup,
  renameJobGroup,
  renameTreeNode,
  searchJobs,
  updateJobTags,
} from "@/api/job";

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

describe("jobGroup write endpoints", () => {
  it("creates a top-level group and a subgroup under it", async () => {
    const topId = await createJobGroup({ name: "T1" });
    const subId = await createJobGroup({ name: "S1", pid: topId });
    const children = await getJobsByGroup(topId);
    expect(children.some((n) => n.id === subId && n.kind === "group")).toBe(true);
  });

  it("rejects a group nested more than one level deep", async () => {
    const topId = await createJobGroup({ name: "T2" });
    const subId = await createJobGroup({ name: "S2", pid: topId });
    await expect(createJobGroup({ name: "S3", pid: subId })).rejects.toBeTruthy();
  });

  it("renames and deletes a group", async () => {
    const id = await createJobGroup({ name: "T3" });
    expect(await renameJobGroup({ id, name: "T3x" })).toBe(id);
    expect(await deleteJobGroup(id)).toBe(true);
  });
});

describe("job_tree placement + leaf writes", () => {
  it("records a placement when a JobInfo is created with a groupId", async () => {
    const topId = await createJobGroup({ name: "P1" });
    await createJobInfo(
      {
        name: "placed-task",
        type: "SHELL",
        execMode: "BATCH",
        routeUrl: [1],
        subject: "echo",
        config: { type: "SHELL", retryTimes: 0, retryInterval: "5s", timeout: "60s" },
      },
      topId,
    );
    const children = await getJobsByGroup(topId);
    expect(children.some((n) => n.name === "placed-task" && n.kind === "task")).toBe(true);
  });

  it("renames and deletes a leaf, and sets tags", async () => {
    const topId = await createJobGroup({ name: "P2" });
    const created = await createJobInfo(
      {
        name: "t",
        type: "SHELL",
        execMode: "BATCH",
        routeUrl: [1],
        subject: "echo",
        config: { type: "SHELL", retryTimes: 0, retryInterval: "5s", timeout: "60s" },
      },
      topId,
    );
    const leafId = String(created.id);
    expect(await renameTreeNode({ id: leafId, name: "t2" })).toBe(leafId);
    const tagged = await updateJobTags(leafId, ["etl"]);
    expect(tagged.tags).toEqual(["etl"]);
    expect(await deleteTreeNode(leafId)).toBe(true);
  });
});
