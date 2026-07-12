import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { Worker } from "@/types/manage";
import { getWorkers } from "@/api/manage";
import { useWorkerCrud } from "./WorkerList.hooks";
import { WorkerFormModal } from "./WorkerList.modal";
import { WorkerActionsCell, WorkerRoleTag, WorkerStatusTag } from "./WorkerList.cells";

export default function WorkerList() {
  const { t } = useTranslation();
  const crud = useWorkerCrud();

  const columns = useMemo<ProColumns<Worker>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      { title: t("worker.ip"), dataIndex: "ip", key: "ip", width: 160 },
      { title: t("worker.port"), dataIndex: "port", key: "port", width: 100 },
      { title: t("worker.role"), dataIndex: "role", key: "role", width: 100, render: (_, r) => <WorkerRoleTag role={r.role} /> },
      {
        title: t("common.status"),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, r) => <WorkerStatusTag status={r.status} />,
      },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <WorkerActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="worker-list">
      <ProTable<Worker>
        headerTitle={t("worker.title")}
        actionRef={crud.actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={crud.handleAdd}
            data-testid="add-worker-button"
          >
            {t("worker.add")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getWorkers({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <WorkerFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingWorker}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
