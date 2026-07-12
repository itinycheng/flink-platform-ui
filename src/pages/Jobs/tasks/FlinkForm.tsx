import { Col, Form, Input, InputNumber, Row } from "antd";
import { useTranslation } from "react-i18next";
import type { FlinkTaskParams, TaskParams } from "@/types/job";

const { TextArea } = Input;

interface FlinkFormProps {
  value?: TaskParams;
  onChange?: (v: TaskParams) => void;
}

function parseConfText(text: string): Record<string, string> | undefined {
  if (!text.trim()) return undefined;
  const conf: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const eqIndex = line.indexOf("=");
    if (eqIndex > 0) {
      const key = line.substring(0, eqIndex).trim();
      const val = line.substring(eqIndex + 1).trim();
      if (key) conf[key] = val;
    }
  }
  return Object.keys(conf).length > 0 ? conf : undefined;
}

function confToText(conf?: Record<string, string>): string {
  return conf
    ? Object.entries(conf)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n")
    : "";
}

export default function FlinkForm({ value, onChange }: FlinkFormProps) {
  const { t } = useTranslation();
  const params = (value ?? { jobName: "", jarPath: "" }) as FlinkTaskParams;

  const handleChange = (field: keyof FlinkTaskParams, fieldValue: unknown) => {
    onChange?.({ ...params, [field]: fieldValue } as TaskParams);
  };

  const handleConfChange = (text: string) => {
    const conf = parseConfText(text);
    if (conf) handleChange("flinkConf", conf);
    else {
      const { flinkConf: _conf, ...rest } = params;
      onChange?.(rest as TaskParams);
    }
  };

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label={t("taskForm.flinkJobName")}
          required
          rules={[{ required: true, message: t("taskForm.flinkJobNameRequired") }]}
        >
          <Input
            placeholder={t("taskForm.flinkJobNamePlaceholder")}
            value={params.jobName}
            onChange={(e) => handleChange("jobName", e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label={t("taskForm.jarPath")}
          required
          rules={[{ required: true, message: t("taskForm.jarPathRequired") }]}
        >
          <Input
            placeholder={t("taskForm.flinkJarPathPlaceholder")}
            value={params.jarPath}
            onChange={(e) => handleChange("jarPath", e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={t("taskForm.entryClass")}>
          <Input
            placeholder={t("taskForm.entryClassPlaceholder")}
            value={params.entryClass}
            onChange={(e) => handleChange("entryClass", e.target.value || undefined)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={t("taskForm.parallelism")}>
          <InputNumber
            min={1}
            max={1024}
            placeholder={t("taskForm.parallelismPlaceholder")}
            style={{ width: "100%" }}
            value={params.parallelism}
            onChange={(v) => handleChange("parallelism", v ?? undefined)}
          />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label={t("taskForm.flinkConf")} tooltip={t("taskForm.confTooltip")}>
          <TextArea
            rows={4}
            placeholder={"execution.checkpointing.interval=60s\nstate.backend=rocksdb"}
            value={confToText(params.flinkConf)}
            onChange={(e) => handleConfChange(e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
