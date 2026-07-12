import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { QueryRequest, QueryResult } from "@/types/reactive";

function buildResult(sql: string): QueryResult {
  const elapsedMs = faker.number.int({ min: 30, max: 1800 });
  const lower = sql.trim().toLowerCase();

  // Simulate a syntax error when the SQL is empty or obviously invalid.
  if (!lower || (!lower.startsWith("select") && !lower.startsWith("show") && !lower.startsWith("desc"))) {
    return {
      success: false,
      columns: [],
      rows: [],
      log: `SQL execution failed: unsupported or empty statement.\n> ${sql}`,
      elapsedMs,
    };
  }

  const columns = ["id", "name", "amount", "created_at"];
  const rowCount = faker.number.int({ min: 3, max: 12 });
  const rows = Array.from({ length: rowCount }, () => ({
    id: faker.number.int({ min: 1, max: 9999 }),
    name: faker.commerce.productName(),
    amount: Number(faker.commerce.price()),
    created_at: faker.date.recent({ days: 30 }).toISOString(),
  }));

  return {
    success: true,
    columns,
    rows,
    log: `Query OK, ${rowCount} rows returned (${elapsedMs} ms)`,
    elapsedMs,
  };
}

export const reactiveHandlers: RequestHandler[] = [
  http.post("/api/reactive/query", async ({ request }) => {
    const { sql } = (await request.json()) as QueryRequest;
    await delay(600);
    return HttpResponse.json(buildResult(sql));
  }),
];
