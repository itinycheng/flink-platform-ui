import { Tag } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { AlertChannelType, AlertRule } from "@/types/alert";
import { enumColor } from "@/utils/statusColor";
import { getAlertChannelOptions } from "./AlertRuleList.constants";

interface AlertChannelTagProps {
  type: AlertChannelType;
}

export function AlertChannelTag({ type }: AlertChannelTagProps) {
  const { t } = useTranslation();
  const labels = Object.fromEntries(getAlertChannelOptions(t).map((o) => [o.value, o.label]));
  return <Tag color={enumColor(type)}>{labels[type] ?? type}</Tag>;
}

interface AlertRuleActionsCellProps {
  record: AlertRule;
  onEdit: (record: AlertRule) => void;
  onDelete: (id: string) => void;
}

export function AlertRuleActionsCell({ record, onEdit, onDelete }: AlertRuleActionsCellProps) {
  const { t } = useTranslation();
  return (
    <RowActions
      actions={[
        {
          key: "edit",
          tooltip: t("common.edit"),
          icon: <EditOutlined />,
          onClick: () => onEdit(record),
        },
        {
          key: "delete",
          tooltip: t("common.delete"),
          icon: <DeleteOutlined />,
          danger: true,
          confirm: t("alertRule.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}
