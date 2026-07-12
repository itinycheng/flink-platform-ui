import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";
import { getAlertChannelOptions } from "./AlertRuleList.constants";

interface AlertRuleFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function AlertRuleFormModal({
  open,
  isEdit,
  form,
  confirmLoading,
  onOk,
  onCancel,
}: AlertRuleFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("alertRule.editTitle") : t("alertRule.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="alert-rule-modal"
    >
      <Form form={form} layout="vertical" data-testid="alert-rule-form">
        <Form.Item name="name" label={t("alertRule.nameLabel")} rules={[{ required: true, message: t("alertRule.namePlaceholder") }]}>
          <Input placeholder={t("alertRule.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("alertRule.typePlaceholder") }]}>
          <Select placeholder={t("alertRule.typePlaceholder")} options={getAlertChannelOptions(t)} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="config" label={t("alertRule.configLabel")}>
          <Input.TextArea placeholder={t("alertRule.configPlaceholder")} rows={6} data-testid="input-config" />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("alertRule.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
