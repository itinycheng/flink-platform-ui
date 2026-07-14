import { Descriptions, Drawer, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { AuditLog } from "@/types/manage";
import { AuditActionTag, AuditResultTag } from "./AuditLogList.cells";

/** Pretty-print a JSON detail string; fall back to the raw text if not JSON. */
function formatDetail(detail: string): string {
  try {
    return JSON.stringify(JSON.parse(detail), null, 2);
  } catch {
    return detail;
  }
}

export function AuditDetailDrawer({ record, onClose }: { record: AuditLog | null; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Drawer title={t("audit.detailTitle")} width={520} open={!!record} onClose={onClose} destroyOnHidden>
      {record && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t("audit.time")}>{new Date(record.createdAt).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label={t("audit.operator")}>{record.operator}</Descriptions.Item>
          <Descriptions.Item label={t("audit.action")}>
            <AuditActionTag action={record.action} />
          </Descriptions.Item>
          <Descriptions.Item label={t("audit.module")}>{record.module}</Descriptions.Item>
          <Descriptions.Item label={t("audit.target")}>{record.target || "-"}</Descriptions.Item>
          <Descriptions.Item label={t("audit.result")}>
            <AuditResultTag result={record.result} />
          </Descriptions.Item>
          <Descriptions.Item label={t("audit.ip")}>{record.ip || "-"}</Descriptions.Item>
          <Descriptions.Item label={t("audit.detail")}>
            {record.detail ? (
              <Typography.Paragraph>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {formatDetail(record.detail)}
                </pre>
              </Typography.Paragraph>
            ) : (
              <Typography.Text type="secondary">{t("audit.noDetail")}</Typography.Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  );
}
