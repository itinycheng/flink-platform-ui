import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { Catalog } from "@/types/manage";
import { getCatalogs } from "@/api/manage";
import { useCatalogCrud } from "./CatalogList.hooks";
import { CatalogFormModal } from "./CatalogList.modal";
import { CatalogActionsCell, CatalogTypeTag } from "./CatalogList.cells";

export default function CatalogList() {
  const { t } = useTranslation();
  const crud = useCatalogCrud();

  const columns = useMemo<ProColumns<Catalog>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      { title: t("common.type"), dataIndex: "type", key: "type", width: 100, render: (_, r) => <CatalogTypeTag type={r.type} /> },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      { title: t("common.updatedAt"), dataIndex: "updatedAt", key: "updatedAt", width: 200 },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <CatalogActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="catalog-list">
      <ProTable<Catalog>
        headerTitle="Catalog"
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
            data-testid="add-catalog-button"
          >
            {t("catalog.add")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getCatalogs({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <CatalogFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingCatalog}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
