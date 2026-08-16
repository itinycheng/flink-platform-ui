import { Tag } from "antd";
import { useTranslation } from "react-i18next";
import type { ExecutionStatus } from "@/constants/enums";
import { getExecStatusColor } from "./runStatus";

export function RunStatusTag({ status }: { status: ExecutionStatus }) {
  const { t } = useTranslation();
  return <Tag color={getExecStatusColor(status)}>{t(`enums.ExecutionStatus.${status}`)}</Tag>;
}
