import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { ROLE_OPTIONS } from "./UserList.constants";

interface UserFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function UserFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: UserFormModalProps) {
  return (
    <Modal
      title={isEdit ? "编辑用户" : "新增用户"}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="user-modal"
    >
      <Form form={form} layout="vertical" data-testid="user-form">
        <Form.Item name="username" label="用户名" rules={[{ required: true, message: "请输入用户名" }]}>
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
        <Form.Item name="roles" label="角色" rules={[{ required: true, message: "请选择角色" }]}>
          <Select mode="multiple" placeholder="请选择角色" options={ROLE_OPTIONS} data-testid="select-roles" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
