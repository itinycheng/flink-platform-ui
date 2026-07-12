import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { SysConfig } from "@/types/manage";
import { getSysConfigs } from "@/api/manage";
import { useSysConfigCrud } from "./SysConfigList.hooks";
import { SysConfigFormModal } from "./SysConfigList.modal";
import { SysConfigActionsCell, SysConfigStatusTag, SysConfigTypeTag } from "./SysConfigList.cells";

export default function SysConfigList() {
  const { t } = useTranslation();
  const crud = useSysConfigCrud();

  const columns = useMemo<ProColumns<SysConfig>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      {
        title: t("common.type"),
        dataIndex: "type",
        key: "type",
        width: 130,
        render: (_, r) => <SysConfigTypeTag type={r.type} />,
      },
      { title: t("sysConfig.version"), dataIndex: "version", key: "version", width: 120 },
      {
        title: t("common.status"),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, r) => <SysConfigStatusTag status={r.status} />,
      },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      { title: t("common.updatedAt"), dataIndex: "updatedAt", key: "updatedAt", width: 200 },
      {
        title: t("common.operation"),
        key: "action",
        width: 200,
        render: (_, record) => (
          <SysConfigActionsCell
            record={record}
            onEdit={crud.handleEdit}
            onDelete={crud.handleDelete}
            onPurge={crud.handlePurge}
          />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete, crud.handlePurge],
  );

  return (
    <div data-testid="sysconfig-list">
      <ProTable<SysConfig>
        headerTitle={t("sysConfig.title")}
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
            data-testid="add-sysconfig-button"
          >
            {t("sysConfig.add")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getSysConfigs({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <SysConfigFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingConfig}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
