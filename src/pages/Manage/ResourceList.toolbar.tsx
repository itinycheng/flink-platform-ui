import { Button, Progress, Space, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { MAX_FILE_SIZE, validateFileSize } from "@/utils/file";
import { formatFileSize } from "./ResourceList.utils";

interface ResourceToolbarProps {
  uploadProgress: number | null;
  onUpload: (file: File) => void;
}

export function ResourceToolbar({ uploadProgress, onUpload }: ResourceToolbarProps) {
  return (
    <Space align="center">
      {uploadProgress !== null && <Progress percent={uploadProgress} data-testid="upload-progress" />}
      <Upload
        showUploadList={false}
        customRequest={({ file }) => onUpload(file as File)}
        beforeUpload={(file) => {
          if (!validateFileSize(file.size)) {
            message.error(`文件 "${file.name}" 大小超过限制（最大 ${formatFileSize(MAX_FILE_SIZE)}）`);
            return Upload.LIST_IGNORE;
          }
          return true;
        }}
      >
        <Button icon={<UploadOutlined />} type="primary" loading={uploadProgress !== null} data-testid="upload-button">
          上传文件
        </Button>
      </Upload>
    </Space>
  );
}
