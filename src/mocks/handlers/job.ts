import { http, delay, type RequestHandler } from "msw";
import { ok, fail } from "@/mocks/lib/response";
import {
  jobTreeStore,
  listRoots,
  listChildren,
  searchTree,
  createGroupRow,
  renameGroupRow,
  deleteGroupSubtree,
  recordPlacement,
  renameLeaf,
  deleteLeaf,
} from "@/mocks/data/jobTree";
import type { JobInfo } from "@/types/entities";
import type { JobType } from "@/constants/enums";

// ---- Seed data generated with faker ----
// Tree seeding (job_group + job_tree stores) now lives in `@/mocks/data/jobTree`.

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

  // ---- Definition lifecycle (Task & Workflow nodes) ----
  // NOTE: run-once / status / copy now go through /jobFlow/* (see jobStore); the
  // old /jobs/:id/{run-once,status,copy} handlers were removed with their api fns.

  // POST /api/jobTree/rename — rename a leaf (task/workflow) placement
  http.post("/api/jobTree/rename", async ({ request }) => {
    await delay(150);
    const { id, name } = (await request.json()) as { id: string; name: string };
    return renameLeaf(id, name) ? ok(id) : fail(1003, "节点不存在");
  }),

  // GET /api/jobTree/delete/:id — delete a leaf placement
  http.get("/api/jobTree/delete/:id", async ({ params }) => {
    await delay(150);
    return ok(deleteLeaf((params as { id: string }).id));
  }),

  // POST /api/jobTree/tags
  http.post("/api/jobTree/tags", async ({ request }) => {
    await delay(150);
    const { id, tags } = (await request.json()) as { id: string; tags: string[] };
    const n = jobTreeStore.get(id);
    if (!n) return fail(1003, "节点不存在");
    n.tags = tags;
    return ok(n);
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
    const { groupId, ...body } = (await request.json()) as JobInfo & { groupId?: string };
    const id = ++jobInfoSeq;
    const stored: JobInfo = { ...body, id, status: "ONLINE" };
    jobInfoStore.set(id, stored);
    if (groupId) {
      recordPlacement({
        id: String(id),
        name: stored.name,
        kind: "task",
        jobType: stored.type,
        refId: id,
        pid: groupId,
        status: "pending",
        lifecycleStatus: "OFFLINE",
        tags: [],
      });
    }
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
