import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { workflowHandlers } from "@/mocks/handlers/job";
import { jobFlowHandlers } from "@/mocks/handlers/jobFlow";
import {
  LEGACY_DEFINITIONS_ROOT_ID,
  createJobGroup,
  createJobInfo,
  deleteTreeNode,
  getJobGroups,
  getJobsByGroup,
  renameTreeNode,
  searchJobs,
  updateJobTags,
} from "@/api/job";

const server = setupServer(...workflowHandlers, ...jobFlowHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("legacy definition tree adapter", () => {
  it("exposes one virtual root without calling a nonexistent jobGroup endpoint", async () => {
    await expect(getJobGroups()).resolves.toEqual([
      expect.objectContaining({ id: LEGACY_DEFINITIONS_ROOT_ID, kind: "group", pid: "" }),
    ]);
  });

  it("combines jobFlow/page and jobInfo/page beneath the virtual root", async () => {
    const children = await getJobsByGroup(LEGACY_DEFINITIONS_ROOT_ID);
    expect(children.some((node) => node.kind === "workflow" && node.id.startsWith("flow:"))).toBe(true);
    expect(children.some((node) => node.kind === "task" && node.id.startsWith("job:"))).toBe(true);
  });

  it("filters backend JobType values and workflows client-side", async () => {
    const tasks = (await searchJobs({ types: ["FLINK_SQL"] })).flatMap((group) => group.children ?? []);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((node) => node.jobType === "FLINK_SQL")).toBe(true);

    const flows = (await searchJobs({ types: ["workflow"] })).flatMap((group) => group.children ?? []);
    expect(flows.length).toBeGreaterThan(0);
    expect(flows.every((node) => node.kind === "workflow")).toBe(true);
  });

  it("rejects grouping because the deployed backend has no group resource", async () => {
    await expect(createJobGroup({ name: "unsupported" })).rejects.toThrow("does not support definition groups");
  });

  it("creates, renames and deletes a task through legacy jobInfo endpoints", async () => {
    const created = await createJobInfo({
      name: "legacy-task",
      type: "SHELL",
      execMode: "BATCH",
      routeUrl: [1],
      subject: "echo ok",
      config: { type: "SHELL", retryTimes: 0, retryInterval: "5s", timeout: "60s" },
    });
    const nodeId = `job:${created.id}`;
    await expect(renameTreeNode({ id: nodeId, name: "renamed-task" })).resolves.toBe(nodeId);
    await expect(deleteTreeNode(nodeId)).resolves.toBe(true);
  });

  it("updates workflow tags through get + update", async () => {
    const flow = (await getJobsByGroup(LEGACY_DEFINITIONS_ROOT_ID)).find((node) => node.kind === "workflow")!;
    await expect(updateJobTags(flow.id, ["etl"])).resolves.toEqual(expect.objectContaining({ tags: ["etl"] }));
  });
});
