import { http, delay, type RequestHandler } from "msw";
import { ok, fail } from "@/mocks/lib/response";
import { ipage, parsePageSize } from "@/mocks/lib/page";
import type { Resource } from "@/types/entities";

let seq = 0;
const nextId = () => ++seq;

/** Seed: a few root DIRs (some nested) and FILEs, including a `.jar` for the picker. */
const resourceStore: Resource[] = [
  { id: nextId(), name: "jars", type: "DIR" },
  { id: nextId(), name: "scripts", type: "DIR" },
  { id: nextId(), name: "configs", type: "DIR" },
  { id: nextId(), name: "bootstrap.sql", type: "FILE" },
];
// Nest a couple of folders/files under the seeded roots.
resourceStore.push(
  { id: nextId(), name: "spark", type: "DIR", pid: resourceStore[0].id },
  { id: nextId(), name: "flink", type: "DIR", pid: resourceStore[0].id },
);
resourceStore.push(
  { id: nextId(), name: "spark-etl.jar", type: "FILE", pid: resourceStore[4].id },
  { id: nextId(), name: "spark-ml.jar", type: "FILE", pid: resourceStore[4].id },
  { id: nextId(), name: "flink-cdc.jar", type: "FILE", pid: resourceStore[5].id },
  { id: nextId(), name: "daily_sync.sh", type: "FILE", pid: resourceStore[1].id },
  { id: nextId(), name: "backfill.py", type: "FILE", pid: resourceStore[1].id },
  { id: nextId(), name: "app.yaml", type: "FILE", pid: resourceStore[2].id },
  { id: nextId(), name: "log4j.xml", type: "FILE", pid: resourceStore[2].id },
);

/** Walk the `pid` graph downward: `id` plus every descendant id. */
function descendantIds(id: number): Set<number> {
  const doomed = new Set<number>([id]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const r of resourceStore) {
      if (r.id != null && r.pid != null && doomed.has(r.pid) && !doomed.has(r.id)) {
        doomed.add(r.id);
        changed = true;
      }
    }
  }
  return doomed;
}

/** Walk the `pid` graph upward: the ancestor chain root → … → `id` (inclusive). */
function ancestorChain(id: number): Resource[] {
  const chain: Resource[] = [];
  let cur = resourceStore.find((r) => r.id === id);
  while (cur) {
    const node = cur;
    chain.unshift(node);
    cur = node.pid != null ? resourceStore.find((r) => r.id === node.pid) : undefined;
  }
  return chain;
}

export const resourceHandlers: RequestHandler[] = [
  http.get("/api/resource/page", async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const { page, size } = parsePageSize(url);
    const pidParam = url.searchParams.get("pid");
    const pid = pidParam ? Number(pidParam) : undefined;
    const name = (url.searchParams.get("name") ?? "").toLowerCase();
    let list = resourceStore.filter((r) => (pid === undefined ? r.pid == null : r.pid === pid));
    if (name) list = list.filter((r) => r.name.toLowerCase().includes(name));
    return ok(ipage(list, page, size));
  }),

  http.get("/api/resource/list", async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const ext = url.searchParams.get("ext");
    let list = resourceStore;
    if (type) list = list.filter((r) => r.type === type);
    if (ext) list = list.filter((r) => r.name.endsWith("." + ext));
    return ok(list);
  }),

  http.post("/api/resource/create", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Resource>;
    const id = nextId();
    resourceStore.push({
      id,
      name: body.name ?? "",
      type: body.type ?? "FILE",
      pid: body.pid,
      description: body.description,
    });
    return ok(id, { status: 201 });
  }),

  http.post("/api/resource/update", async ({ request }) => {
    await delay(200);
    // `pid: null` (explicit) means "move to root"; an absent `pid` key means "leave it".
    const body = (await request.json()) as { id: number; name?: string; pid?: number | null; description?: string };
    const target = resourceStore.find((r) => r.id === body.id);
    if (!target) return fail(1404, "resource not found");
    if (body.name !== undefined) target.name = body.name;
    if ("pid" in body) target.pid = body.pid == null ? undefined : body.pid;
    if (body.description !== undefined) target.description = body.description;
    return ok(body.id);
  }),

  http.get("/api/resource/get/:id", async ({ params }) => {
    await delay(100);
    const id = Number(params.id);
    const found = resourceStore.find((r) => r.id === id);
    return found ? ok(found) : fail(1404, "resource not found");
  }),

  http.get("/api/resource/getWithParents/:id", async ({ params }) => {
    await delay(100);
    const id = Number(params.id);
    return ok(ancestorChain(id));
  }),

  http.get("/api/resource/delete/:id", async ({ params }) => {
    await delay(200);
    const id = Number(params.id);
    if (!resourceStore.some((r) => r.id === id)) return ok(false);
    const doomed = descendantIds(id);
    for (let i = resourceStore.length - 1; i >= 0; i--) {
      const rid = resourceStore[i].id;
      if (rid != null && doomed.has(rid)) resourceStore.splice(i, 1);
    }
    return ok(true);
  }),

  http.post("/api/resource/upload", async ({ request }) => {
    await delay(500);
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const pidRaw = form.get("pid");
    const pid = typeof pidRaw === "string" && pidRaw ? Number(pidRaw) : undefined;
    const resource: Resource = { id: nextId(), name: file?.name ?? "upload", type: "FILE", pid };
    resourceStore.push(resource);
    return ok(resource, { status: 201 });
  }),
];
