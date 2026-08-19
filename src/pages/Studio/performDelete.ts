import type { MessageInstance } from "antd/es/message/interface";
import type { TFunction } from "i18next";
import type { JobTreeNode } from "@/types/job";

/**
 * Persists a node delete and toasts success — but never success on failure. `deleteNode`
 * calls the backend before mutating local state, so an await + try/catch here
 * is required: a fire-and-forget call would show "Deleted" even when the
 * backend rejected the request and the node is still present in the tree.
 * The failure toast itself comes from the global http interceptor; the catch
 * here only swallows the rejection so it doesn't fall through to the success toast.
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
    // handled by the global interceptor toast
  }
}
