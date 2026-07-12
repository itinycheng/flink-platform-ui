export function getAlertChannelOptions(t: (k: string) => string) {
  return [
    { label: t("alertRule.channelEmail"), value: "email" },
    { label: t("alertRule.channelSms"), value: "sms" },
    { label: t("alertRule.channelDingtalk"), value: "dingtalk" },
    { label: t("alertRule.channelWechat"), value: "wechat" },
    { label: t("alertRule.channelWebhook"), value: "webhook" },
  ];
}
