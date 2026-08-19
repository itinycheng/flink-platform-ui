import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { resourceHandlers } from "@/mocks/handlers/resource";
import {
  createFolder,
  deleteResource,
  getFolderTree,
  getResourcePath,
  getResources,
  moveResource,
  renameResource,
} from "@/api/admin";
import { listResourceFiles } from "@/api/picker";

const server = setupServer(...resourceHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("resource /resource/* endpoints", () => {
  it("pages the root level with numeric ids", async () => {
    const res = await getResources({ page: 1, pageSize: 50 });
    expect(res.total).toBeGreaterThan(0);
    expect(res.data.every((r) => typeof r.id === "number")).toBe(true);
  });
  it("create folder → appears under its parent; rename + move update it", async () => {
    const parent = await createFolder("P");
    const child = await createFolder("C", parent);
    const inParent = await getResources({ pid: parent, page: 1, pageSize: 50 });
    expect(inParent.data.some((r) => r.id === child && r.type === "DIR")).toBe(true);
    expect(await renameResource(child, "C2")).toBe(child);
    expect(await moveResource(child)).toBe(child); // move to root
    const atRoot = await getResources({ page: 1, pageSize: 50 });
    expect(atRoot.data.some((r) => r.id === child)).toBe(true);
  });
  it("getWithParents returns the ancestor chain", async () => {
    const a = await createFolder("A");
    const b = await createFolder("B", a);
    const path = await getResourcePath(b);
    expect(path.map((r) => r.id)).toEqual([a, b]);
  });
  it("delete cascades a folder subtree", async () => {
    const a = await createFolder("Da");
    await createFolder("Db", a);
    expect(await deleteResource(a)).toBe(true);
    const gone = await getResources({ pid: a, page: 1, pageSize: 50 });
    expect(gone.data.length).toBe(0);
  });
  it("folder tree lists only DIR; picker lists FILE by ext", async () => {
    expect((await getFolderTree()).every((r) => r.type === "DIR")).toBe(true);
    expect((await listResourceFiles("jar")).every((r) => r.type === "FILE")).toBe(true);
  });
});
