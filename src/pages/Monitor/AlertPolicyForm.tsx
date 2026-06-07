import { useEffect } from "react";
import { Modal, Form } from "antd";
import type { AlertPolicy } from "@/types/monitor";
import { AlertPolicyFormFields } from "./AlertPolicyForm.fields";

export interface AlertPolicyFormProps {
  open: boolean;
  editingPolicy: AlertPolicy | null;
  confirmLoading: boolean;
  onOk: (values: Omit<AlertPolicy, "id">) => void;
  onCancel: () => void;
}

export default function AlertPolicyForm({ open, editingPolicy, confirmLoading, onOk, onCancel }: AlertPolicyFormProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
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
  }, [open, editingPolicy, form]);

  const handleOk = async () => {
    try {
      onOk(await form.validateFields());
    } catch {
      // Field-level errors are rendered inline by the form.
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
      <Form form={form} layout="vertical" initialValues={{ enabled: true }} data-testid="alert-policy-form">
        <AlertPolicyFormFields />
      </Form>
    </Modal>
  );
}
