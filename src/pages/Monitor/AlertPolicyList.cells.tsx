import { Button, Switch } from "antd";
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
  return (
    <Button type="link" onClick={() => onEdit(record)} data-testid={`edit-btn-${record.id}`}>
      编辑
    </Button>
  );
}
