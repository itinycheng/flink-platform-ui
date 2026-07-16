import { useEffect, useState, type CSSProperties } from "react";
import { Empty, Flex, Spin, Tag, Typography } from "antd";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getRuns } from "@/api/run";
import type { Run, RunStatus } from "@/types/run";
import type { DashboardStats } from "@/api/dashboard";
import { RunStatusTag } from "@/pages/Runs/RunStatusTag";
import { formatDuration } from "@/pages/Runs/runStatus";

const cardStyle: CSSProperties = {
  padding: 20,
  background: "#fff",
  height: "100%",
  border: "1px solid var(--ant-color-border)",
};

function CardHeader({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  const { t } = useTranslation();
  return (
    <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
      <Typography.Text strong style={{ fontSize: 15 }}>
        {title}
      </Typography.Text>
      {onViewAll && (
        <Typography.Link style={{ fontSize: 13 }} onClick={onViewAll}>
          {t("dashboard.viewAll")}
        </Typography.Link>
      )}
    </Flex>
  );
}

// ---- Status donut (aggregates all run statuses into 3 buckets + Other) ----

interface DonutSlice {
  status: RunStatus | "";
  name: string;
  value: number;
  color: string;
}

export function StatusDonut({ stats }: { stats: DashboardStats | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const total = stats?.totalTasks ?? 0;
  const success = stats?.successTasks ?? 0;
  const failed = stats?.failedTasks ?? 0;
  const running = stats?.runningTasks ?? 0;
  const other = Math.max(0, total - success - failed - running);
  const rate = total ? Math.round((success / total) * 100) : 0;

  const data: DonutSlice[] = [
    { status: "success", name: t("dashboard.success"), value: success, color: "#52c41a" },
    { status: "failed", name: t("dashboard.failed"), value: failed, color: "#ff4d4f" },
    { status: "running", name: t("dashboard.running"), value: running, color: "#faad14" },
    ...(other > 0 ? [{ status: "" as const, name: t("dashboard.other"), value: other, color: "#bfbfbf" }] : []),
  ];

  return (
    <div style={cardStyle}>
      <CardHeader title={t("dashboard.statusBreakdown")} />
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={100}
              paddingAngle={2}
              onClick={(d: { payload?: DonutSlice }) => d.payload?.status && navigate(`/runs?status=${d.payload.status}`)}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} cursor={d.status ? "pointer" : "default"} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <Flex
          vertical
          align="center"
          style={{ position: "absolute", inset: 0, top: -24, justifyContent: "center", pointerEvents: "none" }}
        >
          <Typography.Text style={{ fontSize: 32, fontWeight: 600, lineHeight: 1 }}>{rate}%</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t("dashboard.successRate")}
          </Typography.Text>
        </Flex>
      </div>
    </div>
  );
}

// ---- Reusable run list (Recent failures / Running now) ----

interface RunListCardProps {
  status: Extract<RunStatus, "failed" | "running">;
  title: string;
  emptyText: string;
}

export function RunListCard({ status, title, emptyText }: RunListCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getRuns({ page: 1, pageSize: 6, status });
        if (!cancelled) setItems(res.data);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div style={cardStyle}>
      <CardHeader title={title} onViewAll={() => navigate(`/runs?status=${status}`)} />
      {loading ? (
        <Flex justify="center" style={{ padding: 40 }}>
          <Spin />
        </Flex>
      ) : items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} style={{ padding: "24px 0" }} />
      ) : (
        <Flex vertical>
          {items.map((run, i) => (
            <Flex
              key={run.id}
              align="center"
              justify="space-between"
              gap={8}
              style={{ padding: "8px 0", borderTop: i ? "1px solid var(--ant-color-split)" : undefined }}
            >
              <Flex align="center" gap={8} style={{ minWidth: 0 }}>
                <Tag style={{ margin: 0 }}>{run.type}</Tag>
                <Typography.Text ellipsis style={{ maxWidth: 220 }}>
                  {run.name}
                </Typography.Text>
                <RunStatusTag status={run.status} />
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                {status === "running" ? t("dashboard.running") : formatDuration(run.duration)}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>
      )}
    </div>
  );
}
