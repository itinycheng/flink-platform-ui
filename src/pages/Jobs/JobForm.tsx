import { useCallback, useEffect, useMemo } from "react";
import { ConfigProvider, Form, message } from "antd";
import { ProForm, ProFormText, ProFormSelect, ProFormSwitch, ProFormTextArea } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import { validateCron } from "@/utils/cron";
import { useJobStore } from "@/stores/jobStore";
import { getTaskTypeOptions, getTaskTypeDefinition } from "@/pages/Jobs/tasks/registry";
import type { WorkflowFormData, TaskParams } from "@/types/job";

const formTheme = {
  components: {
    Input: { activeBorderColor: "#168eff", hoverBorderColor: "#168eff80" },
    Select: { activeBorderColor: "#168eff", hoverBorderColor: "#168eff80" },
  },
};

export default function JobForm() {
  const [form] = Form.useForm<WorkflowFormData>();
  const { formData, setFormData, saveWorkflow, operationLoading } = useJobStore();
  const [messageApi, contextHolder] = message.useMessage();
  const { t } = useTranslation();

  const taskTypeOptions = useMemo(() => getTaskTypeOptions(), []);

  useEffect(() => {
    if (formData) {
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
    }
  }, [formData, form]);

  const cronValidator = useCallback(
    (_rule: unknown, value: string) => {
      if (!value || !value.trim()) {
        return Promise.reject(new Error(t("workflowForm.cronRequired")));
      }
      const result = validateCron(value);
      if (!result.valid) {
        return Promise.reject(new Error(result.error));
      }
      return Promise.resolve();
    },
    [t],
  );

  const handleTaskTypeChange = useCallback(
    (newType: string) => {
      const definition = getTaskTypeDefinition(newType);
      if (definition) {
        form.setFieldsValue({ taskParams: definition.defaultParams });
      }
    },
    [form],
  );

  const taskType = Form.useWatch("taskType", form);
  const TaskParamsForm = useMemo(() => {
    if (!taskType) return null;
    const definition = getTaskTypeDefinition(taskType);
    return definition?.formComponent ?? null;
  }, [taskType]);

  const handleFinish = useCallback(
    async (values: WorkflowFormData) => {
      try {
        const data: WorkflowFormData = { ...formData, ...values };
        await saveWorkflow(data);
        setFormData(data);
        void messageApi.success(t("workflowForm.saveSuccess"));
      } catch {
        void messageApi.error(t("workflowForm.saveFailed"));
      }
    },
    [formData, saveWorkflow, setFormData, messageApi, t],
  );

  return (
    <ConfigProvider theme={formTheme}>
      {contextHolder}
      <div style={{ height: "100%", overflow: "auto", padding: 16, background: "#fff" }}>
        <ProForm<WorkflowFormData>
          form={form}
          grid
          rowProps={{ gutter: 16 }}
          layout="vertical"
          onFinish={handleFinish}
          loading={operationLoading}
          initialValues={{ enabled: true, taskType: undefined, taskParams: {} }}
          submitter={{ searchConfig: { submitText: t("common.save") }, resetButtonProps: false }}
        >
          <ProFormText
            colProps={{ span: 8 }}
            name="name"
            label={t("workflowForm.workflowName")}
            placeholder={t("workflowForm.workflowNamePlaceholder")}
            rules={[{ required: true, message: t("workflowForm.workflowNameRequired") }]}
          />
          <ProFormText
            colProps={{ span: 8 }}
            name="cronExpression"
            label={t("workflowForm.cronExpression")}
            placeholder={t("workflowForm.cronPlaceholder")}
            rules={[{ required: true, validator: cronValidator }]}
          />
          <ProFormSelect
            colProps={{ span: 5 }}
            name="taskType"
            label={t("workflowForm.taskType")}
            placeholder={t("workflowForm.taskTypePlaceholder")}
            options={taskTypeOptions}
            rules={[{ required: true, message: t("workflowForm.taskTypeRequired") }]}
            fieldProps={{ onChange: handleTaskTypeChange }}
          />
          <ProFormSwitch colProps={{ span: 3 }} name="enabled" label={t("workflowForm.enable")} />

          {TaskParamsForm && (
            <Form.Item label={t("workflowForm.taskParams")} style={{ gridColumn: "span 24" }}>
              <Form.Item name="taskParams" noStyle>
                <TaskParamsFormWrapper Component={TaskParamsForm} />
              </Form.Item>
            </Form.Item>
          )}

          <ProFormTextArea
            colProps={{ span: 24 }}
            name="description"
            label={t("workflowForm.description")}
            placeholder={t("workflowForm.descriptionPlaceholder")}
            fieldProps={{ rows: 2 }}
          />
        </ProForm>
      </div>
    </ConfigProvider>
  );
}

function TaskParamsFormWrapper({
  Component,
  value,
  onChange,
}: {
  Component: React.ComponentType<{ value?: TaskParams; onChange?: (v: TaskParams) => void }>;
  value?: TaskParams;
  onChange?: (v: TaskParams) => void;
}) {
  return <Component value={value} onChange={onChange} />;
}
