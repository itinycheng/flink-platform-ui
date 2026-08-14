import { useEffect, useState } from "react";
import { Button, Flex, Form, Input, InputNumber, Select, Spin, message } from "antd";
import type { FormInstance } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useJobStore } from "@/stores/jobStore";
import { getTaskTypeDef, taskTypeOptions } from "@/pages/Studio/tasks/registry";
import { WorkerSelect, KeyValueEditor } from "@/components/form";
import CodeEditor from "@/components/CodeEditor";
import { DEPLOY_MODES, EXECUTION_MODES, JOB_TYPE_CLASSIFICATION, enumOptions, type JobType } from "@/constants/enums";
import type { JobInfo } from "@/types/entities";
import { typeChangeFields } from "@/pages/Studio/JobForm.typeChange";

/**
 * Thin adapter: `CodeEditor` requires `value`/`onChange`/`minHeight` (not
 * `height`), which Ant `Form.Item` can inject but TS can't see when used
 * directly as a Form child — this wraps it with optional props instead.
 */
function CodeField({
  value,
  onChange,
  language,
}: {
  value?: string;
  onChange?: (v: string) => void;
  language: "sql" | "shell";
}) {
  return <CodeEditor value={value ?? ""} onChange={onChange ?? (() => {})} language={language} minHeight={200} />;
}

function resetForType(form: FormInstance, nextType: JobType) {
  form.setFields(typeChangeFields(nextType, form.getFieldValue("execMode") as string | undefined));
}

interface CommonFieldsProps {
  form: FormInstance;
  isFlink: boolean;
}

function CommonFields({ form, isFlink }: CommonFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <Form.Item name="name" label={t("common.name")} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="type" label={t("common.type")} rules={[{ required: true }]}>
        <Select options={taskTypeOptions(t)} onChange={(v: JobType) => resetForType(form, v)} />
      </Form.Item>
      <Form.Item name="execMode" label={t("taskForm.execMode")} rules={[{ required: true }]}>
        <Select options={enumOptions(isFlink ? EXECUTION_MODES : (["BATCH"] as const), "ExecutionMode", t)} />
      </Form.Item>
      <Form.Item name="deployMode" label={t("taskForm.deployMode")}>
        <Select allowClear options={enumOptions(DEPLOY_MODES, "DeployMode", t)} />
      </Form.Item>
      <Form.Item name="version" label={t("taskForm.version")}>
        <Input />
      </Form.Item>
      <Form.Item
        name="routeUrl"
        label={t("taskForm.worker")}
        rules={[{ required: true, message: t("taskForm.workerRequired") }]}
      >
        <WorkerSelect />
      </Form.Item>
      <Form.Item name="description" label={t("common.description")}>
        <Input.TextArea rows={2} />
      </Form.Item>
    </>
  );
}

function RetryFields() {
  const { t } = useTranslation();
  return (
    <>
      <Form.Item name={["config", "retryTimes"]} label={t("taskForm.retryTimes")} initialValue={0}>
        <InputNumber min={0} />
      </Form.Item>
      <Form.Item name={["config", "retryInterval"]} label={t("taskForm.retryInterval")} initialValue="5s">
        <Input />
      </Form.Item>
    </>
  );
}

export default function JobForm({ nodeId }: { nodeId: string }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageApi, ctx] = message.useMessage();
  const loadJobInfo = useJobStore((s) => s.loadJobInfo);
  const saveJobInfo = useJobStore((s) => s.saveJobInfo);
  const type = Form.useWatch("type", form) as JobType | undefined;
  const def = type ? getTaskTypeDef(type) : undefined;
  const isFlink = type ? JOB_TYPE_CLASSIFICATION[type] === "FLINK" : false;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void loadJobInfo(nodeId)
      .then((info) => {
        if (alive && info) form.setFieldsValue(info);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [nodeId, loadJobInfo, form]);

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      // `config.type` must always mirror the top-level `type` on save, even
      // though the ConfigFields components don't manage it directly.
      const jobInfo: JobInfo = { ...values, config: { ...values.config, type: values.type } };
      setSaving(true);
      await saveJobInfo(nodeId, jobInfo);
      void messageApi.success(t("common.saveSuccess"));
    } catch {
      /* validation errors are shown inline */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex vertical style={{ height: "100%", background: "var(--ant-color-bg-container)" }}>
      {ctx}
      <Flex
        justify="flex-end"
        style={{ padding: "6px 12px", borderBottom: "1px solid var(--ant-color-border-secondary)" }}
      >
        <Button type="primary" size="small" icon={<SaveOutlined />} loading={saving} onClick={() => void onSave()}>
          {t("common.save")}
        </Button>
      </Flex>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <Spin spinning={loading}>
          <Form form={form} layout="vertical">
            <CommonFields form={form} isFlink={isFlink} />
            {def && <def.ConfigFields />}
            <RetryFields />
            {def?.needsSubject && (
              <Form.Item name="subject" label={t("taskForm.subject")} rules={[{ required: true }]}>
                <CodeField language={def.subjectLanguage ?? "sql"} />
              </Form.Item>
            )}
            <Form.Item name="params" label={t("taskForm.params")}>
              <KeyValueEditor />
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </Flex>
  );
}
