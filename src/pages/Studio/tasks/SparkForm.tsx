import { Col, Form, Input, Row } from "antd";
import { useTranslation } from "react-i18next";
import type { SparkTaskParams, TaskParams } from "@/types/job";

const { TextArea } = Input;

interface SparkFormProps {
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

function parseArgsText(text: string): string[] | undefined {
  const args = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return args.length > 0 ? args : undefined;
}

const argsToText = (args?: string[]): string => (args ? args.join("\n") : "");

export default function SparkForm({ value, onChange }: SparkFormProps) {
  const { t } = useTranslation();
  const params = (value ?? { mainClass: "", jarPath: "" }) as SparkTaskParams;

  const handleChange = (field: keyof SparkTaskParams, fieldValue: unknown) => {
    onChange?.({ ...params, [field]: fieldValue } as TaskParams);
  };

  const handleSparkConfChange = (text: string) => {
    const conf = parseConfText(text);
    if (conf) handleChange("sparkConf", conf);
    else {
      const { sparkConf: _conf, ...rest } = params;
      onChange?.(rest as TaskParams);
    }
  };

  const handleArgsChange = (text: string) => {
    const args = parseArgsText(text);
    if (args) handleChange("args", args);
    else {
      const { args: _args, ...rest } = params;
      onChange?.(rest as TaskParams);
    }
  };

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label={t("taskForm.mainClass")}
          required
          rules={[{ required: true, message: t("taskForm.sparkMainClassRequired") }]}
        >
          <Input
            placeholder={t("taskForm.mainClassPlaceholder")}
            value={params.mainClass}
            onChange={(e) => handleChange("mainClass", e.target.value)}
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
            placeholder={t("taskForm.sparkJarPathPlaceholder")}
            value={params.jarPath}
            onChange={(e) => handleChange("jarPath", e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={t("taskForm.sparkConf")} tooltip={t("taskForm.confTooltip")}>
          <TextArea
            rows={4}
            placeholder={"spark.executor.memory=4g\nspark.executor.cores=2"}
            value={confToText(params.sparkConf)}
            onChange={(e) => handleSparkConfChange(e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={t("taskForm.runArgs")} tooltip={t("taskForm.runArgsTooltip")}>
          <TextArea
            rows={4}
            placeholder={"--input /data/input\n--output /data/output"}
            value={argsToText(params.args)}
            onChange={(e) => handleArgsChange(e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
