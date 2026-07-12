import { Tag } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { Workspace, WorkspaceStatus } from "@/types/workspace";
import { statusColor } from "@/utils/statusColor";
import { getWorkspaceStatusLabels } from "./WorkspaceList.constants";

interface WorkspaceStatusTagProps {
  status: WorkspaceStatus;
}

export function WorkspaceStatusTag({ status }: WorkspaceStatusTagProps) {
  const { t } = useTranslation();
  return <Tag color={statusColor(status)}>{getWorkspaceStatusLabels(t)[status]}</Tag>;
}

interface WorkspaceActionsCellProps {
  record: Workspace;
  onEdit: (record: Workspace) => void;
  onDelete: (id: string) => void;
}

export function WorkspaceActionsCell({ record, onEdit, onDelete }: WorkspaceActionsCellProps) {
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
          confirm: t("workspace.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}
