import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { Col, Flex, Row, Segmented, Statistic, Typography } from "antd";
import { AppstoreOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getStats, getTrend, type DashboardStats, type TrendDataPoint } from "@/api/dashboard";
import { StatusDonut, RunListCard } from "./panels";

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

interface StatCardProps {
  title: string;
  value: number | string;
  gradient: string;
  icon: ReactNode;
  iconColor: string;
  onClick: () => void;
}

function StatCard({ title, value, gradient, icon, iconColor, onClick }: StatCardProps) {
  return (
    <Col xs={24} sm={12} lg={6}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
        style={{ ...cardStyle, background: gradient, position: "relative", cursor: "pointer" }}
      >
        <Statistic title={title} value={value} />
        <span style={{ position: "absolute", top: 18, right: 20, fontSize: 26, color: iconColor, opacity: 0.85 }}>
          {icon}
        </span>
      </div>
    </Col>
  );
}

function TrendChart({ trend }: { trend: TrendDataPoint[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Drill-down: clicking a series jumps to Job Runs filtered by that status.
  const drill = (status: string) => {
    void navigate(`/runs?status=${status}`);
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
  const navigate = useNavigate();
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

  const toRuns = (status?: string) => () => void navigate(status ? `/runs?status=${status}` : "/runs");

  return (
    <div>
      {/* One block title + inline scope, so the four cards read as "last 24h runs". */}
      <Flex align="baseline" gap={8} style={{ marginBottom: 12 }}>
        <Typography.Text strong style={{ fontSize: 15 }}>
          {t("dashboard.overview")}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {t("dashboard.last24h")}
        </Typography.Text>
      </Flex>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <StatCard
          title={t("dashboard.totalTasks")}
          value={stats?.totalTasks ?? "-"}
          gradient={STAT_GRADIENTS.total}
          icon={<AppstoreOutlined />}
          iconColor="#1677ff"
          onClick={toRuns()}
        />
        <StatCard
          title={t("dashboard.successTasks")}
          value={stats?.successTasks ?? "-"}
          gradient={STAT_GRADIENTS.success}
          icon={<CheckCircleOutlined />}
          iconColor="#52c41a"
          onClick={toRuns("success")}
        />
        <StatCard
          title={t("dashboard.failedTasks")}
          value={stats?.failedTasks ?? "-"}
          gradient={STAT_GRADIENTS.failed}
          icon={<CloseCircleOutlined />}
          iconColor="#ff4d4f"
          onClick={toRuns("failed")}
        />
        <StatCard
          title={t("dashboard.runningTasks")}
          value={stats?.runningTasks ?? "-"}
          gradient={STAT_GRADIENTS.running}
          icon={<SyncOutlined />}
          iconColor="#faad14"
          onClick={toRuns("running")}
        />
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <StatusDonut stats={stats} />
        </Col>
        <TaskTrendCard trend={trend} timeRange={timeRange} onTimeRangeChange={setTimeRange} />

        <Col xs={24} lg={12}>
          <RunListCard status="failed" title={t("dashboard.recentFailed")} emptyText={t("dashboard.noFailures")} />
        </Col>
        <Col xs={24} lg={12}>
          <RunListCard status="running" title={t("dashboard.runningNow")} emptyText={t("dashboard.nothingRunning")} />
        </Col>
      </Row>
    </div>
  );
}
