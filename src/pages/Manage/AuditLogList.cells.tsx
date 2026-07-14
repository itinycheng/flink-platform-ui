import { Tag } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { AuditResult } from "@/types/manage";

// Known action → tag color; unknown actions fall back to default (no color).
const ACTION_COLOR: Record<string, string> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  LOGIN: "geekblue",
  LOGOUT: "default",
  RUN: "purple",
  ONLINE: "cyan",
  OFFLINE: "orange",
};

export function AuditActionTag({ action }: { action: string }) {
  return <Tag color={ACTION_COLOR[action]}>{action}</Tag>;
}

export function AuditResultTag({ result }: { result: AuditResult }) {
  const { t } = useTranslation();
  return result === "success" ? (
    <Tag icon={<CheckCircleOutlined />} color="success">
      {t("audit.resultSuccess")}
    </Tag>
  ) : (
    <Tag icon={<CloseCircleOutlined />} color="error">
      {t("audit.resultFailed")}
    </Tag>
  );
}
