import { Button, Popconfirm, Tag } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { CustomParam } from "@/types/manage";
import { TYPE_TAG_COLORS } from "./CustomParamList.constants";

interface ParamTypeTagProps {
  type: CustomParam["type"];
}

export function ParamTypeTag({ type }: ParamTypeTagProps) {
  return <Tag color={TYPE_TAG_COLORS[type]}>{type}</Tag>;
}

interface ParamActionsCellProps {
  record: CustomParam;
  onEdit: (record: CustomParam) => void;
  onDelete: (id: string) => void;
}

export function ParamActionsCell({ record, onEdit, onDelete }: ParamActionsCellProps) {
  return (
    <>
      <Button type="link" onClick={() => onEdit(record)} data-testid={`edit-btn-${record.id}`}>
        编辑
      </Button>
      <Popconfirm
        title="确认删除"
        description={`确定要删除参数 "${record.name}" 吗？`}
        onConfirm={() => onDelete(record.id)}
        okText="确定"
        cancelText="取消"
      >
        <Button type="link" danger icon={<DeleteOutlined />} data-testid={`delete-btn-${record.id}`}>
          删除
        </Button>
      </Popconfirm>
    </>
  );
}
