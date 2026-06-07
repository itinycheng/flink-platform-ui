import { Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ResourceFile } from "@/types/manage";

interface ResourceDeleteCellProps {
  record: ResourceFile;
  onDelete: (id: string) => void;
}

export function ResourceDeleteCell({ record, onDelete }: ResourceDeleteCellProps) {
  return (
    <Popconfirm
      title="确认删除"
      description={`确定要删除文件 "${record.name}" 吗？`}
      onConfirm={() => onDelete(record.id)}
      okText="确定"
      cancelText="取消"
    >
      <Button type="link" danger icon={<DeleteOutlined />} data-testid={`delete-btn-${record.id}`}>
        删除
      </Button>
    </Popconfirm>
  );
}
