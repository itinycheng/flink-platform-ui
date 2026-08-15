import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import { ok, fail } from "@/mocks/lib/response";
import {
  jobTreeStore,
  listRoots,
  listChildren,
  searchTree,
  createGroupRow,
  renameGroupRow,
  deleteGroupSubtree,
} from "@/mocks/data/jobTree";
import type { JobTreeNode, WorkflowRunRecord } from "@/types/job";
import type { JobInfo } from "@/types/entities";
import type { JobType } from "@/constants/enums";

// ---- Seed data generated with faker ----
// Tree seeding (job_group + job_tree stores) now lives in `@/mocks/data/jobTree`.

/**
 * Find a leaf placement (task/workflow definition) by node id.
 * Thin shim over the shared store — Task 5 rewrites the tags/alert-rule
 * handlers below to go through the shared store's own leaf-write helpers.
 */
function findDefinition(id: string): { node: JobTreeNode } | null {
  const node = jobTreeStore.get(id);
  return node ? { node } : null;
}

function generateRuns(workflowId: string): WorkflowRunRecord[] {
  const runs: WorkflowRunRecord[] = [];
  const now = Date.now();

  for (let i = 0; i < 10; i++) {
    const startMs = now - (i + 1) * 3600_000;
    const duration = faker.number.int({ min: 30, max: 600 });
    const status: WorkflowRunRecord["status"] = i === 0 ? "running" : faker.helpers.arrayElement(["success", "failed"]);

    runs.push({
      id: `run-${workflowId}-${faker.string.nanoid(4)}`,
      workflowId,
      startTime: new Date(startMs).toISOString(),
      endTime: status === "running" ? "" : new Date(startMs + duration * 1000).toISOString(),
      status,
      duration: status === "running" ? 0 : duration,
      logUrl: status !== "running" ? `/logs/${workflowId}/${faker.string.nanoid(4)}` : undefined,
    });
  }
  return runs;
}

// ---- JobInfo (backend-shaped task entity) store ----

const jobInfoStore = new Map<number, JobInfo>();
let jobInfoSeq = 1000;

function defaultConfig(type: JobType) {
  const base = { type, retryTimes: 0, retryInterval: "5s" };
  if (type === "SHELL") return { ...base, timeout: "60s" };
  if (type === "MYSQL_SQL" || type === "HIVE_SQL" || type === "CLICKHOUSE_SQL") return { ...base, dsId: 1 };
  return base;
}

function defaultJobInfo(id: number): JobInfo {
  return {
    id,
    name: `job-${id}`,
    type: "MYSQL_SQL",
    execMode: "BATCH",
    routeUrl: [1],
    subject: "SELECT 1",
    config: defaultConfig("MYSQL_SQL") as JobInfo["config"],
    status: "ONLINE",
  };
}

export const workflowHandlers: RequestHandler[] = [
  // GET /api/jobTree/roots — top-level groups only (no children)
  http.get("/api/jobTree/roots", async () => {
    await delay(200);
    return ok(listRoots());
  }),

  // GET /api/jobTree/children — direct members (subgroups + leaves) of a group
  http.get("/api/jobTree/children", async ({ request }) => {
    await delay(50);
    const groupId = new URL(request.url).searchParams.get("groupId") ?? "";
    return ok(listChildren(groupId));
  }),

  // GET /api/jobTree/search — search leaves across all groups
  http.get("/api/jobTree/search", async ({ request }) => {
    await delay(200);
    const p = new URL(request.url).searchParams;
    return ok(
      searchTree({
        keyword: p.get("keyword") ?? undefined,
        types: p.get("types") ? p.get("types")!.split(",") : undefined,
        statuses: p.get("statuses") ? p.get("statuses")!.split(",") : undefined,
      }),
    );
  }),

  // POST /api/jobGroup/create — creates a top-level group (no pid) or a
  // subgroup (pid points at a top-level group). Nesting beyond one level
  // (pid pointing at a subgroup) or a nonexistent pid is rejected.
  http.post("/api/jobGroup/create", async ({ request }) => {
    await delay(150);
    const { name, pid } = (await request.json()) as { name: string; pid?: string };
    try {
      return ok(createGroupRow(name, pid ?? ""), { status: 201 });
    } catch (e) {
      const err = e as { code?: number; desc?: string };
      return fail(err.code ?? 1001, err.desc ?? "分组嵌套超过一层");
    }
  }),

  // POST /api/jobGroup/update — rename a group
  http.post("/api/jobGroup/update", async ({ request }) => {
    await delay(150);
    const { id, name } = (await request.json()) as { id: string; name: string };
    return renameGroupRow(id, name) ? ok(id) : fail(1002, "分组不存在");
  }),

  // GET /api/jobGroup/delete/:id — delete a group and cascade its subtree
  http.get("/api/jobGroup/delete/:id", async ({ params }) => {
    await delay(150);
    return ok(deleteGroupSubtree((params as { id: string }).id));
  }),

  // GET /api/workflows/:id/runs
  http.get("/api/workflows/:id/runs", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    return HttpResponse.json(generateRuns(id));
  }),

  // ---- Definition lifecycle (Task & Workflow nodes) ----
  // NOTE: run-once / status / copy now go through /jobFlow/* (see jobStore); the
  // old /jobs/:id/{run-once,status,copy} handlers were removed with their api fns.

  // PUT /api/jobs/:id/tags
  http.put("/api/jobs/:id/tags", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const { tags } = (await request.json()) as { tags: string[] };
    const found = findDefinition(id);
    if (!found) return HttpResponse.json({ message: "定义不存在" }, { status: 404 });
    found.node.tags = tags;
    return HttpResponse.json(found.node);
  }),

  // PUT /api/jobs/:id/alert-rules
  http.put("/api/jobs/:id/alert-rules", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const { alertRuleIds } = (await request.json()) as { alertRuleIds: string[] };
    const found = findDefinition(id);
    if (!found) return HttpResponse.json({ message: "定义不存在" }, { status: 404 });
    found.node.alertRuleIds = alertRuleIds;
    return HttpResponse.json(found.node);
  }),

  // ---- JobInfo (backend-shaped task entity) ----

  // GET /api/jobInfo/get/:id — tolerates numeric ids (stored) and non-numeric
  // seeded tree-node ids like `task-xxx` (synthesizes a default so they open).
  http.get("/api/jobInfo/get/:id", async ({ params }) => {
    await delay(150);
    const { id } = params as { id: string };
    const numericId = Number(id);
    if (Number.isFinite(numericId) && jobInfoStore.has(numericId)) {
      return ok(jobInfoStore.get(numericId));
    }
    return ok(defaultJobInfo(Number.isFinite(numericId) ? numericId : ++jobInfoSeq));
  }),

  // POST /api/jobInfo/create
  http.post("/api/jobInfo/create", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as JobInfo;
    const id = ++jobInfoSeq;
    const stored: JobInfo = { ...body, id, status: "ONLINE" };
    jobInfoStore.set(id, stored);
    return ok(stored, { status: 201 });
  }),

  // POST /api/jobInfo/update
  http.post("/api/jobInfo/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as JobInfo;
    if (typeof body.id !== "number") {
      return ok(body);
    }
    const merged: JobInfo = { ...jobInfoStore.get(body.id), ...body };
    jobInfoStore.set(body.id, merged);
    return ok(merged);
  }),
];
