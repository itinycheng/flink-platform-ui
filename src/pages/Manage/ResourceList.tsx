import { useState } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ResourceFile } from "@/types/manage";
import { getResources } from "@/api/manage";
import { useResourceActions, useResourcePath } from "./ResourceList.hooks";
import { useResourceColumns } from "./ResourceList.columns";
import { ResourceToolbar } from "./ResourceList.toolbar";
import { ResourceBreadcrumb } from "./ResourceList.breadcrumb";
import { RenameModal, MoveModal } from "./ResourceList.dialogs";

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
