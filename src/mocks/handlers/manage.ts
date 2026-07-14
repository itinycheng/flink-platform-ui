import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type {
  ResourceFile,
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
} from "@/types/manage";
import { paginate } from "@/utils/pagination";

function parsePagination(url: URL): { page: number; pageSize: number } {
  return {
    page: Number(url.searchParams.get("page")) || 1,
    pageSize: Number(url.searchParams.get("pageSize")) || 10,
  };
}

// ---- Seed data generated with faker ----

function generateResources(count: number): ResourceFile[] {
  const extensions = ["py", "yaml", "jar", "sql", "sh", "json", "csv", "xml"];
  const mimeTypes: Record<string, string> = {
    py: "text/x-python",
    yaml: "application/x-yaml",
    jar: "application/java-archive",
    sql: "application/sql",
    sh: "application/x-sh",
    json: "application/json",
    csv: "text/csv",
    xml: "application/xml",
  };

  return Array.from({ length: count }, () => {
    const ext = faker.helpers.arrayElement(extensions);
    const fileName = `${faker.word.noun()}-${faker.word.verb()}.${ext}`;
    return {
      id: `res-${faker.string.nanoid(6)}`,
      name: fileName,
      size: faker.number.int({ min: 512, max: 52_428_800 }),
      type: mimeTypes[ext] || "application/octet-stream",
      uploadTime: faker.date.recent({ days: 30 }).toISOString(),
      url: `/files/${fileName}`,
    };
  });
}

function generateUsers(count: number): ManagedUser[] {
  return Array.from({ length: count }, () => ({
    id: `usr-${faker.string.nanoid(6)}`,
    username: faker.internet.username(),
    email: faker.internet.email(),
    roles: [faker.helpers.arrayElement(["admin", "developer", "viewer"])],
    status: faker.helpers.arrayElement(["active", "disabled"] as const),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
  }));
}

function generateCustomParams(count: number): CustomParam[] {
  const paramTypes = ["string", "number", "boolean", "json"] as const;
  return Array.from({ length: count }, () => {
    const type = faker.helpers.arrayElement(paramTypes);
    let value: string;
    switch (type) {
      case "number":
        value = String(faker.number.int({ min: 1, max: 1000 }));
        break;
      case "boolean":
        value = faker.helpers.arrayElement(["true", "false"]);
        break;
      case "json":
        value = JSON.stringify({
          [faker.word.noun()]: faker.word.adjective(),
          [faker.word.noun()]: faker.number.int({ min: 1, max: 100 }),
        });
        break;
      default:
        value = faker.word.words({ count: { min: 1, max: 3 } });
    }
    return {
      id: `param-${faker.string.nanoid(6)}`,
      name:
        faker.helpers.arrayElement([
          "MAX_RETRY",
          "ALERT_EMAIL",
          "ENABLE_CACHE",
          "SPARK_CONF",
          "BATCH_SIZE",
          "TIMEOUT_SEC",
          "NOTIFY_URL",
          "DATA_DIR",
        ]) + `_${faker.string.alphanumeric(3).toUpperCase()}`,
      value,
      type,
      description: faker.lorem.sentence({ min: 3, max: 8 }),
    };
  });
}

function generateDataSources(count: number): DataSource[] {
  const types: DataSourceType[] = ["MySQL", "PostgreSQL", "Oracle", "Hive", "Kafka", "Flink"];
  return Array.from({ length: count }, () => {
    const type = faker.helpers.arrayElement(types);
    const now = faker.date.recent({ days: 60 }).toISOString();
    return {
      id: `ds-${faker.string.nanoid(6)}`,
      name: `${type.toLowerCase()}-${faker.word.noun()}`,
      type,
      params: JSON.stringify(
        {
          host: faker.internet.ip(),
          port: faker.internet.port(),
          database: faker.word.noun(),
          username: faker.internet.username(),
        },
        null,
        2,
      ),
      description: faker.lorem.sentence({ min: 3, max: 8 }),
      createdAt: now,
      updatedAt: now,
    };
  });
}

function generateCatalogs(count: number): Catalog[] {
  const types: CatalogType[] = ["hive", "jdbc", "paimon", "iceberg"];
  return Array.from({ length: count }, () => {
    const type = faker.helpers.arrayElement(types);
    const name = `${type}_${faker.word.noun()}`;
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
      port: faker.internet.port(),
      role: faker.helpers.arrayElement(["master", "worker", "all"] as const),
      status: faker.helpers.arrayElement(["online", "offline"] as const),
      description: faker.lorem.sentence({ min: 3, max: 8 }),
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
      name: faker.word.noun(),
      type: faker.helpers.arrayElement(["business", "system", "custom"]),
      status: faker.helpers.arrayElement(["active", "disabled"] as const),
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
      status: faker.helpers.arrayElement(["online", "offline"] as const),
      content: `# ${type}\nkey.a=${faker.word.noun()}\nkey.b=${faker.number.int({ min: 1, max: 100 })}`,
      description: faker.lorem.sentence({ min: 3, max: 8 }),
      createdAt: now,
      updatedAt: now,
    };
  });
}

