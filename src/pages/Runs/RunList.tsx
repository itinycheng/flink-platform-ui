import { useRef, useState, useCallback, useMemo } from "react";
import { Button, Popconfirm, Space, Tag, message } from "antd";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useSearchParams } from "react-router-dom";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import type { FlowRun, FlowRunListParams } from "@/types/run";
import { getFlowRuns, killFlowRun } from "@/api/run";
import { JOB_TYPES, JOB_FLOW_TYPES, type JobType, type JobFlowType } from "@/constants/enums";
import { getExecStatusOptions, formatDuration, execIsRunning } from "./runStatus";
import { RunStatusTag } from "./RunStatusTag";
import RunDetailDrawer from "./RunDetailDrawer";

type RunType = JobType | JobFlowType;

function toParams(p: Record<string, unknown>): FlowRunListParams {
  const range = p.startRange as [string, string] | undefined;
  return {
    page: (p.current as number) ?? 1,
    pageSize: (p.pageSize as number) ?? 10,
    name: (p.name as string) || undefined,
    type: (p.type as RunType) || undefined,
    status: (p.status as FlowRunListParams["status"]) || undefined,
    startFrom: range?.[0],
    startTo: range?.[1],
  };
}

const isFlowType = (type: RunType) => JOB_FLOW_TYPES.includes(type as never);
const typeLabel = (type: RunType, t: (key: string) => string) =>
  t(`enums.${isFlowType(type) ? "JobFlowType" : "JobType"}.${type}`);

const buildStatusEnum = (t: TFunction) =>
  Object.fromEntries(getExecStatusOptions(t).map((o) => [o.value, { text: o.label }]));

const buildTypeEnum = (t: TFunction) =>
  Object.fromEntries([
    ...JOB_TYPES.map((v) => [v, { text: t(`enums.JobType.${v}`) }]),
    ...JOB_FLOW_TYPES.map((v) => [v, { text: t(`enums.JobFlowType.${v}`) }]),
  ]);

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
        await killFlowRun(id);
        message.success(t("runs.killSent"));
        void actionRef.current?.reload();
      } catch {
        message.error(t("runs.killFailed"));
      }
    },
    [t],
  );

  const columns = useMemo<ProColumns<FlowRun>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", ellipsis: true },
      {
        title: t("runs.type"),
        dataIndex: "type",
        width: 110,
        valueType: "select",
        valueEnum: buildTypeEnum(t),
        render: (_, r) => <Tag color={isFlowType(r.type) ? "purple" : "default"}>{typeLabel(r.type, t)}</Tag>,
      },
      { title: t("common.status"), dataIndex: "status", width: 110, valueType: "select", valueEnum: buildStatusEnum(t), render: (_, r) => <RunStatusTag status={r.status} /> },
      { title: t("runs.startTime"), dataIndex: "startTime", valueType: "dateTime", search: false, width: 170 },
      { title: t("runs.duration"), dataIndex: "duration", search: false, width: 100, render: (_, r) => formatDuration(r.duration) },
      { title: t("runs.owner"), dataIndex: "submitter", search: false, width: 140 },
      { title: t("runs.startTime"), dataIndex: "startRange", valueType: "dateTimeRange", hideInTable: true },
      {
        title: t("common.operation"),
        valueType: "option",
        width: 130,
        render: (_, record) => (
          <Space>
            <a onClick={() => openDetail(record.id)}>{t("runs.detail")}</a>
            {execIsRunning(record.status) && (
              <Popconfirm title={t("runs.killConfirm")} onConfirm={() => void onKill(record.id)} okText={t("common.ok")} cancelText={t("common.cancel")}>
                <a style={{ color: "var(--ant-color-error)" }}>{t("runs.kill")}</a>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [t, openDetail, onKill],
  );

  return (
    <div data-testid="run-list">
      <ProTable<FlowRun>
        headerTitle={t("runs.title")}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        options={{ reload: true, density: false, setting: false }}
        form={{ initialValues: { status: searchParams.get("status") ?? undefined, type: searchParams.get("type") ?? undefined } }}
        toolBarRender={() => [<Button key="refresh" onClick={() => void actionRef.current?.reload()}>{t("common.refresh")}</Button>]}
        request={async (params) => {
          const result = await getFlowRuns(toParams(params));
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <RunDetailDrawer runId={detailId} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
