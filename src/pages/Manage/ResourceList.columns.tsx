import { useMemo } from "react";
import type { ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { ResourceFile } from "@/types/manage";
import { formatFileSize } from "./ResourceList.utils";
import { ResourceNameCell, ResourceActionsCell } from "./ResourceList.cells";

interface UseResourceColumnsArgs {
  onOpen: (id: string) => void;
  onRename: (record: ResourceFile) => void;
  onMove: (record: ResourceFile) => void;
  onDelete: (id: string) => void;
}

export function useResourceColumns(args: UseResourceColumnsArgs): ProColumns<ResourceFile>[] {
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
