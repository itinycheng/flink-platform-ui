import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { AlertPolicy } from "@/types/monitor";
import { getAlerts } from "@/api/monitor";
import AlertPolicyForm from "./AlertPolicyForm";
import { getNotifyMethodLabels } from "./AlertPolicyList.constants";
import { AlertEditButton, AlertEnabledSwitch } from "./AlertPolicyList.cells";
import { useAlertPolicyCrud } from "./AlertPolicyList.hooks";

export default function AlertPolicyList() {
  const { t } = useTranslation();
  const crud = useAlertPolicyCrud();

  const columns = useMemo<ProColumns<AlertPolicy>[]>(() => {
    const notifyLabels = getNotifyMethodLabels(t);
    return [
      { title: t("monitor.policyName"), dataIndex: "name", key: "name", ellipsis: true },
      { title: t("monitor.target"), dataIndex: "target", key: "target", ellipsis: true },
      { title: t("monitor.condition"), key: "condition", render: (_, r) => `${r.condition} ${r.threshold}` },
      {
        title: t("monitor.notifyMethod"),
        dataIndex: "notifyMethod",
        key: "notifyMethod",
        width: 120,
        render: (_, r) => notifyLabels[r.notifyMethod],
      },
      {
        title: t("monitor.enabledStatus"),
        dataIndex: "enabled",
        key: "enabled",
        width: 100,
        render: (_, r) => <AlertEnabledSwitch record={r} onToggle={crud.handleToggleEnabled} />,
      },
      {
        title: t("common.operation"),
        key: "action",
        width: 100,
        render: (_, r) => <AlertEditButton record={r} onEdit={crud.handleEdit} />,
      },
    ];
  }, [t, crud.handleToggleEnabled, crud.handleEdit]);

  return (
    <>
      <ProTable<AlertPolicy>
        headerTitle={t("monitor.policyListTitle")}
        actionRef={crud.actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={crud.handleAdd}
            data-testid="add-policy-button"
          >
            {t("monitor.addPolicy")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getAlerts({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <AlertPolicyForm
        open={crud.modalOpen}
        editingPolicy={crud.editingPolicy}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleFormOk}
        onCancel={crud.handleFormCancel}
      />
    </>
  );
}
