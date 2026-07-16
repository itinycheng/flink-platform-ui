import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { RunStatus, RunType, RunDetail, RunNode, RunGraph } from "@/types/run";
import { paginate } from "@/utils/pagination";

const RUN_STATUSES: RunStatus[] = ["waiting", "running", "success", "failed", "killed"];
const ATOMIC_TYPES: RunType[] = ["spark", "flink", "shell", "sql"];

function times(status: RunStatus): { startTime: string; endTime?: string; duration: number } {
  const start = faker.date.recent({ days: 14 });
  const inflight = status === "running" || status === "waiting";
  const durationSec = faker.number.int({ min: 5, max: 7200 });
  return {
    startTime: start.toISOString(),
    endTime: inflight ? undefined : new Date(start.getTime() + durationSec * 1000).toISOString(),
    duration: inflight ? 0 : durationSec,
  };
}

function trackingFor(type: RunType): string | undefined {
  return type === "flink" || type === "spark"
    ? `http://flink-console.local/jobs/${faker.string.nanoid(10)}`
    : undefined;
}

const sampleParams = () =>
  JSON.stringify({ parallelism: faker.number.int({ min: 1, max: 8 }), retry: faker.number.int({ min: 0, max: 3 }) }, null, 2);

/** Build a flow's DAG: a short chain of atomic nodes with per-node status. */
function makeFlowGraph(): { graph: RunGraph; nodes: RunNode[] } {
  const count = faker.number.int({ min: 3, max: 5 });
  const nodes: RunNode[] = [];
  const gNodes = Array.from({ length: count }, (_, i) => {
    const type = faker.helpers.arrayElement(ATOMIC_TYPES);
    const status = faker.helpers.arrayElement(RUN_STATUSES);
    const id = `n-${faker.string.nanoid(6)}`;
    const name = `${faker.word.verb()}-${faker.word.noun()}`;
    nodes.push({ id, name, type, status, duration: faker.number.int({ min: 5, max: 3600 }), params: sampleParams(), trackingUrl: trackingFor(type) });
    return { id, label: name, type, x: 80 + i * 180, y: 80 + (i % 2) * 110, status };
  });
  const edges = gNodes.slice(1).map((n, i) => ({ source: gNodes[i].id, target: n.id }));
  return { graph: { nodes: gNodes, edges }, nodes };
}

function makeRun(type: RunType): RunDetail {
  const status = faker.helpers.arrayElement(RUN_STATUSES);
  const base: RunDetail = {
    id: `run-${faker.string.nanoid(8)}`,
    name:
      type === "flow"
        ? `${faker.helpers.arrayElement(["日报汇总", "数据同步流程", "ETL Pipeline"])}-${faker.number.int({ min: 1, max: 99 })}`
        : `${faker.word.verb()}-${faker.word.noun()}-task`,
    type,
    status,
    tags: faker.helpers.arrayElements(["etl", "daily", "hourly", "critical", "adhoc"], { min: 0, max: 2 }),
    owner: faker.internet.username(),
    ...times(status),
  };
  if (type === "flow") {
    const { graph, nodes } = makeFlowGraph();
    return { ...base, graph, nodes };
  }
  return { ...base, params: sampleParams(), trackingUrl: trackingFor(type) };
}

const mockRuns: RunDetail[] = [
  ...Array.from({ length: 12 }, () => makeRun("flow")),
  ...Array.from({ length: 28 }, () => makeRun(faker.helpers.arrayElement(ATOMIC_TYPES))),
].sort((a, b) => b.startTime.localeCompare(a.startTime));

/** Trim a detail record down to the list shape (no graph/nodes). */
function toListItem({ graph: _g, nodes: _n, ...rest }: RunDetail) {
  return rest;
}

function logLines(n: number): string {
  return Array.from({ length: n }, () => `[${faker.date.recent().toISOString()}] ${faker.lorem.sentence()}`).join("\n");
}

export const runHandlers: RequestHandler[] = [
  http.get("/api/runs", async ({ request }) => {
    await delay(200);
    const p = new URL(request.url).searchParams;
    const page = Number(p.get("page")) || 1;
    const pageSize = Number(p.get("pageSize")) || 10;
    const name = p.get("name")?.toLowerCase();
    const type = p.get("type");
    const status = p.get("status");
    const from = p.get("startFrom");
    const to = p.get("startTo");
    const filtered = mockRuns.filter((r) => {
      if (name && !r.name.toLowerCase().includes(name)) return false;
      if (type && r.type !== type) return false;
      if (status && r.status !== status) return false;
      if (from && r.startTime < from) return false;
      if (to && r.startTime > to) return false;
      return true;
    });
    return HttpResponse.json(paginate(filtered.map(toListItem), page, pageSize));
  }),

  http.get("/api/runs/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const run = mockRuns.find((r) => r.id === id);
    if (!run) return HttpResponse.json({ message: "运行记录不存在" }, { status: 404 });
    return HttpResponse.json(run);
  }),

  http.post("/api/runs/:id/kill", async ({ params }) => {
    await delay(300);
    const { id } = params as { id: string };
    const run = mockRuns.find((r) => r.id === id);
    if (!run) return HttpResponse.json({ message: "运行记录不存在" }, { status: 404 });
    run.status = "killed";
    run.endTime = new Date().toISOString();
    run.duration = Math.max(1, Math.round((Date.now() - new Date(run.startTime).getTime()) / 1000));
    return HttpResponse.json(toListItem(run));
  }),

  // Log for a top-level run or a flow node (?node=<nodeId>).
  http.get("/api/runs/:id/log", async ({ request, params }) => {
    await delay(250);
    const { id } = params as { id: string };
    const node = new URL(request.url).searchParams.get("node");
    return HttpResponse.json({ id: node ?? id, content: logLines(node ? 16 : 24) });
  }),
];
