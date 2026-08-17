import { http, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { Workspace } from "@/types/workspace";
import { ok } from "@/mocks/lib/response";
import { ipage, parsePageSize } from "@/mocks/lib/page";

let wsSeq = 1;

// A stable default workspace plus a few generated ones.
const mockWorkspaces: Workspace[] = [
  {
    id: 1,
    name: "Default Workspace",
    description: "System default workspace",
    status: "ENABLE",
    isDefault: true,
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  },
  ...Array.from({ length: 3 }, () => ({
    id: ++wsSeq,
    name: faker.company.name(),
    description: faker.lorem.sentence({ min: 3, max: 8 }),
    status: faker.helpers.arrayElement(["ENABLE", "DISABLE"] as const),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  })),
];

export const workspaceHandlers: RequestHandler[] = [
  http.get("/api/workspace/list", async () => {
    await delay(150);
    return ok(mockWorkspaces.filter((w) => w.status === "ENABLE"));
  }),

  http.get("/api/workspace/page", async ({ request }) => {
    await delay(200);
    const { page, size } = parsePageSize(new URL(request.url));
    return ok(ipage(mockWorkspaces, page, size));
  }),

  http.post("/api/workspace/create", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<Workspace, "id" | "createdAt">;
    const id = ++wsSeq;
    mockWorkspaces.push({ ...body, id, createdAt: new Date().toISOString() });
    return ok(id, { status: 201 });
  }),

  http.post("/api/workspace/update", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Workspace> & { id: number };
    const ws = mockWorkspaces.find((w) => w.id === body.id);
    if (!ws) return ok(0);
    Object.assign(ws, body);
    return ok(1);
  }),

  http.get("/api/workspace/delete/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockWorkspaces.findIndex((w) => w.id === Number(id));
    if (idx !== -1) mockWorkspaces.splice(idx, 1);
    return ok(idx !== -1);
  }),
];
