import { Col, Form, Input, Row } from "antd";
import type { ShellTaskParams, TaskParams } from "@/types/job";
import CodeEditor from "@/components/CodeEditor";

const { TextArea } = Input;

interface ShellFormProps {
  value?: TaskParams;
  onChange?: (v: TaskParams) => void;
}

export default function ShellForm({ value, onChange }: ShellFormProps) {
  const params = (value ?? { script: "" }) as ShellTaskParams;

  const handleChange = (field: keyof ShellTaskParams, fieldValue: unknown) => {
    onChange?.({ ...params, [field]: fieldValue } as TaskParams);
  };

  const handleEnvChange = (text: string) => {
    if (!text.trim()) {
      const { env: _env, ...rest } = params;
      onChange?.(rest as TaskParams);
      return;
    }
    const env: Record<string, string> = {};
    for (const line of text.split("\n")) {
      const eqIndex = line.indexOf("=");
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex).trim();
        const val = line.substring(eqIndex + 1).trim();
        if (key) env[key] = val;
      }
    }
    handleChange("env", Object.keys(env).length > 0 ? env : undefined);
  };

  const envToText = (env?: Record<string, string>): string => {
    if (!env) return "";
    return Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
  };

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="脚本内容" required rules={[{ required: true, message: "请输入脚本内容" }]}>
          <CodeEditor
            language="shell"
            placeholder="请输入 Shell 脚本内容"
            value={params.script}
            onChange={(v) => handleChange("script", v)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="环境变量" tooltip="每行一个，格式：KEY=VALUE">
          <TextArea
            rows={6}
            placeholder={"KEY1=VALUE1\nKEY2=VALUE2"}
            value={envToText(params.env)}
            onChange={(e) => handleEnvChange(e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="工作目录">
          <Input
            placeholder="例如：/home/user/scripts"
            value={params.workingDir}
            onChange={(e) => handleChange("workingDir", e.target.value || undefined)}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
