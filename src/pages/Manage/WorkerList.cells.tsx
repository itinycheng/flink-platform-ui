import { Tag } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { Worker } from "@/types/manage";
import { enumColor, statusColor } from "@/utils/statusColor";

const ROLE_LABEL_KEYS: Record<Worker["role"], string> = {
  master: "worker.roleMaster",
  worker: "worker.roleWorker",
  all: "worker.roleAll",
};

const STATUS_LABEL_KEYS: Record<Worker["status"], string> = {
  online: "worker.statusOnline",
  offline: "worker.statusOffline",
};

interface WorkerRoleTagProps {
  role: Worker["role"];
}

export function WorkerRoleTag({ role }: WorkerRoleTagProps) {
  const { t } = useTranslation();
  return <Tag color={enumColor(role)}>{t(ROLE_LABEL_KEYS[role])}</Tag>;
}

interface WorkerStatusTagProps {
  status: Worker["status"];
}

export function WorkerStatusTag({ status }: WorkerStatusTagProps) {
  const { t } = useTranslation();
  return <Tag color={statusColor(status)}>{t(STATUS_LABEL_KEYS[status])}</Tag>;
}

interface WorkerActionsCellProps {
  record: Worker;
  onEdit: (record: Worker) => void;
  onDelete: (id: string) => void;
}

export function WorkerActionsCell({ record, onEdit, onDelete }: WorkerActionsCellProps) {
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
          confirm: t("worker.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}
