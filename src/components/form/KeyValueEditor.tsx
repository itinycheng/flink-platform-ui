import { useEffect, useRef, useState } from "react";
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
  // Local buffer so in-progress rows (empty/duplicate keys) survive editing while
  // we still emit the cleaned map. Re-sync when the parent value changes to
  // something we did not emit (e.g. form reset / loading a different record).
  const [rows, setRows] = useState<Row[]>(() => toRows(value));
  const emittedRef = useRef<Record<string, string> | undefined>(value);

  useEffect(() => {
    if (value !== emittedRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows(toRows(value));
      emittedRef.current = value;
    }
  }, [value]);

  const update = (next: Row[]) => {
    setRows(next);
    const map = toMap(next);
    emittedRef.current = map;
    onChange?.(map);
  };

  return (
    <Flex vertical gap={8}>
      {rows.map((row, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Space key={i} align="baseline">
          <Input
            placeholder={keyPlaceholder ?? t("common.key")}
            value={row.k}
            onChange={(e) => update(rows.map((r, j) => (j === i ? { ...r, k: e.target.value } : r)))}
          />
          <Input
            placeholder={valuePlaceholder ?? t("common.value")}
            value={row.v}
            onChange={(e) => update(rows.map((r, j) => (j === i ? { ...r, v: e.target.value } : r)))}
          />
          <Button type="text" icon={<DeleteOutlined />} onClick={() => update(rows.filter((_, j) => j !== i))} />
        </Space>
      ))}
      <Button type="dashed" icon={<PlusOutlined />} onClick={() => update([...rows, { k: "", v: "" }])}>
        {t("common.add")}
      </Button>
    </Flex>
  );
}
