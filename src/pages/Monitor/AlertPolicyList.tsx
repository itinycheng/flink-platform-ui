import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import type { AlertPolicy } from "@/types/monitor";
import { getAlerts } from "@/api/monitor";
import AlertPolicyForm from "./AlertPolicyForm";
import { NOTIFY_METHOD_LABEL } from "./AlertPolicyList.constants";
import { AlertEditButton, AlertEnabledSwitch } from "./AlertPolicyList.cells";
import { useAlertPolicyCrud } from "./AlertPolicyList.hooks";

export default function AlertPolicyList() {
  const crud = useAlertPolicyCrud();

  const columns = useMemo<ProColumns<AlertPolicy>[]>(
    () => [
      { title: "策略名称", dataIndex: "name", key: "name", ellipsis: true },
      { title: "监控对象", dataIndex: "target", key: "target", ellipsis: true },
      { title: "告警条件", key: "condition", render: (_, r) => `${r.condition} ${r.threshold}` },
      {
        title: "通知方式",
        dataIndex: "notifyMethod",
        key: "notifyMethod",
        width: 120,
        render: (_, r) => NOTIFY_METHOD_LABEL[r.notifyMethod],
      },
      {
        title: "启用状态",
        dataIndex: "enabled",
        key: "enabled",
        width: 100,
        render: (_, r) => <AlertEnabledSwitch record={r} onToggle={crud.handleToggleEnabled} />,
      },
      {
        title: "操作",
        key: "action",
        width: 100,
        render: (_, r) => <AlertEditButton record={r} onEdit={crud.handleEdit} />,
      },
    ],
    [crud.handleToggleEnabled, crud.handleEdit],
  );

  return (
    <>
      <ProTable<AlertPolicy>
        headerTitle="告警策略列表"
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
            新增策略
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
