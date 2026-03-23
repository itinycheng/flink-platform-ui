import { useEffect, useState } from "react";
import { Col, Flex, Progress, Row, Segmented, Statistic, Table, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { getStats, getTrend, type DashboardStats, type TrendDataPoint } from "@/api/dashboard";

type TimeRange = "7d" | "14d" | "30d";

const cardStyle: React.CSSProperties = {
  padding: 20,
  background: "#fff",
  height: "100%",
  border: "1px solid var(--ant-color-border)",
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

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
      render: (v: number) => <Typography.Text style={{ color: "#52c41a" }}>{v}</Typography.Text>,
    },
    {
      title: t("dashboard.failed"),
      dataIndex: "failed",
      key: "failed",
      render: (v: number) => <Typography.Text style={{ color: "#ff4d4f" }}>{v}</Typography.Text>,
    },
    {
      title: t("dashboard.running"),
      dataIndex: "running",
      key: "running",
      render: (v: number) => <Typography.Text style={{ color: "#faad14" }}>{v}</Typography.Text>,
    },
  ];

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    getTrend(timeRange)
      .then(setTrend)
      .catch(() => {});
  }, [timeRange]);

  const successRate = stats ? Math.round((stats.successTasks / stats.totalTasks) * 100) : 0;
  const failRate = stats ? Math.round((stats.failedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div style={{ padding: 24, height: "100%", overflow: "auto" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div style={{ ...cardStyle, background: "linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)" }}>
            <Statistic title={t("dashboard.totalTasks")} value={stats?.totalTasks ?? "-"} />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div style={{ ...cardStyle, background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)" }}>
            <Statistic title={t("dashboard.successTasks")} value={stats?.successTasks ?? "-"} />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div style={{ ...cardStyle, background: "linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)" }}>
            <Statistic title={t("dashboard.failedTasks")} value={stats?.failedTasks ?? "-"} />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div style={{ ...cardStyle, background: "linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)" }}>
            <Statistic title={t("dashboard.runningTasks")} value={stats?.runningTasks ?? "-"} />
          </div>
        </Col>

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
                trailColor="var(--ant-color-bg-layout)"
                size={150}
              />
              <Flex gap={24}>
                <Flex vertical align="center">
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t("dashboard.successTasks")}
                  </Typography.Text>
                  <Typography.Text strong style={{ color: "#52c41a" }}>
                    {successRate}%
                  </Typography.Text>
                </Flex>
                <Flex vertical align="center">
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t("dashboard.failedTasks")}
                  </Typography.Text>
                  <Typography.Text strong style={{ color: "#ff4d4f" }}>
                    {failRate}%
                  </Typography.Text>
                </Flex>
              </Flex>
            </Flex>
          </div>
        </Col>

        <Col xs={24} lg={16}>
          <div style={cardStyle}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
              <Typography.Text strong style={{ fontSize: 15 }}>
                {t("dashboard.taskTrend")}
              </Typography.Text>
              <Segmented
                options={timeRanges}
                value={timeRange}
                onChange={(v) => setTimeRange(v as TimeRange)}
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
      </Row>
    </div>
  );
}
