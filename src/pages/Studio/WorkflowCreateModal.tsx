import { useEffect } from "react";
import { Form, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  confirmLoading: boolean;
  onOk: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function WorkflowCreateModal({ open, confirmLoading, onOk, onCancel }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<{ name: string }>();

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleOk = async () => {
    const { name } = await form.validateFields();
    await onOk(name.trim());
  };

  return (
    <Modal
      title={t("workflow.addWorkflow")}
      open={open}
      confirmLoading={confirmLoading}
      onOk={() => void handleOk()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="name"
          label={t("workflowForm.workflowName")}
          rules={[{ required: true, whitespace: true, message: t("workflowForm.workflowNameRequired") }]}
        >
          <Input
            autoFocus
            maxLength={64}
            placeholder={t("workflowForm.workflowNamePlaceholder")}
            onPressEnter={() => void handleOk()}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
