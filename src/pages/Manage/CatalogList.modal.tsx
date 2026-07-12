import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";
import CodeEditor from "@/components/CodeEditor";
import { CATALOG_TYPE_OPTIONS } from "./CatalogList.constants";

interface CatalogFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

/**
 * Adapter so CodeEditor works as an Ant Design custom form control. Form.Item
 * injects `value` (possibly undefined) and `onChange`; CodeEditor requires a
 * string `value`, so we coerce here.
 */
function CreateSqlField({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <CodeEditor
      value={value ?? ""}
      onChange={(next) => onChange?.(next)}
      language="sql"
      placeholder={placeholder}
    />
  );
}

export function CatalogFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: CatalogFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("catalog.editTitle") : t("catalog.addTitle")}
      open={open}
      width={720}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="catalog-modal"
    >
      <Form form={form} layout="vertical" data-testid="catalog-form">
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("catalog.namePlaceholder") }]}>
          <Input placeholder={t("catalog.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("catalog.typePlaceholder") }]}>
          <Select placeholder={t("catalog.typePlaceholder")} options={CATALOG_TYPE_OPTIONS} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="createSql" label={t("catalog.ddlLabel")} rules={[{ required: true, message: t("catalog.ddlPlaceholder") }]}>
          <CreateSqlField placeholder={t("catalog.ddlPlaceholder")} />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("catalog.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
