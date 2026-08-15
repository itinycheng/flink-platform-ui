import { http as mswHttp, delay, type RequestHandler } from "msw";
import { ok } from "@/mocks/lib/response";
import type { JobFlow } from "@/types/entities";

// In-memory store, mirrors the backend /jobFlow endpoints for mock-only dev.
const store = new Map<number, JobFlow>();
let seq = 2000;

/** Numeric id from a path param; non-numeric tree ids (e.g. "wf-abc") get a fresh synthesized id. */
function numId(idParam: string): number {
  const n = Number(idParam);
  return Number.isFinite(n) ? n : ++seq;
}

function defaultFlow(id: number): JobFlow {
  return {
    id,
    name: `flow-${id}`,
    type: "JOB_FLOW",
    status: "ONLINE",
    config: { parallelism: 1 },
    timeout: { enable: false },
  };
}

export const jobFlowHandlers: RequestHandler[] = [
  mswHttp.post("/api/jobFlow/create", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as JobFlow;
    const id = ++seq;
    store.set(id, { ...body, id, status: "ONLINE" });
    return ok(id, { status: 201 });
  }),

  mswHttp.post("/api/jobFlow/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as JobFlow;
    const id = body.id!;
    store.set(id, { ...(store.get(id) ?? {}), ...body });
    return ok(id);
  }),

  mswHttp.get("/api/jobFlow/get/:id", async ({ params }) => {
    await delay(150);
    const id = numId(params.id as string);
    return ok(store.get(id) ?? defaultFlow(id));
  }),

  mswHttp.get("/api/jobFlow/copy/:id", async ({ params }) => {
    await delay(200);
    const srcId = numId(params.id as string);
    const src = store.get(srcId) ?? defaultFlow(srcId);
    const id = ++seq;
    store.set(id, { ...src, id, name: `${src.name}-copy` });
    return ok(id);
  }),

  mswHttp.get("/api/jobFlow/schedule/start/:id", async ({ params }) => {
    await delay(150);
    const id = numId(params.id as string);
    const flow = store.get(id);
    if (flow) flow.status = "SCHEDULING";
    return ok(id);
  }),

  mswHttp.get("/api/jobFlow/schedule/stop/:id", async ({ params }) => {
    await delay(150);
    const id = numId(params.id as string);
    const flow = store.get(id);
    if (flow) flow.status = "ONLINE";
    return ok(id);
  }),

  mswHttp.post("/api/jobFlow/schedule/runOnce/:id", async () => {
    await delay(200);
    return ok(++seq); // fake flowRunId
  }),
];
