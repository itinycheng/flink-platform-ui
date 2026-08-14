import { describe, it, expect } from "vitest";
import { ok, fail } from "./response";

describe("mock response helpers", () => {
  it("ok() wraps data in a success envelope", async () => {
    const res = ok({ id: 7 });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ code: 0, desc: "success", data: { id: 7 } });
  });

  it("ok() forwards a custom status", async () => {
    const res = ok({ id: 7 }, { status: 201 });
    expect(res.status).toBe(201);
  });

  it("fail() builds an error envelope with null data", async () => {
    const res = fail(404, "not found", { status: 404 });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ code: 404, desc: "not found", data: null });
  });
});
