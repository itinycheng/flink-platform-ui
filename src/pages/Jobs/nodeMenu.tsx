import type { MenuProps } from "antd";
import {
  PlusOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  CopyOutlined,
  TagsOutlined,
  BellOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { TFunction } from "i18next";
import type { JobTreeNode } from "@/types/job";

type MenuItem = Required<MenuProps>["items"][number];

function groupMenu(t: TFunction): MenuItem[] {
  return [
    { key: "addWorkflow", icon: <PlusOutlined />, label: t("workflow.addWorkflow") },
    { key: "addTask", icon: <PlusOutlined />, label: t("workflow.addTask") },
    { type: "divider" },
    { key: "rename", icon: <EditOutlined />, label: t("workflow.editName") },
    { key: "delete", icon: <DeleteOutlined />, label: t("common.delete"), danger: true },
  ];
}

/** Lifecycle menu for a definition node (Task or Workflow), driven by its status. */
function definitionMenu(node: JobTreeNode, t: TFunction): MenuItem[] {
  const s = node.lifecycleStatus ?? "OFFLINE";
  const items: MenuItem[] = [
    { key: "runOnce", icon: <PlayCircleOutlined />, label: t("definitions.runOnce") },
    { type: "divider" },
  ];
  if (s === "OFFLINE") items.push({ key: "online", icon: <CloudUploadOutlined />, label: t("definitions.online") });
  if (s === "ONLINE") {
    items.push(
      { key: "offline", icon: <CloudDownloadOutlined />, label: t("definitions.offline") },
      { key: "startSchedule", icon: <ClockCircleOutlined />, label: t("definitions.startSchedule") },
    );
  }
  if (s === "SCHEDULING") {
    items.push({ key: "stopSchedule", icon: <PauseCircleOutlined />, label: t("definitions.stopSchedule") });
  }
  items.push(
    { type: "divider" },
    { key: "editTags", icon: <TagsOutlined />, label: t("definitions.editTags") },
    { key: "editAlerts", icon: <BellOutlined />, label: t("definitions.editAlerts") },
    { key: "copy", icon: <CopyOutlined />, label: t("definitions.copy") },
  );
  // A scheduling definition must be stopped before it can be deleted.
  if (s !== "SCHEDULING") {
    items.push({ type: "divider" }, { key: "delete", icon: <DeleteOutlined />, label: t("common.delete"), danger: true });
  }
  return items;
}

export function buildNodeMenuItems(node: JobTreeNode, t: TFunction): MenuProps["items"] {
  return node.type === "group" ? groupMenu(t) : definitionMenu(node, t);
}
