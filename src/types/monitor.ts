export interface AlertPolicy {
  id: string;
  name: string;
  target: string;
  condition: string;
  threshold: number;
  notifyMethod: "email" | "webhook" | "sms";
  enabled: boolean;
}

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
}
