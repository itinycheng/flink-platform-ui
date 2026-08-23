// Per-JobType `config.*` field groups, rendered inside the real JobInfo Form
// (see JobForm.tsx). Each component reads/writes Ant Form context directly
// (no props) — the Form.Item `name` paths are what wire them to `config.*`.
import { Form, Input, InputNumber, Select } from "antd";
import { useTranslation } from "react-i18next";
import {
  DEPENDENT_RELATIONS,
  DEPENDENT_STRATEGIES,
  EXECUTION_CONDITIONS,
  EXECUTION_STATUSES,
  PARAM_TRANSFER_MODES,
  enumOptions,
} from "@/constants/enums";
import {
  CatalogSelect,
  DatasourceSelect,
  DurationInput,
  DynamicListEditor,
  KeyValueEditor,
  ResourceSelect,
  isValidDuration,
} from "@/components/form";
import type { DependentItem } from "@/types/task";

export function JavaConfigFields() {
  return null;
}

export function SqlConfigFields() {
  const { t } = useTranslation();
  const jobType = Form.useWatch("type");
  return (
    <Form.Item
      name={["config", "dsId"]}
      label={t("taskForm.datasource")}
      rules={[{ required: true, message: t("taskForm.datasourceRequired") }]}
    >
      <DatasourceSelect jobType={jobType} />
    </Form.Item>
  );
}

export function ShellConfigFields() {
  const { t } = useTranslation();
  return (
    <Form.Item
      name={["config", "timeout"]}
      label={t("taskForm.timeout")}
      rules={[
        { required: true, message: t("taskForm.timeoutRequired") },
        {
          validator: (_, v) =>
            !v || isValidDuration(v) ? Promise.resolve() : Promise.reject(new Error(t("taskForm.durationInvalid"))),
        },
      ]}
    >
      <DurationInput />
    </Form.Item>
  );
}

function FlinkConfigFields({ variant }: { variant: "sql" | "jar" }) {
  const { t } = useTranslation();
  return (
    <>
      <Form.Item name={["config", "configs"]} label={t("taskForm.flinkConf")} className="job-form-full">
        <KeyValueEditor />
      </Form.Item>
      <Form.Item name={["config", "catalogs"]} label={t("taskForm.catalogs")} className="job-form-full">
        <CatalogSelect />
      </Form.Item>
      <Form.Item name={["config", "extJars"]} label={t("taskForm.extJars")} className="job-form-full">
        <ResourceSelect />
      </Form.Item>
      {variant === "jar" && (
        <>
          <Form.Item name={["config", "mainClass"]} label={t("taskForm.mainClass")} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name={["config", "mainArgs"]} label={t("taskForm.mainArgs")}>
            <Input />
          </Form.Item>
          <Form.Item name={["config", "optionArgs"]} label={t("taskForm.optionArgs")}>
            <Input />
          </Form.Item>
        </>
      )}
    </>
  );
}
export function FlinkSqlConfigFields() {
  return <FlinkConfigFields variant="sql" />;
}
export function FlinkJarConfigFields() {
  return <FlinkConfigFields variant="jar" />;
}

export function ConditionConfigFields() {
  const { t } = useTranslation();
  return (
    <Form.Item name={["config", "condition"]} label={t("taskForm.condition")} rules={[{ required: true }]}>
      <Select options={enumOptions(EXECUTION_CONDITIONS, "ExecutionCondition", t)} />
    </Form.Item>
  );
}

export function DependentConfigFields() {
  const { t } = useTranslation();
  return (
    <>
      <Form.Item name={["config", "relation"]} label={t("taskForm.relation")} rules={[{ required: true }]}>
        <Select options={enumOptions(DEPENDENT_RELATIONS, "DependentRelation", t)} />
      </Form.Item>
      <Form.Item name={["config", "dependentItems"]} label={t("taskForm.dependentItems")} className="job-form-full">
        <DependentItemsEditor />
      </Form.Item>
    </>
  );
}

function newDependentItem(): DependentItem {
  return { flowId: 0, jobId: 0, statuses: [], strategy: "LAST_EXECUTION_AS_EXPECTED", duration: "" };
}

function DependentItemRow({
  item,
  onItemChange,
}: {
  item: DependentItem;
  onItemChange: (next: DependentItem) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <InputNumber
        placeholder={t("taskForm.flowId")}
        value={item.flowId}
        onChange={(v) => onItemChange({ ...item, flowId: v ?? 0 })}
      />
      <InputNumber
        placeholder={t("taskForm.jobId")}
        value={item.jobId}
        onChange={(v) => onItemChange({ ...item, jobId: v ?? 0 })}
      />
      <Select
        mode="multiple"
        style={{ minWidth: 160 }}
        placeholder={t("taskForm.statuses")}
        value={item.statuses}
        onChange={(v) => onItemChange({ ...item, statuses: v })}
        options={enumOptions(EXECUTION_STATUSES, "ExecutionStatus", t)}
      />
      <Select
        style={{ minWidth: 160 }}
        value={item.strategy}
        onChange={(v) => onItemChange({ ...item, strategy: v })}
        options={enumOptions(DEPENDENT_STRATEGIES, "DependentStrategy", t)}
      />
      <Input
        placeholder={t("taskForm.duration")}
        value={item.duration}
        onChange={(e) => onItemChange({ ...item, duration: e.target.value })}
      />
    </>
  );
}

// Wraps DynamicListEditor with the per-row dependent-item controls.
function DependentItemsEditor({
  value,
  onChange,
}: {
  value?: DependentItem[];
  onChange?: (v: DependentItem[]) => void;
}) {
  return (
    <DynamicListEditor
      value={value}
      onChange={onChange}
      newItem={newDependentItem}
      renderItem={(item, onItemChange) => <DependentItemRow item={item} onItemChange={onItemChange} />}
    />
  );
}

export function FlowConfigFields() {
  const { t } = useTranslation();
  const mode = Form.useWatch(["config", "paramTransferMode"]);
  return (
    <>
      <Form.Item
        name={["config", "flowId"]}
        label={t("taskForm.subFlowId")}
        rules={[{ required: true }, { type: "number", min: 1, message: t("taskForm.flowIdPositive") }]}
      >
        <InputNumber min={1} />
      </Form.Item>
      <Form.Item
        name={["config", "paramTransferMode"]}
        label={t("taskForm.paramTransferMode")}
        rules={[{ required: true }]}
      >
        <Select options={enumOptions(PARAM_TRANSFER_MODES, "ParamTransferMode", t)} />
      </Form.Item>
      {mode === "CUSTOM" && (
        <Form.Item name={["config", "paramNames"]} label={t("taskForm.paramNames")} className="job-form-full">
          <Select mode="tags" />
        </Form.Item>
      )}
    </>
  );
}
