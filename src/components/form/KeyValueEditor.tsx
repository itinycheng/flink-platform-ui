import { useMemo, useState } from "react";
import { Button, Flex, Input, Space } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface Row {
  k: string;
  v: string;
}

interface Props {
  value?: Record<string, string>;
  onChange?: (v: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

function toRows(value?: Record<string, string>): Row[] {
  return Object.entries(value ?? {}).map(([k, v]) => ({ k, v }));
}

function toMap(rows: Row[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { k, v } of rows) {
    const key = k.trim();
    if (key) out[key] = v;
  }
  return out;
}

export default function KeyValueEditor({ value, onChange, keyPlaceholder, valuePlaceholder }: Props) {
  const { t } = useTranslation();
  const [localRows, setLocalRows] = useState<Row[] | null>(null);
  const baseRows = useMemo(() => toRows(value), [value]);
  const rows = localRows ?? baseRows;

  const emit = (next: Row[]) => {
    setLocalRows(next);
    onChange?.(toMap(next));
  };

  return (
    <Flex vertical gap={8}>
      {rows.map((row, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Space key={i} align="baseline">
          <Input
            placeholder={keyPlaceholder ?? t("common.key", "Key")}
            value={row.k}
            onChange={(e) => emit(rows.map((r, j) => (j === i ? { ...r, k: e.target.value } : r)))}
          />
          <Input
            placeholder={valuePlaceholder ?? t("common.value", "Value")}
            value={row.v}
            onChange={(e) => emit(rows.map((r, j) => (j === i ? { ...r, v: e.target.value } : r)))}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => emit(rows.filter((_, j) => j !== i))}
          />
        </Space>
      ))}
      <Button type="dashed" icon={<PlusOutlined />} onClick={() => emit([...rows, { k: "", v: "" }])}>
        {t("common.add")}
      </Button>
    </Flex>
  );
}
