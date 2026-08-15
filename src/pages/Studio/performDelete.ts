import type { MessageInstance } from "antd/es/message/interface";
import type { TFunction } from "i18next";
import type { JobTreeNode } from "@/types/job";

/**
 * Persists a node delete and toasts success/failure — never both. `deleteNode`
 * calls the backend before mutating local state, so an await + try/catch here
 * is required: a fire-and-forget call would show "Deleted" even when the
 * backend rejected the request and the node is still present in the tree.
 * Kept in its own module (rather than inline in JobTree.tsx) so it can be
 * unit-tested directly without going through antd's static `Modal.confirm`.
 */
export async function performDelete(
  node: JobTreeNode,
  deleteNode: (node: JobTreeNode) => Promise<void>,
  messageApi: MessageInstance,
  t: TFunction,
): Promise<void> {
  try {
    await deleteNode(node);
    void messageApi.success(t("workflow.deleted"));
  } catch {
    void messageApi.error(t("common.deleteFailed"));
  }
}
