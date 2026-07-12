import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { ManagedUser } from "@/types/manage";
import { getUsers } from "@/api/manage";
import { useUserCrud } from "./UserList.hooks";
import { UserFormModal } from "./UserList.modal";
import { UserActionsCell, UserRoleTags, UserStatusTag } from "./UserList.cells";

export default function UserList() {
  const { t } = useTranslation();
  const crud = useUserCrud();

  const columns = useMemo<ProColumns<ManagedUser>[]>(
    () => [
      { title: t("user2.usernameLabel"), dataIndex: "username", key: "username", ellipsis: true },
      { title: t("user2.emailLabel"), dataIndex: "email", key: "email", ellipsis: true },
      {
        title: t("user2.rolesLabel"),
        dataIndex: "roles",
        key: "roles",
        width: 200,
        render: (_, r) => <UserRoleTags roles={r.roles} />,
      },
      {
        title: t("common.status"),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, r) => <UserStatusTag status={r.status} />,
      },
      { title: t("common.createdAt"), dataIndex: "createdAt", key: "createdAt", width: 200, valueType: "dateTime", sorter: true },
      {
        title: t("common.operation"),
        key: "action",
        width: 180,
        render: (_, record) => (
          <UserActionsCell record={record} onEdit={crud.handleEdit} onToggleStatus={crud.handleToggleStatus} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleToggleStatus],
  );

  return (
    <div data-testid="user-list">
      <ProTable<ManagedUser>
        headerTitle={t("user2.title")}
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
            data-testid="add-user-button"
          >
            {t("user2.addButton")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getUsers({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <UserFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingUser}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
