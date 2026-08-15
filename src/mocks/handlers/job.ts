import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import { ok } from "@/mocks/lib/response";
import type { JobTreeNode, WorkflowRunRecord, JobStatus, WorkflowLifecycleStatus } from "@/types/job";
import type { JobInfo } from "@/types/entities";
import type { JobType } from "@/constants/enums";

// ---- Seed data generated with faker ----

// Group name + how many children to generate. One oversized group stress-tests virtual scrolling.
const GROUP_SPECS: { name: string; size: number }[] = [
  { name: "数据采集", size: 1200 },
  { name: "数据处理", size: 350 },
  { name: "实时计算", size: 600 },
  { name: "机器学习", size: 15 },
  { name: "报表生成", size: 8 },
];

function generateChild(gi: number, groupId: string): JobTreeNode {
  const isWorkflow = faker.datatype.boolean();
  const jobType = faker.helpers.arrayElement<JobType>(["MYSQL_SQL", "SHELL", "FLINK_SQL", "FLINK_JAR"]);
  return {
    id: isWorkflow ? `wf-${faker.string.nanoid(6)}` : `task-${faker.string.nanoid(6)}`,
    name:
      isWorkflow
        ? faker.helpers.arrayElement(["日报汇总", "数据同步流程", "ETL Pipeline", "报表生成流程"]) +
          ` ${gi}-${faker.number.int({ min: 1, max: 99 })}`
        : faker.helpers.arrayElement([
            "MySQL 数据同步",
            "Kafka 消费任务",
            "Spark ETL 日报",
            "Shell 清理脚本",
            "Hive 分区整理",
            "Flink CDC 实时同步",
          ]) + ` ${gi}-${faker.number.int({ min: 1, max: 99 })}`,
    kind: isWorkflow ? "workflow" : "task",
    jobType: isWorkflow ? undefined : jobType,
    pid: groupId,
    // Latest-run status (run outcome), shown as an icon on the definition node.
    status: faker.helpers.arrayElement(["success", "failed", "running", "pending", "stopped"] as JobStatus[]),
    lifecycleStatus: faker.helpers.arrayElement(["OFFLINE", "ONLINE", "SCHEDULING"] as WorkflowLifecycleStatus[]),
    tags: faker.helpers.arrayElements(["etl", "daily", "hourly", "critical", "adhoc"], { min: 0, max: 2 }),
    alertRuleIds: [],
  };
}

function generateWorkflowTree(): JobTreeNode[] {
  return GROUP_SPECS.map(({ name, size }, gi) => {
    const groupId = `g-${faker.string.nanoid(6)}`;
    const children: JobTreeNode[] = Array.from({ length: size }, () => generateChild(gi, groupId));
    return {
      id: groupId,
      name,
      kind: "group" as const,
      pid: "",
      childCount: children.length,
      children,
    };
  });
}

const mockTree: JobTreeNode[] = generateWorkflowTree();

/** Find a definition node (a group's child) and its parent group by node id. */
function findDefinition(id: string): { node: JobTreeNode; group: JobTreeNode } | null {
  for (const group of mockTree) {
    const node = group.children?.find((c) => c.id === id);
    if (node) return { node, group };
  }
  return null;
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
  // GET /api/jobs/groups — only group nodes (no children)
  http.get("/api/jobs/groups", async () => {
    await delay(200);
    const groups = mockTree.map(({ children: _children, ...rest }) => rest);
    return HttpResponse.json(groups);
  }),

  // GET /api/jobs/groups/:groupId/children — children of a specific group
  http.get("/api/jobs/groups/:groupId/children", async ({ params }) => {
    await delay(50);
    const { groupId } = params as { groupId: string };
    const group = mockTree.find((g) => g.id === groupId);
    if (!group) {
      return HttpResponse.json({ message: "分组不存在" }, { status: 404 });
    }
    return HttpResponse.json(group.children ?? []);
  }),

  // GET /api/jobs/search — search jobs across all groups
  http.get("/api/jobs/search", async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const keyword = (url.searchParams.get("keyword") ?? "").toLowerCase().trim();
    const splitParam = (key: string) =>
      url.searchParams.get(key) ? url.searchParams.get(key)!.toLowerCase().split(",") : [];
    // Task types are backend JobType values (e.g. FLINK_SQL) and are matched
    // case-sensitively — unlike keyword/status, they must not be lowercased.
    const types = url.searchParams.get("types") ? url.searchParams.get("types")!.split(",") : [];
    const statuses = splitParam("statuses");

    const results: JobTreeNode[] = [];
    for (const group of mockTree) {
      const matched = (group.children ?? []).filter((child) => {
        const matchKeyword =
          !keyword || child.name.toLowerCase().includes(keyword) || child.id.toLowerCase().includes(keyword);
        const matchType = types.length === 0 || (child.jobType ? types.includes(child.jobType) : false);
        const matchStatus = statuses.length === 0 || (child.status ? statuses.includes(child.status) : false);
        return matchKeyword && matchType && matchStatus;
      });
      if (matched.length > 0) {
        results.push({ ...group, children: matched });
      }
    }
    return HttpResponse.json(results);
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
