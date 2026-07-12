import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";
import { getTagStatusOptions, getTagTypeOptions } from "./TagList.constants";

interface TagFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function TagFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: TagFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("tag.editTitle") : t("tag.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="tag-modal"
    >
      <Form form={form} layout="vertical" data-testid="tag-form">
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("tag.namePlaceholder") }]}>
          <Input placeholder={t("tag.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("tag.typePlaceholder") }]}>
          <Select placeholder={t("tag.typePlaceholder")} options={getTagTypeOptions(t)} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="status" label={t("common.status")} rules={[{ required: true, message: t("tag.statusPlaceholder") }]}>
          <Select placeholder={t("tag.statusPlaceholder")} options={getTagStatusOptions(t)} data-testid="select-status" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
