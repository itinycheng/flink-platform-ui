import { http, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { FlowRun, FlowRunDetail, FlowRunGraph, JobRun } from "@/types/run";
import { EXECUTION_STATUSES, JOB_TYPES, type ExecutionStatus, type JobType } from "@/constants/enums";
import { ok, fail } from "@/mocks/lib/response";
import { ipage, parsePageSize } from "@/mocks/lib/page";
import type { LegacyFlowRunDto, LegacyJobRunDto } from "@/api/legacy/contracts";

const sampleParams = () =>
  JSON.stringify(
    { parallelism: faker.number.int({ min: 1, max: 8 }), retry: faker.number.int({ min: 0, max: 3 }) },
    null,
    2,
  );

function logLines(n: number): string {
  return Array.from({ length: n }, () => `[${faker.date.recent().toISOString()}] ${faker.lorem.sentence()}`).join("\n");
}

const INFLIGHT_EXEC_STATUSES: ExecutionStatus[] = ["SUBMITTED", "RUNNING", "KILLING", "CREATED", "WAITING"];
const JAR_LIKE_TYPES: JobType[] = ["FLINK_SQL", "FLINK_JAR", "COMMON_JAR"];

function timesForExec(status: ExecutionStatus): { startTime: string; endTime?: string; duration: number } {
  const start = faker.date.recent({ days: 14 });
  const inflight = INFLIGHT_EXEC_STATUSES.includes(status);
  const durationSec = faker.number.int({ min: 5, max: 7200 });
  return {
    startTime: start.toISOString(),
    endTime: inflight ? undefined : new Date(start.getTime() + durationSec * 1000).toISOString(),
    duration: inflight ? 0 : durationSec,
  };
}

function trackingForJobType(type: JobType): string | undefined {
  return JAR_LIKE_TYPES.includes(type) ? `http://flink-console.local/jobs/${faker.string.nanoid(10)}` : undefined;
}

function makeJobRun(flowRunId: string, type: JobType): JobRun {
  const status = faker.helpers.arrayElement(EXECUTION_STATUSES);
  return {
    id: `jr-${faker.string.nanoid(6)}`,
    jobId: String(faker.number.int({ min: 1, max: 9999 })),
    flowRunId,
    name: `${faker.word.verb()}-${faker.word.noun()}`,
    type,
    status,
    ...timesForExec(status),
    params: sampleParams(),
    trackingUrl: trackingForJobType(type),
  };
}

function toLegacyJobRun(run: JobRun): LegacyJobRunDto {
  return {
    id: run.id,
    jobId: run.jobId,
    flowRunId: run.flowRunId,
    name: run.name,
    type: run.type,
    status: run.status,
    submitTime: run.startTime,
    endTime: run.endTime,
    duration: run.duration,
    params: run.params,
    backInfo: {
      trackingUrl: run.trackingUrl,
      stdMsg: logLines(20),
    },
  };
}

function toLegacyFlowRun(run: FlowRunDetail): LegacyFlowRunDto {
  const vertexIds = new Map(run.nodes.map((node, index) => [node.id, index + 1]));
  return {
    id: run.id,
    flowId: run.flowId,
    name: run.name,
    userId: 1,
    type: run.type === "JOB_FLOW" ? "JOB_FLOW" : "JOB_LIST",
    status: run.status,
    startTime: run.startTime,
    endTime: run.endTime,
    duration: run.duration,
    tags: run.tags,
    flow: {
      vertices: run.nodes.map((node, index) => ({
        id: index + 1,
        jobId: Number(node.jobId),
        jobRunId: Number(node.id),
        jobRunStatus: node.status,
      })),
      edges: run.graph.edges.flatMap((edge) => {
        const fromVId = vertexIds.get(edge.source);
        const toVId = vertexIds.get(edge.target);
        return fromVId && toVId ? [{ fromVId, toVId, expectStatus: "SUCCESS" }] : [];
      }),
      nodeLayouts: Object.fromEntries(
        run.graph.nodes.map((node, index) => [
          String(index + 1),
          { id: node.id, type: node.type, x: node.x, y: node.y },
        ]),
      ),
    },
  };
}

/** Build a flow run's DAG: a short chain of node runs with per-node status/position. */
function makeFlowRunGraph(nodes: JobRun[]): FlowRunGraph {
  const gNodes = nodes.map((n, i) => ({
    id: n.id,
    label: n.name,
    type: n.type,
    x: 80 + i * 180,
    y: 80 + (i % 2) * 110,
    status: n.status,
  }));
  const edges = gNodes.slice(1).map((n, i) => ({ source: gNodes[i].id, target: n.id }));
  return { nodes: gNodes, edges };
}

/** Build a top-level flow run. `type === "JOB_FLOW"` yields a composite run with 3-5 nodes;
 * any `JobType` yields a single-task run with exactly 1 node (list `type` = that `JobType`). */
function makeFlowRun(type: JobType | "JOB_FLOW", flowId: string): FlowRunDetail {
  const status = faker.helpers.arrayElement(EXECUTION_STATUSES);
  const isComposite = type === "JOB_FLOW";
  const id = `frun-${faker.string.nanoid(8)}`;
  const nodeTypes: JobType[] = isComposite
    ? Array.from({ length: faker.number.int({ min: 3, max: 5 }) }, () => faker.helpers.arrayElement(JOB_TYPES))
    : [type];
  const nodes = nodeTypes.map((t) => makeJobRun(id, t));
  const base: FlowRun = {
    id,
    flowId,
    name: isComposite
      ? `${faker.helpers.arrayElement(["日报汇总", "数据同步流程", "ETL Pipeline"])}-${faker.number.int({ min: 1, max: 99 })}`
      : `${faker.word.verb()}-${faker.word.noun()}-task`,
    type,
    status,
    ...timesForExec(status),
    submitter: faker.internet.username(),
    tags: faker.helpers.arrayElements(["etl", "daily", "hourly", "critical", "adhoc"], { min: 0, max: 2 }),
  };
  return { ...base, graph: makeFlowRunGraph(nodes), nodes };
}

// Shared flowIds so multiple runs (re-runs / history) point at the same flow definition.
const COMPOSITE_FLOW_IDS = Array.from({ length: 6 }, () => `flow-${faker.string.nanoid(6)}`);
const SINGLE_FLOW_IDS = Array.from({ length: 15 }, () => `flow-${faker.string.nanoid(6)}`);

const mockFlowRuns: FlowRunDetail[] = [
  ...Array.from({ length: 12 }, (_, i) => makeFlowRun("JOB_FLOW", COMPOSITE_FLOW_IDS[i % COMPOSITE_FLOW_IDS.length])),
  ...Array.from({ length: 28 }, (_, i) =>
    makeFlowRun(faker.helpers.arrayElement(JOB_TYPES), SINGLE_FLOW_IDS[i % SINGLE_FLOW_IDS.length]),
  ),
].sort((a, b) => b.startTime.localeCompare(a.startTime));

/** `statuses` (CSV bucket match) takes precedence over the single `status` literal when both are present. */
function matchesStatus(r: FlowRun, status?: string | null, statuses?: string | null): boolean {
  if (statuses) return statuses.split(",").filter(Boolean).includes(r.status);
  return !status || r.status === status;
}

function matchesFlowRunFilters(
  r: FlowRun,
  f: {
    name?: string;
    status?: string | null;
    statuses?: string | null;
    type?: string | null;
    flowId?: string | null;
    from?: string | null;
    to?: string | null;
  },
): boolean {
  const nameMatch = !f.name || r.name.toLowerCase().includes(f.name);
  const statusMatch = matchesStatus(r, f.status, f.statuses);
  const typeMatch = !f.type || r.type === f.type;
  const flowIdMatch = !f.flowId || r.flowId === f.flowId;
  const fromMatch = !f.from || r.startTime >= f.from;
  const toMatch = !f.to || r.startTime <= f.to;

  return nameMatch && statusMatch && typeMatch && flowIdMatch && fromMatch && toMatch;
}

export const runHandlers: RequestHandler[] = [
  http.get("/api/jobFlowRun/page", async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const { page, size } = parsePageSize(url);
    const p = url.searchParams;
    const filters = {
      name: p.get("name")?.toLowerCase(),
      status: p.get("status"),
      statuses: null,
      type: null,
      flowId: null,
      from: p.get("startTime"),
      to: p.get("endTime"),
    };
    const filtered = mockFlowRuns.filter((r) => matchesFlowRunFilters(r, filters));
    return ok(ipage(filtered.map(toLegacyFlowRun), page, size));
  }),

  http.get("/api/jobFlowRun/get/:id", async ({ params }) => {
    await delay(200);
    const r = mockFlowRuns.find((x) => x.id === (params as { id: string }).id);
    return r ? ok(toLegacyFlowRun(r)) : fail(1404, "运行不存在");
  }),

  http.get("/api/jobFlowRun/kill/:id", async ({ params }) => {
    await delay(200);
    const r = mockFlowRuns.find((x) => x.id === (params as { id: string }).id);
    if (!r) return fail(1404, "运行不存在");
    r.status = "KILLED";
    r.endTime = new Date().toISOString();
    r.duration = Math.max(1, Math.round((Date.now() - new Date(r.startTime).getTime()) / 1000));
    return ok(r.id);
  }),

  http.get("/api/jobRun/page", async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const { page, size } = parsePageSize(url);
    const flowRunId = url.searchParams.get("flowRunId");
    const jobs = mockFlowRuns
      .filter((run) => !flowRunId || run.id === flowRunId)
      .flatMap((run) => run.nodes)
      .map(toLegacyJobRun);
    return ok(ipage(jobs, page, size));
  }),

  http.get("/api/jobRun/get/:id", async ({ params }) => {
    await delay(150);
    const id = (params as { id: string }).id;
    const job = mockFlowRuns.flatMap((run) => run.nodes).find((node) => node.id === id);
    return job ? ok(toLegacyJobRun(job)) : fail(1404, "任务实例不存在");
  }),
];
