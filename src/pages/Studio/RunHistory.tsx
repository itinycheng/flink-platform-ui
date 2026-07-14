import { useEffect, useState, useCallback } from "react";
import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { getWorkflowRuns } from "@/api/job";
import type { WorkflowRunRecord } from "@/types/job";

interface RunHistoryProps {
  workflowId: string;
}

export default function RunHistory({ workflowId }: RunHistoryProps) {
  const [records, setRecords] = useState<WorkflowRunRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const columns: ColumnsType<WorkflowRunRecord> = [
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
      render: (status: WorkflowRunRecord["status"]) => {
        const map: Record<string, { color: string; key: string }> = {
          success: { color: "success", key: "runHistory.success" },
          failed: { color: "error", key: "runHistory.failed" },
          running: { color: "processing", key: "runHistory.running" },
        };
        const cfg = map[status];
        return <Tag color={cfg.color}>{t(cfg.key)}</Tag>;
      },
    },
    {
      title: t("runHistory.duration"),
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => {
        if (duration < 1000) return `${duration}ms`;
        if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
        return `${(duration / 60000).toFixed(1)}min`;
      },
    },
    {
      title: t("runHistory.log"),
      dataIndex: "logUrl",
      key: "logUrl",
      render: (logUrl: string | undefined) =>
        logUrl ? (
          <a href={logUrl} target="_blank" rel="noopener noreferrer">
            {t("runHistory.viewLog")}
          </a>
        ) : (
          "-"
        ),
    },
  ];

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkflowRuns(workflowId);
      setRecords(data);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    void fetchRuns();
  }, [fetchRuns]);

  return (
    <div data-testid="run-history">
      <Table<WorkflowRunRecord>
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
