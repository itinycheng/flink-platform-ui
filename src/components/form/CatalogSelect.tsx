import { Select } from "antd";
import { useTranslation } from "react-i18next";
import { listCatalogs } from "@/api/picker";
import { useRemoteOptions } from "./useRemoteOptions";
import { catalogOptions } from "./pickerOptions";

interface Props {
  value?: number[];
  onChange?: (v: number[]) => void;
}

export default function CatalogSelect({ value, onChange }: Props) {
  const { t } = useTranslation();
  const { data, loading } = useRemoteOptions("catalogs", listCatalogs, []);
  return (
    <Select
      mode="multiple"
      loading={loading}
      value={value}
      onChange={onChange}
      placeholder={t("picker.selectCatalog")}
      options={catalogOptions(data)}
      optionFilterProp="label"
    />
  );
}
