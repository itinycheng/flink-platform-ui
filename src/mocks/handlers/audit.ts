import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { AuditLog } from "@/types/manage";
import { paginate } from "@/utils/pagination";

function generateAuditLogs(count: number): AuditLog[] {
  const actions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "RUN", "ONLINE", "OFFLINE"];
  const modules = ["user", "resource", "workflow", "task", "datasource", "config", "tag"];
  return Array.from({ length: count }, () => {
    const action = faker.helpers.arrayElement(actions);
    const withDiff = action === "UPDATE";
    return {
      id: `audit-${faker.string.nanoid(8)}`,
      operator: faker.internet.username(),
      action,
      module: faker.helpers.arrayElement(modules),
      target: faker.helpers.arrayElement([faker.word.noun(), faker.string.nanoid(6)]),
      result: faker.helpers.weightedArrayElement([
        { value: "success" as const, weight: 8 },
        { value: "failed" as const, weight: 2 },
      ]),
      ip: faker.internet.ipv4(),
      detail: withDiff
        ? JSON.stringify({ before: { name: faker.word.noun() }, after: { name: faker.word.noun() } }, null, 2)
        : "",
      createdAt: faker.date.recent({ days: 30 }).toISOString(),
    };
  });
}

const mockAuditLogs: AuditLog[] = generateAuditLogs(200);

function matchesAuditFilters(
  log: AuditLog,
  f: { operator: string; action: string; module: string; result: string; startTime: string; endTime: string },
): boolean {
  const operatorMatch = !f.operator || log.operator.toLowerCase().includes(f.operator);
  const actionMatch = !f.action || log.action === f.action;
  const moduleMatch = !f.module || log.module === f.module;
  const resultMatch = !f.result || log.result === f.result;
  const startTimeMatch = !f.startTime || log.createdAt >= f.startTime;
  const endTimeMatch = !f.endTime || log.createdAt <= f.endTime;

  return operatorMatch && actionMatch && moduleMatch && resultMatch && startTimeMatch && endTimeMatch;
}

export const auditHandlers: RequestHandler[] = [
  // GET /api/audit-logs — read-only, filterable audit records (newest first)
  http.get("/api/audit-logs", async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 10;
    const operator = url.searchParams.get("operator")?.toLowerCase() ?? "";
    const action = url.searchParams.get("action") ?? "";
    const moduleName = url.searchParams.get("module") ?? "";
    const result = url.searchParams.get("result") ?? "";
    const startTime = url.searchParams.get("startTime") ?? "";
    const endTime = url.searchParams.get("endTime") ?? "";

    const filtered = mockAuditLogs
      .filter((log) =>
        matchesAuditFilters(log, {
          operator,
          action,
          module: moduleName,
          result,
          startTime,
          endTime,
        }),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),
];
