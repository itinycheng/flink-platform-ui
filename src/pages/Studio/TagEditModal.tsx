import { useEffect, useState } from "react";
import { Modal, Select } from "antd";
import { useTranslation } from "react-i18next";
import { getTags } from "@/api/manage";

interface TagEditModalProps {
  open: boolean;
  value: string[];
  confirmLoading: boolean;
  onOk: (tags: string[]) => void;
  onCancel: () => void;
}

export function TagEditModal({ open, value, confirmLoading, onOk, onCancel }: TagEditModalProps) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [selected, setSelected] = useState<string[]>(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const result = await getTags({ page: 1, pageSize: 200 });
      setOptions(result.data.map((tag) => ({ label: tag.name, value: tag.name })));
    })();
  }, [open]);

  return (
    <Modal
      title={t("definitions.tagModalTitle")}
      open={open}
      onOk={() => onOk(selected)}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="definition-tag-modal"
    >
      <Select
        mode="multiple"
        allowClear
        style={{ width: "100%" }}
        placeholder={t("definitions.selectTags")}
        options={options}
        value={selected}
        onChange={setSelected}
        data-testid="select-tags"
      />
    </Modal>
  );
}
