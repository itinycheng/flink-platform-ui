import { describe, it, expect } from "vitest";
import type { JobInfo } from "./entities";
import type { FlinkJob, SqlJob, DependentJob } from "./task";

describe("backend entity types compile with representative values", () => {
  it("builds a FLINK_SQL JobInfo", () => {
    const config: FlinkJob = {
      type: "FLINK_SQL",
      retryTimes: 0,
      retryInterval: "5s",
      configs: { "pipeline.name": "demo" },
      catalogs: [1, 2],
      extJars: [10],
    };
    const job: JobInfo = {
      name: "demo",
      type: "FLINK_SQL",
      execMode: "STREAMING",
      routeUrl: [1],
      subject: "SELECT 1",
      config,
    };
    expect(job.type).toBe("FLINK_SQL");
    expect((job.config as FlinkJob).catalogs).toEqual([1, 2]);
  });

  it("builds a SqlJob with dsId and a DependentJob with items", () => {
    const sql: SqlJob = { type: "MYSQL_SQL", retryTimes: 0, retryInterval: "5s", dsId: 42 };
    const dep: DependentJob = {
      type: "DEPENDENT",
      retryTimes: 0,
      retryInterval: "5s",
      relation: "AND",
      dependentItems: [
        { flowId: 1, jobId: 2, statuses: ["SUCCESS"], strategy: "LAST_EXECUTION_AS_EXPECTED", duration: "" },
      ],
    };
    expect(sql.dsId).toBe(42);
    expect(dep.dependentItems[0].statuses).toContain("SUCCESS");
  });
});
