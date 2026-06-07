import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import type { CustomParam } from "@/types/manage";
import { getParams } from "@/api/manage";
import { useParamCrud } from "./CustomParamList.hooks";
import { ParamFormModal } from "./CustomParamList.modal";
import { ParamActionsCell, ParamTypeTag } from "./CustomParamList.cells";

export default function CustomParamList() {
  const crud = useParamCrud();

  const columns = useMemo<ProColumns<CustomParam>[]>(
    () => [
      { title: "参数名", dataIndex: "name", key: "name", ellipsis: true },
      { title: "值", dataIndex: "value", key: "value", ellipsis: true },
      { title: "类型", dataIndex: "type", key: "type", width: 100, render: (_, r) => <ParamTypeTag type={r.type} /> },
      { title: "描述", dataIndex: "description", key: "description", ellipsis: true },
      {
        title: "操作",
        key: "action",
        width: 150,
        render: (_, record) => (
          <ParamActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="custom-param-list">
      <ProTable<CustomParam>
        headerTitle="自定义参数"
        actionRef={crud.actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={crud.handleAdd}
            data-testid="add-param-button"
          >
            新增参数
          </Button>,
        ]}
        request={async (params) => {
          const result = await getParams({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <ParamFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingParam}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
