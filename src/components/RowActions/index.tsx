import { Button, Popconfirm, Space, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

export interface RowAction {
  key: string;
  /** Tooltip text shown on hover (the action name). */
  tooltip: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
  /** When set, the action is confirmed via a Popconfirm with this title before onClick fires. */
  confirm?: string;
  hidden?: boolean;
}

/**
 * Icon-only table row actions with hover tooltips — the shared action cell for
 * every Management table so all rows look and behave consistently.
 */
export default function RowActions({ actions }: { actions: RowAction[] }) {
  const { t } = useTranslation();

  return (
    <Space size={0}>
      {actions
        .filter((a) => !a.hidden)
        .map((a) => {
          const button = (
            <Tooltip title={a.tooltip}>
              <Button
                type="text"
                size="small"
                danger={a.danger}
                icon={a.icon}
                aria-label={a.tooltip}
                onClick={a.confirm ? undefined : a.onClick}
              />
            </Tooltip>
          );
          return a.confirm ? (
            <Popconfirm
              key={a.key}
              title={a.confirm}
              okText={t("common.ok")}
              cancelText={t("common.cancel")}
              onConfirm={a.onClick}
            >
              {button}
            </Popconfirm>
          ) : (
            <span key={a.key}>{button}</span>
          );
        })}
    </Space>
  );
}
