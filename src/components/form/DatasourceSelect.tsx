import { useCallback } from "react";
import { Select } from "antd";
import { useTranslation } from "react-i18next";
import { listDatasources } from "@/api/picker";
import type { JobType } from "@/constants/enums";
import { useRemoteOptions } from "./useRemoteOptions";
import { datasourceOptions } from "./pickerOptions";

interface Props {
  value?: number;
  onChange?: (v: number) => void;
  jobType?: JobType;
}

export default function DatasourceSelect({ value, onChange, jobType }: Props) {
  const { t } = useTranslation();
  const fetcher = useCallback(() => listDatasources(jobType), [jobType]);
  const { data, loading } = useRemoteOptions(fetcher, [jobType]);
  return (
    <Select
      allowClear
      loading={loading}
      value={value}
      onChange={onChange}
      placeholder={t("picker.selectDatasource")}
      options={datasourceOptions(data)}
      optionFilterProp="label"
      showSearch
    />
  );
}
