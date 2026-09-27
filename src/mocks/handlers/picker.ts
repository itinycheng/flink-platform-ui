import { http as mswHttp, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import { ok } from "@/mocks/lib/response";
import type { Worker, Datasource, CatalogInfo } from "@/types/entities";
import { DB_TYPES, CATALOG_TYPES, type DbType } from "@/constants/enums";

const workers: Worker[] = [
  ...Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `worker-${faker.word.noun()}`,
    ip: faker.internet.ip(),
    port: String(faker.internet.port()),
    grpcPort: faker.internet.port(),
    role: "ACTIVE" as const,
  })),
  {
    id: 99,
    name: "worker-retired",
    ip: faker.internet.ip(),
    port: String(faker.internet.port()),
    grpcPort: faker.internet.port(),
    role: "DELETED" as const,
  },
];

const datasources: Datasource[] = DB_TYPES.flatMap((type, ti) =>
  Array.from({ length: 2 }, (_, i) => ({
    id: ti * 10 + i + 1,
    name: `${type.toLowerCase()}-${faker.word.noun()}`,
    type,
    params: { url: `jdbc:${type.toLowerCase()}://${faker.internet.ip()}:3306/db` },
  })),
);

const catalogs: CatalogInfo[] = CATALOG_TYPES.map((type, i) => ({
  id: i + 1,
  name: `cat_${type.toLowerCase()}`,
  type,
  createSql: `CREATE CATALOG cat_${type.toLowerCase()} WITH ('type'='${type.toLowerCase()}');`,
}));

export const pickerHandlers: RequestHandler[] = [
  mswHttp.get("/api/worker/list", async () => {
    await delay(150);
    return ok(workers.filter((w) => w.role !== "DELETED"));
  }),
  mswHttp.get("/api/datasource/list", async ({ request }) => {
    await delay(150);
    const dbType = new URL(request.url).searchParams.get("dbType") as DbType | null;
    return ok(dbType ? datasources.filter((d) => d.type === dbType) : datasources);
  }),
  mswHttp.get("/api/catalog/list", async () => {
    await delay(150);
    return ok(catalogs);
  }),
];
