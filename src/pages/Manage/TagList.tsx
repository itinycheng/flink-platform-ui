import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { Tag as TagModel } from "@/types/manage";
import { getTags } from "@/api/manage";
import { useTagCrud } from "./TagList.hooks";
import { TagFormModal } from "./TagList.modal";
import { TagActionsCell, TagStatusTag, TagTypeTag } from "./TagList.cells";

export default function TagList() {
  const { t } = useTranslation();
  const crud = useTagCrud();

  const columns = useMemo<ProColumns<TagModel>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      {
        title: t("common.type"),
        dataIndex: "type",
        key: "type",
        width: 120,
        render: (_, r) => <TagTypeTag type={r.type} />,
      },
      {
        title: t("common.status"),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, r) => <TagStatusTag status={r.status} />,
      },
      { title: t("common.createdAt"), dataIndex: "createdAt", key: "createdAt", width: 180 },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <TagActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="tag-list">
      <ProTable<TagModel>
        headerTitle={t("tag.title")}
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
            data-testid="add-tag-button"
          >
            {t("tag.add")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getTags({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <TagFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingTag}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
