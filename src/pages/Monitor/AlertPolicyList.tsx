import { useRef, useState } from "react";
import { Button, message, Switch } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import type { AlertPolicy } from "@/types/monitor";
import { getAlerts, createAlert, updateAlert } from "@/api/monitor";
import AlertPolicyForm from "./AlertPolicyForm";

/** Notification method display mapping. */
const NOTIFY_METHOD_LABEL: Record<AlertPolicy["notifyMethod"], string> = {
  email: "邮件",
  webhook: "Webhook",
  sms: "短信",
};

/**
 * AlertPolicyList — Alert policy management page.
 *
 * Features:
 * - ProTable displaying alert policies (name, target, condition+threshold, notifyMethod, enabled, actions)
 * - Create / edit policy via AlertPolicyForm modal
 * - Toggle enabled/disabled via Switch
 * - Toolbar with "新增策略" button
 *
 * Requirements: 8.1, 8.2, 8.3
 */
export default function AlertPolicyList() {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AlertPolicy | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  /** Open modal for creating a new policy. */
  const handleAdd = () => {
    setEditingPolicy(null);
    setModalOpen(true);
  };

  /** Open modal for editing an existing policy. */
  const handleEdit = (record: AlertPolicy) => {
    setEditingPolicy(record);
    setModalOpen(true);
  };

  /** Handle form submission (create or update). */
  const handleFormOk = async (values: Omit<AlertPolicy, "id">) => {
    try {
      setConfirmLoading(true);

      if (editingPolicy) {
        await updateAlert(editingPolicy.id, values);
        message.success("策略更新成功");
      } else {
        await createAlert(values);
        message.success("策略创建成功");
      }

      setModalOpen(false);
      actionRef.current?.reload();
    } catch {
      message.error(editingPolicy ? "策略更新失败，请重试" : "策略创建失败，请重试");
    } finally {
      setConfirmLoading(false);
    }
  };

  /** Cancel the modal. */
  const handleFormCancel = () => {
    setModalOpen(false);
    setEditingPolicy(null);
  };

  /** Toggle policy enabled status. */
  const handleToggleEnabled = async (record: AlertPolicy, checked: boolean) => {
    try {
      await updateAlert(record.id, { enabled: checked });
      message.success(checked ? "策略已启用" : "策略已禁用");
      actionRef.current?.reload();
    } catch {
      message.error("操作失败，请重试");
    }
  };

  const columns: ProColumns<AlertPolicy>[] = [
    {
      title: "策略名称",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "监控对象",
      dataIndex: "target",
      key: "target",
      ellipsis: true,
    },
    {
      title: "告警条件",
      key: "condition",
      render: (_, record) => `${record.condition} ${record.threshold}`,
    },
    {
      title: "通知方式",
      dataIndex: "notifyMethod",
      key: "notifyMethod",
      width: 120,
      render: (_, record) => NOTIFY_METHOD_LABEL[record.notifyMethod],
    },
    {
      title: "启用状态",
      dataIndex: "enabled",
      key: "enabled",
      width: 100,
      render: (_, record) => (
        <Switch
          checked={record.enabled}
          onChange={(checked) => handleToggleEnabled(record, checked)}
          data-testid={`toggle-enabled-${record.id}`}
        />
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => handleEdit(record)} data-testid={`edit-btn-${record.id}`}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <>
      <ProTable<AlertPolicy>
        headerTitle="告警策略列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd} data-testid="add-policy-button">
            新增策略
          </Button>,
        ]}
        request={async (params) => {
          const { current, pageSize } = params;
          const result = await getAlerts({
            page: current ?? 1,
            pageSize: pageSize ?? 10,
          });
          return {
            data: result.data,
            total: result.total,
            success: true,
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      <AlertPolicyForm
        open={modalOpen}
        editingPolicy={editingPolicy}
        confirmLoading={confirmLoading}
        onOk={handleFormOk}
        onCancel={handleFormCancel}
      />
    </>
  );
}
