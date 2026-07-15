import { useMemo } from "react";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { ResourceFile } from "@/types/manage";
import { getResources } from "@/api/manage";
import { formatFileSize } from "./ResourceList.utils";
import { ResourceNameCell, ResourceActionsCell } from "./ResourceList.cells";
import { useResourceActions, useResourcePath } from "./ResourceList.hooks";
import { ResourceToolbar } from "./ResourceList.toolbar";
import { ResourceBreadcrumb } from "./ResourceList.breadcrumb";

export default function ResourceList() {
  const { t } = useTranslation();
  const { actionRef, folder, uploadProgress, navigateFolder, handleUpload, handleCreateFolder, handleDelete } =
    useResourceActions();
  const path = useResourcePath(folder);

  const columns = useMemo<ProColumns<ResourceFile>[]>(
    () => [
      {
        title: t("resource.fileNameLabel"),
        dataIndex: "name",
        key: "name",
        ellipsis: true,
        render: (_, r) => <ResourceNameCell record={r} onOpen={navigateFolder} />,
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
        width: 100,
        render: (_, record) => <ResourceActionsCell record={record} onDelete={handleDelete} />,
      },
    ],
    [t, navigateFolder, handleDelete],
  );

  return (
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
          onUpload={handleUpload}
          onCreateFolder={handleCreateFolder}
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
  );
}
