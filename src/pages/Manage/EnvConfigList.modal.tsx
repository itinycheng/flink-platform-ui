import { Modal, Form, Input, type FormInstance } from "antd";
import type { EnvConfig } from "@/types/manage";
import { EnvTag } from "./EnvConfigList.cells";

interface EnvConfigEditModalProps {
  open: boolean;
  editingConfig: EnvConfig | null;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function EnvConfigEditModal({
  open,
  editingConfig,
  form,
  confirmLoading,
  onOk,
  onCancel,
}: EnvConfigEditModalProps) {
  return (
    <Modal
      title="编辑配置"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="env-config-modal"
    >
      <Form form={form} layout="vertical" data-testid="env-config-form">
        {editingConfig && (
          <>
            <Form.Item label="环境">
              <EnvTag env={editingConfig.env} />
            </Form.Item>
            <Form.Item label="配置键">
              <Input value={editingConfig.key} disabled data-testid="input-key" />
            </Form.Item>
          </>
        )}
        <Form.Item name="value" label="配置值" rules={[{ required: true, message: "请输入配置值" }]}>
          <Input placeholder="请输入配置值" data-testid="input-value" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea placeholder="请输入描述（可选）" rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
