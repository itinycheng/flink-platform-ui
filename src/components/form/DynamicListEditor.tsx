import type { ReactNode } from "react";
import { Button, Flex, Space } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface Props<T> {
  value?: T[];
  onChange?: (v: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, onItemChange: (next: T) => void, index: number) => ReactNode;
  addLabel?: string;
}

export default function DynamicListEditor<T>({
  value,
  onChange,
  newItem,
  renderItem,
  addLabel,
}: Props<T>) {
  const { t } = useTranslation();
  const items = value ?? [];
  const emit = (next: T[]) => onChange?.(next);

  return (
    <Flex vertical gap={8}>
      {items.map((item, i) => (
        <Space key={i} align="baseline" style={{ width: "100%" }}>
          {renderItem(
            item,
            (next) => emit(items.map((it, j) => (j === i ? next : it))),
            i,
          )}
          <Button
            type="text"
            aria-label={t("common.delete")}
            icon={<DeleteOutlined />}
            onClick={() => emit(items.filter((_, j) => j !== i))}
          />
        </Space>
      ))}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => emit([...items, newItem()])}
      >
        {addLabel ?? t("common.add")}
      </Button>
    </Flex>
  );
}
