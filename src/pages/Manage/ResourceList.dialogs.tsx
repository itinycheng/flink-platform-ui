import { useEffect, useMemo, useState } from "react";
import { Input, Modal, TreeSelect, type TreeSelectProps } from "antd";
import { useTranslation } from "react-i18next";
import { getFolderTree } from "@/api/manage";
import type { FolderNode, ResourceFile } from "@/types/manage";

type TreeNode = NonNullable<TreeSelectProps["treeData"]>[number];

/** Sentinel TreeSelect value for the root (move to top level). */
const ROOT_VALUE = "__root__";

interface RenameModalProps {
  target: ResourceFile;
  onClose: () => void;
  onSubmit: (id: string, name: string) => void;
}

/** Rendered with a `key={target.id}` so its input resets per target — no effect needed. */
export function RenameModal({ target, onClose, onSubmit }: RenameModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(target.name);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === target.name) {
      onClose();
      return;
    }
    onSubmit(target.id, trimmed);
    onClose();
  };

  return (
    <Modal
      open
      title={t("resource.rename")}
      onOk={submit}
      onCancel={onClose}
      okText={t("common.ok")}
      cancelText={t("common.cancel")}
    >
      <Input
        autoFocus
        placeholder={t("resource.renamePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={submit}
      />
    </Modal>
  );
}

/** Collect a folder's own id plus all descendant ids (disallowed move targets). */
function subtreeIds(nodes: FolderNode[], id: string): Set<string> {
  const result = new Set<string>();
  const find = (list: FolderNode[]): FolderNode | undefined => {
    for (const n of list) {
      if (n.id === id) return n;
      const hit = find(n.children);
      if (hit) return hit;
    }
    return undefined;
  };
  const walk = (n: FolderNode) => {
    result.add(n.id);
    n.children.forEach(walk);
  };
  const node = find(nodes);
  if (node) walk(node);
  return result;
}

function toTreeData(nodes: FolderNode[], disallowed: Set<string>): TreeNode[] {
  return nodes.map((n) => ({
    title: n.name,
    value: n.id,
    disabled: disallowed.has(n.id),
    children: toTreeData(n.children, disallowed),
  }));
}

interface MoveModalProps {
  target: ResourceFile;
  onClose: () => void;
  onSubmit: (id: string, targetParentId?: string) => void;
}

export function MoveModal({ target, onClose, onSubmit }: MoveModalProps) {
  const { t } = useTranslation();
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [value, setValue] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getFolderTree();
        if (!cancelled) setTree(data);
      } catch (err) {
        console.error("[Resource] load folders failed", err);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // A folder can't move into itself or its own descendants.
  const disallowed = useMemo(() => (target.isDir ? subtreeIds(tree, target.id) : new Set<string>()), [tree, target]);
  const treeData = useMemo<TreeNode[]>(
    () => [{ title: t("resource.home"), value: ROOT_VALUE, children: toTreeData(tree, disallowed) }],
    [t, tree, disallowed],
  );

  const submit = () => {
    if (value === undefined) return;
    onSubmit(target.id, value === ROOT_VALUE ? undefined : value);
    onClose();
  };

  return (
    <Modal
      open
      title={t("resource.moveTitle")}
      onOk={submit}
      onCancel={onClose}
      okText={t("common.ok")}
      cancelText={t("common.cancel")}
      okButtonProps={{ disabled: value === undefined }}
    >
      <TreeSelect
        style={{ width: "100%" }}
        treeData={treeData}
        value={value}
        onChange={setValue}
        placeholder={t("resource.moveTargetPlaceholder")}
        treeDefaultExpandAll
        showSearch
        treeNodeFilterProp="title"
      />
    </Modal>
  );
}
