import type { AlertType } from "@/constants/enums";

/** Notification channel type, aligned to the backend AlertType enum. */
export type AlertChannelType = AlertType;

/** Channel-specific config; only FEI_SHU uses webhook + content (mirrors FeiShuAlert). */
export interface AlertRuleConfig {
  webhook?: string;
  content?: Record<string, unknown>;
}

/** A reusable notification rule that can be bound to workflows (mirrors backend AlertInfo). */
export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  config?: AlertRuleConfig;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
