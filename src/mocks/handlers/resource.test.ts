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
  uploadResource,
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
  it("moveResource to a non-root folder relocates it (not just to root)", async () => {
    const a = await createFolder("MoveA");
    const b = await createFolder("MoveB");
    const c = await createFolder("MoveC", a);
    expect(await moveResource(c, b)).toBe(c);
    const inB = await getResources({ pid: b, page: 1, pageSize: 50 });
    expect(inB.data.some((r) => r.id === c)).toBe(true);
    const inA = await getResources({ pid: a, page: 1, pageSize: 50 });
    expect(inA.data.some((r) => r.id === c)).toBe(false);
  });
  it("name filter on /resource/page returns only matches", async () => {
    await createFolder("UniqueFilterTarget");
    await createFolder("Other");
    const filtered = await getResources({ name: "uniquefiltertarget", page: 1, pageSize: 50 });
    expect(filtered.data.length).toBeGreaterThan(0);
    expect(filtered.data.every((r) => r.name.toLowerCase().includes("uniquefiltertarget"))).toBe(true);
  });
  it("uploadResource creates a FILE under the given pid", async () => {
    const folder = await createFolder("UploadTarget");
    // Note: jsdom's fetch/FormData polyfill doesn't preserve File.name across a fetch body
    // (reproduced even with a bare `fetch()` call, independent of this app's code), so we
    // don't assert the exact filename here — only that a FILE resource lands under `folder`.
    const file = new File(["x"], "lib.jar");
    const uploaded = await uploadResource(file, folder);
    expect(uploaded.type).toBe("FILE");
    const inFolder = await getResources({ pid: folder, page: 1, pageSize: 50 });
    expect(inFolder.data.some((r) => r.id === uploaded.id && r.type === "FILE")).toBe(true);
  });
});
