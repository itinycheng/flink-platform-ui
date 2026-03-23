import { useRef, useState } from "react";
import { Button, message, Popconfirm, Modal, Form, Input, Select, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import type { ManagedUser } from "@/types/manage";
import { getUsers, createUser, updateUser } from "@/api/manage";

/** Available role options for user management. */
const ROLE_OPTIONS = [
  { label: "管理员", value: "admin" },
  { label: "开发者", value: "developer" },
  { label: "查看者", value: "viewer" },
];

/** Status tag color mapping. */
const STATUS_CONFIG: Record<ManagedUser["status"], { color: string; text: string }> = {
  active: { color: "green", text: "启用" },
  disabled: { color: "red", text: "禁用" },
};

/**
 * UserList — User management sub-module.
 *
 * Features:
 * - ProTable displaying user list (username, email, roles, status, createdAt, actions)
 * - Create / edit user via Modal + Form (username, email, role selection)
 * - Disable / enable user with Popconfirm confirmation
 * - Refresh list after create/edit/toggle status
 *
 * Requirements: 7.5
 */
export default function UserList() {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  /** Open modal for creating a new user. */
  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  /** Open modal for editing an existing user. */
  const handleEdit = (record: ManagedUser) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      roles: record.roles,
    });
    setModalOpen(true);
  };

  /** Submit the create/edit form. */
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);

      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success("用户更新成功");
      } else {
        await createUser({ ...values, status: "active" });
        message.success("用户创建成功");
      }

      setModalOpen(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      // If it's a form validation error, don't show API error message
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }
      message.error(editingUser ? "用户更新失败，请重试" : "用户创建失败，请重试");
    } finally {
      setConfirmLoading(false);
    }
  };

  /** Cancel the modal. */
  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingUser(null);
  };

  /** Toggle user status (active ↔ disabled). */
  const handleToggleStatus = async (record: ManagedUser) => {
    const newStatus = record.status === "active" ? "disabled" : "active";
    try {
      await updateUser(record.id, { status: newStatus });
      message.success(newStatus === "disabled" ? "用户已禁用" : "用户已启用");
      actionRef.current?.reload();
    } catch {
      message.error("操作失败，请重试");
    }
  };

  const columns: ProColumns<ManagedUser>[] = [
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
      ellipsis: true,
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "角色",
      dataIndex: "roles",
      key: "roles",
      width: 200,
      render: (_, record) =>
        record.roles.map((role) => (
          <Tag key={role} color="blue">
            {role}
          </Tag>
        )),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (_, record) => {
        const config = STATUS_CONFIG[record.status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 200,
      valueType: "dateTime",
      sorter: true,
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_, record) => (
        <>
          <Button
            type="link"
            onClick={() => handleEdit(record)}
            data-testid={`edit-btn-${record.id}`}
          >
            编辑
          </Button>
          <Popconfirm
            title={record.status === "active" ? "确认禁用" : "确认启用"}
            description={
              record.status === "active"
                ? `确定要禁用用户 "${record.username}" 吗？`
                : `确定要启用用户 "${record.username}" 吗？`
            }
            onConfirm={() => handleToggleStatus(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger={record.status === "active"}
              data-testid={`toggle-status-btn-${record.id}`}
            >
              {record.status === "active" ? "禁用" : "启用"}
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div data-testid="user-list">
      <ProTable<ManagedUser>
        headerTitle="用户列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            data-testid="add-user-button"
          >
            新增用户
          </Button>,
        ]}
        request={async (params) => {
          const { current, pageSize } = params;
          const result = await getUsers({
            page: current ?? 1,
            pageSize: pageSize ?? 10,
          });
          return {
            data: result.data,
            total: result.total,
            success: true,
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      <Modal
        title={editingUser ? "编辑用户" : "新增用户"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
        destroyOnHidden
        data-testid="user-modal"
      >
        <Form
          form={form}
          layout="vertical"
          data-testid="user-form"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="请输入用户名" data-testid="input-username" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input placeholder="请输入邮箱" data-testid="input-email" />
          </Form.Item>
          <Form.Item
            name="roles"
            label="角色"
            rules={[{ required: true, message: "请选择角色" }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={ROLE_OPTIONS}
              data-testid="select-roles"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
