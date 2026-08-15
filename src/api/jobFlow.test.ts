import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { jobFlowHandlers } from "@/mocks/handlers/jobFlow";
import {
  createJobFlow,
  getJobFlow,
  updateJobFlow,
  copyJobFlow,
  startSchedule,
  stopSchedule,
  runFlowOnce,
} from "./jobFlow";

const server = setupServer(...jobFlowHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("jobFlow API + mock", () => {
  it("creates then gets a JobFlow", async () => {
    const id = await createJobFlow({ name: "f1", type: "JOB_FLOW", cronExpr: "0 0 * * *", config: { parallelism: 2 } });
    expect(typeof id).toBe("number");
    const flow = await getJobFlow(id);
    expect(flow.name).toBe("f1");
    expect(flow.status).toBe("ONLINE");
  });

  it("start/stop schedule flips status", async () => {
    const id = await createJobFlow({ name: "f2", type: "JOB_FLOW" });
    await startSchedule(id);
    expect((await getJobFlow(id)).status).toBe("SCHEDULING");
    await stopSchedule(id);
    expect((await getJobFlow(id)).status).toBe("ONLINE");
  });

  it("update merges and runOnce returns an id", async () => {
    const id = await createJobFlow({ name: "f3", type: "JOB_FLOW" });
    await updateJobFlow({ id, name: "f3-renamed", type: "JOB_FLOW" });
    expect((await getJobFlow(id)).name).toBe("f3-renamed");
    expect(typeof (await runFlowOnce(id))).toBe("number");
  });

  it("synthesizes a default JobFlow for non-numeric seeded tree ids", async () => {
    const flow = await getJobFlow("wf-abc123");
    expect(flow.type).toBe("JOB_FLOW");
    expect(flow.status).toBe("ONLINE");
  });

  it("copies a JobFlow under a new id", async () => {
    const id = await createJobFlow({ name: "f4", type: "JOB_FLOW" });
    const copyId = await copyJobFlow(id);
    expect(typeof copyId).toBe("number");
    expect(copyId).not.toBe(id);
  });
});
