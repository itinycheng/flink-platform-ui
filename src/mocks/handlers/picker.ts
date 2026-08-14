import { http as mswHttp, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import { ok } from "@/mocks/lib/response";
import type { Worker, Datasource, CatalogInfo, Resource } from "@/types/entities";
import { DB_TYPES, CATALOG_TYPES, JOB_TYPE_DBTYPE, type JobType } from "@/constants/enums";

const workers: Worker[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `worker-${faker.word.noun()}`,
  ip: faker.internet.ip(),
  port: String(faker.internet.port()),
  grpcPort: faker.internet.port(),
  status: "ACTIVE",
}));

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

const resources: Resource[] = [
  ...Array.from({ length: 4 }, (_, i) => ({ id: i + 1, name: `${faker.word.noun()}.jar`, type: "FILE" as const })),
  ...Array.from({ length: 2 }, (_, i) => ({ id: 100 + i, name: `${faker.word.noun()}.py`, type: "FILE" as const })),
];

export const pickerHandlers: RequestHandler[] = [
  mswHttp.get("/api/worker/list", async () => {
    await delay(150);
    return ok(workers.filter((w) => w.status !== "DELETED"));
  }),
  mswHttp.get("/api/datasource/list", async ({ request }) => {
    await delay(150);
    const jobType = new URL(request.url).searchParams.get("jobType") as JobType | null;
    const dbType = jobType ? JOB_TYPE_DBTYPE[jobType] : undefined;
    return ok(dbType ? datasources.filter((d) => d.type === dbType) : datasources);
  }),
  mswHttp.get("/api/catalog/list", async () => {
    await delay(150);
    return ok(catalogs);
  }),
  mswHttp.get("/api/resource/list", async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const ext = url.searchParams.get("ext");
    let out = resources;
    if (type) out = out.filter((r) => r.type === type);
    if (ext) out = out.filter((r) => r.name.endsWith(ext));
    return ok(out);
  }),
];
