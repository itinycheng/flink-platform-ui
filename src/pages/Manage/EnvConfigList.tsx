import { useMemo } from "react";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import type { EnvConfig } from "@/types/manage";
import { getEnvConfigs } from "@/api/manage";
import { useEnvConfigEdit } from "./EnvConfigList.hooks";
import { EnvConfigEditModal } from "./EnvConfigList.modal";
import { EnvConfigEditButton, EnvTag } from "./EnvConfigList.cells";

export default function EnvConfigList() {
  const edit = useEnvConfigEdit();

  const columns = useMemo<ProColumns<EnvConfig>[]>(
    () => [
      { title: "环境", dataIndex: "env", key: "env", width: 120, render: (_, r) => <EnvTag env={r.env} /> },
      { title: "配置键", dataIndex: "key", key: "key", ellipsis: true },
      { title: "配置值", dataIndex: "value", key: "value", ellipsis: true },
      { title: "描述", dataIndex: "description", key: "description", ellipsis: true },
      {
        title: "操作",
        key: "action",
        width: 100,
        render: (_, record) => <EnvConfigEditButton record={record} onEdit={edit.handleEdit} />,
      },
    ],
    [edit.handleEdit],
  );

  return (
    <div data-testid="env-config-list">
      <ProTable<EnvConfig>
        headerTitle="环境配置"
        actionRef={edit.actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        request={async (params) => {
          const result = await getEnvConfigs({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <EnvConfigEditModal
        open={edit.modalOpen}
        editingConfig={edit.editingConfig}
        form={edit.form}
        confirmLoading={edit.confirmLoading}
        onOk={edit.handleModalOk}
        onCancel={edit.handleModalCancel}
      />
    </div>
  );
}
