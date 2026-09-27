import { useEffect, useMemo, useState } from "react";
import {
  Breadcrumb,
  Button,
  Input,
  Modal,
  Progress,
  Space,
  TreeSelect,
  Upload,
  message,
  type TreeSelectProps,
} from "antd";
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
import type { Resource } from "@/types/entities";
import { getFolderTree, getResources } from "@/api/admin";
import RowActions from "@/components/RowActions";
import { MAX_FILE_SIZE, validateFileSize } from "@/utils/file";
import { formatFileSize, useResourceActions, useResourcePath } from "./ResourceList.hooks";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/app/queryClient";
import { queryKeys } from "@/api/queryKeys";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface ResourceBreadcrumbProps {
  path: Resource[];
  onNavigate: (id?: number) => void;
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
  record: Resource;
  /** Open a folder (navigates into it). Not called for files. */
  onOpen: (id: number) => void;
}

/** Folder names are clickable (navigate in); file names are plain. */
function ResourceNameCell({ record, onOpen }: ResourceNameCellProps) {
  if (record.type === "DIR") {
    return (
      <a onClick={() => record.id != null && onOpen(record.id)}>
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
  record: Resource;
  onRename: (record: Resource) => void;
  onMove: (record: Resource) => void;
  onDelete: (id: number) => void;
}

function ResourceActionsCell({ record, onRename, onMove, onDelete }: ResourceActionsCellProps) {
  const { t } = useTranslation();
  const confirm =
    record.type === "DIR"
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
          onClick: () => record.id != null && onDelete(record.id),
        },
      ]}
    />
  );
}

interface UseResourceColumnsArgs {
  onOpen: (id: number) => void;
  onRename: (record: Resource) => void;
  onMove: (record: Resource) => void;
  onDelete: (id: number) => void;
}

function useResourceColumns(args: UseResourceColumnsArgs): ProColumns<Resource>[] {
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
        title: t("common.type"),
        dataIndex: "type",
        key: "type",
        width: 140,
        render: (_, r) => t(`enums.ResourceType.${r.type}`),
      },
      {
        title: t("common.description"),
        dataIndex: "description",
        key: "description",
        ellipsis: true,
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
  target: Resource;
  onClose: () => void;
  onSubmit: (id: number, name: string) => void;
}

/** Rendered with a `key={target.id}` so its input resets per target — no effect needed. */
function RenameModal({ target, onClose, onSubmit }: RenameModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(target.name);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === target.name || target.id == null) {
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

/** Collect a folder's own id plus all descendant ids (disallowed move targets), from the flat DIR list. */
function subtreeIds(list: Resource[], id: number): Set<number> {
  const result = new Set<number>([id]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const r of list) {
      if (r.id != null && r.pid != null && result.has(r.pid) && !result.has(r.id)) {
        result.add(r.id);
        changed = true;
      }
    }
  }
  return result;
}

/** Nest the flat DIR list by `pid` into TreeSelect nodes (root = items with `pid == null`). */
function buildFolderTree(list: Resource[], pid: number | undefined, disallowed: Set<number>): TreeNode[] {
  return list
    .filter((r) => (pid === undefined ? r.pid == null : r.pid === pid))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => ({
      title: n.name,
      value: n.id as number,
      disabled: n.id != null && disallowed.has(n.id),
      children: buildFolderTree(list, n.id, disallowed),
    }));
}

interface MoveModalProps {
  target: Resource;
  onClose: () => void;
  onSubmit: (id: number, targetPid?: number) => void;
}

function MoveModal({ target, onClose, onSubmit }: MoveModalProps) {
  const { t } = useTranslation();
  const [tree, setTree] = useState<Resource[]>([]);
  const [value, setValue] = useState<string | number>();

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
  const disallowed = useMemo(
    () => (target.type === "DIR" && target.id != null ? subtreeIds(tree, target.id) : new Set<number>()),
    [tree, target],
  );
  const treeData = useMemo<TreeNode[]>(
    () => [{ title: t("resource.home"), value: ROOT_VALUE, children: buildFolderTree(tree, undefined, disallowed) }],
    [t, tree, disallowed],
  );

  const submit = () => {
    if (value === undefined || target.id == null) return;
    onSubmit(target.id, value === ROOT_VALUE ? undefined : Number(value));
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
  const { folder, uploadProgress, navigateFolder } = actions;
  const path = useResourcePath(folder);
  const workspaceId = useWorkspaceStore((state) => state.currentId);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const resourcesQuery = useQuery(
    {
      queryKey: queryKeys.adminList(workspaceId, "resources", { folder, ...pagination }),
      queryFn: () => getResources({ pid: folder, ...pagination }),
      enabled: workspaceId != null,
    },
    queryClient,
  );
  const [renameTarget, setRenameTarget] = useState<Resource | null>(null);
  const [moveTarget, setMoveTarget] = useState<Resource | null>(null);

  const columns = useResourceColumns({
    onOpen: navigateFolder,
    onRename: setRenameTarget,
    onMove: setMoveTarget,
    onDelete: (id) => void actions.handleDelete(id),
  });

  return (
    <>
      <ProTable<Resource, { folder?: number }>
        headerTitle={<ResourceBreadcrumb path={path} onNavigate={navigateFolder} />}
        rowKey="id"
        columns={columns}
        dataSource={resourcesQuery.data?.data ?? []}
        loading={resourcesQuery.isFetching}
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
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: resourcesQuery.data?.total ?? 0,
          showSizeChanger: true,
          onChange: (page, pageSize) => setPagination({ page, pageSize }),
        }}
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
          onSubmit={(id, targetPid) => void actions.handleMove(id, targetPid)}
        />
      )}
    </>
  );
}
