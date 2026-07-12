import type { AlertPolicy } from "@/types/monitor";

export function getNotifyMethodOptions(t: (k: string) => string) {
  return [
    { label: t("monitor.notifyEmail"), value: "email" },
    { label: t("monitor.notifyWebhook"), value: "webhook" },
    { label: t("monitor.notifySms"), value: "sms" },
  ];
}

export function getNotifyMethodLabels(t: (k: string) => string): Record<AlertPolicy["notifyMethod"], string> {
  return {
    email: t("monitor.notifyEmail"),
    webhook: t("monitor.notifyWebhook"),
    sms: t("monitor.notifySms"),
  };
}
