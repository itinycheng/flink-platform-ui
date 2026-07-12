import { useRef, useState, useCallback, useMemo } from "react";
import { Button, Modal, Popconfirm, Space, message } from "antd";
import { useTranslation } from "react-i18next";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import type { JobRun, RunListParams, RunLog } from "@/types/run";
import { getJobRuns, killJobRun, getJobRunLog } from "@/api/run";
import { getRunStatusOptions, formatDuration, isRunning } from "./runStatus";
import { RunStatusTag } from "./RunStatusTag";
import LogDrawer from "./LogDrawer";

function toParams(p: Record<string, unknown>): RunListParams {
  return {
    page: (p.current as number) ?? 1,
    pageSize: (p.pageSize as number) ?? 10,
    name: (p.name as string) || undefined,
    status: (p.status as RunListParams["status"]) || undefined,
    flowRunId: (p.flowRunId as string) || undefined,
    jobId: (p.jobId as string) || undefined,
  };
}

function TrackingCell({ run }: { run: JobRun }) {
  const { t } = useTranslation();
  return run.trackingUrl ? (
    <a href={run.trackingUrl} target="_blank" rel="noopener noreferrer">
      {t("runs.console")}
    </a>
  ) : (
    "-"
  );
}

export default function JobRunList() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logLoader, setLogLoader] = useState<(() => Promise<RunLog>) | null>(null);
  const [paramsText, setParamsText] = useState<string | null>(null);

  const onKill = useCallback(
    async (id: string) => {
      try {
        await killJobRun(id);
        message.success(t("runs.killSent"));
        void actionRef.current?.reload();
      } catch {
        message.error(t("runs.killFailed"));
      }
    },
    [t],
  );

  const onLog = useCallback((id: string) => {
    setLogLoader(() => () => getJobRunLog(id));
    setLogOpen(true);
  }, []);

  const columns = useMemo<ProColumns<JobRun>[]>(() => {
    const statusValueEnum = Object.fromEntries(getRunStatusOptions(t).map((o) => [o.value, { text: o.label }]));
    return [
      { title: t("common.name"), dataIndex: "name", ellipsis: true },
      { title: t("common.type"), dataIndex: "type", search: false },
      { title: t("common.status"), dataIndex: "status", valueType: "select", valueEnum: statusValueEnum, render: (_, r) => <RunStatusTag status={r.status} /> },
      { title: t("runs.instanceId"), dataIndex: "flowRunId", ellipsis: true, copyable: true },
      { title: t("runs.jobId"), dataIndex: "jobId", ellipsis: true },
      { title: t("runs.duration"), dataIndex: "duration", search: false, render: (_, r) => formatDuration(r.duration) },
      { title: "Tracking", dataIndex: "trackingUrl", search: false, render: (_, r) => <TrackingCell run={r} /> },
      {
        title: t("common.operation"),
        valueType: "option",
        render: (_, record) => (
          <Space>
            <a onClick={() => setParamsText(record.params)}>{t("runs.params")}</a>
            <a onClick={() => onLog(record.id)}>{t("runs.viewLog")}</a>
            {isRunning(record.status) && (
              <Popconfirm title={t("runs.killConfirmJob")} onConfirm={() => void onKill(record.id)} okText={t("common.ok")} cancelText={t("common.cancel")}>
                <a style={{ color: "var(--ant-color-error)" }}>{t("runs.kill")}</a>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ];
  }, [t, onLog, onKill]);

  return (
    <div data-testid="job-run-list">
      <ProTable<JobRun>
        headerTitle={t("runs.jobTitle")}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        options={{ reload: true, density: false, setting: false }}
        toolBarRender={() => [<Button key="refresh" onClick={() => void actionRef.current?.reload()}>{t("common.refresh")}</Button>]}
        request={async (params) => {
          const result = await getJobRuns(toParams(params));
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <LogDrawer open={logOpen} title={t("runs.jobLog")} loader={logLoader} onClose={() => setLogOpen(false)} />
      <Modal title={t("runs.params")} open={paramsText !== null} footer={null} onCancel={() => setParamsText(null)}>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{paramsText}</pre>
      </Modal>
    </div>
  );
}
