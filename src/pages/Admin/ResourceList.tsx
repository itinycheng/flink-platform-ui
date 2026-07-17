import { useEffect, useMemo, useState } from "react";
import { Breadcrumb, Button, Input, Modal, Progress, Space, TreeSelect, Upload, message, type TreeSelectProps } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  FolderAddOutlined,
  FolderFilled,
  FolderOpenOutlined,
  HomeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { FolderNode, ResourceFile, ResourcePathItem } from "@/types/admin";
import { getFolderTree, getResources } from "@/api/admin";
import RowActions from "@/components/RowActions";
import { MAX_FILE_SIZE, validateFileSize } from "@/utils/file";
import { formatFileSize, useResourceActions, useResourcePath } from "./ResourceList.hooks";

interface ResourceBreadcrumbProps {
  path: ResourcePathItem[];
  onNavigate: (id?: string) => void;
}

/** Folder trail shown as the resource table's title: Home / … / current. */
function ResourceBreadcrumb({ path, onNavigate }: ResourceBreadcrumbProps) {
  const { t } = useTranslation();
  const items = [
    {
      title: (
        <a onClick={() => onNavigate(undefined)}>
          <HomeOutlined /> {t("resource.home")}
        </a>
      ),
    },
    ...path.map((item, i) => {
      const isCurrent = i === path.length - 1;
      return {
        title: isCurrent ? item.name : <a onClick={() => onNavigate(item.id)}>{item.name}</a>,
      };
    }),
  ];
  return <Breadcrumb items={items} />;
}

interface ResourceNameCellProps {
  record: ResourceFile;
  /** Open a folder (navigates into it). Not called for files. */
  onOpen: (id: string) => void;
}

/** Folder names are clickable (navigate in); file names are plain. */
function ResourceNameCell({ record, onOpen }: ResourceNameCellProps) {
  if (record.isDir) {
    return (
      <a onClick={() => onOpen(record.id)}>
        <FolderFilled style={{ marginRight: 8, color: "#e8b339" }} />
        {record.name}
      </a>
    );
  }
  return (
    <span>
      <FileOutlined style={{ marginRight: 8, color: "var(--ant-color-text-tertiary)" }} />
      {record.name}
    </span>
  );
}

interface ResourceActionsCellProps {
  record: ResourceFile;
  onRename: (record: ResourceFile) => void;
  onMove: (record: ResourceFile) => void;
  onDelete: (id: string) => void;
}

