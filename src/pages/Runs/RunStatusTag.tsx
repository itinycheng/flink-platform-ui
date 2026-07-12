import { Tag } from "antd";
import { useTranslation } from "react-i18next";
import type { RunStatus } from "@/types/run";
import { RUN_STATUS_LABEL_KEYS, STATUS_CONFIG } from "./runStatus";

export function RunStatusTag({ status }: { status: RunStatus }) {
  const { t } = useTranslation();
  return <Tag color={STATUS_CONFIG[status].color}>{t(RUN_STATUS_LABEL_KEYS[status])}</Tag>;
}
