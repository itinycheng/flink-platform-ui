import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { CustomParam } from "@/types/manage";
import { getParams } from "@/api/manage";
import { useParamCrud } from "./CustomParamList.hooks";
import { ParamFormModal } from "./CustomParamList.modal";
import { ParamActionsCell, ParamTypeTag } from "./CustomParamList.cells";

export default function CustomParamList() {
  const { t } = useTranslation();
  const crud = useParamCrud();

  const columns = useMemo<ProColumns<CustomParam>[]>(
    () => [
      { title: t("param.nameLabel"), dataIndex: "name", key: "name", ellipsis: true },
      { title: t("param.valueLabel"), dataIndex: "value", key: "value", ellipsis: true },
      { title: t("common.type"), dataIndex: "type", key: "type", width: 100, render: (_, r) => <ParamTypeTag type={r.type} /> },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <ParamActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="custom-param-list">
      <ProTable<CustomParam>
        headerTitle={t("param.title")}
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
            {t("param.addButton")}
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
