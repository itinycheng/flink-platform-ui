import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";
import { DATASOURCE_TYPE_OPTIONS } from "./DataSourceList.constants";

interface DataSourceFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function DataSourceFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: DataSourceFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("datasource.editTitle") : t("datasource.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="datasource-modal"
    >
      <Form form={form} layout="vertical" data-testid="datasource-form">
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("datasource.namePlaceholder") }]}>
          <Input placeholder={t("datasource.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("datasource.typePlaceholder") }]}>
          <Select placeholder={t("datasource.typePlaceholder")} options={DATASOURCE_TYPE_OPTIONS} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="params" label={t("datasource.paramsLabel")} rules={[{ required: true, message: t("datasource.paramsPlaceholder") }]}>
          <Input.TextArea placeholder={t("datasource.paramsPlaceholder")} rows={6} data-testid="input-params" />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("datasource.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
