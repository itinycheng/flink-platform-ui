import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import type { WorkflowLifecycleStatus } from "@/types/job";
import { LIFECYCLE_DOT_COLOR, LIFECYCLE_LABEL_KEY } from "./lifecycle";

/** Small colored dot showing a definition node's lifecycle status. */
export function StatusDot({ status }: { status: WorkflowLifecycleStatus }) {
  const { t } = useTranslation();
  return (
    <Tooltip title={t(LIFECYCLE_LABEL_KEY[status])}>
      <span
        aria-label={t(LIFECYCLE_LABEL_KEY[status])}
        style={{
          display: "inline-block",
          width: 7,
          height: 7,
          borderRadius: "50%",
          flexShrink: 0,
          backgroundColor: LIFECYCLE_DOT_COLOR[status],
        }}
      />
    </Tooltip>
  );
}
