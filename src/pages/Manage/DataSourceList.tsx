import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { DataSource } from "@/types/manage";
import { getDataSources } from "@/api/manage";
import { useDataSourceCrud } from "./DataSourceList.hooks";
import { DataSourceFormModal } from "./DataSourceList.modal";
import { DataSourceActionsCell, DataSourceTypeTag } from "./DataSourceList.cells";

export default function DataSourceList() {
  const { t } = useTranslation();
  const crud = useDataSourceCrud();

  const columns = useMemo<ProColumns<DataSource>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      { title: t("common.type"), dataIndex: "type", key: "type", width: 120, render: (_, r) => <DataSourceTypeTag type={r.type} /> },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      { title: t("common.updatedAt"), dataIndex: "updatedAt", key: "updatedAt", width: 180 },
      {
        title: t("common.operation"),
        key: "action",
        width: 220,
        render: (_, record) => (
          <DataSourceActionsCell
            record={record}
            onEdit={crud.handleEdit}
            onTest={crud.handleTest}
            onDelete={crud.handleDelete}
          />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleTest, crud.handleDelete],
  );

  return (
    <div data-testid="datasource-list">
      <ProTable<DataSource>
        headerTitle={t("datasource.title")}
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
            data-testid="add-datasource-button"
          >
            {t("datasource.add")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getDataSources({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <DataSourceFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingDataSource}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
