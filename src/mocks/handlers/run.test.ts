import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { runHandlers } from "@/mocks/handlers/run";
import { getFlowRuns, getFlowRunDetail, killFlowRun, getJobRunLog } from "@/api/run";

const server = setupServer(...runHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("jobFlowRun endpoints", () => {
  it("pages flow runs with total", async () => {
    const res = await getFlowRuns({ page: 1, pageSize: 5 });
    expect(res.data.length).toBeLessThanOrEqual(5);
    expect(res.total).toBeGreaterThan(0);
    expect(res.data.every((r) => typeof r.status === "string" && typeof r.type === "string")).toBe(true);
  });
  it("filters by flowId (RunHistory)", async () => {
    const all = await getFlowRuns({ page: 1, pageSize: 50 });
    const fid = all.data[0].flowId;
    const filtered = await getFlowRuns({ page: 1, pageSize: 50, flowId: fid });
    expect(filtered.data.length).toBeGreaterThan(0);
    expect(filtered.data.every((r) => r.flowId === fid)).toBe(true);
  });
  it("detail: single-task flow has 1 node, composite has >1", async () => {
    const all = await getFlowRuns({ page: 1, pageSize: 50 });
    const composite = all.data.find((r) => r.type === "JOB_FLOW")!;
    const single = all.data.find((r) => r.type !== "JOB_FLOW")!;
    expect((await getFlowRunDetail(composite.id)).nodes.length).toBeGreaterThan(1);
    expect((await getFlowRunDetail(single.id)).nodes.length).toBe(1);
  });
  it("kill sets status KILLED", async () => {
    const all = await getFlowRuns({ page: 1, pageSize: 50 });
    const killed = await killFlowRun(all.data[0].id);
    expect(killed.status).toBe("KILLED");
  });
  it("jobRun log returns content", async () => {
    const all = await getFlowRuns({ page: 1, pageSize: 50 });
    const detail = await getFlowRunDetail(all.data[0].id);
    const log = await getJobRunLog(detail.nodes[0].id);
    expect(typeof log.content).toBe("string");
  });
});
