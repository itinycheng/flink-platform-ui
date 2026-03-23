import { useRef, useState } from "react";
import { Button, message, Modal, Form, Input, Tag } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import type { EnvConfig } from "@/types/manage";
import { getEnvConfigs, updateEnvConfig } from "@/api/manage";

/** Color mapping for environment tags. */
const ENV_TAG_COLORS: Record<string, string> = {
  production: "red",
  staging: "orange",
  development: "blue",
};

/**
 * EnvConfigList — Environment configuration management sub-module.
 *
 * Features:
 * - ProTable displaying environment config list (env, key, value, description, actions)
 * - Edit configuration via Modal + Form
 * - Refresh list after edit
 *
 * Requirements: 7.6
 */
export default function EnvConfigList() {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EnvConfig | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  /** Open modal for editing an existing config. */
  const handleEdit = (record: EnvConfig) => {
    setEditingConfig(record);
    form.setFieldsValue({
      value: record.value,
      description: record.description ?? "",
    });
    setModalOpen(true);
  };

  /** Submit the edit form. */
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);

      if (editingConfig) {
        await updateEnvConfig(editingConfig.id, values);
        message.success("配置更新成功");
      }

      setModalOpen(false);
      form.resetFields();
      setEditingConfig(null);
      actionRef.current?.reload();
    } catch (error) {
      // If it's a form validation error, don't show API error message
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }
      message.error("配置更新失败，请重试");
    } finally {
      setConfirmLoading(false);
    }
  };

  /** Cancel the modal. */
  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingConfig(null);
  };

  const columns: ProColumns<EnvConfig>[] = [
    {
      title: "环境",
      dataIndex: "env",
      key: "env",
      width: 120,
      render: (_, record) => (
        <Tag color={ENV_TAG_COLORS[record.env] ?? "default"}>{record.env}</Tag>
      ),
    },
    {
      title: "配置键",
      dataIndex: "key",
      key: "key",
      ellipsis: true,
    },
    {
      title: "配置值",
      dataIndex: "value",
      key: "value",
      ellipsis: true,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
          data-testid={`edit-btn-${record.id}`}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div data-testid="env-config-list">
      <ProTable<EnvConfig>
        headerTitle="环境配置"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        request={async (params) => {
          const { current, pageSize } = params;
          const result = await getEnvConfigs({
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

      <Modal
        title="编辑配置"
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
        destroyOnHidden
        data-testid="env-config-modal"
      >
        <Form form={form} layout="vertical" data-testid="env-config-form">
          {editingConfig && (
            <>
              <Form.Item label="环境">
                <Tag color={ENV_TAG_COLORS[editingConfig.env] ?? "default"}>
                  {editingConfig.env}
                </Tag>
              </Form.Item>
              <Form.Item label="配置键">
                <Input value={editingConfig.key} disabled data-testid="input-key" />
              </Form.Item>
            </>
          )}
          <Form.Item
            name="value"
            label="配置值"
            rules={[{ required: true, message: "请输入配置值" }]}
          >
            <Input placeholder="请输入配置值" data-testid="input-value" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea
              placeholder="请输入描述（可选）"
              rows={3}
              data-testid="input-description"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
