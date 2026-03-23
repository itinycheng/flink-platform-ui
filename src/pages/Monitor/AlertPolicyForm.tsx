import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, Switch } from "antd";
import type { AlertPolicy } from "@/types/monitor";

/** Notification method options. */
const NOTIFY_METHOD_OPTIONS = [
  { label: "邮件", value: "email" },
  { label: "Webhook", value: "webhook" },
  { label: "短信", value: "sms" },
];

export interface AlertPolicyFormProps {
  open: boolean;
  editingPolicy: AlertPolicy | null;
  confirmLoading: boolean;
  onOk: (values: Omit<AlertPolicy, "id">) => void;
  onCancel: () => void;
}

/**
 * AlertPolicyForm — Modal form for creating / editing an alert policy.
 *
 * Fields:
 * - name (策略名称, required)
 * - target (监控对象, required)
 * - condition (告警条件, required)
 * - threshold (告警阈值, required, number)
 * - notifyMethod (通知方式, required, Select: email/webhook/sms)
 * - enabled (启用状态, Switch, default true)
 *
 * Requirements: 8.2, 8.3
 */
export default function AlertPolicyForm({
  open,
  editingPolicy,
  confirmLoading,
  onOk,
  onCancel,
}: AlertPolicyFormProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (editingPolicy) {
        form.setFieldsValue({
          name: editingPolicy.name,
          target: editingPolicy.target,
          condition: editingPolicy.condition,
          threshold: editingPolicy.threshold,
          notifyMethod: editingPolicy.notifyMethod,
          enabled: editingPolicy.enabled,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingPolicy, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch {
      // Validation errors are displayed by the form itself
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={editingPolicy ? "编辑策略" : "新增策略"}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="alert-policy-modal"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ enabled: true }}
        data-testid="alert-policy-form"
      >
        <Form.Item
          name="name"
          label="策略名称"
          rules={[{ required: true, message: "请输入策略名称" }]}
        >
          <Input placeholder="请输入策略名称" data-testid="input-name" />
        </Form.Item>
        <Form.Item
          name="target"
          label="监控对象"
          rules={[{ required: true, message: "请输入监控对象" }]}
        >
          <Input placeholder="请输入监控对象" data-testid="input-target" />
        </Form.Item>
        <Form.Item
          name="condition"
          label="告警条件"
          rules={[{ required: true, message: "请输入告警条件" }]}
        >
          <Input placeholder="请输入告警条件" data-testid="input-condition" />
        </Form.Item>
        <Form.Item
          name="threshold"
          label="告警阈值"
          rules={[{ required: true, message: "请输入告警阈值" }]}
        >
          <InputNumber
            data-testid="input-threshold"
            placeholder="请输入告警阈值"
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          name="notifyMethod"
          label="通知方式"
          rules={[{ required: true, message: "请选择通知方式" }]}
        >
          <Select
            placeholder="请选择通知方式"
            options={NOTIFY_METHOD_OPTIONS}
            data-testid="select-notify-method"
          />
        </Form.Item>
        <Form.Item name="enabled" label="启用状态" valuePropName="checked">
          <Switch data-testid="switch-enabled" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
