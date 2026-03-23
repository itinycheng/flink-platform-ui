import { useRef, useState } from "react";
import { Button, Upload, message, Popconfirm, Space, Progress } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import type { ResourceFile } from "@/types/manage";
import { getResources, uploadResource, deleteResource } from "@/api/manage";
import { MAX_FILE_SIZE, validateFileSize } from "@/utils/file";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export default function ResourceList() {
  const actionRef = useRef<ActionType>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    setUploadProgress(0);
    try {
      await uploadResource(file, (percent) => {
        setUploadProgress(percent);
      });
      message.success(`文件 "${file.name}" 上传成功`);
      actionRef.current?.reload();
    } catch {
      message.error("文件上传失败，请重试");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResource(id);
      message.success("资源已删除");
      actionRef.current?.reload();
    } catch {
      message.error("删除失败，请重试");
    }
  };

  const columns: ProColumns<ResourceFile>[] = [
    {
      title: "文件名",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      width: 120,
      render: (_, record) => formatFileSize(record.size),
      sorter: true,
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 180,
      ellipsis: true,
    },
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
      render: (_, record) => (
        <Popconfirm
          title="确认删除"
          description={`确定要删除文件 "${record.name}" 吗？`}
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger icon={<DeleteOutlined />} data-testid={`delete-btn-${record.id}`}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <ProTable<ResourceFile>
      headerTitle="资源列表"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      search={false}
      toolBarRender={() => [
        <Space key="upload-area" align="center">
          {uploadProgress !== null && <Progress percent={uploadProgress} data-testid="upload-progress" />}
          <Upload
            showUploadList={false}
            customRequest={({ file }) => {
              handleUpload(file as File);
            }}
            beforeUpload={(file) => {
              if (!validateFileSize(file.size)) {
                message.error(`文件 "${file.name}" 大小超过限制（最大 ${formatFileSize(MAX_FILE_SIZE)}）`);
                return Upload.LIST_IGNORE;
              }
              return true;
            }}
          >
            <Button
              icon={<UploadOutlined />}
              type="primary"
              loading={uploadProgress !== null}
              data-testid="upload-button"
            >
              上传文件
            </Button>
          </Upload>
        </Space>,
      ]}
      request={async (params) => {
        const { current, pageSize } = params;
        const result = await getResources({
          page: current ?? 1,
          pageSize: pageSize ?? 10,
        });
        return {
          data: result.data,
          total: result.total,
          success: true,
        };
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
      }}
    />
  );
}
