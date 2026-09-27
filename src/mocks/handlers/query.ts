import { http, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { QueryResult } from "@/types/query";
import { ok } from "@/mocks/lib/response";

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

/** Realistic warehouse-layer database names the schema browser draws from. */
const DATABASE_POOL = ["default", "ods", "dwd", "dws", "ads", "tag", "analytics"];

/** A pool of realistic table names the schema browser draws from. */
const TABLE_POOL = [
  "orders",
  "order_items",
  "users",
  "user_profiles",
  "products",
  "product_categories",
  "payments",
  "refunds",
  "invoices",
  "shipments",
  "inventory",
  "sessions",
  "events",
  "audit_logs",
  "campaigns",
  "subscriptions",
  "carts",
  "addresses",
  "reviews",
  "accounts",
];

export const queryHandlers: RequestHandler[] = [
  http.get("/api/datasource/get/:id", async ({ params }) =>
    ok({
      id: String((params as { id: string }).id),
      name: "mock-mysql",
      type: "MYSQL",
      params: { url: "jdbc:mysql://localhost/mock" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ),
  http.post("/api/reactive/execJob", async ({ request }) => {
    const { subject: sql } = (await request.json()) as { subject: string };
    await delay(600);
    const result = buildResult(sql);
    return ok({
      sync: true,
      execId: `reactive-${faker.string.nanoid(8)}`,
      meta: result.columns,
      data: result.rows.map((row) => result.columns.map((column) => row[column])),
      exception: result.success ? null : result.log,
    });
  }),

  http.get("/api/query/databases", async ({ request }) => {
    const datasourceId = new URL(request.url).searchParams.get("datasourceId");
    await delay(250);
    if (!datasourceId) return ok([]);
    const count = faker.number.int({ min: 2, max: DATABASE_POOL.length });
    return ok(faker.helpers.arrayElements(DATABASE_POOL, count).sort());
  }),

  http.get("/api/query/tables", async ({ request }) => {
    const url = new URL(request.url);
    const datasourceId = url.searchParams.get("datasourceId");
    const database = url.searchParams.get("database");
    await delay(300);
    if (!datasourceId || !database) return ok([]);
    // Vary the set per database so expanding different databases feels real.
    const count = faker.number.int({ min: 6, max: TABLE_POOL.length });
    return ok(faker.helpers.arrayElements(TABLE_POOL, count).sort());
  }),
];