const mockResources: ResourceFile[] = generateResources(5);
const mockUsers: ManagedUser[] = generateUsers(4);
const mockParams: CustomParam[] = generateCustomParams(4);
const mockDataSources: DataSource[] = generateDataSources(6);
const mockCatalogs: Catalog[] = generateCatalogs(5);
const mockWorkers: Worker[] = generateWorkers(5);
const mockTags: Tag[] = generateTags(8);
const mockSysConfigs: SysConfig[] = generateSysConfigs(6);

export const manageHandlers: RequestHandler[] = [
  // ---- Resources ----

  // POST /api/resources/upload
  http.post("/api/resources/upload", async () => {
    await delay(500);
    const ext = faker.helpers.arrayElement(["py", "sh", "jar", "sql", "csv"]);
    const fileName = `${faker.word.noun()}-upload.${ext}`;
    const resource: ResourceFile = {
      id: `res-${faker.string.nanoid(6)}`,
      name: fileName,
      size: faker.number.int({ min: 1024, max: 10_000_000 }),
      type: "application/octet-stream",
      uploadTime: new Date().toISOString(),
      url: `/files/${fileName}`,
    };
    mockResources.push(resource);
    return HttpResponse.json(resource, { status: 201 });
  }),

  // GET /api/resources
  http.get("/api/resources", async ({ request }) => {
    await delay(200);
    const { page, pageSize } = parsePagination(new URL(request.url));
    return HttpResponse.json(paginate(mockResources, page, pageSize));
  }),

  // DELETE /api/resources/:id
  http.delete("/api/resources/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockResources.findIndex((r) => r.id === id);
    if (idx === -1) {
      return HttpResponse.json({ message: "资源不存在" }, { status: 404 });
    }
    mockResources.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Users ----

  // GET /api/users
  http.get("/api/users", async ({ request }) => {
    await delay(200);
    const { page, pageSize } = parsePagination(new URL(request.url));
    return HttpResponse.json(paginate(mockUsers, page, pageSize));
  }),

  // POST /api/users
  http.post("/api/users", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<ManagedUser, "id" | "createdAt">;
    const user: ManagedUser = {
      ...body,
      id: `usr-${faker.string.nanoid(6)}`,
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(user);
    return HttpResponse.json(user, { status: 201 });
  }),

  // PUT /api/users/:id
  http.put("/api/users/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<Omit<ManagedUser, "id" | "createdAt">>;
    const user = mockUsers.find((u) => u.id === id);
    if (!user) {
      return HttpResponse.json({ message: "用户不存在" }, { status: 404 });
    }
    Object.assign(user, body);
    return HttpResponse.json(user);
  }),

  // ---- Custom Params ----

  // GET /api/params
  http.get("/api/params", async ({ request }) => {
    await delay(200);
    const { page, pageSize } = parsePagination(new URL(request.url));
    return HttpResponse.json(paginate(mockParams, page, pageSize));
  }),

  // POST /api/params
  http.post("/api/params", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<CustomParam, "id">;
    const param: CustomParam = { ...body, id: `param-${faker.string.nanoid(6)}` };
    mockParams.push(param);
    return HttpResponse.json(param, { status: 201 });
  }),

  // PUT /api/params/:id
  http.put("/api/params/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<Omit<CustomParam, "id">>;
    const param = mockParams.find((p) => p.id === id);
    if (!param) {
      return HttpResponse.json({ message: "参数不存在" }, { status: 404 });
    }
    Object.assign(param, body);
    return HttpResponse.json(param);
  }),

  // DELETE /api/params/:id
  http.delete("/api/params/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockParams.findIndex((p) => p.id === id);
    if (idx === -1) {
      return HttpResponse.json({ message: "参数不存在" }, { status: 404 });
    }
    mockParams.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Data Sources ----

  http.get("/api/datasources", async ({ request }) => {
    await delay(200);
    const { page, pageSize } = parsePagination(new URL(request.url));
    return HttpResponse.json(paginate(mockDataSources, page, pageSize));
  }),

  http.post("/api/datasources", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<DataSource, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    const ds: DataSource = { ...body, id: `ds-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now };
    mockDataSources.push(ds);
    return HttpResponse.json(ds, { status: 201 });
  }),

  http.put("/api/datasources/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<DataSource>;
    const ds = mockDataSources.find((d) => d.id === id);
    if (!ds) return HttpResponse.json({ message: "数据源不存在" }, { status: 404 });
    Object.assign(ds, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(ds);
  }),

  http.delete("/api/datasources/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockDataSources.findIndex((d) => d.id === id);
    if (idx === -1) return HttpResponse.json({ message: "数据源不存在" }, { status: 404 });
    mockDataSources.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/datasources/:id/test", async () => {
    await delay(600);
    const success = faker.datatype.boolean({ probability: 0.7 });
    return HttpResponse.json({
      success,
      message: success ? "连接成功" : "连接失败：无法建立到数据源的连接",
    });
  }),

  // ---- Catalogs ----

  http.get("/api/catalogs", async ({ request }) => {
    await delay(200);
    const { page, pageSize } = parsePagination(new URL(request.url));
    return HttpResponse.json(paginate(mockCatalogs, page, pageSize));
  }),

  http.post("/api/catalogs", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<Catalog, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    const cat: Catalog = { ...body, id: `cat-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now };
    mockCatalogs.push(cat);
    return HttpResponse.json(cat, { status: 201 });
  }),

  http.put("/api/catalogs/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<Catalog>;
    const cat = mockCatalogs.find((c) => c.id === id);
    if (!cat) return HttpResponse.json({ message: "Catalog 不存在" }, { status: 404 });
    Object.assign(cat, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(cat);
  }),

  http.delete("/api/catalogs/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockCatalogs.findIndex((c) => c.id === id);
    if (idx === -1) return HttpResponse.json({ message: "Catalog 不存在" }, { status: 404 });
    mockCatalogs.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Workers ----

  http.get("/api/workers", async ({ request }) => {
    await delay(200);
    const { page, pageSize } = parsePagination(new URL(request.url));
    return HttpResponse.json(paginate(mockWorkers, page, pageSize));
  }),

  http.post("/api/workers", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<Worker, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    const wk: Worker = { ...body, id: `wk-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now };
    mockWorkers.push(wk);
    return HttpResponse.json(wk, { status: 201 });
  }),

  http.put("/api/workers/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<Worker>;
    const wk = mockWorkers.find((w) => w.id === id);
    if (!wk) return HttpResponse.json({ message: "Worker 不存在" }, { status: 404 });
    Object.assign(wk, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(wk);
  }),

  http.delete("/api/workers/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockWorkers.findIndex((w) => w.id === id);
    if (idx === -1) return HttpResponse.json({ message: "Worker 不存在" }, { status: 404 });
    mockWorkers.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Tags ----

  http.get("/api/tags", async ({ request }) => {
    await delay(200);
    const { page, pageSize } = parsePagination(new URL(request.url));
    return HttpResponse.json(paginate(mockTags, page, pageSize));
  }),

  http.post("/api/tags", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<Tag, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    const tag: Tag = { ...body, id: `tag-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now };
    mockTags.push(tag);
    return HttpResponse.json(tag, { status: 201 });
  }),

  http.put("/api/tags/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<Tag>;
    const tag = mockTags.find((t) => t.id === id);
    if (!tag) return HttpResponse.json({ message: "标签不存在" }, { status: 404 });
    Object.assign(tag, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(tag);
  }),

  http.delete("/api/tags/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockTags.findIndex((t) => t.id === id);
    if (idx === -1) return HttpResponse.json({ message: "标签不存在" }, { status: 404 });
    mockTags.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- System Configs ----

  http.get("/api/sys-configs", async ({ request }) => {
    await delay(200);
    const { page, pageSize } = parsePagination(new URL(request.url));
    return HttpResponse.json(paginate(mockSysConfigs, page, pageSize));
  }),

  http.post("/api/sys-configs", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<SysConfig, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    const cfg: SysConfig = { ...body, id: `cfg-${faker.string.nanoid(6)}`, createdAt: now, updatedAt: now };
    mockSysConfigs.push(cfg);
    return HttpResponse.json(cfg, { status: 201 });
  }),

  http.put("/api/sys-configs/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<SysConfig>;
    const cfg = mockSysConfigs.find((c) => c.id === id);
    if (!cfg) return HttpResponse.json({ message: "配置不存在" }, { status: 404 });
    Object.assign(cfg, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(cfg);
  }),

  // DELETE /api/sys-configs/:id/purge — must be registered before the plain delete.
  http.delete("/api/sys-configs/:id/purge", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockSysConfigs.findIndex((c) => c.id === id);
    if (idx === -1) return HttpResponse.json({ message: "配置不存在" }, { status: 404 });
    mockSysConfigs.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("/api/sys-configs/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const cfg = mockSysConfigs.find((c) => c.id === id);
    if (!cfg) return HttpResponse.json({ message: "配置不存在" }, { status: 404 });
    cfg.status = "deleted";
    cfg.updatedAt = new Date().toISOString();
    return new HttpResponse(null, { status: 204 });
  }),
];
