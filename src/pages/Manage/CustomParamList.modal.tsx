import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";
import { getParamTypeOptions } from "./CustomParamList.constants";

interface ParamFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function ParamFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: ParamFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("param.editTitle") : t("param.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="custom-param-modal"
    >
      <Form form={form} layout="vertical" data-testid="custom-param-form">
        <Form.Item name="name" label={t("param.nameLabel")} rules={[{ required: true, message: t("param.namePlaceholder") }]}>
          <Input placeholder={t("param.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="value" label={t("param.valueLabel")} rules={[{ required: true, message: t("param.valuePlaceholder") }]}>
          <Input placeholder={t("param.valuePlaceholder")} data-testid="input-value" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("param.typePlaceholder") }]}>
          <Select placeholder={t("param.typePlaceholder")} options={getParamTypeOptions(t)} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("param.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
