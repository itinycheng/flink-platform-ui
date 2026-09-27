import { useQuery } from "@tanstack/react-query";
import { Empty, Flex, Spin, Tooltip, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { queryClient } from "@/app/queryClient";
import { queryKeys } from "@/api/queryKeys";
import { listJobsForFlow } from "@/api/job";
import { TaskIcon, getTaskIcon } from "@/components/TaskIcon";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface Props {
  workflowId: string;
  usedJobIds: Set<number>;
}

export function TaskSidebar({ workflowId, usedJobIds }: Props) {
  const { t } = useTranslation();
  const workspaceId = useWorkspaceStore((state) => state.currentId);
  const { data = [], isPending } = useQuery(
    {
      queryKey: queryKeys.definitions.flowJobs(workspaceId, workflowId),
      queryFn: () => listJobsForFlow(workflowId),
      enabled: workspaceId != null,
    },
    queryClient,
  );

  return (
    <Flex
      vertical
      style={{
        width: 220,
        flexShrink: 0,
        background: "var(--ant-color-bg-container)",
        borderTop: "1px solid var(--ant-color-border-secondary)",
        borderRight: "1px solid var(--ant-color-border-secondary)",
        overflowY: "auto",
        padding: 8,
        gap: 6,
      }}
    >
      <Typography.Text strong style={{ padding: "2px 4px" }}>
        {t("dag.availableTasks")}
      </Typography.Text>
      <Spin spinning={isPending}>
        {!isPending && data.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("dag.noAvailableTasks")} />
        ) : (
          <Flex vertical gap={6}>
            {data.map((job) => {
              const used = job.id == null || usedJobIds.has(job.id);
              const color = getTaskIcon(job.type).color;
              const content = (
                <Flex
                  draggable={!used}
                  onDragStart={(event) => {
                    if (used || job.id == null) return;
                    event.dataTransfer.setData("application/reactflow-job-id", String(job.id));
                    event.dataTransfer.setData("application/reactflow-type", job.type);
                    event.dataTransfer.setData("application/reactflow-label", job.name);
                    event.dataTransfer.setData("application/reactflow-description", job.description ?? "");
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  align="center"
                  gap={8}
                  style={{
                    minHeight: 38,
                    padding: "6px 8px",
                    cursor: used ? "not-allowed" : "grab",
                    opacity: used ? 0.45 : 1,
                    color,
                    background: "var(--ant-color-fill-quaternary)",
                    border: "1px solid var(--ant-color-border-secondary)",
                    borderRadius: 4,
                  }}
                >
                  <TaskIcon type={job.type} size={20} />
                  <Typography.Text ellipsis style={{ flex: 1 }}>
                    {job.name}
                  </Typography.Text>
                </Flex>
              );
              return used ? (
                <Tooltip key={job.id ?? job.name} title={t("dag.taskAlreadyAdded")} placement="right">
                  {content}
                </Tooltip>
              ) : (
                <div key={job.id ?? job.name}>{content}</div>
              );
            })}
          </Flex>
        )}
      </Spin>
    </Flex>
  );
}
