import { useEffect, useState } from "react";
import { Descriptions, Drawer, Flex, Modal, Spin, Table, Tabs, Tag, Typography, type TableColumnsType } from "antd";
import { useTranslation } from "react-i18next";
import { getRunDetail, getRunLog } from "@/api/run";
import type { RunDetail, RunNode } from "@/types/run";
import { RunStatusTag } from "./RunStatusTag";
import { formatDuration } from "./runStatus";
import { RunFlowGraph } from "./RunFlowGraph";

const preStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  background: "var(--ant-color-fill-quaternary)",
  padding: 12,
  borderRadius: 6,
  fontSize: 12,
  margin: 0,
  maxHeight: 360,
  overflow: "auto",
};

function LogView({ runId, nodeId }: { runId: string; nodeId?: string }) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const l = await getRunLog(runId, nodeId);
        if (!cancelled) setContent(l.content);
      } catch {
        if (!cancelled) setContent(t("runs.logLoadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [runId, nodeId, t]);
  if (loading) return <Spin />;
  return <pre style={preStyle}>{content}</pre>;
}

function RunMeta({ run }: { run: RunDetail }) {
  const { t } = useTranslation();
  return (
    <>
      <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
        <Tag>{run.type}</Tag>
        <Typography.Text strong>{run.name}</Typography.Text>
        <RunStatusTag status={run.status} />
      </Flex>
      <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t("runs.owner")}>{run.owner}</Descriptions.Item>
        <Descriptions.Item label={t("runs.duration")}>{formatDuration(run.duration)}</Descriptions.Item>
        <Descriptions.Item label={t("runs.startTime")}>{new Date(run.startTime).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label={t("runs.endTime")}>
          {run.endTime ? new Date(run.endTime).toLocaleString() : "-"}
        </Descriptions.Item>
      </Descriptions>
    </>
  );
}

function FlowDetail({ run }: { run: RunDetail }) {
  const { t } = useTranslation();
  const [node, setNode] = useState<RunNode | null>(null);
  const byId = (id: string) => run.nodes?.find((n) => n.id === id) ?? null;

  const columns: TableColumnsType<RunNode> = [
    { title: t("common.name"), dataIndex: "name", ellipsis: true },
    { title: t("common.type"), dataIndex: "type", width: 90, render: (v: string) => <Tag>{v}</Tag> },
    { title: t("common.status"), dataIndex: "status", width: 100, render: (_, r) => <RunStatusTag status={r.status} /> },
    { title: t("runs.duration"), dataIndex: "duration", width: 100, render: (_, r) => formatDuration(r.duration) },
    { title: "", width: 60, render: (_, r) => <a onClick={() => setNode(r)}>{t("runs.viewLog")}</a> },
  ];

  return (
    <Flex vertical gap={16}>
      {run.graph && <RunFlowGraph graph={run.graph} onNodeClick={(id) => setNode(byId(id))} />}
      <Table<RunNode> size="small" rowKey="id" columns={columns} dataSource={run.nodes ?? []} pagination={false} />
      <Modal title={node?.name} open={!!node} footer={null} width={720} onCancel={() => setNode(null)}>
        {node && (
          <Tabs
            items={[
              { key: "log", label: t("runs.viewLog"), children: <LogView runId={run.id} nodeId={node.id} /> },
              {
                key: "params",
                label: t("runs.params"),
                children: <pre style={preStyle}>{node.params}</pre>,
              },
            ]}
          />
        )}
      </Modal>
    </Flex>
  );
}

function AtomicDetail({ run }: { run: RunDetail }) {
  const { t } = useTranslation();
  return (
    <Tabs
      items={[
        { key: "log", label: t("runs.viewLog"), children: <LogView runId={run.id} /> },
        { key: "params", label: t("runs.params"), children: <pre style={preStyle}>{run.params ?? "-"}</pre> },
      ]}
    />
  );
}

interface RunDetailDrawerProps {
  runId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function RunDetailDrawer({ runId, open, onClose }: RunDetailDrawerProps) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !runId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setDetail(null);
      try {
        const d = await getRunDetail(runId);
        if (!cancelled) setDetail(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, runId]);

  return (
    <Drawer open={open} onClose={onClose} size="large" title={t("runs.detail")} destroyOnHidden data-testid="run-detail">
      {loading || !detail ? (
        <Flex justify="center" style={{ paddingTop: 80 }}>
          <Spin />
        </Flex>
      ) : (
        <>
          <RunMeta run={detail} />
          {detail.type === "flow" && detail.graph ? <FlowDetail run={detail} /> : <AtomicDetail run={detail} />}
        </>
      )}
    </Drawer>
  );
}
