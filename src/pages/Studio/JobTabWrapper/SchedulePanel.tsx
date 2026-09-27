import { useEffect, useRef, useState } from "react";
import { Button, Form, Input, InputNumber, Select, Spin, Switch, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useJobStore } from "@/stores/jobStore";
import { DurationInput } from "@/components/form";
import { enumOptions, TIMEOUT_STRATEGIES } from "@/constants/enums";
import type { JobFlow } from "@/types/entities";
import CronPreview from "./CronPreview";

/** Schedule settings for a workflow (JobFlow): cron, parallelism, timeout, priority. */
export default function SchedulePanel({ nodeId }: { nodeId: string }) {
  const { t } = useTranslation();
  // Untyped form: Ant's strict Store typing rejects JobFlow.params (Record<string, unknown>).
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageApi, ctx] = message.useMessage();
  const loadJobFlow = useJobStore((s) => s.loadJobFlow);
  const saveJobFlow = useJobStore((s) => s.saveJobFlow);
  // The full loaded flow — merge form edits OVER it so unedited fields
  // (type, code, description, tags, alerts, status, id, name) survive the save.
  const loadedRef = useRef<JobFlow | null>(null);
  const cron = Form.useWatch("cronExpr", form) as string | undefined;
  const timeoutEnabled = Form.useWatch(["timeout", "enable"], form) as boolean | undefined;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void loadJobFlow(nodeId)
      .then((flow) => {
        if (alive && flow) {
          loadedRef.current = flow;
          form.setFieldsValue(flow);
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
      const prev = loadedRef.current;
      // Deep-merge the nested config/timeout so their un-edited sub-fields
      // (e.g. ExecutionConfig.strategy/startJobId/scheduleTime) survive the save.
      await saveJobFlow(nodeId, {
        ...prev,
        ...values,
        config: { ...prev?.config, ...values.config },
        timeout: { ...prev?.timeout, ...values.timeout },
      } as JobFlow);
      void messageApi.success(t("common.saveSuccess"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Spin spinning={loading}>
      {ctx}
      <Form form={form} layout="vertical" size="small" style={{ padding: "0 4px" }}>
        <Form.Item name="cronExpr" label={t("sidePanel.cronExpression")}>
          <Input placeholder="0 0 * * * ?" />
        </Form.Item>
        <CronPreview expression={cron ?? ""} />
        <Form.Item name={["config", "parallelism"]} label={t("sidePanel.parallelism")} initialValue={1}>
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="priority" label={t("sidePanel.priority")}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name={["timeout", "enable"]} label={t("sidePanel.timeoutEnable")} valuePropName="checked">
          <Switch />
        </Form.Item>
        {timeoutEnabled && (
          <>
            <Form.Item name={["timeout", "strategies"]} label={t("sidePanel.timeoutStrategies")}>
              <Select mode="multiple" options={enumOptions(TIMEOUT_STRATEGIES, "TimeoutStrategy", t)} />
            </Form.Item>
            <Form.Item name={["timeout", "threshold"]} label={t("sidePanel.timeoutThreshold")}>
              <DurationInput />
            </Form.Item>
          </>
        )}
        <Button type="primary" size="small" icon={<SaveOutlined />} loading={saving} onClick={() => void onSave()}>
          {t("common.save")}
        </Button>
      </Form>
    </Spin>
  );
}
