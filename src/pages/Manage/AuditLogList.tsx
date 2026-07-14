import { useMemo, useState } from "react";
import { Button } from "antd";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { AuditLog } from "@/types/manage";
import { getAuditLogs } from "@/api/manage";
import { AuditActionTag, AuditResultTag } from "./AuditLogList.cells";
import { AuditDetailDrawer } from "./AuditLogList.drawer";

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "RUN", "ONLINE", "OFFLINE"];
const MODULES = ["user", "resource", "workflow", "task", "datasource", "config", "tag"];

const toValueEnum = (values: string[]) => Object.fromEntries(values.map((v) => [v, { text: v }]));

function useAuditColumns(t: ReturnType<typeof useTranslation>["t"], setDetail: (record: AuditLog) => void) {
  return useMemo<ProColumns<AuditLog>[]>(
    () => [
      {
        title: t("audit.time"),
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        valueType: "dateTimeRange",
        sorter: true,
        render: (_, r) => new Date(r.createdAt).toLocaleString(),
        search: {
          transform: (value: [string, string]) => ({ startTime: value?.[0], endTime: value?.[1] }),
        },
      },
      { title: t("audit.operator"), dataIndex: "operator", key: "operator", width: 140, ellipsis: true },
      {
        title: t("audit.action"),
        dataIndex: "action",
        key: "action",
        width: 120,
        valueType: "select",
        valueEnum: toValueEnum(ACTIONS),
        render: (_, r) => <AuditActionTag action={r.action} />,
      },
      {
        title: t("audit.module"),
        dataIndex: "module",
        key: "module",
        width: 120,
        valueType: "select",
        valueEnum: toValueEnum(MODULES),
      },
      { title: t("audit.target"), dataIndex: "target", key: "target", width: 140, ellipsis: true, hideInSearch: true },
      {
        title: t("audit.result"),
        dataIndex: "result",
        key: "result",
        width: 110,
        valueType: "select",
        valueEnum: { success: { text: t("audit.resultSuccess") }, failed: { text: t("audit.resultFailed") } },
        render: (_, r) => <AuditResultTag result={r.result} />,
      },
      { title: t("audit.ip"), dataIndex: "ip", key: "ip", width: 130, hideInSearch: true },
      {
        title: t("audit.detail"),
        key: "action-view",
        width: 90,
        hideInSearch: true,
        render: (_, record) => (
          <Button type="link" size="small" onClick={() => setDetail(record)}>
            {t("audit.view")}
          </Button>
        ),
      },
    ],
    [t, setDetail],
  );
}

export default function AuditLogList() {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<AuditLog | null>(null);
  const columns = useAuditColumns(t, setDetail);

  return (
    <div data-testid="audit-log-list">
      <ProTable<AuditLog>
        headerTitle={t("audit.title")}
        rowKey="id"
        columns={columns}
        options={false}
        request={async (params) => {
          const result = await getAuditLogs({
            page: params.current ?? 1,
            pageSize: params.pageSize ?? 10,
            operator: params.operator,
            action: params.action,
            module: params.module,
            result: params.result,
            startTime: params.startTime,
            endTime: params.endTime,
          });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <AuditDetailDrawer record={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
