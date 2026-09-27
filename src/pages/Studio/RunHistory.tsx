import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { getFlowRuns } from "@/api/run";
import type { FlowRun } from "@/types/run";
import { RunStatusTag } from "@/pages/Runs/RunStatusTag";
import { formatDuration } from "@/pages/Runs/runStatus";
import { execIsRunning } from "@/pages/Runs/runStatus";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { queryKeys } from "@/api/queryKeys";

interface RunHistoryProps {
  workflowId: string;
}

export default function RunHistory({ workflowId }: RunHistoryProps) {
  const { t } = useTranslation();
  const workspaceId = useWorkspaceStore((state) => state.currentId);
  const params = { flowId: workflowId, page: 1, pageSize: 20 };
  const { data, isPending: loading } = useQuery({
    queryKey: queryKeys.runs.list(workspaceId, params),
    queryFn: () => getFlowRuns(params),
    enabled: workspaceId != null,
    refetchInterval: (query) => (query.state.data?.data.some((run) => execIsRunning(run.status)) ? 5_000 : false),
  });
  const records: FlowRun[] = data?.data ?? [];

  const columns: ColumnsType<FlowRun> = [
    {
      title: t("runHistory.startTime"),
      dataIndex: "startTime",
      key: "startTime",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: t("runHistory.endTime"),
      dataIndex: "endTime",
      key: "endTime",
      render: (text: string) => (text ? new Date(text).toLocaleString() : "-"),
    },
    {
      title: t("runHistory.status"),
      dataIndex: "status",
      key: "status",
      render: (_, r) => <RunStatusTag status={r.status} />,
    },
    {
      title: t("runHistory.duration"),
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => formatDuration(duration),
    },
    {
      title: t("common.name"),
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
  ];

  return (
    <div data-testid="run-history">
      <Table<FlowRun>
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: t("runHistory.noRecords") }}
      />
    </div>
  );
}
