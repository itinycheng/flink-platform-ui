import { Input } from "antd";
import { useTranslation } from "react-i18next";

interface Props {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}

export default function DurationInput({ value, onChange, placeholder }: Props) {
  const { t } = useTranslation();
  return (
    <Input
      value={value}
      placeholder={placeholder ?? t("common.durationHint")}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
