import { Form, Input, InputNumber, Select, Switch } from "antd";
import { useTranslation } from "react-i18next";
import { getNotifyMethodOptions } from "./AlertPolicyList.constants";

export function AlertPolicyFormFields() {
  const { t } = useTranslation();
  return (
    <>
      <Form.Item name="name" label={t("monitor.policyName")} rules={[{ required: true, message: t("monitor.policyNameRequired") }]}>
        <Input placeholder={t("monitor.policyNameRequired")} data-testid="input-name" />
      </Form.Item>
      <Form.Item name="target" label={t("monitor.target")} rules={[{ required: true, message: t("monitor.targetRequired") }]}>
        <Input placeholder={t("monitor.targetRequired")} data-testid="input-target" />
      </Form.Item>
      <Form.Item name="condition" label={t("monitor.condition")} rules={[{ required: true, message: t("monitor.conditionRequired") }]}>
        <Input placeholder={t("monitor.conditionRequired")} data-testid="input-condition" />
      </Form.Item>
      <Form.Item name="threshold" label={t("monitor.threshold")} rules={[{ required: true, message: t("monitor.thresholdRequired") }]}>
        <InputNumber data-testid="input-threshold" placeholder={t("monitor.thresholdRequired")} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="notifyMethod" label={t("monitor.notifyMethod")} rules={[{ required: true, message: t("monitor.notifyMethodRequired") }]}>
        <Select placeholder={t("monitor.notifyMethodRequired")} options={getNotifyMethodOptions(t)} data-testid="select-notify-method" />
      </Form.Item>
      <Form.Item name="enabled" label={t("monitor.enabledStatus")} valuePropName="checked">
        <Switch data-testid="switch-enabled" />
      </Form.Item>
    </>
  );
}
