import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { ResourceFile, ManagedUser, EnvConfig, CustomParam } from "@/types/manage";
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

function generateEnvConfigs(): EnvConfig[] {
  const envs = ["production", "staging", "development"];
  const keys = ["DB_HOST", "DB_PORT", "DB_NAME", "REDIS_HOST", "CACHE_TTL", "DEBUG", "LOG_LEVEL"];
  const configs: EnvConfig[] = [];

  for (const env of envs) {
    const keyCount = faker.number.int({ min: 2, max: 4 });
    const selectedKeys = faker.helpers.arrayElements(keys, keyCount);
    for (const key of selectedKeys) {
      configs.push({
        id: `env-${faker.string.nanoid(6)}`,
        env,
        key,
        value: key.includes("PORT")
          ? String(faker.internet.port())
          : key.includes("HOST")
            ? faker.internet.ip()
            : key === "DEBUG"
              ? faker.helpers.arrayElement(["true", "false"])
              : faker.word.noun(),
        description: faker.lorem.sentence({ min: 3, max: 8 }),
      });
    }
  }
  return configs;
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

const mockResources: ResourceFile[] = generateResources(5);
const mockUsers: ManagedUser[] = generateUsers(4);
const mockEnvConfigs: EnvConfig[] = generateEnvConfigs();
const mockParams: CustomParam[] = generateCustomParams(4);

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

  // ---- Environment Configs ----

  // GET /api/env-configs
  http.get("/api/env-configs", async ({ request }) => {
    await delay(200);
    const { page, pageSize } = parsePagination(new URL(request.url));
    return HttpResponse.json(paginate(mockEnvConfigs, page, pageSize));
  }),

  // PUT /api/env-configs/:id
  http.put("/api/env-configs/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<Omit<EnvConfig, "id">>;
    const config = mockEnvConfigs.find((c) => c.id === id);
    if (!config) {
      return HttpResponse.json({ message: "配置不存在" }, { status: 404 });
    }
    Object.assign(config, body);
    return HttpResponse.json(config);
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
];
