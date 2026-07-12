import { DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { ResourceFile } from "@/types/manage";

interface ResourceDeleteCellProps {
  record: ResourceFile;
  onDelete: (id: string) => void;
}

export function ResourceDeleteCell({ record, onDelete }: ResourceDeleteCellProps) {
  const { t } = useTranslation();
  return (
    <RowActions
      actions={[
        {
          key: "delete",
          tooltip: t("common.delete"),
          icon: <DeleteOutlined />,
          danger: true,
          confirm: t("resource.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}