function ResourceActionsCell({ record, onRename, onMove, onDelete }: ResourceActionsCellProps) {
  const { t } = useTranslation();
  const confirm = record.isDir
    ? t("resource.deleteFolderConfirm", { name: record.name })
    : t("resource.deleteConfirmDesc", { name: record.name });
  return (
    <RowActions
      actions={[
        {
          key: "rename",
          tooltip: t("resource.rename"),
          icon: <EditOutlined />,
          onClick: () => onRename(record),
        },
        {
          key: "move",
          tooltip: t("resource.move"),
          icon: <FolderOpenOutlined />,
          onClick: () => onMove(record),
        },
        {
          key: "delete",
          tooltip: t("common.delete"),
          icon: <DeleteOutlined />,
          danger: true,
          confirm,
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}

interface UseResourceColumnsArgs {
  onOpen: (id: string) => void;
  onRename: (record: ResourceFile) => void;
  onMove: (record: ResourceFile) => void;
  onDelete: (id: string) => void;
}

function useResourceColumns(args: UseResourceColumnsArgs): ProColumns<ResourceFile>[] {
  const { t } = useTranslation();
  const { onOpen, onRename, onMove, onDelete } = args;

  return useMemo(
    () => [
      {
        title: t("resource.fileNameLabel"),
        dataIndex: "name",
        key: "name",
        ellipsis: true,
        render: (_, r) => <ResourceNameCell record={r} onOpen={onOpen} />,
      },
      {
        title: t("resource.sizeLabel"),
        dataIndex: "size",
        key: "size",
        width: 120,
        render: (_, r) => (r.isDir ? "-" : formatFileSize(r.size)),
      },
      {
        title: t("common.type"),
        dataIndex: "type",
        key: "type",
        width: 180,
        ellipsis: true,
        render: (_, r) => (r.isDir ? t("resource.folder") : r.type),
      },
      {
        title: t("resource.uploadTimeLabel"),
        dataIndex: "uploadTime",
        key: "uploadTime",
        width: 200,
        valueType: "dateTime",
      },
      {
        title: t("common.operation"),
        key: "action",
        width: 140,
        render: (_, record) => (
          <ResourceActionsCell record={record} onRename={onRename} onMove={onMove} onDelete={onDelete} />
        ),
      },
    ],
    [t, onOpen, onRename, onMove, onDelete],
  );
}

type TreeNode = NonNullable<TreeSelectProps["treeData"]>[number];

/** Sentinel TreeSelect value for the root (move to top level). */
const ROOT_VALUE = "__root__";

interface RenameModalProps {
  target: ResourceFile;
  onClose: () => void;
  onSubmit: (id: string, name: string) => void;
}

/** Rendered with a `key={target.id}` so its input resets per target — no effect needed. */
function RenameModal({ target, onClose, onSubmit }: RenameModalProps) {
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

function MoveModal({ target, onClose, onSubmit }: MoveModalProps) {
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

interface ResourceToolbarProps {
  uploadProgress: number | null;
  onUpload: (file: File) => void;
  onCreateFolder: (name: string) => void;
}

function ResourceToolbar({ uploadProgress, onUpload, onCreateFolder }: ResourceToolbarProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");

  const submitFolder = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreateFolder(trimmed);
    setModalOpen(false);
    setName("");
  };

  return (
    <Space align="center">
      {uploadProgress !== null && <Progress percent={uploadProgress} data-testid="upload-progress" />}
      <Button icon={<FolderAddOutlined />} onClick={() => setModalOpen(true)} data-testid="new-folder-button">
        {t("resource.newFolder")}
      </Button>
      <Upload
        showUploadList={false}
        customRequest={({ file }) => onUpload(file as File)}
        beforeUpload={(file) => {
          if (!validateFileSize(file.size)) {
            message.error(t("resource.fileTooLarge", { name: file.name, max: formatFileSize(MAX_FILE_SIZE) }));
            return Upload.LIST_IGNORE;
          }
          return true;
        }}
      >
        <Button icon={<UploadOutlined />} type="primary" loading={uploadProgress !== null} data-testid="upload-button">
          {t("resource.uploadButton")}
        </Button>
      </Upload>
      <Modal
        title={t("resource.newFolder")}
        open={modalOpen}
        onOk={submitFolder}
        onCancel={() => setModalOpen(false)}
        okText={t("common.ok")}
        cancelText={t("common.cancel")}
        destroyOnHidden
      >
        <Input
          autoFocus
          placeholder={t("resource.folderNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={submitFolder}
        />
      </Modal>
    </Space>
  );
}

export default function ResourceList() {
  const actions = useResourceActions();
  const { actionRef, folder, uploadProgress, navigateFolder } = actions;
  const path = useResourcePath(folder);
  const [renameTarget, setRenameTarget] = useState<ResourceFile | null>(null);
  const [moveTarget, setMoveTarget] = useState<ResourceFile | null>(null);

  const columns = useResourceColumns({
    onOpen: navigateFolder,
    onRename: setRenameTarget,
    onMove: setMoveTarget,
    onDelete: (id) => void actions.handleDelete(id),
  });

  return (
    <>
      <ProTable<ResourceFile, { folder?: string }>
        headerTitle={<ResourceBreadcrumb path={path} onNavigate={navigateFolder} />}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        params={{ folder }}
        toolBarRender={() => [
          <ResourceToolbar
            key="toolbar"
            uploadProgress={uploadProgress}
            onUpload={actions.handleUpload}
            onCreateFolder={actions.handleCreateFolder}
          />,
        ]}
        request={async (params) => {
          const result = await getResources({
            parentId: params.folder,
            page: params.current ?? 1,
            pageSize: params.pageSize ?? 10,
          });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      {renameTarget && (
        <RenameModal
          key={renameTarget.id}
          target={renameTarget}
          onClose={() => setRenameTarget(null)}
          onSubmit={(id, name) => void actions.handleRename(id, name)}
        />
      )}
      {moveTarget && (
        <MoveModal
          key={moveTarget.id}
          target={moveTarget}
          onClose={() => setMoveTarget(null)}
          onSubmit={(id, targetParentId) => void actions.handleMove(id, targetParentId)}
        />
      )}
    </>
  );
}
