import { Col, Form, Input, Row } from "antd";
import { useTranslation } from "react-i18next";
import type { ConditionTaskParams, TaskParams } from "@/types/job";

interface ConditionFormProps {
  value?: TaskParams;
  onChange?: (v: TaskParams) => void;
}

export default function ConditionForm({ value, onChange }: ConditionFormProps) {
  const { t } = useTranslation();
  const params = (value ?? { expression: "" }) as ConditionTaskParams;

  const handleChange = (field: keyof ConditionTaskParams, fieldValue: string) => {
    onChange?.({ ...params, [field]: fieldValue || undefined } as TaskParams);
  };

  return (
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item label={t("taskForm.conditionExpr")} required tooltip={t("taskForm.conditionExprTip")}>
          <Input.TextArea
            rows={3}
            placeholder={t("taskForm.conditionExprPlaceholder")}
            value={params.expression}
            onChange={(e) => handleChange("expression", e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={t("taskForm.trueBranch")}>
          <Input
            placeholder={t("taskForm.trueBranchPlaceholder")}
            value={params.trueBranch}
            onChange={(e) => handleChange("trueBranch", e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={t("taskForm.falseBranch")}>
          <Input
            placeholder={t("taskForm.falseBranchPlaceholder")}
            value={params.falseBranch}
            onChange={(e) => handleChange("falseBranch", e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
