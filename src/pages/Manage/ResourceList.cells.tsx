import { DeleteOutlined, FileOutlined, FolderFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { ResourceFile } from "@/types/manage";

interface ResourceNameCellProps {
  record: ResourceFile;
  /** Open a folder (navigates into it). Not called for files. */
  onOpen: (id: string) => void;
}

/** Folder names are clickable (navigate in); file names are plain. */
export function ResourceNameCell({ record, onOpen }: ResourceNameCellProps) {
  if (record.isDir) {
    return (
      <a onClick={() => onOpen(record.id)}>
        <FolderFilled style={{ marginRight: 8, color: "#e8b339" }} />
        {record.name}
      </a>
    );
  }
  return (
    <span>
      <FileOutlined style={{ marginRight: 8, color: "var(--ant-color-text-tertiary)" }} />
      {record.name}
    </span>
  );
}

interface ResourceActionsCellProps {
  record: ResourceFile;
  onDelete: (id: string) => void;
}

export function ResourceActionsCell({ record, onDelete }: ResourceActionsCellProps) {
  const { t } = useTranslation();
  const confirm = record.isDir
    ? t("resource.deleteFolderConfirm", { name: record.name })
    : t("resource.deleteConfirmDesc", { name: record.name });
  return (
    <RowActions
      actions={[
        {
          key: "delete",
          tooltip: t("common.delete"),
          icon: <DeleteOutlined />,
          danger: true,
          confirm,
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}
