import { Form, Input, InputNumber, Select, Switch } from "antd";

const NOTIFY_METHOD_OPTIONS = [
  { label: "邮件", value: "email" },
  { label: "Webhook", value: "webhook" },
  { label: "短信", value: "sms" },
];

export function AlertPolicyFormFields() {
  return (
    <>
      <Form.Item name="name" label="策略名称" rules={[{ required: true, message: "请输入策略名称" }]}>
        <Input placeholder="请输入策略名称" data-testid="input-name" />
      </Form.Item>
      <Form.Item name="target" label="监控对象" rules={[{ required: true, message: "请输入监控对象" }]}>
        <Input placeholder="请输入监控对象" data-testid="input-target" />
      </Form.Item>
      <Form.Item name="condition" label="告警条件" rules={[{ required: true, message: "请输入告警条件" }]}>
        <Input placeholder="请输入告警条件" data-testid="input-condition" />
      </Form.Item>
      <Form.Item name="threshold" label="告警阈值" rules={[{ required: true, message: "请输入告警阈值" }]}>
        <InputNumber data-testid="input-threshold" placeholder="请输入告警阈值" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="notifyMethod" label="通知方式" rules={[{ required: true, message: "请选择通知方式" }]}>
        <Select placeholder="请选择通知方式" options={NOTIFY_METHOD_OPTIONS} data-testid="select-notify-method" />
      </Form.Item>
      <Form.Item name="enabled" label="启用状态" valuePropName="checked">
        <Switch data-testid="switch-enabled" />
      </Form.Item>
    </>
  );
}
