import type { MenuProps } from "antd";
import {
  PlusOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  CopyOutlined,
  TagsOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  FolderAddOutlined,
} from "@ant-design/icons";
import type { TFunction } from "i18next";
import type { JobTreeNode } from "@/types/job";

type MenuItem = Required<MenuProps>["items"][number];

function groupMenu(node: JobTreeNode, t: TFunction): MenuItem[] {
  const items: MenuItem[] = [
    { key: "addWorkflow", icon: <PlusOutlined />, label: t("workflow.addWorkflow") },
    { key: "addTask", icon: <PlusOutlined />, label: t("workflow.addTask") },
  ];
  if (node.pid === "") items.push({ key: "addSubgroup", icon: <FolderAddOutlined />, label: t("workflow.addSubgroup") });
  items.push(
    { type: "divider" },
    { key: "rename", icon: <EditOutlined />, label: t("workflow.editName") },
    { key: "delete", icon: <DeleteOutlined />, label: t("common.delete"), danger: true },
  );
  return items;
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
    { key: "copy", icon: <CopyOutlined />, label: t("definitions.copy") },
  );
  // A scheduling definition must be stopped before it can be deleted.
  if (s !== "SCHEDULING") {
    items.push({ type: "divider" }, { key: "delete", icon: <DeleteOutlined />, label: t("common.delete"), danger: true });
  }
  return items;
}

export function buildNodeMenuItems(node: JobTreeNode, t: TFunction): MenuProps["items"] {
  return node.kind === "group" ? groupMenu(node, t) : definitionMenu(node, t);
}
