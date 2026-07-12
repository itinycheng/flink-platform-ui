import { Tag } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { Tag as TagModel } from "@/types/manage";
import { statusColor } from "@/utils/statusColor";
import { STATUS_LABEL_KEYS, TYPE_LABEL_KEYS } from "./TagList.constants";

interface TagTypeTagProps {
  type: TagModel["type"];
}

export function TagTypeTag({ type }: TagTypeTagProps) {
  const { t } = useTranslation();
  const key = TYPE_LABEL_KEYS[type];
  return <Tag>{key ? t(key) : type}</Tag>;
}

interface TagStatusTagProps {
  status: TagModel["status"];
}

export function TagStatusTag({ status }: TagStatusTagProps) {
  const { t } = useTranslation();
  const key = STATUS_LABEL_KEYS[status];
  return <Tag color={statusColor(status)}>{key ? t(key) : status}</Tag>;
}

interface TagActionsCellProps {
  record: TagModel;
  onEdit: (record: TagModel) => void;
  onDelete: (id: string) => void;
}

export function TagActionsCell({ record, onEdit, onDelete }: TagActionsCellProps) {
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
          confirm: t("tag.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}
