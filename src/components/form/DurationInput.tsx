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
      placeholder={placeholder ?? t("common.durationHint", "e.g. 5s / 1m / 2h / 1d")}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
