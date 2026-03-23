import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Flex, Progress, Spin, Typography } from "antd";
import { StatisticCard } from "@ant-design/pro-components";
import { ReloadOutlined } from "@ant-design/icons";
import type { SystemMetric } from "@/types/monitor";
import { getMetrics } from "@/api/monitor";

const { Title } = Typography;

/**
 * Determine the Progress stroke color based on the metric value (percentage).
 * - Green for values below 60
 * - Orange for values between 60 and 80
 * - Red for values 80 and above
 */
function getProgressColor(value: number): string {
  if (value >= 80) return "#ff4d4f";
  if (value >= 60) return "#faad14";
  return "#52c41a";
}

/**
 * Check whether a metric represents a percentage value.
 */
function isPercentageMetric(metric: SystemMetric): boolean {
  return metric.unit === "%";
}

/**
 * MetricsPanel — Displays system environment metrics (CPU, memory, disk, etc.)
 *
 * Features:
 * - StatisticCard for each metric with name, value, and unit
 * - Progress ring for percentage-type metrics (unit === "%")
 * - Loading spinner while data is being fetched
 * - Error alert with retry button on failure
 *
 * Requirements: 8.4
 */
export default function MetricsPanel() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch {
      setError("指标数据加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  return (
    <Flex data-testid="metrics-panel" vertical>
      <Title level={5}>环境指标</Title>

      <Spin spinning={loading} data-testid="metrics-loading">
        {error ? (
          <Alert
            data-testid="metrics-error"
            type="error"
            title={error}
            action={
              <Button
                data-testid="metrics-retry-button"
                icon={<ReloadOutlined />}
                onClick={() => void loadMetrics()}
              >
                重试
              </Button>
            }
          />
        ) : (
          <Flex data-testid="metrics-cards" gap={16} wrap>
            {metrics.map((metric) => (
              <StatisticCard
                key={metric.name}
                data-testid={`metric-card-${metric.name}`}
                statistic={{
                  title: metric.name,
                  value: metric.value,
                  suffix: metric.unit,
                }}
                chart={
                  isPercentageMetric(metric) ? (
                    <Progress
                      type="dashboard"
                      percent={metric.value}
                      size={80}
                      strokeColor={getProgressColor(metric.value)}
                      format={(percent) => `${percent}%`}
                    />
                  ) : undefined
                }
                style={{ flex: "1 1 240px", minWidth: 240 }}
              />
            ))}
          </Flex>
        )}
      </Spin>
    </Flex>
  );
}
