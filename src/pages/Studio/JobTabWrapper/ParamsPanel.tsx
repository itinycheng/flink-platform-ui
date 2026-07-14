import { Button, Flex, Form, Input, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ParamRow {
  id: string;
  key: string;
  value: string;
}

let nextRowId = 0;
const newRow = (): ParamRow => ({ id: `p-${++nextRowId}`, key: "", value: "" });

export default function ParamsPanel() {
  const { t } = useTranslation();
  const [params, setParams] = useState<ParamRow[]>([]);

  const addParam = () => setParams([...params, newRow()]);

  const removeParam = (id: string) => setParams(params.filter((p) => p.id !== id));

  const updateParam = (id: string, field: "key" | "value", val: string) => {
    setParams(params.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  return (
    <Flex vertical gap={12} style={{ padding: "0 4px" }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {t("sidePanel.paramsDescription")}
      </Typography.Text>

      <Form layout="vertical" size="small">
        {params.map((param, index) => (
          <Flex key={param.id} gap={6} align="start" style={{ marginBottom: 8 }}>
            <Form.Item style={{ flex: 1, marginBottom: 0 }} label={index === 0 ? t("sidePanel.paramKey") : undefined}>
              <Input
                placeholder={t("sidePanel.paramKeyPlaceholder")}
                value={param.key}
                onChange={(e) => updateParam(param.id, "key", e.target.value)}
              />
            </Form.Item>
            <Form.Item style={{ flex: 1, marginBottom: 0 }} label={index === 0 ? t("sidePanel.paramValue") : undefined}>
              <Input
                placeholder={t("sidePanel.paramValuePlaceholder")}
                value={param.value}
                onChange={(e) => updateParam(param.id, "value", e.target.value)}
              />
            </Form.Item>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeParam(param.id)}
              style={{ marginTop: index === 0 ? 30 : 0 }}
            />
          </Flex>
        ))}
      </Form>

      <Button type="dashed" icon={<PlusOutlined />} onClick={addParam} block size="small">
        {t("sidePanel.addParam")}
      </Button>
    </Flex>
  );
}
