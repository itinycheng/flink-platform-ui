import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MessageInstance } from "antd/es/message/interface";
import type { JobTreeNode, WorkflowLifecycleStatus } from "@/types/job";
import { useJobStore } from "@/stores/jobStore";

const STATUS_ACTION: Record<string, WorkflowLifecycleStatus> = {
  online: "ONLINE",
  offline: "OFFLINE",
  startSchedule: "SCHEDULING",
  stopSchedule: "ONLINE",
};

/** Lifecycle actions (run-once, status transitions, copy) + tag edit modal for definition nodes. */
export function useDefinitionLifecycle(messageApi: MessageInstance) {
  const { t } = useTranslation();
  const runOnce = useJobStore((s) => s.runOnce);
  const setLifecycleStatus = useJobStore((s) => s.setLifecycleStatus);
  const copyDefinition = useJobStore((s) => s.copyDefinition);
  const setNodeTags = useJobStore((s) => s.setNodeTags);

  const [tagNode, setTagNode] = useState<JobTreeNode | null>(null);
  const [saving, setSaving] = useState(false);

  const handleLifecycle = useCallback(
    async (key: string, node: JobTreeNode) => {
      try {
        if (key === "runOnce") {
          const flowRunId = await runOnce(node.id);
          void messageApi.success(t("definitions.runTriggered", { id: flowRunId }));
        } else if (key in STATUS_ACTION) {
          await setLifecycleStatus(node.id, STATUS_ACTION[key]);
          void messageApi.success(t("common.actionSuccess"));
        } else if (key === "copy") {
          await copyDefinition(node.id);
          void messageApi.success(t("definitions.copySuccess"));
        } else if (key === "editTags") {
          setTagNode(node);
        }
      } catch {
        // handled by the global interceptor toast
      }
    },
    [runOnce, setLifecycleStatus, copyDefinition, messageApi, t],
  );

  const saveTags = useCallback(
    async (tags: string[]) => {
      if (!tagNode) return;
      setSaving(true);
      try {
        await setNodeTags(tagNode.id, tags);
        void messageApi.success(t("definitions.tagsUpdated"));
        setTagNode(null);
      } catch {
        // handled by the global interceptor toast
      } finally {
        setSaving(false);
      }
    },
    [tagNode, setNodeTags, messageApi, t],
  );

  return {
    handleLifecycle,
    tagNode,
    saving,
    closeTag: () => setTagNode(null),
    saveTags,
  };
}
