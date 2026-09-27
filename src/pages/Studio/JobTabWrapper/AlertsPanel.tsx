import { useEffect, useRef, useState } from "react";
import { Button, Form, Select, Space, Spin, message } from "antd";
import { SaveOutlined, PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { FormListFieldData } from "antd";
import { useJobStore } from "@/stores/jobStore";
import { getAllAlertRules } from "@/api/alert";
import { enumOptions, EXECUTION_STATUSES } from "@/constants/enums";
import type { JobFlow } from "@/types/entities";

interface AlertRowProps {
  field: FormListFieldData;
  alertOptions: { label: string; value: number }[];
  t: TFunction;
  onRemove: () => void;
}

/** One JobFlow.alerts row: alert select + trigger-statuses multi-select. */
function AlertRow({ field, alertOptions, t, onRemove }: AlertRowProps) {
  return (
    <Space align="baseline" style={{ display: "flex", marginBottom: 8 }}>
      <Form.Item
        name={[field.name, "alertId"]}
        rules={[{ required: true, message: t("sidePanel.alertSelectRequired") }]}
        style={{ marginBottom: 0 }}
      >
        <Select placeholder={t("sidePanel.selectAlert")} options={alertOptions} style={{ minWidth: 140 }} />
      </Form.Item>
      <Form.Item name={[field.name, "statuses"]} style={{ marginBottom: 0 }}>
        <Select
          mode="multiple"
          placeholder={t("sidePanel.alertStatuses")}
          options={enumOptions(EXECUTION_STATUSES, "ExecutionStatus", t)}
          style={{ minWidth: 160 }}
        />
      </Form.Item>
      <MinusCircleOutlined onClick={onRemove} />
    </Space>
  );
}

/** Alert bindings for a workflow (JobFlow.alerts): each row = one alert + the statuses that trigger it. */
// The form is intentionally kept as one unit so dynamic alert rows share the
// same Ant Form instance and save lifecycle.
// eslint-disable-next-line max-lines-per-function
export default function AlertsPanel({ nodeId }: { nodeId: string }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageApi, ctx] = message.useMessage();
  const [alertOptions, setAlertOptions] = useState<{ label: string; value: number }[]>([]);
  const loadJobFlow = useJobStore((s) => s.loadJobFlow);
  const saveJobFlow = useJobStore((s) => s.saveJobFlow);
  const loadedRef = useRef<JobFlow | null>(null);

  useEffect(() => {
    void getAllAlertRules().then((rules) =>
      setAlertOptions(rules.map((r) => ({ label: `${r.name}(${r.type})`, value: r.id }))),
    );
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void loadJobFlow(nodeId)
      .then((flow) => {
        if (alive && flow) {
          loadedRef.current = flow;
          form.setFieldsValue({ alerts: flow.alerts ?? [] });
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [nodeId, loadJobFlow, form]);

  const onSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await saveJobFlow(nodeId, { ...loadedRef.current, alerts: values.alerts ?? [] } as JobFlow);
      void messageApi.success(t("common.saveSuccess"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Spin spinning={loading}>
      {ctx}
      <Form form={form} layout="vertical" size="small" style={{ padding: "0 4px" }}>
        <Form.List name="alerts">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <AlertRow
                  key={field.key}
                  field={field}
                  alertOptions={alertOptions}
                  t={t}
                  onRemove={() => remove(field.name)}
                />
              ))}
              <Button
                type="dashed"
                size="small"
                onClick={() => add({ alertId: undefined, statuses: [] })}
                icon={<PlusOutlined />}
                block
              >
                {t("sidePanel.addAlert")}
              </Button>
            </>
          )}
        </Form.List>
        <Button
          type="primary"
          size="small"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => void onSave()}
          style={{ marginTop: 12 }}
        >
          {t("common.save")}
        </Button>
      </Form>
    </Spin>
  );
}
