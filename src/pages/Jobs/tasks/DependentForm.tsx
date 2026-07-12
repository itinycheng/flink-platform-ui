import { Col, Form, Input, Row, Select } from "antd";
import { useTranslation } from "react-i18next";
import type { DependentTaskParams, TaskParams } from "@/types/job";

interface DependentFormProps {
  value?: TaskParams;
  onChange?: (v: TaskParams) => void;
}

const DEFAULTS: DependentTaskParams = { dependWorkflowId: "", dependStatus: "success", relation: "and" };

export default function DependentForm({ value, onChange }: DependentFormProps) {
  const { t } = useTranslation();
  const params = (value ?? DEFAULTS) as DependentTaskParams;

  const handleChange = (field: keyof DependentTaskParams, fieldValue: string) => {
    onChange?.({ ...params, [field]: fieldValue } as TaskParams);
  };

  return (
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item label={t("taskForm.dependWorkflow")} required tooltip={t("taskForm.dependWorkflowTip")}>
          <Input
            placeholder={t("taskForm.dependWorkflowPlaceholder")}
            value={params.dependWorkflowId}
            onChange={(e) => handleChange("dependWorkflowId", e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={t("taskForm.dependStatus")}>
          <Select
            value={params.dependStatus}
            onChange={(v) => handleChange("dependStatus", v)}
            options={[
              { label: t("taskForm.statusSuccess"), value: "success" },
              { label: t("taskForm.statusFailed"), value: "failed" },
              { label: t("taskForm.statusAny"), value: "any" },
            ]}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={t("taskForm.relation")} tooltip={t("taskForm.relationTip")}>
          <Select
            value={params.relation}
            onChange={(v) => handleChange("relation", v)}
            options={[
              { label: t("taskForm.relationAnd"), value: "and" },
              { label: t("taskForm.relationOr"), value: "or" },
            ]}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
