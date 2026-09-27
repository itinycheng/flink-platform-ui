import { describe, expect, it } from "vitest";
import {
  adaptFlowRun,
  adaptFlowRunDetail,
  adaptLegacyTimestamps,
  adaptRunLog,
  adaptUserRoles,
  durationSeconds,
  type LegacyFlowRunDto,
  type LegacyJobRunDto,
} from "./contracts";

const flow: LegacyFlowRunDto = {
  id: 11,
  flowId: 5,
  name: "daily-etl",
  userId: 3,
  type: "JOB_FLOW",
  status: "KILLABLE",
  startTime: "2026-09-27T10:00:00",
  endTime: "2026-09-27T11:02:03",
  duration: "1h 2m 3s",
  flow: {
    vertices: [{ id: 7, jobId: 9, jobRunId: 21, jobRunStatus: "SUCCESS" }],
    edges: [],
    nodeLayouts: { 7: { x: 120, y: 80 } },
  },
};

const job: LegacyJobRunDto = {
  id: 21,
  jobId: 9,
  flowRunId: 11,
  name: "extract",
  type: "MYSQL_SQL",
  status: "SUCCESS",
  submitTime: "2026-09-27T10:00:00",
  endTime: "2026-09-27T11:02:03",
  backInfo: { trackingUrl: "https://example.test/job/21", stdMsg: "done" },
};

describe("legacy backend adapters", () => {
  it("normalizes status, ids and compact durations", () => {
    expect(durationSeconds("1d 2h 3m")).toBe(93_780);
    expect(adaptFlowRun(flow)).toEqual(
      expect.objectContaining({ id: "11", flowId: "5", status: "KILLING", duration: 3_723, submitter: "3" }),
    );
  });

  it("joins flow vertices to job executions for the run graph", () => {
    const detail = adaptFlowRunDetail(flow, [job]);
    expect(detail.nodes[0]).toEqual(expect.objectContaining({ id: "21", jobId: "9" }));
    expect(detail.graph.nodes[0]).toEqual(expect.objectContaining({ id: "21", label: "extract", x: 120, y: 80 }));
  });

  it("reads logs from the legacy backInfo payload", () => {
    expect(adaptRunLog(job)).toEqual({ id: "21", content: "done" });
  });

  it("adapts the Vue-era role array returned by user/info", () => {
    expect(adaptUserRoles(["admin", "common"])).toEqual({ global: "ADMIN", workspaces: {} });
    expect(adaptUserRoles(undefined)).toEqual({});
  });

  it("normalizes legacy timestamp field names", () => {
    expect(adaptLegacyTimestamps({ id: 1, createTime: "created", updateTime: "updated" })).toEqual(
      expect.objectContaining({ createdAt: "created", updatedAt: "updated" }),
    );
  });
});
