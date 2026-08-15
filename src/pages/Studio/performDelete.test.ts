import { describe, it, expect, vi } from "vitest";
import i18n from "@/i18n";
import { performDelete } from "./performDelete";
import type { JobTreeNode } from "@/types/job";
import type { MessageInstance } from "antd/es/message/interface";

const t = i18n.getFixedT("en");
const node: JobTreeNode = { id: "n1", name: "n1", kind: "task", pid: "" };

function makeMessageApi() {
  return { success: vi.fn(), error: vi.fn() } as unknown as MessageInstance;
}

describe("performDelete", () => {
  it("shows the success toast (and not the error toast) when deleteNode resolves", async () => {
    const deleteNode = vi.fn().mockResolvedValue(undefined);
    const messageApi = makeMessageApi();

    await performDelete(node, deleteNode, messageApi, t);

    expect(deleteNode).toHaveBeenCalledWith(node);
    expect(messageApi.success).toHaveBeenCalledWith(t("workflow.deleted"));
    expect(messageApi.error).not.toHaveBeenCalled();
  });

  it("shows the error toast (and not the success toast) when deleteNode rejects", async () => {
    const deleteNode = vi.fn().mockRejectedValue(new Error("backend rejected delete"));
    const messageApi = makeMessageApi();

    await performDelete(node, deleteNode, messageApi, t);

    expect(deleteNode).toHaveBeenCalledWith(node);
    expect(messageApi.error).toHaveBeenCalledWith(t("common.deleteFailed"));
    expect(messageApi.success).not.toHaveBeenCalled();
  });
});
