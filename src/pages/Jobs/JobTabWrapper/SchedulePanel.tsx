import { Form, Input, InputNumber, Select, Switch } from "antd";
import { useTranslation } from "react-i18next";

export default function SchedulePanel() {
  const { t } = useTranslation();

  return (
    <Form layout="vertical" size="small" style={{ padding: "0 4px" }}>
      <Form.Item label={t("sidePanel.cronExpression")}>
        <Input placeholder="0 0 * * *" />
      </Form.Item>
      <Form.Item label={t("sidePanel.timezone")}>
        <Select
          placeholder={t("sidePanel.timezonePlaceholder")}
          options={[
            { label: "Asia/Shanghai (UTC+8)", value: "Asia/Shanghai" },
            { label: "America/New_York (UTC-5)", value: "America/New_York" },
            { label: "Europe/London (UTC+0)", value: "Europe/London" },
            { label: "Asia/Tokyo (UTC+9)", value: "Asia/Tokyo" },
            { label: "UTC", value: "UTC" },
          ]}
        />
      </Form.Item>
      <Form.Item label={t("sidePanel.timeout")}>
        <InputNumber
          min={0}
          max={86400}
          placeholder={t("sidePanel.timeoutPlaceholder")}
          style={{ width: "100%" }}
          suffix={t("sidePanel.seconds")}
        />
      </Form.Item>
      <Form.Item label={t("sidePanel.retryCount")}>
        <InputNumber min={0} max={10} defaultValue={0} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label={t("sidePanel.retryInterval")}>
        <InputNumber min={0} max={3600} placeholder="60" style={{ width: "100%" }} suffix={t("sidePanel.seconds")} />
      </Form.Item>
      <Form.Item label={t("sidePanel.failureStrategy")}>
        <Select
          defaultValue="continue"
          options={[
            { label: t("sidePanel.continueOnFailure"), value: "continue" },
            { label: t("sidePanel.stopOnFailure"), value: "stop" },
          ]}
        />
      </Form.Item>
      <Form.Item label={t("sidePanel.enabled")} valuePropName="checked">
        <Switch defaultChecked />
      </Form.Item>
    </Form>
  );
}
