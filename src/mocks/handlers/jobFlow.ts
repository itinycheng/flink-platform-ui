import { http as mswHttp, delay, type RequestHandler } from "msw";
import { ok } from "@/mocks/lib/response";
import type { JobFlow } from "@/types/entities";

// In-memory store, mirrors the backend /jobFlow endpoints for mock-only dev.
const store = new Map<number, JobFlow>();
let seq = 2000;

/**
 * Numeric id from a path param. Non-numeric tree ids (e.g. "wf-abc") hash to a
 * STABLE positive number so repeated GET/update of the same node hit the same
 * stored flow (edits round-trip). Real backend flow ids are numeric already.
 */
function numId(idParam: string): number {
  const n = Number(idParam);
  if (Number.isFinite(n)) return n;
  let hash = 0;
  for (let i = 0; i < idParam.length; i++) hash = (hash * 31 + idParam.charCodeAt(i)) | 0;
  return Math.abs(hash) + 1_000_000; // offset to avoid clashing with the ++seq range
}

/** Get-or-synthesize a stored flow so subsequent updates/reopens see the same object. */
function ensureFlow(id: number): JobFlow {
  let flow = store.get(id);
  if (!flow) {
    flow = defaultFlow(id);
    store.set(id, flow);
  }
  return flow;
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
    return ok(ensureFlow(numId(params.id as string)));
  }),

  mswHttp.get("/api/jobFlow/copy/:id", async ({ params }) => {
    await delay(200);
    const src = ensureFlow(numId(params.id as string));
    const id = ++seq;
    store.set(id, { ...src, id, name: `${src.name}-copy` });
    return ok(id);
  }),

  mswHttp.get("/api/jobFlow/schedule/start/:id", async ({ params }) => {
    await delay(150);
    const flow = ensureFlow(numId(params.id as string));
    flow.status = "SCHEDULING";
    return ok(flow.id);
  }),

  mswHttp.get("/api/jobFlow/schedule/stop/:id", async ({ params }) => {
    await delay(150);
    const flow = ensureFlow(numId(params.id as string));
    flow.status = "ONLINE";
    return ok(flow.id);
  }),

  mswHttp.post("/api/jobFlow/schedule/runOnce/:id", async () => {
    await delay(200);
    return ok(++seq); // fake flowRunId
  }),

  mswHttp.post("/api/jobFlow/updateFlow", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as { id: string | number; flow: unknown };
    const flow = ensureFlow(numId(String(body.id)));
    // New-UI FlowGraph stored on the flow's `flow` field (backend accepts both shapes).
    (flow as { flow?: unknown }).flow = body.flow;
    return ok(flow.id);
  }),
];
