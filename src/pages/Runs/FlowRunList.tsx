import { useRef, useState, useCallback, useMemo } from "react";
import { Button, Popconfirm, Space, Tag, message } from "antd";
import { useTranslation } from "react-i18next";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import type { FlowRun, RunListParams, RunLog } from "@/types/run";
import { getFlowRuns, killFlowRun, getFlowRunLog } from "@/api/run";
import { getRunStatusOptions, formatDuration, isRunning } from "./runStatus";
import { RunStatusTag } from "./RunStatusTag";
import LogDrawer from "./LogDrawer";

function toParams(p: Record<string, unknown>): RunListParams {
  const range = p.startRange as [string, string] | undefined;
  return {
    page: (p.current as number) ?? 1,
    pageSize: (p.pageSize as number) ?? 10,
    name: (p.name as string) || undefined,
    status: (p.status as RunListParams["status"]) || undefined,
    startFrom: range?.[0],
    startTo: range?.[1],
  };
}

export default function FlowRunList() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logLoader, setLogLoader] = useState<(() => Promise<RunLog>) | null>(null);

  const handleKill = useCallback(
    async (id: string) => {
      try {
        await killFlowRun(id);
        message.success(t("runs.killSent"));
        void actionRef.current?.reload();
      } catch {
        message.error(t("runs.killFailed"));
      }
    },
    [t],
  );

  const handleLog = useCallback((id: string) => {
    setLogLoader(() => () => getFlowRunLog(id));
    setLogOpen(true);
  }, []);

  const columns = useMemo<ProColumns<FlowRun>[]>(() => {
    const statusValueEnum = Object.fromEntries(getRunStatusOptions(t).map((o) => [o.value, { text: o.label }]));
    return [
      { title: t("common.name"), dataIndex: "name", ellipsis: true },
      { title: t("common.status"), dataIndex: "status", valueType: "select", valueEnum: statusValueEnum, render: (_, r) => <RunStatusTag status={r.status} /> },
      { title: t("runs.tags"), dataIndex: "tags", search: false, render: (_, r) => r.tags.map((tg) => <Tag key={tg}>{tg}</Tag>) },
      { title: t("runs.startTime"), dataIndex: "startTime", valueType: "dateTime", search: false },
      { title: t("runs.endTime"), dataIndex: "endTime", valueType: "dateTime", search: false, render: (_, r) => (r.endTime ? new Date(r.endTime).toLocaleString() : "-") },
      { title: t("runs.duration"), dataIndex: "duration", search: false, render: (_, r) => formatDuration(r.duration) },
      { title: t("runs.owner"), dataIndex: "owner", search: false },
      { title: t("runs.startTime"), dataIndex: "startRange", valueType: "dateTimeRange", hideInTable: true },
      {
        title: t("common.operation"),
        valueType: "option",
        render: (_, record) => (
          <Space>
            <a onClick={() => handleLog(record.id)}>{t("runs.viewLog")}</a>
            {isRunning(record.status) && (
              <Popconfirm title={t("runs.killConfirmFlow")} onConfirm={() => void handleKill(record.id)} okText={t("common.ok")} cancelText={t("common.cancel")}>
                <a style={{ color: "var(--ant-color-error)" }}>{t("runs.kill")}</a>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ];
  }, [t, handleLog, handleKill]);

  return (
    <div data-testid="flow-run-list">
      <ProTable<FlowRun>
        headerTitle={t("runs.flowTitle")}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        options={{ reload: true, density: false, setting: false }}
        toolBarRender={() => [<Button key="refresh" onClick={() => void actionRef.current?.reload()}>{t("common.refresh")}</Button>]}
        request={async (params) => {
          const result = await getFlowRuns(toParams(params));
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <LogDrawer open={logOpen} title={t("runs.instanceLog")} loader={logLoader} onClose={() => setLogOpen(false)} />
    </div>
  );
}
