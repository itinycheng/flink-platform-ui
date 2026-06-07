import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { JobTreeNode, WorkflowFormData, WorkflowRunRecord, JobStatus } from "@/types/job";

// ---- Seed data generated with faker ----

function generateWorkflowTree(): JobTreeNode[] {
  const groups = ["数据采集", "数据处理", "报表生成"];
  return groups.map((groupName, gi) => {
    const groupId = `g-${faker.string.nanoid(6)}`;
    const childCount = faker.number.int({ min: 2, max: 4 });
    const children: JobTreeNode[] = Array.from({ length: childCount }, () => {
      const jobType = faker.helpers.arrayElement(["SQL", "SHELL", "SPARK", "FLINK", "workflow"]);
      return {
        id: jobType === "workflow" ? `wf-${faker.string.nanoid(6)}` : `task-${faker.string.nanoid(6)}`,
        name:
          jobType === "workflow"
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
        type: jobType,
        group: groupId,
        status: faker.helpers.arrayElement([
          "success",
          "failed",
          "running",
          "scheduling",
          "stopped",
          "pending",
        ] as JobStatus[]),
      };
    });
    return {
      id: groupId,
      name: groupName,
      type: "group" as const,
      group: "",
      children,
    };
  });
}

const mockTree: JobTreeNode[] = generateWorkflowTree();

function generateWorkflowFormData(id: string, name: string): WorkflowFormData {
  const taskType = faker.helpers.arrayElement(["sql", "shell", "spark"] as const);
  const taskParamsMap = {
    sql: {
      datasource: faker.helpers.arrayElement(["mysql-prod", "mysql-staging", "postgres-analytics"]),
      sql: `CALL ${faker.database.column()}_sync()`,
      timeout: faker.number.int({ min: 60, max: 7200 }),
    },
    shell: {
      script: `/opt/scripts/${faker.system.fileName()}`,
      workingDir: faker.helpers.arrayElement(["/opt/scripts", "/home/deploy", "/var/tasks"]),
      env: { RETENTION_DAYS: String(faker.number.int({ min: 7, max: 90 })) },
    },
    spark: {
      mainClass: `com.example.${faker.word.noun().replace(/^\w/, (c) => c.toUpperCase())}ETL`,
      jarPath: `/opt/jars/${faker.system.fileName({ extensionCount: 0 })}.jar`,
      sparkConf: {
        "executor.memory": faker.helpers.arrayElement(["2g", "4g", "8g"]),
      },
      args: ["--date", "yesterday"],
    },
  };

  return {
    id,
    name,
    cronExpression: `${faker.number.int({ min: 0, max: 59 })} ${faker.number.int({ min: 0, max: 23 })} * * *`,
    taskType,
    taskParams: taskParamsMap[taskType],
    description: faker.lorem.sentence(),
    enabled: faker.datatype.boolean(),
  };
}

// Build initial workflow lookup from tree
const mockWorkflows: Record<string, WorkflowFormData> = {};
for (const group of mockTree) {
  if (group.children) {
    for (const child of group.children) {
      mockWorkflows[child.id] = generateWorkflowFormData(child.id, child.name);
    }
  }
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

export const workflowHandlers: RequestHandler[] = [
  // GET /api/jobs/groups — only group nodes (no children)
  http.get("/api/jobs/groups", async () => {
    await delay(200);
    const groups = mockTree.map(({ children: _children, ...rest }) => rest);
    return HttpResponse.json(groups);
  }),

  // GET /api/jobs/groups/:groupId/children — children of a specific group
  http.get("/api/jobs/groups/:groupId/children", async ({ params }) => {
    await delay(200);
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
    const typesParam = url.searchParams.get("types");
    const types = typesParam ? typesParam.split(",") : [];

    const results: JobTreeNode[] = [];
    for (const group of mockTree) {
      const matched = (group.children ?? []).filter((child) => {
        const matchKeyword = !keyword || child.name.toLowerCase().includes(keyword);
        const matchType = types.length === 0 || types.includes(child.type);
        return matchKeyword && matchType;
      });
      if (matched.length > 0) {
        results.push({ ...group, children: matched });
      }
    }
    return HttpResponse.json(results);
  }),

  // GET /api/workflows/tree
  http.get("/api/workflows/tree", async () => {
    await delay(200);
    return HttpResponse.json(mockTree);
  }),

  // GET /api/workflows/:id — get single workflow detail
  http.get("/api/workflows/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    // Skip if the path looks like /workflows/:id/runs (handled by another handler)
    const wf = mockWorkflows[id];
    if (!wf) {
      return HttpResponse.json({ message: "工作流不存在" }, { status: 404 });
    }
    return HttpResponse.json(wf);
  }),

  // POST /api/workflows
  http.post("/api/workflows", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as WorkflowFormData;
    const id = `wf-${faker.string.nanoid(6)}`;
    const created: WorkflowFormData = { ...body, id };
    mockWorkflows[id] = created;
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/workflows/:id
  http.put("/api/workflows/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as WorkflowFormData;

    if (!mockWorkflows[id]) {
      return HttpResponse.json({ message: "工作流不存在" }, { status: 404 });
    }

    const updated: WorkflowFormData = { ...body, id };
    mockWorkflows[id] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/workflows/:id
  http.delete("/api/workflows/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };

    if (!mockWorkflows[id]) {
      return HttpResponse.json({ message: "工作流不存在" }, { status: 404 });
    }

    delete mockWorkflows[id];
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/workflows/:id/runs
  http.get("/api/workflows/:id/runs", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    return HttpResponse.json(generateRuns(id));
  }),
];
