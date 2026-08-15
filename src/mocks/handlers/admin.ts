import { http, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type {
  ManagedUser,
  CustomParam,
  DataSource,
  DataSourceType,
  Catalog,
  CatalogType,
  Worker,
  Tag,
  SysConfig,
  SysConfigType,
} from "@/types/admin";
import { ok } from "@/mocks/lib/response";
import { ipage, parsePageSize } from "@/mocks/lib/page";

// ---- Seed data generated with faker ----

function generateUsers(count: number): ManagedUser[] {
  return Array.from({ length: count }, () => ({
    id: `usr-${faker.string.nanoid(6)}`,
    username: faker.internet.username(),
    email: faker.internet.email(),
    roles: { global: faker.helpers.arrayElement(["ADMIN", "DEVELOPER", "OPERATOR", "VIEWER"] as const) },
    status: faker.helpers.arrayElement(["NORMAL", "LOCKED"] as const),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
  }));
}

function generateCustomParams(count: number): CustomParam[] {
  return Array.from({ length: count }, () => {
    const type = faker.helpers.arrayElement(["GLOBAL", "JOB_FLOW"] as const);
    const paramName =
      faker.helpers.arrayElement(["max_retry", "alert_email", "batch_size", "timeout_sec", "notify_url", "data_dir"]) +
      `_${faker.string.alphanumeric(3).toLowerCase()}`;
    return {
      id: `param-${faker.string.nanoid(6)}`,
      paramName,
      paramValue: faker.word.words({ count: { min: 1, max: 3 } }),
      type,
      flowId: type === "JOB_FLOW" ? String(faker.number.int({ min: 1, max: 50 })) : undefined,
      status: "ENABLE" as const,
      description: faker.lorem.sentence({ min: 3, max: 8 }),
    };
  });
}

function generateDataSources(count: number): DataSource[] {
  const types: DataSourceType[] = ["CLICKHOUSE", "MYSQL", "HIVE"];
  return Array.from({ length: count }, () => {
    const type = faker.helpers.arrayElement(types);
    const now = faker.date.recent({ days: 60 }).toISOString();
    return {
      id: `ds-${faker.string.nanoid(6)}`,
      name: `${type.toLowerCase()}-${faker.word.noun()}`,
      type,
      params: {
        url: `jdbc:${type.toLowerCase()}://${faker.internet.ip()}:3306/${faker.word.noun()}`,
        username: faker.internet.username(),
        password: faker.internet.password({ length: 10 }),
        properties: { useSSL: "false", connectTimeout: "5000" },
      },
      description: faker.lorem.sentence({ min: 3, max: 8 }),
      createdAt: now,
      updatedAt: now,
    };
  });
}

function generateCatalogs(count: number): Catalog[] {
  const types: CatalogType[] = ["MEMORY", "HIVE", "JDBC", "POSTGRES", "CLICKHOUSE", "ICEBERG"];
  return Array.from({ length: count }, () => {
    const type = faker.helpers.arrayElement(types);
    const name = `${type.toLowerCase()}_${faker.word.noun()}`;
    const now = faker.date.recent({ days: 60 }).toISOString();
    return {
      id: `cat-${faker.string.nanoid(6)}`,
      name,
      type,
      createSql: `CREATE CATALOG ${name} WITH (\n  'type' = '${type}'\n);`,
      description: faker.lorem.sentence({ min: 3, max: 8 }),
      createdAt: now,
      updatedAt: now,
    };
  });
}

function generateWorkers(count: number): Worker[] {
  return Array.from({ length: count }, () => {
    const now = faker.date.recent({ days: 60 }).toISOString();
    return {
      id: `wk-${faker.string.nanoid(6)}`,
      name: `worker-${faker.word.noun()}`,
      ip: faker.internet.ip(),
      port: String(faker.internet.port()),
      grpcPort: faker.internet.port(),
      role: faker.helpers.arrayElement(["ACTIVE", "INACTIVE", "DELETED"] as const),
      desc: faker.lorem.sentence({ min: 3, max: 8 }),
      environments: [{ name: "JAVA_HOME", value: "/usr/lib/jvm/java-11" }],
      createdAt: now,
      updatedAt: now,
    };
  });
}

function generateTags(count: number): Tag[] {
  return Array.from({ length: count }, () => {
    const now = faker.date.recent({ days: 60 }).toISOString();
    return {
      id: `tag-${faker.string.nanoid(6)}`,
      code: `tag_${faker.string.alphanumeric(6)}`,
      name: faker.word.noun(),
      type: "JOB_FLOW",
      status: faker.helpers.arrayElement(["ENABLE", "DISABLE", "DELETED"] as const),
      createdAt: now,
      updatedAt: now,
    };
  });
}

function generateSysConfigs(count: number): SysConfig[] {
  const types: SysConfigType[] = ["HADOOP_CONFIG", "FLINK_CONFIG", "HIVE_CONFIG", "SPARK_CONFIG"];
  return Array.from({ length: count }, () => {
    const type = faker.helpers.arrayElement(types);
    const now = faker.date.recent({ days: 60 }).toISOString();
    return {
      id: `cfg-${faker.string.nanoid(6)}`,
      name: `${type.toLowerCase()}-${faker.word.noun()}`,
      type,
      version: `${faker.number.int({ min: 1, max: 3 })}.${faker.number.int({ min: 0, max: 9 })}`,
      status: faker.helpers.arrayElement(["ENABLE", "DISABLE"] as const),
      content: `# ${type}\nkey.a=${faker.word.noun()}\nkey.b=${faker.number.int({ min: 1, max: 100 })}`,
      description: faker.lorem.sentence({ min: 3, max: 8 }),
      createdAt: now,
      updatedAt: now,
    };
  });
}

const mockUsers: ManagedUser[] = generateUsers(4);
const mockParams: CustomParam[] = generateCustomParams(4);
const mockDataSources: DataSource[] = generateDataSources(6);
const mockCatalogs: Catalog[] = generateCatalogs(5);
const mockWorkers: Worker[] = generateWorkers(5);
const mockTags: Tag[] = generateTags(8);
const mockSysConfigs: SysConfig[] = generateSysConfigs(6);

export const adminHandlers: RequestHandler[] = [
  // ---- Users ----

  // GET /api/users
  http.get("/api/user/page", async ({ request }) => {
    await delay(200);
    const { page, size } = parsePageSize(new URL(request.url));
    return ok(ipage(mockUsers, page, size));
  }),

  http.post("/api/user/create", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<ManagedUser, "id" | "createdAt">;
    const user: ManagedUser = { ...body, id: `usr-${faker.string.nanoid(6)}`, createdAt: new Date().toISOString() };
    mockUsers.push(user);
    return ok(mockUsers.length, { status: 201 });
  }),

  http.post("/api/user/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<ManagedUser> & { id: string };
    const user = mockUsers.find((u) => u.id === body.id);
    if (!user) return ok(0);
    Object.assign(user, body);
    return ok(1);
  }),

  // ---- Custom Params ----

  http.get("/api/jobParam/page", async ({ request }) => {
    await delay(200);
    const { page, size } = parsePageSize(new URL(request.url));
    return ok(ipage(mockParams, page, size));
  }),

  http.post("/api/jobParam/create", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<CustomParam, "id">;
    mockParams.push({ ...body, id: `param-${faker.string.nanoid(6)}` });
    return ok(mockParams.length, { status: 201 });
  }),

  http.post("/api/jobParam/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<CustomParam> & { id: string };
    const param = mockParams.find((p) => p.id === body.id);
    if (!param) return ok(0);
    Object.assign(param, body);
    return ok(1);
  }),

  http.get("/api/jobParam/delete/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockParams.findIndex((p) => p.id === id);
    if (idx !== -1) mockParams.splice(idx, 1);
    return ok(idx !== -1);
  }),

  // ---- Data Sources ----

  http.get("/api/datasource/page", async ({ request }) => {
    await delay(200);
    const { page, size } = parsePageSize(new URL(request.url));
    return ok(ipage(mockDataSources, page, size));
  }),

  http.post("/api/datasource/create", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<DataSource, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    const ds: DataSource = { ...body, id: `ds-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now };
    mockDataSources.push(ds);
    return ok(mockDataSources.length, { status: 201 });
  }),

  http.post("/api/datasource/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<DataSource> & { id: string };
    const ds = mockDataSources.find((d) => d.id === body.id);
    if (!ds) return ok(0);
    Object.assign(ds, body, { updatedAt: new Date().toISOString() });
    return ok(1);
  }),

  http.get("/api/datasource/delete/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockDataSources.findIndex((d) => d.id === id);
    if (idx !== -1) mockDataSources.splice(idx, 1);
    return ok(idx !== -1);
  }),

  http.get("/api/datasource/test/:id", async () => {
    await delay(600);
    return ok(faker.datatype.boolean({ probability: 0.7 }));
  }),

  // ---- Catalogs ---- (/catalog/*)

  http.get("/api/catalog/page", async ({ request }) => {
    await delay(200);
    const { page, size } = parsePageSize(new URL(request.url));
    return ok(ipage(mockCatalogs, page, size));
  }),

  http.post("/api/catalog/create", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<Catalog, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    mockCatalogs.push({ ...body, id: `cat-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now });
    return ok(mockCatalogs.length, { status: 201 });
  }),

  http.post("/api/catalog/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Catalog> & { id: string };
    const cat = mockCatalogs.find((c) => c.id === body.id);
    if (!cat) return ok(0);
    Object.assign(cat, body, { updatedAt: new Date().toISOString() });
    return ok(1);
  }),

  http.get("/api/catalog/delete/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockCatalogs.findIndex((c) => c.id === id);
    if (idx !== -1) mockCatalogs.splice(idx, 1);
    return ok(idx !== -1);
  }),

  // ---- Workers ---- (/worker/*)

  http.get("/api/worker/page", async ({ request }) => {
    await delay(200);
    const { page, size } = parsePageSize(new URL(request.url));
    return ok(ipage(mockWorkers, page, size));
  }),

  http.post("/api/worker/create", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<Worker, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    mockWorkers.push({ ...body, id: `wk-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now });
    return ok(mockWorkers.length, { status: 201 });
  }),

  http.post("/api/worker/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Worker> & { id: string };
    const wk = mockWorkers.find((w) => w.id === body.id);
    if (!wk) return ok(0);
    Object.assign(wk, body, { updatedAt: new Date().toISOString() });
    return ok(1);
  }),

  http.get("/api/worker/delete/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockWorkers.findIndex((w) => w.id === id);
    if (idx !== -1) mockWorkers.splice(idx, 1);
    return ok(idx !== -1);
  }),

  // ---- Tags ---- (/tag/*)

  http.get("/api/tag/page", async ({ request }) => {
    await delay(200);
    const { page, size } = parsePageSize(new URL(request.url));
    return ok(ipage(mockTags, page, size));
  }),

  http.post("/api/tag/create", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<Tag, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    mockTags.push({ ...body, id: `tag-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now });
    return ok(mockTags.length, { status: 201 });
  }),

  http.post("/api/tag/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Tag> & { id: string };
    const tag = mockTags.find((t) => t.id === body.id);
    if (!tag) return ok(0);
    Object.assign(tag, body, { updatedAt: new Date().toISOString() });
    return ok(1);
  }),

  http.get("/api/tag/delete/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockTags.findIndex((t) => t.id === id);
    if (idx !== -1) mockTags.splice(idx, 1);
    return ok(idx !== -1);
  }),

  // ---- System Configs ---- (/config/*)

  http.get("/api/config/page", async ({ request }) => {
    await delay(200);
    const { page, size } = parsePageSize(new URL(request.url));
    return ok(ipage(mockSysConfigs, page, size));
  }),

  http.post("/api/config/create", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<SysConfig, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    mockSysConfigs.push({ ...body, id: `cfg-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now });
    return ok(mockSysConfigs.length, { status: 201 });
  }),

  http.post("/api/config/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<SysConfig> & { id: string };
    const cfg = mockSysConfigs.find((c) => c.id === body.id);
    if (!cfg) return ok(0);
    Object.assign(cfg, body, { updatedAt: new Date().toISOString() });
    return ok(1);
  }),

  // soft-delete: sets status DELETED (purge physically removes)
  http.get("/api/config/delete/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const cfg = mockSysConfigs.find((c) => c.id === id);
    if (!cfg) return ok(false);
    cfg.status = "DELETED";
    cfg.updatedAt = new Date().toISOString();
    return ok(true);
  }),

  http.get("/api/config/purge/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockSysConfigs.findIndex((c) => c.id === id);
    if (idx !== -1) mockSysConfigs.splice(idx, 1);
    return ok(idx !== -1);
  }),
];
