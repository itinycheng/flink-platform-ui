import { http, HttpResponse, delay, type RequestHandler } from "msw";
import { faker } from "@faker-js/faker";
import type { Workspace } from "@/types/workspace";
import { paginate } from "@/utils/pagination";

// A stable default workspace plus a few generated ones.
const mockWorkspaces: Workspace[] = [
  {
    id: "ws-default",
    name: "Default Workspace",
    description: "System default workspace",
    status: "active",
    isDefault: true,
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  },
  ...Array.from({ length: 3 }, () => ({
    id: `ws-${faker.string.nanoid(6)}`,
    name: faker.company.name(),
    description: faker.lorem.sentence({ min: 3, max: 8 }),
    status: faker.helpers.arrayElement(["active", "disabled"] as const),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  })),
];

export const workspaceHandlers: RequestHandler[] = [
  http.get("/api/workspaces/all", async () => {
    await delay(150);
    return HttpResponse.json(mockWorkspaces.filter((w) => w.status === "active"));
  }),

  http.get("/api/workspaces", async ({ request }) => {
    await delay(200);
    const p = new URL(request.url).searchParams;
    const page = Number(p.get("page")) || 1;
    const pageSize = Number(p.get("pageSize")) || 10;
    return HttpResponse.json(paginate(mockWorkspaces, page, pageSize));
  }),

  http.post("/api/workspaces", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<Workspace, "id" | "createdAt">;
    const ws: Workspace = { ...body, id: `ws-${faker.string.nanoid(6)}`, createdAt: new Date().toISOString() };
    mockWorkspaces.push(ws);
    return HttpResponse.json(ws, { status: 201 });
  }),

  http.put("/api/workspaces/:id", async ({ params, request }) => {
    await delay(200);
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<Workspace>;
    const ws = mockWorkspaces.find((w) => w.id === id);
    if (!ws) return HttpResponse.json({ message: "工作空间不存在" }, { status: 404 });
    Object.assign(ws, body);
    return HttpResponse.json(ws);
  }),

  http.delete("/api/workspaces/:id", async ({ params }) => {
    await delay(200);
    const { id } = params as { id: string };
    const idx = mockWorkspaces.findIndex((w) => w.id === id);
    if (idx === -1) return HttpResponse.json({ message: "工作空间不存在" }, { status: 404 });
    mockWorkspaces.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
