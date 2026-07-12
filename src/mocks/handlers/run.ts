import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { FlowRun, JobRun, RunStatus } from "@/types/run";
import { paginate } from "@/utils/pagination";

const RUN_STATUSES: RunStatus[] = ["waiting", "running", "success", "failed", "killed"];
const TASK_TYPES = ["SQL", "SHELL", "FLINK", "SPARK"];

function makeTimes(): { startTime: string; endTime?: string; duration: number; status: RunStatus } {
  const status = faker.helpers.arrayElement(RUN_STATUSES);
  const start = faker.date.recent({ days: 14 });
  const running = status === "running" || status === "waiting";
  const durationSec = faker.number.int({ min: 5, max: 7200 });
  return {
    status,
    startTime: start.toISOString(),
    endTime: running ? undefined : new Date(start.getTime() + durationSec * 1000).toISOString(),
    duration: running ? 0 : durationSec,
  };
}

function generateFlowRuns(count: number): FlowRun[] {
  return Array.from({ length: count }, () => ({
    id: `fr-${faker.string.nanoid(8)}`,
    flowId: `flow-${faker.string.nanoid(6)}`,
    name: `${faker.word.verb()}-${faker.word.noun()}-flow`,
    tags: faker.helpers.arrayElements(["etl", "daily", "hourly", "critical", "adhoc"], { min: 0, max: 2 }),
    owner: faker.internet.username(),
    ...makeTimes(),
  }));
}

function generateJobRuns(count: number): JobRun[] {
  return Array.from({ length: count }, () => {
    const times = makeTimes();
    const type = faker.helpers.arrayElement(TASK_TYPES);
    return {
      id: `jr-${faker.string.nanoid(8)}`,
      jobId: `job-${faker.string.nanoid(6)}`,
      flowRunId: `fr-${faker.string.nanoid(8)}`,
      name: `${faker.word.verb()}-${faker.word.noun()}-task`,
      type,
      trackingUrl:
        type === "FLINK" || type === "SPARK"
          ? `http://flink-console.local/jobs/${faker.string.nanoid(10)}`
          : undefined,
      params: JSON.stringify({ parallelism: faker.number.int({ min: 1, max: 8 }), retry: faker.number.int({ min: 0, max: 3 }) }, null, 2),
      owner: faker.internet.username(),
      ...times,
    };
  });
}

const mockFlowRuns: FlowRun[] = generateFlowRuns(23);
const mockJobRuns: JobRun[] = generateJobRuns(37);

interface Filters {
  page: number;
  pageSize: number;
  name?: string;
  status?: string;
  flowRunId?: string;
  jobId?: string;
  startFrom?: string;
  startTo?: string;
}

function parseFilters(url: URL): Filters {
  const p = url.searchParams;
  return {
    page: Number(p.get("page")) || 1,
    pageSize: Number(p.get("pageSize")) || 10,
    name: p.get("name") || undefined,
    status: p.get("status") || undefined,
    flowRunId: p.get("flowRunId") || undefined,
    jobId: p.get("jobId") || undefined,
    startFrom: p.get("startFrom") || undefined,
    startTo: p.get("startTo") || undefined,
  };
}

function applyCommonFilters<T extends { name: string; status: string; startTime: string }>(
  items: T[],
  f: Filters,
): T[] {
  return items.filter((it) => {
    if (f.name && !it.name.toLowerCase().includes(f.name.toLowerCase())) return false;
    if (f.status && it.status !== f.status) return false;
    if (f.startFrom && it.startTime < f.startFrom) return false;
    if (f.startTo && it.startTime > f.startTo) return false;
    return true;
  });
}

function setKilled<T extends { status: RunStatus; endTime?: string; duration: number; startTime: string }>(run: T): T {
  run.status = "killed";
  run.endTime = new Date().toISOString();
  run.duration = Math.max(1, Math.round((Date.now() - new Date(run.startTime).getTime()) / 1000));
  return run;
}

export const runHandlers: RequestHandler[] = [
  // ---- Flow Runs ----

  http.get("/api/flow-runs", async ({ request }) => {
    await delay(200);
    const f = parseFilters(new URL(request.url));
    const filtered = applyCommonFilters(mockFlowRuns, f);
    return HttpResponse.json(paginate(filtered, f.page, f.pageSize));
  }),

  http.post("/api/flow-runs/:id/kill", async ({ params }) => {
    await delay(300);
    const { id } = params as { id: string };
    const run = mockFlowRuns.find((r) => r.id === id);
    if (!run) return HttpResponse.json({ message: "实例不存在" }, { status: 404 });
    return HttpResponse.json(setKilled(run));
  }),

  http.get("/api/flow-runs/:id/log", async ({ params }) => {
    await delay(300);
    const { id } = params as { id: string };
    const lines = Array.from({ length: 20 }, () => `[${faker.date.recent().toISOString()}] ${faker.lorem.sentence()}`);
    return HttpResponse.json({ id, content: lines.join("\n") });
  }),

  // ---- Job Runs ----

  http.get("/api/job-runs", async ({ request }) => {
    await delay(200);
    const f = parseFilters(new URL(request.url));
    let filtered = applyCommonFilters(mockJobRuns, f);
    if (f.flowRunId) filtered = filtered.filter((r) => r.flowRunId.includes(f.flowRunId!));
    if (f.jobId) filtered = filtered.filter((r) => r.jobId.includes(f.jobId!));
    return HttpResponse.json(paginate(filtered, f.page, f.pageSize));
  }),

  http.post("/api/job-runs/:id/kill", async ({ params }) => {
    await delay(300);
    const { id } = params as { id: string };
    const run = mockJobRuns.find((r) => r.id === id);
    if (!run) return HttpResponse.json({ message: "作业实例不存在" }, { status: 404 });
    return HttpResponse.json(setKilled(run));
  }),

  http.get("/api/job-runs/:id/log", async ({ params }) => {
    await delay(300);
    const { id } = params as { id: string };
    const lines = Array.from({ length: 24 }, () => `[${faker.date.recent().toISOString()}] ${faker.lorem.sentence()}`);
    return HttpResponse.json({ id, content: lines.join("\n") });
  }),
];
