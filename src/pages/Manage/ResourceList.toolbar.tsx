import { useState } from "react";
import { Button, Input, Modal, Progress, Space, Upload, message } from "antd";
import { FolderAddOutlined, UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { MAX_FILE_SIZE, validateFileSize } from "@/utils/file";
import { formatFileSize } from "./ResourceList.utils";

interface ResourceToolbarProps {
  uploadProgress: number | null;
  onUpload: (file: File) => void;
  onCreateFolder: (name: string) => void;
}

export function ResourceToolbar({ uploadProgress, onUpload, onCreateFolder }: ResourceToolbarProps) {
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
