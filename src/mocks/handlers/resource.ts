import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { ResourceFile } from "@/types/manage";
import { paginate, parsePagination } from "@/utils/pagination";

const RESOURCE_MIME: Record<string, string> = {
  py: "text/x-python",
  yaml: "application/x-yaml",
  jar: "application/java-archive",
  sql: "application/sql",
  sh: "application/x-sh",
  json: "application/json",
  csv: "text/csv",
  xml: "application/xml",
};

function makeDir(name: string, parentId: string | null): ResourceFile {
  return {
    id: `res-${faker.string.nanoid(6)}`,
    name,
    size: 0,
    type: "DIR",
    uploadTime: faker.date.recent({ days: 60 }).toISOString(),
    url: "",
    parentId,
    isDir: true,
  };
}

function makeFile(name: string, parentId: string | null): ResourceFile {
  const ext = name.split(".").pop() ?? "";
  return {
    id: `res-${faker.string.nanoid(6)}`,
    name,
    size: faker.number.int({ min: 512, max: 52_428_800 }),
    type: RESOURCE_MIME[ext] ?? "application/octet-stream",
    uploadTime: faker.date.recent({ days: 60 }).toISOString(),
    url: `/files/${name}`,
    parentId,
    isDir: false,
  };
}

/** Seed a small resource tree: a few root folders with nested folders and files. */
function generateResourceTree(): ResourceFile[] {
  const out: ResourceFile[] = [];
  const add = (r: ResourceFile) => {
    out.push(r);
    return r;
  };

  const jars = add(makeDir("jars", null));
  const scripts = add(makeDir("scripts", null));
  const configs = add(makeDir("configs", null));
  add(makeFile("bootstrap.sql", null));

  const spark = add(makeDir("spark", jars.id));
  const flink = add(makeDir("flink", jars.id));
  add(makeFile("spark-etl.jar", spark.id));
  add(makeFile("spark-ml.jar", spark.id));
  add(makeFile("flink-cdc.jar", flink.id));

  add(makeFile("daily_sync.sh", scripts.id));
  add(makeFile("backfill.py", scripts.id));

  add(makeFile("app.yaml", configs.id));
  add(makeFile("log4j.xml", configs.id));

  return out;
}

const mockResources: ResourceFile[] = generateResourceTree();

export const resourceHandlers: RequestHandler[] = [
  // GET /api/resources?parentId=&name=&page=&pageSize=  (lists one folder level)
  http.get("/api/resources", async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const parentId = url.searchParams.get("parentId");
    const name = (url.searchParams.get("name") ?? "").toLowerCase();
    const { page, pageSize } = parsePagination(url);
    let list = mockResources.filter((r) => (r.parentId ?? null) === (parentId ?? null));
    if (name) list = list.filter((r) => r.name.toLowerCase().includes(name));
    // Folders first, then alphabetical.
    list = [...list].sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name));
    return HttpResponse.json(paginate(list, page, pageSize));
  }),

  // POST /api/resources/folder  { name, parentId }
  http.post("/api/resources/folder", async ({ request }) => {
    await delay(200);
    const { name, parentId } = (await request.json()) as { name: string; parentId: string | null };
    const folder = makeDir(name, parentId ?? null);
    folder.uploadTime = new Date().toISOString();
    mockResources.push(folder);
    return HttpResponse.json(folder, { status: 201 });
  }),

  // POST /api/resources/upload  (multipart: file, parentId?)
  http.post("/api/resources/upload", async ({ request }) => {
    await delay(500);
    const form = await request.formData();
    const parentId = (form.get("parentId") as string | null) || null;
    const uploaded = form.get("file");
    const fileName = uploaded instanceof File ? uploaded.name : `${faker.word.noun()}-upload.dat`;
    const resource = makeFile(fileName, parentId);
    if (uploaded instanceof File && uploaded.size) resource.size = uploaded.size;
    resource.uploadTime = new Date().toISOString();
    mockResources.push(resource);
    return HttpResponse.json(resource, { status: 201 });
  }),

  // GET /api/resources/:id/path  (root → … → the folder itself)
  http.get("/api/resources/:id/path", async ({ params }) => {
    await delay(100);
    const { id } = params as { id: string };
    const path: { id: string; name: string }[] = [];
    let cur = mockResources.find((r) => r.id === id);
    while (cur) {
      const node = cur;
      path.unshift({ id: node.id, name: node.name });
      cur = node.parentId ? mockResources.find((r) => r.id === node.parentId) : undefined;
    }
    return HttpResponse.json(path);
  }),

  // DELETE /api/resources/:id  (folders cascade to all descendants)
  http.delete("/api/resources/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    if (!mockResources.some((r) => r.id === id)) {
      return HttpResponse.json({ message: "资源不存在" }, { status: 404 });
    }
    const doomed = new Set<string>([id]);
    for (let changed = true; changed; ) {
      changed = false;
      for (const r of mockResources) {
        if (r.parentId && doomed.has(r.parentId) && !doomed.has(r.id)) {
          doomed.add(r.id);
          changed = true;
        }
      }
    }
    for (let i = mockResources.length - 1; i >= 0; i--) {
      if (doomed.has(mockResources[i].id)) mockResources.splice(i, 1);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
