import { useEffect, useState, useCallback } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { getFlowRuns } from "@/api/run";
import type { FlowRun } from "@/types/run";
import { RunStatusTag } from "@/pages/Runs/RunStatusTag";
import { formatDuration } from "@/pages/Runs/runStatus";

interface RunHistoryProps {
  workflowId: string;
}

export default function RunHistory({ workflowId }: RunHistoryProps) {
  const [records, setRecords] = useState<FlowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFlowRuns({ flowId: workflowId, page: 1, pageSize: 20 });
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    void fetchRuns();
  }, [fetchRuns]);

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
