import { useState } from "react";
import { Button, Flex, message, Typography } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { getTaskTypeDefinition } from "@/pages/Studio/tasks/registry";
import type { TaskParams } from "@/types/job";

export default function JobForm({ taskType }: { taskType?: string }) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const type = taskType?.toLowerCase();
  const def = type ? getTaskTypeDefinition(type) : null;
  const TaskParamsForm = def?.formComponent;

  const [params, setParams] = useState<TaskParams | undefined>(def?.defaultParams);

  return (
    <div
      style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--ant-color-bg-container)" }}
    >
      {contextHolder}
      <Flex
        justify="flex-end"
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid var(--ant-color-border-secondary)",
          background: "var(--ant-color-bg-layout)",
          flexShrink: 0,
        }}
      >
        <Button
          type="primary"
          size="small"
          icon={<SaveOutlined />}
          onClick={() => void messageApi.success(t("dag.flowSaved"))}
        >
          {t("common.save")}
        </Button>
      </Flex>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {TaskParamsForm ? (
          <TaskParamsForm value={params} onChange={setParams} />
        ) : (
          <Typography.Text type="secondary">{t("dag.noFormForType")}</Typography.Text>
        )}
      </div>
    </div>
  );
}
