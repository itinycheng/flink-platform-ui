import React, { useMemo } from "react";
import { Button, Flex, Tooltip, Typography } from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CloseOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import type { MessageInstance } from "antd/es/message/interface";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { Node } from "@xyflow/react";
import { getTaskTypeDefinition } from "@/pages/Jobs/tasks/registry";
import type { TaskParams } from "@/types/job";

interface DAGToolbarProps {
  embedded: boolean;
  onSave: () => void;
  messageApi: MessageInstance;
}

export function DAGToolbar({ embedded, onSave, messageApi }: DAGToolbarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Flex
      style={{
        background: "var(--ant-color-bg-container, #fff)",
        padding: "4px 6px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {!embedded && (
        <Tooltip title={t("common.back")}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/workflow")} />
        </Tooltip>
      )}
      <Tooltip title={t("dag.saveFlow")}>
        <Button type="text" icon={<SaveOutlined style={{ color: "var(--ant-color-primary)" }} />} onClick={onSave} />
      </Tooltip>
      <Tooltip title={t("dag.settings")}>
        <Button type="text" icon={<SettingOutlined />} onClick={() => void messageApi.info(t("dag.settingsHint"))} />
      </Tooltip>
      <Tooltip title={t("dag.taskList")}>
        <Button
          type="text"
          icon={<UnorderedListOutlined />}
          onClick={() => void messageApi.info(t("dag.taskListHint"))}
        />
      </Tooltip>
    </Flex>
  );
}

interface BottomPanelHeaderProps {
  label: string;
  taskType: string | undefined;
  onSave: () => void;
  onClose: () => void;
  saveLabel: string;
  closeLabel: string;
}

function BottomPanelHeader({ label, taskType, onSave, onClose, saveLabel, closeLabel }: BottomPanelHeaderProps) {
  return (
    <Flex
      align="center"
      justify="space-between"
      style={{
        padding: "2px 12px",
        borderBottom: "1px solid var(--ant-color-border-secondary)",
        background: "var(--ant-color-bg-layout)",
      }}
    >
      <Flex align="center" gap={8}>
        <Typography.Text strong>{label}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {taskType?.toUpperCase()}
        </Typography.Text>
      </Flex>
      <Flex align="center" gap={4}>
        <Button size="small" icon={<SaveOutlined />} onClick={onSave}>
          {saveLabel}
        </Button>
        <Button size="small" icon={<CloseOutlined />} onClick={onClose}>
          {closeLabel}
        </Button>
      </Flex>
    </Flex>
  );
}

interface BottomPanelProps {
  node: Node;
  panelHeight: number;
  taskParamsMap: Record<string, TaskParams>;
  onResizeMouseDown: (e: React.MouseEvent) => void;
  onClose: () => void;
  onParamsChange: (params: TaskParams) => void;
  messageApi: MessageInstance;
}

export function BottomPanel({
  node,
  panelHeight,
  taskParamsMap,
  onResizeMouseDown,
  onClose,
  onParamsChange,
  messageApi,
}: BottomPanelProps) {
  const { t } = useTranslation();
  const taskType = node.data.taskType as string | undefined;
  const TaskForm = useMemo(() => {
    if (!taskType) return null;
    const def = getTaskTypeDefinition(taskType);
    return def?.formComponent ?? null;
  }, [taskType]);

  return (
    <>
      <div
        onMouseDown={onResizeMouseDown}
        style={{ height: 3, cursor: "row-resize", background: "var(--ant-color-border-secondary)", flexShrink: 0 }}
      />
      <div
        style={{
          height: panelHeight,
          flexShrink: 0,
          overflow: "auto",
          background: "var(--ant-color-bg-container, #fff)",
          borderTop: "1px solid var(--ant-color-border-secondary)",
        }}
      >
        <BottomPanelHeader
          label={node.data.label as string}
          taskType={taskType}
          onSave={() => void messageApi.success(t("dag.flowSaved"))}
          onClose={onClose}
          saveLabel={t("common.save")}
          closeLabel={t("common.close")}
        />
        <div style={{ padding: 16 }}>
          {TaskForm ? (
            <TaskForm value={taskParamsMap[node.id]} onChange={onParamsChange} />
          ) : (
            <Typography.Text type="secondary">{t("dag.noFormForType")}</Typography.Text>
          )}
        </div>
      </div>
    </>
  );
}
