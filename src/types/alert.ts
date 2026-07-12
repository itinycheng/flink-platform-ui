/** Notification channels for workflow alert rules (distinct from Monitor metric alerts). */
export type AlertChannelType = "email" | "sms" | "dingtalk" | "wechat" | "webhook";

/** A reusable notification rule that can be bound to workflows. */
export interface AlertRule {
  id: string;
  name: string;
  type: AlertChannelType;
  /** Channel-specific configuration serialized as a JSON string (recipients, url, template...). */
  config: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
