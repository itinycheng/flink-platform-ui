import type { AlertPolicy } from "@/types/monitor";

export const NOTIFY_METHOD_LABEL: Record<AlertPolicy["notifyMethod"], string> = {
  email: "邮件",
  webhook: "Webhook",
  sms: "短信",
};
