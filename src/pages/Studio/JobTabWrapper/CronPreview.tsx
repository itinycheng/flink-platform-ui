import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, List, Typography } from "antd";
import { validateCron, getNextRuns } from "@/utils/cron";

interface CronPreviewProps {
  expression: string;
}

/** Shows validity and the next few execution times for a cron expression. */
export default function CronPreview({ expression }: CronPreviewProps) {
  const { t } = useTranslation();
  const { valid, runs } = useMemo(() => {
    const expr = expression?.trim();
    if (!expr) return { valid: false, runs: [] as string[] };
    const result = validateCron(expr);
    if (!result.valid) return { valid: false, runs: [] as string[] };
    return { valid: true, runs: getNextRuns(expr, 5) };
  }, [expression]);

  if (!expression?.trim()) return null;

  if (!valid) {
    return <Alert type="error" showIcon message={t("sidePanel.cronInvalid")} style={{ marginBottom: 8 }} />;
  }

  return (
    <List
      size="small"
      header={<Typography.Text type="secondary">{t("sidePanel.nextRuns")}</Typography.Text>}
      dataSource={runs}
      renderItem={(iso) => (
        <List.Item style={{ padding: "2px 0" }}>
          <Typography.Text style={{ fontSize: 12 }}>{new Date(iso).toLocaleString()}</Typography.Text>
        </List.Item>
      )}
    />
  );
}
