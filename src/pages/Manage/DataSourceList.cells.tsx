import { Tag } from "antd";
import { ApiOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { DataSource, DataSourceType } from "@/types/manage";
import { enumColor } from "@/utils/statusColor";

interface DataSourceTypeTagProps {
  type: DataSourceType;
}

export function DataSourceTypeTag({ type }: DataSourceTypeTagProps) {
  return <Tag color={enumColor(type)}>{type}</Tag>;
}

interface DataSourceActionsCellProps {
  record: DataSource;
  onEdit: (record: DataSource) => void;
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DataSourceActionsCell({ record, onEdit, onTest, onDelete }: DataSourceActionsCellProps) {
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
          key: "test",
          tooltip: t("datasource.test"),
          icon: <ApiOutlined />,
          onClick: () => onTest(record.id),
        },
        {
          key: "delete",
          tooltip: t("common.delete"),
          icon: <DeleteOutlined />,
          danger: true,
          confirm: t("datasource.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}
