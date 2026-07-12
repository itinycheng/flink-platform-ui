import { Col, Form, Input, Row } from "antd";
import { useTranslation } from "react-i18next";
import type { SubFlowTaskParams, TaskParams } from "@/types/job";

interface SubFlowFormProps {
  value?: TaskParams;
  onChange?: (v: TaskParams) => void;
}

function paramsToText(params?: Record<string, string>): string {
  if (!params) return "";
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export default function SubFlowForm({ value, onChange }: SubFlowFormProps) {
  const { t } = useTranslation();
  const params = (value ?? { subWorkflowId: "" }) as SubFlowTaskParams;

  const handleId = (id: string) => {
    onChange?.({ ...params, subWorkflowId: id } as TaskParams);
  };

  const handleParams = (text: string) => {
    if (!text.trim()) {
      const { params: _drop, ...rest } = params;
      onChange?.(rest as TaskParams);
      return;
    }
    const parsed: Record<string, string> = {};
    for (const line of text.split("\n")) {
      const eq = line.indexOf("=");
      if (eq > 0) {
        const key = line.substring(0, eq).trim();
        if (key) parsed[key] = line.substring(eq + 1).trim();
      }
    }
    onChange?.({ ...params, params: Object.keys(parsed).length ? parsed : undefined } as TaskParams);
  };

  return (
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item label={t("taskForm.subWorkflow")} required tooltip={t("taskForm.subWorkflowTip")}>
          <Input
            placeholder={t("taskForm.subWorkflowPlaceholder")}
            value={params.subWorkflowId}
            onChange={(e) => handleId(e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label={t("taskForm.subParams")} tooltip={t("taskForm.subParamsTip")}>
          <Input.TextArea
            rows={5}
            placeholder={"KEY1=VALUE1\nKEY2=VALUE2"}
            value={paramsToText(params.params)}
            onChange={(e) => handleParams(e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}
