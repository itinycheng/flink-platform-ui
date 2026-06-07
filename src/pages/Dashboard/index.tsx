import { useEffect, useState, type CSSProperties } from "react";

import { Col, Flex, Row, Segmented, Statistic, Progress, Table, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { getStats, getTrend, type DashboardStats, type TrendDataPoint } from "@/api/dashboard";

type TimeRange = "7d" | "14d" | "30d";

const STAT_GRADIENTS = {
  total: "linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)",
  success: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
  failed: "linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)",
  running: "linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)",
};

const cardStyle: CSSProperties = {
  padding: 20,
  background: "#fff",
  height: "100%",
  border: "1px solid var(--ant-color-border)",
};

function computeRates(stats: DashboardStats | null): { successRate: number; failRate: number } {
  if (!stats) return { successRate: 0, failRate: 0 };
  return {
    successRate: Math.round((stats.successTasks / stats.totalTasks) * 100),
    failRate: Math.round((stats.failedTasks / stats.totalTasks) * 100),
  };
}

interface StatCardProps {
  title: string;
  value: number | string;
  gradient: string;
}

function StatCard({ title, value, gradient }: StatCardProps) {
  return (
    <Col xs={24} sm={12} lg={6}>
      <div style={{ ...cardStyle, background: gradient }}>
        <Statistic title={title} value={value} />
      </div>
    </Col>
  );
}

interface RateLabelProps {
  text: string;
  color: string;
  percent: number;
}

function RateLabel({ text, color, percent }: RateLabelProps) {
  return (
    <Flex vertical align="center">
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {text}
      </Typography.Text>
      <Typography.Text strong style={{ color }}>
        {percent}%
      </Typography.Text>
    </Flex>
  );
}

interface SuccessRateCardProps {
  successRate: number;
  failRate: number;
}

function SuccessRateCard({ successRate, failRate }: SuccessRateCardProps) {
  const { t } = useTranslation();
  return (
    <Col xs={24} lg={8}>
      <div style={cardStyle}>
        <Typography.Text strong style={{ fontSize: 15 }}>
          {t("dashboard.successRate")}
        </Typography.Text>
        <Flex vertical align="center" gap={12} style={{ padding: "16px 0 8px" }}>
          <Progress
            type="dashboard"
            percent={successRate}
            strokeColor="#52c41a"
            railColor="var(--ant-color-bg-layout)"
            size={150}
          />
          <Flex gap={24}>
            <RateLabel text={t("dashboard.successTasks")} color="#52c41a" percent={successRate} />
            <RateLabel text={t("dashboard.failedTasks")} color="#ff4d4f" percent={failRate} />
          </Flex>
        </Flex>
      </div>
    </Col>
  );
}

interface ColoredCountProps {
  value: number;
  color: string;
}

function ColoredCount({ value, color }: ColoredCountProps) {
  return <Typography.Text style={{ color }}>{value}</Typography.Text>;
}

interface TaskTrendCardProps {
  trend: TrendDataPoint[];
  timeRange: TimeRange;
  onTimeRangeChange: (next: TimeRange) => void;
}

function TaskTrendCard({ trend, timeRange, onTimeRangeChange }: TaskTrendCardProps) {
  const { t } = useTranslation();
  const timeRanges = [
    { label: t("dashboard.last7Days"), value: "7d" },
    { label: t("dashboard.last14Days"), value: "14d" },
    { label: t("dashboard.last30Days"), value: "30d" },
  ];
  const trendColumns = [
    { title: t("dashboard.date"), dataIndex: "date", key: "date", width: 140 },
    {
      title: t("dashboard.success"),
      dataIndex: "success",
      key: "success",
      render: (v: number) => <ColoredCount value={v} color="#52c41a" />,
    },
    {
      title: t("dashboard.failed"),
      dataIndex: "failed",
      key: "failed",
      render: (v: number) => <ColoredCount value={v} color="#ff4d4f" />,
    },
    {
      title: t("dashboard.running"),
      dataIndex: "running",
      key: "running",
      render: (v: number) => <ColoredCount value={v} color="#faad14" />,
    },
  ];

  return (
    <Col xs={24} lg={16}>
      <div style={cardStyle}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <Typography.Text strong style={{ fontSize: 15 }}>
            {t("dashboard.taskTrend")}
          </Typography.Text>
          <Segmented
            options={timeRanges}
            value={timeRange}
            onChange={(v) => onTimeRangeChange(v as TimeRange)}
            size="small"
          />
        </Flex>
        <Table
          columns={trendColumns}
          dataSource={trend}
          rowKey="date"
          pagination={false}
          size="small"
          scroll={{ y: 260 }}
        />
      </div>
    </Col>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => console.error("[Dashboard] getStats failed", err));
  }, []);

  useEffect(() => {
    getTrend(timeRange)
      .then(setTrend)
      .catch((err) => console.error("[Dashboard] getTrend failed", err));
  }, [timeRange]);

  const { successRate, failRate } = computeRates(stats);

  return (
    <div style={{ padding: 24, height: "100%", overflow: "auto" }}>
      <Row gutter={[16, 16]}>
        <StatCard title={t("dashboard.totalTasks")} value={stats?.totalTasks ?? "-"} gradient={STAT_GRADIENTS.total} />
        <StatCard
          title={t("dashboard.successTasks")}
          value={stats?.successTasks ?? "-"}
          gradient={STAT_GRADIENTS.success}
        />
        <StatCard
          title={t("dashboard.failedTasks")}
          value={stats?.failedTasks ?? "-"}
          gradient={STAT_GRADIENTS.failed}
        />
        <StatCard
          title={t("dashboard.runningTasks")}
          value={stats?.runningTasks ?? "-"}
          gradient={STAT_GRADIENTS.running}
        />
        <SuccessRateCard successRate={successRate} failRate={failRate} />
        <TaskTrendCard trend={trend} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
      </Row>
    </div>
  );
}
