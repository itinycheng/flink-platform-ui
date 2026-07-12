import { Tag } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { Catalog } from "@/types/manage";
import { enumColor } from "@/utils/statusColor";

interface CatalogTypeTagProps {
  type: Catalog["type"];
}

export function CatalogTypeTag({ type }: CatalogTypeTagProps) {
  return <Tag color={enumColor(type)}>{type}</Tag>;
}

interface CatalogActionsCellProps {
  record: Catalog;
  onEdit: (record: Catalog) => void;
  onDelete: (id: string) => void;
}

export function CatalogActionsCell({ record, onEdit, onDelete }: CatalogActionsCellProps) {
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
          confirm: t("catalog.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}
