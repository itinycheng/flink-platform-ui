import { Col, Form, Input, InputNumber, Row } from "antd";
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
        <Form.Item label="Job 名称" required rules={[{ required: true, message: "请输入 Flink Job 名称" }]}>
          <Input
            placeholder="例如：flink-etl-job"
            value={params.jobName}
            onChange={(e) => handleChange("jobName", e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="JAR 路径" required rules={[{ required: true, message: "请输入 JAR 文件路径" }]}>
          <Input
            placeholder="例如：hdfs:///jars/flink-job.jar"
            value={params.jarPath}
            onChange={(e) => handleChange("jarPath", e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Entry Class">
          <Input
            placeholder="例如：com.example.FlinkJob"
            value={params.entryClass}
            onChange={(e) => handleChange("entryClass", e.target.value || undefined)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="并行度">
          <InputNumber
            min={1}
            max={1024}
            placeholder="默认由集群决定"
            style={{ width: "100%" }}
            value={params.parallelism}
            onChange={(v) => handleChange("parallelism", v ?? undefined)}
          />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="Flink 配置" tooltip="每行一个，格式：key=value">
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
