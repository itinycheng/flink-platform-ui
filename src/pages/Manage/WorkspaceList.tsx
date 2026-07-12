import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { Workspace } from "@/types/workspace";
import { getWorkspaces } from "@/api/workspace";
import { useWorkspaceCrud } from "./WorkspaceList.hooks";
import { WorkspaceFormModal } from "./WorkspaceList.modal";
import { WorkspaceActionsCell, WorkspaceStatusTag } from "./WorkspaceList.cells";

export default function WorkspaceList() {
  const { t } = useTranslation();
  const crud = useWorkspaceCrud();

  const columns = useMemo<ProColumns<Workspace>[]>(
    () => [
      {
        title: t("common.name"),
        dataIndex: "name",
        key: "name",
        ellipsis: true,
        render: (_, r) => (r.isDefault ? t("workspace.defaultName") : r.name),
      },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      {
        title: t("common.status"),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, r) => <WorkspaceStatusTag status={r.status} />,
      },
      {
        title: t("common.createdAt"),
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (_, r) => new Date(r.createdAt).toLocaleString(),
      },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <WorkspaceActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="workspace-list">
      <ProTable<Workspace>
        headerTitle={t("workspace.title")}
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
            data-testid="add-workspace-button"
          >
            {t("workspace.addButton")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getWorkspaces({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <WorkspaceFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingWorkspace}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
