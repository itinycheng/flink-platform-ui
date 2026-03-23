import { useRef, useState } from "react";
import { Button, message, Modal, Form, Input, Select, Popconfirm, Tag } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import type { CustomParam } from "@/types/manage";
import { getParams, createParam, updateParam, deleteParam } from "@/api/manage";

/** Available parameter type options. */
const PARAM_TYPE_OPTIONS = [
  { label: "字符串", value: "string" },
  { label: "数字", value: "number" },
  { label: "布尔值", value: "boolean" },
  { label: "JSON", value: "json" },
];

/** Type tag color mapping. */
const TYPE_TAG_COLORS: Record<CustomParam["type"], string> = {
  string: "blue",
  number: "green",
  boolean: "orange",
  json: "purple",
};

/**
 * CustomParamList — Custom parameter management sub-module.
 *
 * Features:
 * - ProTable displaying custom parameter list (name, value, type, description, actions)
 * - Create / edit parameter via Modal + Form
 * - Delete parameter with Popconfirm confirmation
 * - Refresh list after create/edit/delete
 *
 * Requirements: 7.7
 */
export default function CustomParamList() {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<CustomParam | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  /** Open modal for creating a new parameter. */
  const handleAdd = () => {
    setEditingParam(null);
    form.resetFields();
    setModalOpen(true);
  };

  /** Open modal for editing an existing parameter. */
  const handleEdit = (record: CustomParam) => {
    setEditingParam(record);
    form.setFieldsValue({
      name: record.name,
      value: record.value,
      type: record.type,
      description: record.description ?? "",
    });
    setModalOpen(true);
  };

  /** Submit the create/edit form. */
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);

      if (editingParam) {
        await updateParam(editingParam.id, values);
        message.success("参数更新成功");
      } else {
        await createParam(values);
        message.success("参数创建成功");
      }

      setModalOpen(false);
      form.resetFields();
      setEditingParam(null);
      actionRef.current?.reload();
    } catch (error) {
      // If it's a form validation error, don't show API error message
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }
      message.error(editingParam ? "参数更新失败，请重试" : "参数创建失败，请重试");
    } finally {
      setConfirmLoading(false);
    }
  };

  /** Cancel the modal. */
  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingParam(null);
  };

  /** Delete a parameter. */
  const handleDelete = async (id: string) => {
    try {
      await deleteParam(id);
      message.success("参数已删除");
      actionRef.current?.reload();
    } catch {
      message.error("删除失败，请重试");
    }
  };

  const columns: ProColumns<CustomParam>[] = [
    {
      title: "参数名",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "值",
      dataIndex: "value",
      key: "value",
      ellipsis: true,
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (_, record) => (
        <Tag color={TYPE_TAG_COLORS[record.type]}>{record.type}</Tag>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      width: 150,
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
            title="确认删除"
            description={`确定要删除参数 "${record.name}" 吗？`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              data-testid={`delete-btn-${record.id}`}
            >
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div data-testid="custom-param-list">
      <ProTable<CustomParam>
        headerTitle="自定义参数"
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
            data-testid="add-param-button"
          >
            新增参数
          </Button>,
        ]}
        request={async (params) => {
          const { current, pageSize } = params;
          const result = await getParams({
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
        title={editingParam ? "编辑参数" : "新增参数"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
        destroyOnHidden
        data-testid="custom-param-modal"
      >
        <Form form={form} layout="vertical" data-testid="custom-param-form">
          <Form.Item
            name="name"
            label="参数名"
            rules={[{ required: true, message: "请输入参数名" }]}
          >
            <Input placeholder="请输入参数名" data-testid="input-name" />
          </Form.Item>
          <Form.Item
            name="value"
            label="值"
            rules={[{ required: true, message: "请输入参数值" }]}
          >
            <Input placeholder="请输入参数值" data-testid="input-value" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: "请选择参数类型" }]}
          >
            <Select
              placeholder="请选择参数类型"
              options={PARAM_TYPE_OPTIONS}
              data-testid="select-type"
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea
              placeholder="请输入描述（可选）"
              rows={3}
              data-testid="input-description"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
