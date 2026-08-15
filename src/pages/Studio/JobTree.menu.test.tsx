import { describe, it, expect } from "vitest";
import i18n from "@/i18n";
import { buildNodeMenuItems } from "./nodeMenu";
import type { JobTreeNode } from "@/types/job";

const t = i18n.getFixedT("en");
const keys = (node: JobTreeNode) =>
  (buildNodeMenuItems(node, t) ?? []).map((i) => (i && "key" in i ? i.key : undefined));

describe("buildNodeMenuItems subgroup gating", () => {
  it("top-level group offers addSubgroup", () => {
    expect(keys({ id: "g", name: "g", kind: "group", pid: "" })).toContain("addSubgroup");
  });
  it("subgroup does NOT offer addSubgroup", () => {
    expect(keys({ id: "s", name: "s", kind: "group", pid: "g" })).not.toContain("addSubgroup");
  });
});
