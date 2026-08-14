import { useCallback } from "react";
import { Select } from "antd";
import { useTranslation } from "react-i18next";
import { listResourceFiles } from "@/api/picker";
import { useRemoteOptions } from "./useRemoteOptions";
import { resourceOptions } from "./pickerOptions";

interface Props {
  value?: number[];
  onChange?: (v: number[]) => void;
  ext?: string;
}

export default function ResourceSelect({ value, onChange, ext = "jar" }: Props) {
  const { t } = useTranslation();
  const fetcher = useCallback(() => listResourceFiles(ext), [ext]);
  const { data, loading } = useRemoteOptions(fetcher, [ext]);
  return (
    <Select
      mode="multiple"
      loading={loading}
      value={value}
      onChange={onChange}
      placeholder={t("picker.selectResource")}
      options={resourceOptions(data)}
      optionFilterProp="label"
    />
  );
}
