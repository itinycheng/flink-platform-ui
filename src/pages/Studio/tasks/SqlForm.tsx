import { Col, Form, InputNumber, Row, Select } from "antd";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const params = (value ?? { datasource: "", sql: "" }) as SqlTaskParams;

  const handleChange = (field: keyof SqlTaskParams, fieldValue: unknown) => {
    onChange?.({ ...params, [field]: fieldValue } as TaskParams);
  };

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label={t("taskForm.datasource")}
          required
          rules={[{ required: true, message: t("taskForm.datasourceRequired") }]}
        >
          <Select
            placeholder={t("taskForm.datasourcePlaceholder")}
            options={DATASOURCE_OPTIONS}
            value={params.datasource || undefined}
            onChange={(v: string) => handleChange("datasource", v)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={t("taskForm.timeout")}>
          <InputNumber
            min={1}
            max={86400}
            placeholder={t("taskForm.timeoutPlaceholder")}
            style={{ width: "100%" }}
            value={params.timeout}
            onChange={(v) => handleChange("timeout", v ?? undefined)}
          />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item
          label={t("taskForm.sql")}
          required
          rules={[{ required: true, message: t("taskForm.sqlRequired") }]}
        >
          <CodeEditor
            language="sql"
            placeholder={t("taskForm.sqlPlaceholder")}
            value={params.sql}
            onChange={(v) => handleChange("sql", v)}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
