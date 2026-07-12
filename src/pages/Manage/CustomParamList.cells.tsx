import { Tag } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { CustomParam } from "@/types/manage";
import { enumColor } from "@/utils/statusColor";

interface ParamTypeTagProps {
  type: CustomParam["type"];
}

export function ParamTypeTag({ type }: ParamTypeTagProps) {
  return <Tag color={enumColor(type)}>{type}</Tag>;
}

interface ParamActionsCellProps {
  record: CustomParam;
  onEdit: (record: CustomParam) => void;
  onDelete: (id: string) => void;
}

export function ParamActionsCell({ record, onEdit, onDelete }: ParamActionsCellProps) {
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
          confirm: t("param.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}
