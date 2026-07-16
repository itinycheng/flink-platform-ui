import { useRef, useState, useCallback, useMemo } from "react";
import { Button, Popconfirm, Space, Tag, message } from "antd";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import type { Run, RunListParams, RunType } from "@/types/run";
import { getRuns, killRun } from "@/api/run";
import { getRunStatusOptions, formatDuration, isRunning } from "./runStatus";
import { RunStatusTag } from "./RunStatusTag";
import RunDetailDrawer from "./RunDetailDrawer";

const RUN_TYPES: RunType[] = ["flow", "spark", "flink", "shell", "sql"];

function toParams(p: Record<string, unknown>): RunListParams {
  const range = p.startRange as [string, string] | undefined;
  return {
    page: (p.current as number) ?? 1,
    pageSize: (p.pageSize as number) ?? 10,
    name: (p.name as string) || undefined,
    type: (p.type as RunType) || undefined,
    status: (p.status as RunListParams["status"]) || undefined,
    startFrom: range?.[0],
    startTo: range?.[1],
  };
}

export default function RunList() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const actionRef = useRef<ActionType>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = useCallback((id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  }, []);

  const onKill = useCallback(
    async (id: string) => {
      try {
        await killRun(id);
        message.success(t("runs.killSent"));
        void actionRef.current?.reload();
      } catch {
        message.error(t("runs.killFailed"));
      }
    },
    [t],
  );

  const columns = useMemo<ProColumns<Run>[]>(() => {
    const statusEnum = Object.fromEntries(getRunStatusOptions(t).map((o) => [o.value, { text: o.label }]));
    const typeEnum = Object.fromEntries(RUN_TYPES.map((v) => [v, { text: t(`runs.type_${v}`) }]));
    return [
      { title: t("common.name"), dataIndex: "name", ellipsis: true },
      {
        title: t("runs.type"),
        dataIndex: "type",
        width: 110,
        valueType: "select",
        valueEnum: typeEnum,
        render: (_, r) => <Tag color={r.type === "flow" ? "purple" : "default"}>{t(`runs.type_${r.type}`)}</Tag>,
      },
      { title: t("common.status"), dataIndex: "status", width: 110, valueType: "select", valueEnum: statusEnum, render: (_, r) => <RunStatusTag status={r.status} /> },
      { title: t("runs.startTime"), dataIndex: "startTime", valueType: "dateTime", search: false, width: 170 },
      { title: t("runs.duration"), dataIndex: "duration", search: false, width: 100, render: (_, r) => formatDuration(r.duration) },
      { title: t("runs.owner"), dataIndex: "owner", search: false, width: 140 },
      { title: t("runs.startTime"), dataIndex: "startRange", valueType: "dateTimeRange", hideInTable: true },
      {
        title: t("common.operation"),
        valueType: "option",
        width: 130,
        render: (_, record) => (
          <Space>
            <a onClick={() => openDetail(record.id)}>{t("runs.detail")}</a>
            {isRunning(record.status) && (
              <Popconfirm title={t("runs.killConfirm")} onConfirm={() => void onKill(record.id)} okText={t("common.ok")} cancelText={t("common.cancel")}>
                <a style={{ color: "var(--ant-color-error)" }}>{t("runs.kill")}</a>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ];
  }, [t, openDetail, onKill]);

  return (
    <div data-testid="run-list">
      <ProTable<Run>
        headerTitle={t("runs.title")}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        options={{ reload: true, density: false, setting: false }}
        form={{ initialValues: { status: searchParams.get("status") ?? undefined, type: searchParams.get("type") ?? undefined } }}
        toolBarRender={() => [<Button key="refresh" onClick={() => void actionRef.current?.reload()}>{t("common.refresh")}</Button>]}
        request={async (params) => {
          const result = await getRuns(toParams(params));
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <RunDetailDrawer runId={detailId} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
