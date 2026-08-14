import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { workflowHandlers } from "@/mocks/handlers/job";
import { createJobInfo, getJobInfo, updateJobInfo } from "./job";

const server = setupServer(...workflowHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("jobInfo API + mock", () => {
  it("creates then gets a JobInfo, assigning an id and ONLINE status", async () => {
    const created = await createJobInfo({
      name: "j1",
      type: "MYSQL_SQL",
      execMode: "BATCH",
      routeUrl: [1],
      subject: "SELECT 1",
      config: { type: "MYSQL_SQL", retryTimes: 0, retryInterval: "5s", dsId: 1 },
    });
    expect(typeof created.id).toBe("number");
    expect(created.status).toBe("ONLINE");
    const fetched = await getJobInfo(created.id!);
    expect(fetched.name).toBe("j1");
  });

  it("updates a JobInfo", async () => {
    const created = await createJobInfo({
      name: "j2",
      type: "SHELL",
      execMode: "BATCH",
      routeUrl: [1],
      subject: "echo",
      config: { type: "SHELL", retryTimes: 0, retryInterval: "5s", timeout: "60s" },
    });
    const updated = await updateJobInfo({ ...created, name: "j2-renamed" });
    expect(updated.name).toBe("j2-renamed");
  });

  it("synthesizes a default JobInfo when the id is a non-numeric seeded tree-node id", async () => {
    const fetched = await getJobInfo("task-abc123");
    expect(fetched.type).toBe("MYSQL_SQL");
    expect(fetched.status).toBe("ONLINE");
  });
});
