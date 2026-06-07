import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import type { ManagedUser } from "@/types/manage";
import { getUsers } from "@/api/manage";
import { useUserCrud } from "./UserList.hooks";
import { UserFormModal } from "./UserList.modal";
import { UserActionsCell, UserRoleTags, UserStatusTag } from "./UserList.cells";

export default function UserList() {
  const crud = useUserCrud();

  const columns = useMemo<ProColumns<ManagedUser>[]>(
    () => [
      { title: "用户名", dataIndex: "username", key: "username", ellipsis: true },
      { title: "邮箱", dataIndex: "email", key: "email", ellipsis: true },
      {
        title: "角色",
        dataIndex: "roles",
        key: "roles",
        width: 200,
        render: (_, r) => <UserRoleTags roles={r.roles} />,
      },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, r) => <UserStatusTag status={r.status} />,
      },
      { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 200, valueType: "dateTime", sorter: true },
      {
        title: "操作",
        key: "action",
        width: 180,
        render: (_, record) => (
          <UserActionsCell record={record} onEdit={crud.handleEdit} onToggleStatus={crud.handleToggleStatus} />
        ),
      },
    ],
    [crud.handleEdit, crud.handleToggleStatus],
  );

  return (
    <div data-testid="user-list">
      <ProTable<ManagedUser>
        headerTitle="用户列表"
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
            新增用户
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
