import { Button, Tag } from "antd";
import { EditOutlined } from "@ant-design/icons";
import type { EnvConfig } from "@/types/manage";
import { ENV_TAG_COLORS } from "./EnvConfigList.constants";

interface EnvTagProps {
  env: string;
}

export function EnvTag({ env }: EnvTagProps) {
  return <Tag color={ENV_TAG_COLORS[env] ?? "default"}>{env}</Tag>;
}

interface EnvConfigEditButtonProps {
  record: EnvConfig;
  onEdit: (record: EnvConfig) => void;
}

export function EnvConfigEditButton({ record, onEdit }: EnvConfigEditButtonProps) {
  return (
    <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} data-testid={`edit-btn-${record.id}`}>
      编辑
    </Button>
  );
}
