import { Tag } from "antd";
import { ClearOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { SysConfig } from "@/types/manage";
import { enumColor, statusColor } from "@/utils/statusColor";
import { STATUS_LABEL_KEYS, TYPE_LABEL_KEYS } from "./SysConfigList.constants";

interface SysConfigTypeTagProps {
  type: SysConfig["type"];
}

export function SysConfigTypeTag({ type }: SysConfigTypeTagProps) {
  const { t } = useTranslation();
  return <Tag color={enumColor(type)}>{t(TYPE_LABEL_KEYS[type])}</Tag>;
}

interface SysConfigStatusTagProps {
  status: SysConfig["status"];
}

export function SysConfigStatusTag({ status }: SysConfigStatusTagProps) {
  const { t } = useTranslation();
  return <Tag color={statusColor(status)}>{t(STATUS_LABEL_KEYS[status])}</Tag>;
}

interface SysConfigActionsCellProps {
  record: SysConfig;
  onEdit: (record: SysConfig) => void;
  onDelete: (id: string) => void;
  onPurge: (id: string) => void;
}

export function SysConfigActionsCell({ record, onEdit, onDelete, onPurge }: SysConfigActionsCellProps) {
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
          confirm: t("sysConfig.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
        {
          key: "purge",
          tooltip: t("sysConfig.purge"),
          icon: <ClearOutlined />,
          danger: true,
          confirm: t("sysConfig.purgeConfirmDesc", { name: record.name }),
          onClick: () => onPurge(record.id),
          hidden: record.status !== "deleted",
        },
      ]}
    />
  );
}
