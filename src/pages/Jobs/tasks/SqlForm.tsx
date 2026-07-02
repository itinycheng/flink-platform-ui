import { Col, Form, InputNumber, Row, Select } from "antd";
import type { SqlTaskParams, TaskParams } from "@/types/job";
import CodeEditor from "@/components/CodeEditor";

interface SqlFormProps {
  value?: TaskParams;
  onChange?: (v: TaskParams) => void;
}

const DATASOURCE_OPTIONS = [
  { label: "MySQL", value: "mysql" },
  { label: "PostgreSQL", value: "postgresql" },
  { label: "Oracle", value: "oracle" },
  { label: "SQL Server", value: "sqlserver" },
  { label: "ClickHouse", value: "clickhouse" },
];

export default function SqlForm({ value, onChange }: SqlFormProps) {
  const params = (value ?? { datasource: "", sql: "" }) as SqlTaskParams;

  const handleChange = (field: keyof SqlTaskParams, fieldValue: unknown) => {
    onChange?.({ ...params, [field]: fieldValue } as TaskParams);
  };

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="数据源xxx" required rules={[{ required: true, message: "请选择数据源" }]}>
          <Select
            placeholder="请选择数据源"
            options={DATASOURCE_OPTIONS}
            value={params.datasource || undefined}
            onChange={(v: string) => handleChange("datasource", v)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="超时时间（秒）">
          <InputNumber
            min={1}
            max={86400}
            placeholder="默认不限制"
            style={{ width: "100%" }}
            value={params.timeout}
            onChange={(v) => handleChange("timeout", v ?? undefined)}
          />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="SQL 语句" required rules={[{ required: true, message: "请输入 SQL 语句" }]}>
          <CodeEditor
            language="sql"
            placeholder="请输入 SQL 语句"
            value={params.sql}
            onChange={(v) => handleChange("sql", v)}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
