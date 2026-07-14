import { useEffect, useState } from "react";
import { Modal, Select } from "antd";
import { useTranslation } from "react-i18next";
import { getAllAlertRules } from "@/api/alert";

interface AlertBindModalProps {
  open: boolean;
  value: string[];
  confirmLoading: boolean;
  onOk: (alertRuleIds: string[]) => void;
  onCancel: () => void;
}

export function AlertBindModal({ open, value, confirmLoading, onOk, onCancel }: AlertBindModalProps) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [selected, setSelected] = useState<string[]>(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const rules = await getAllAlertRules();
      setOptions(rules.map((r) => ({ label: `${r.name}(${r.type})`, value: r.id })));
    })();
  }, [open]);

  return (
    <Modal
      title={t("definitions.alertModalTitle")}
      open={open}
      onOk={() => onOk(selected)}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="definition-alert-modal"
    >
      <Select
        mode="multiple"
        allowClear
        style={{ width: "100%" }}
        placeholder={t("definitions.selectAlerts")}
        options={options}
        value={selected}
        onChange={setSelected}
        data-testid="select-alert-rules"
      />
    </Modal>
  );
}
