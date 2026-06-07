import { useMemo } from "react";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import type { ResourceFile } from "@/types/manage";
import { getResources } from "@/api/manage";
import { formatFileSize } from "./ResourceList.utils";
import { ResourceDeleteCell } from "./ResourceList.cells";
import { useResourceActions } from "./ResourceList.hooks";
import { ResourceToolbar } from "./ResourceList.toolbar";

export default function ResourceList() {
  const { actionRef, uploadProgress, handleUpload, handleDelete } = useResourceActions();

  const columns = useMemo<ProColumns<ResourceFile>[]>(
    () => [
      { title: "文件名", dataIndex: "name", key: "name", ellipsis: true },
      {
        title: "大小",
        dataIndex: "size",
        key: "size",
        width: 120,
        render: (_, r) => formatFileSize(r.size),
        sorter: true,
      },
      { title: "类型", dataIndex: "type", key: "type", width: 180, ellipsis: true },
      {
        title: "上传时间",
        dataIndex: "uploadTime",
        key: "uploadTime",
        width: 200,
        valueType: "dateTime",
        sorter: true,
      },
      {
        title: "操作",
        key: "action",
        width: 100,
        render: (_, record) => <ResourceDeleteCell record={record} onDelete={handleDelete} />,
      },
    ],
    [handleDelete],
  );

  return (
    <ProTable<ResourceFile>
      headerTitle="资源列表"
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
