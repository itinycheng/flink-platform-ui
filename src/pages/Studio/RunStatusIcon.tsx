import { Tooltip } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  SyncOutlined,
  ClockCircleOutlined,
  MinusCircleFilled,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { JobStatus } from "@/types/job";

const RUN_ICON: Record<JobStatus, { color: string; Icon: typeof CheckCircleFilled; spin?: boolean }> = {
  success: { color: "#52c41a", Icon: CheckCircleFilled },
  failed: { color: "#ff4d4f", Icon: CloseCircleFilled },
  running: { color: "#1677ff", Icon: SyncOutlined, spin: true },
  pending: { color: "#8c8c8c", Icon: ClockCircleOutlined },
  stopped: { color: "#8c8c8c", Icon: MinusCircleFilled },
  scheduling: { color: "#52c41a", Icon: ClockCircleOutlined },
};

/** Latest-run status of a definition node, shown as an icon (distinct from the lifecycle dot). */
export function RunStatusIcon({ status }: { status?: JobStatus }) {
  const { t } = useTranslation();
  const cfg = status ? RUN_ICON[status] : undefined;
  const label = `${t("jobStatus.lastRun")}: ${status ? t(`jobStatus.${status}`) : t("jobStatus.neverRun")}`;
  const { Icon, color, spin } = cfg ?? { Icon: ClockCircleOutlined, color: "#d9d9d9", spin: false };
  return (
    <Tooltip title={label}>
      <Icon spin={spin} style={{ fontSize: 12, color }} aria-label={label} />
    </Tooltip>
  );
}
