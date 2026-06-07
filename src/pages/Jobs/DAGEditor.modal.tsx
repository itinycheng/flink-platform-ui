import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";

interface NodeEditModalProps {
  open: boolean;
  form: FormInstance;
  onSave: () => void;
  onCancel: () => void;
}

export function NodeEditModal({ open, form, onSave, onCancel }: NodeEditModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dag.editTaskNode")}
      open={open}
      onOk={onSave}
      onCancel={onCancel}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t("dag.taskName")}
          name="label"
          rules={[{ required: true, message: t("dag.taskNameRequired") }]}
        >
          <Input placeholder={t("dag.taskNamePlaceholder")} />
        </Form.Item>
        <Form.Item label={t("dag.taskDescription")} name="description">
          <Input.TextArea rows={3} placeholder={t("dag.taskDescPlaceholder")} />
        </Form.Item>
        <Form.Item label={t("dag.priority")} name="priority">
          <Select
            options={[
              { value: "low", label: t("dag.priorityLow") },
              { value: "medium", label: t("dag.priorityMedium") },
              { value: "high", label: t("dag.priorityHigh") },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
