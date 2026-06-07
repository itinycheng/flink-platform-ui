import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { PARAM_TYPE_OPTIONS } from "./CustomParamList.constants";

interface ParamFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function ParamFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: ParamFormModalProps) {
  return (
    <Modal
      title={isEdit ? "编辑参数" : "新增参数"}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="custom-param-modal"
    >
      <Form form={form} layout="vertical" data-testid="custom-param-form">
        <Form.Item name="name" label="参数名" rules={[{ required: true, message: "请输入参数名" }]}>
          <Input placeholder="请输入参数名" data-testid="input-name" />
        </Form.Item>
        <Form.Item name="value" label="值" rules={[{ required: true, message: "请输入参数值" }]}>
          <Input placeholder="请输入参数值" data-testid="input-value" />
        </Form.Item>
        <Form.Item name="type" label="类型" rules={[{ required: true, message: "请选择参数类型" }]}>
          <Select placeholder="请选择参数类型" options={PARAM_TYPE_OPTIONS} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea placeholder="请输入描述（可选）" rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
