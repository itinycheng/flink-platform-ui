import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { Col, Flex, Row, Segmented, Statistic, Progress, Typography } from "antd";
import { AppstoreOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getStats, getTrend, type DashboardStats, type TrendDataPoint } from "@/api/dashboard";

const TREND_SERIES = [
  { key: "success", color: "#52c41a" },
  { key: "failed", color: "#ff4d4f" },
  { key: "running", color: "#faad14" },
] as const;

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
  icon: ReactNode;
  iconColor: string;
}

function StatCard({ title, value, gradient, icon, iconColor }: StatCardProps) {
  return (
    <Col xs={24} sm={12} lg={6}>
      <div style={{ ...cardStyle, background: gradient, position: "relative" }}>
        <Statistic title={title} value={value} />
        <span style={{ position: "absolute", top: 18, right: 20, fontSize: 26, color: iconColor, opacity: 0.85 }}>
          {icon}
        </span>
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

function TrendChart({ trend }: { trend: TrendDataPoint[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Drill-down: clicking a series jumps to Job Runs filtered by that status.
  const drill = (status: string) => {
    void navigate(`/runs/jobs?status=${status}`);
  };
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ant-color-border-secondary)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--ant-color-text-tertiary)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--ant-color-text-tertiary)" allowDecimals={false} width={44} />
        <Tooltip />
        <Legend
          onClick={(e) => drill(String(e.dataKey))}
          wrapperStyle={{ cursor: "pointer" }}
        />
        {TREND_SERIES.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={t(`dashboard.${s.key}`)}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3, cursor: "pointer" }}
            activeDot={{ r: 5, cursor: "pointer", onClick: () => drill(s.key) }}
            onClick={() => drill(s.key)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
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
        <TrendChart trend={trend} />
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
        <StatCard
          title={t("dashboard.totalTasks")}
          value={stats?.totalTasks ?? "-"}
          gradient={STAT_GRADIENTS.total}
          icon={<AppstoreOutlined />}
          iconColor="#1677ff"
        />
        <StatCard
          title={t("dashboard.successTasks")}
          value={stats?.successTasks ?? "-"}
          gradient={STAT_GRADIENTS.success}
          icon={<CheckCircleOutlined />}
          iconColor="#52c41a"
        />
        <StatCard
          title={t("dashboard.failedTasks")}
          value={stats?.failedTasks ?? "-"}
          gradient={STAT_GRADIENTS.failed}
          icon={<CloseCircleOutlined />}
          iconColor="#ff4d4f"
        />
        <StatCard
          title={t("dashboard.runningTasks")}
          value={stats?.runningTasks ?? "-"}
          gradient={STAT_GRADIENTS.running}
          icon={<SyncOutlined />}
          iconColor="#faad14"
        />
        <SuccessRateCard successRate={successRate} failRate={failRate} />
        <TaskTrendCard trend={trend} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
      </Row>
    </div>
  );
}
