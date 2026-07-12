import { useMemo } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { AlertRule } from "@/types/alert";
import { getAlertRules } from "@/api/alert";
import { useAlertRuleCrud } from "./AlertRuleList.hooks";
import { AlertRuleFormModal } from "./AlertRuleList.modal";
import { AlertChannelTag, AlertRuleActionsCell } from "./AlertRuleList.cells";

export default function AlertRuleList() {
  const { t } = useTranslation();
  const crud = useAlertRuleCrud();

  const columns = useMemo<ProColumns<AlertRule>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      {
        title: t("common.type"),
        dataIndex: "type",
        key: "type",
        width: 120,
        render: (_, r) => <AlertChannelTag type={r.type} />,
      },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      { title: t("common.updatedAt"), dataIndex: "updatedAt", key: "updatedAt", width: 180 },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <AlertRuleActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="alert-rule-list">
      <ProTable<AlertRule>
        headerTitle={t("alertRule.title")}
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
            data-testid="add-alert-rule-button"
          >
            {t("alertRule.addButton")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getAlertRules({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <AlertRuleFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingRule}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
