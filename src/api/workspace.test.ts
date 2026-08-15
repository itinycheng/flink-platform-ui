import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { workspaceHandlers } from "@/mocks/handlers/workspace";
import { getWorkspaces, getAllWorkspaces } from "./workspace";

const server = setupServer(...workspaceHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("workspace mock — backend-aligned Status + /workspace/{page,list}", () => {
  it("page returns workspaces with a backend Status", async () => {
    const page = await getWorkspaces({ page: 1, pageSize: 10 });
    expect(page.data.length).toBeGreaterThan(0);
    expect(["ENABLE", "DISABLE", "DELETED"]).toContain(page.data[0].status);
  });

  it("list returns only ENABLE workspaces (for the switcher)", async () => {
    const all = await getAllWorkspaces();
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((w) => w.status === "ENABLE")).toBe(true);
  });
});
