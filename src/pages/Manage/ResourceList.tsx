import { useMemo } from "react";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { ResourceFile } from "@/types/manage";
import { getResources } from "@/api/manage";
import { formatFileSize } from "./ResourceList.utils";
import { ResourceDeleteCell } from "./ResourceList.cells";
import { useResourceActions } from "./ResourceList.hooks";
import { ResourceToolbar } from "./ResourceList.toolbar";

export default function ResourceList() {
  const { t } = useTranslation();
  const { actionRef, uploadProgress, handleUpload, handleDelete } = useResourceActions();

  const columns = useMemo<ProColumns<ResourceFile>[]>(
    () => [
      { title: t("resource.fileNameLabel"), dataIndex: "name", key: "name", ellipsis: true },
      {
        title: t("resource.sizeLabel"),
        dataIndex: "size",
        key: "size",
        width: 120,
        render: (_, r) => formatFileSize(r.size),
        sorter: true,
      },
      { title: t("common.type"), dataIndex: "type", key: "type", width: 180, ellipsis: true },
      {
        title: t("resource.uploadTimeLabel"),
        dataIndex: "uploadTime",
        key: "uploadTime",
        width: 200,
        valueType: "dateTime",
        sorter: true,
      },
      {
        title: t("common.operation"),
        key: "action",
        width: 100,
        render: (_, record) => <ResourceDeleteCell record={record} onDelete={handleDelete} />,
      },
    ],
    [t, handleDelete],
  );

  return (
    <ProTable<ResourceFile>
      headerTitle={t("resource.title")}
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      search={false}
      toolBarRender={() => [<ResourceToolbar key="upload" uploadProgress={uploadProgress} onUpload={handleUpload} />]}
      request={async (params) => {
        const result = await getResources({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
        return { data: result.data, total: result.total, success: true };
      }}
      pagination={{ defaultPageSize: 10, showSizeChanger: true }}
    />
  );
}
