import { Button, Switch } from "antd";
import { useTranslation } from "react-i18next";
import type { AlertPolicy } from "@/types/monitor";

interface AlertEnabledSwitchProps {
  record: AlertPolicy;
  onToggle: (record: AlertPolicy, checked: boolean) => void;
}

export function AlertEnabledSwitch({ record, onToggle }: AlertEnabledSwitchProps) {
  return (
    <Switch
      checked={record.enabled}
      onChange={(checked) => onToggle(record, checked)}
      data-testid={`toggle-enabled-${record.id}`}
    />
  );
}

interface AlertEditButtonProps {
  record: AlertPolicy;
  onEdit: (record: AlertPolicy) => void;
}

export function AlertEditButton({ record, onEdit }: AlertEditButtonProps) {
  const { t } = useTranslation();
  return (
    <Button type="link" onClick={() => onEdit(record)} data-testid={`edit-btn-${record.id}`}>
      {t("common.edit")}
    </Button>
  );
}
