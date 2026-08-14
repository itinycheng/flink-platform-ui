import { describe, it, expect } from "vitest";
import { unwrapEnvelope } from "./request";

describe("unwrapEnvelope", () => {
  it("unwraps a success envelope to its data", () => {
    expect(unwrapEnvelope({ code: 0, desc: "success", data: { id: 1 } })).toEqual({ id: 1 });
  });

  it("throws with desc on a non-zero code", () => {
    expect(() => unwrapEnvelope({ code: 500, desc: "boom", data: null })).toThrowError("boom");
  });

  it("passes through a plain (non-envelope) body unchanged", () => {
    const plain = { total: 3, data: [1, 2, 3] as number[] };
    // no `code` field -> not an envelope -> returned as-is
    expect(unwrapEnvelope(plain)).toBe(plain);
  });

  it("passes through primitives and null", () => {
    expect(unwrapEnvelope(null)).toBeNull();
    expect(unwrapEnvelope("ok")).toBe("ok");
  });
});
