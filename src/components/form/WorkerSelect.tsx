import { Select } from "antd";
import { useTranslation } from "react-i18next";
import { listWorkers } from "@/api/picker";
import { useRemoteOptions } from "./useRemoteOptions";
import { workerOptions } from "./pickerOptions";

interface Props {
  value?: number[];
  onChange?: (v: number[]) => void;
}

export default function WorkerSelect({ value, onChange }: Props) {
  const { t } = useTranslation();
  const { data, loading } = useRemoteOptions(listWorkers, []);
  return (
    <Select
      mode="multiple"
      loading={loading}
      value={value}
      onChange={onChange}
      placeholder={t("picker.selectWorker")}
      options={workerOptions(data)}
      optionFilterProp="label"
    />
  );
}
