import { useTranslation } from "react-i18next";
import { Button, Card, Dropdown, Flex, Select, Space, Tooltip, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClearOutlined,
  DownloadOutlined,
  FormatPainterOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import CodeEditor from "@/components/CodeEditor";
import type { QueryResult } from "@/types/reactive";
import ResultPanel from "./ResultPanel";
import SchemaSidebar from "./SchemaSidebar";
import { useReactiveQuery, type DsOption } from "./useReactiveQuery";
import type { QueryHistoryEntry } from "./useQueryHistory";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ReactiveQuery() {
  const { t } = useTranslation();
  const {
    editorRef,
    options,
    datasourceId,
    setDatasourceId,
    sql,
    setSql,
    running,
    result,
    history,
    run,
    formatSql,
    clear,
    pickHistory,
    exportCsv,
    insertToken,
  } = useReactiveQuery();

  const canExport = !!result?.success && result.rows.length > 0;

  return (
    <PageContainer header={{ title: false }} data-testid="reactive-query">
      <Flex gap={12} align="flex-start">
        <SchemaSidebar datasourceId={datasourceId} onInsert={insertToken} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card size="small" style={{ marginBottom: 12 }}>
            <Toolbar
              options={options}
              datasourceId={datasourceId}
              onDatasourceChange={setDatasourceId}
              running={running}
              onRun={run}
              onFormat={formatSql}
              onClear={clear}
              history={history.entries}
              onPickHistory={pickHistory}
              onClearHistory={history.clear}
            />
            <CodeEditor
              ref={editorRef}
              value={sql}
              onChange={setSql}
              language="sql"
              placeholder={t("reactive.sqlPlaceholder")}
              onRun={run}
            />
          </Card>
          <Card size="small">
            <Flex justify="space-between" align="center" style={{ marginBottom: 8, minHeight: 24 }}>
              <ResultMeta result={result} />
              <Button
                size="small"
                icon={<DownloadOutlined />}
                disabled={!canExport}
                onClick={exportCsv}
                data-testid="export-csv-button"
              >
                {t("reactive.exportCsv")}
              </Button>
            </Flex>
            <ResultPanel result={result} />
          </Card>
        </div>
      </Flex>
    </PageContainer>
  );
}

interface ToolbarProps {
  options: DsOption[];
  datasourceId?: string;
  onDatasourceChange: (id: string) => void;
  running: boolean;
  onRun: () => void;
  onFormat: () => void;
  onClear: () => void;
  history: QueryHistoryEntry[];
  onPickHistory: (entry: QueryHistoryEntry) => void;
  onClearHistory: () => void;
}

function Toolbar(props: ToolbarProps) {
  const { t } = useTranslation();
  const { options, datasourceId, onDatasourceChange, running, onRun, onFormat, onClear } = props;

  const historyItems: MenuProps["items"] = props.history.length
    ? [
        ...props.history.map((entry, i) => ({
          key: String(i),
          label: (
            <Flex vertical style={{ maxWidth: 360 }} onClick={() => props.onPickHistory(entry)}>
              <Typography.Text ellipsis style={{ fontFamily: "monospace", fontSize: 12 }}>
                {entry.sql.replace(/\s+/g, " ")}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {formatTime(entry.ts)}
              </Typography.Text>
            </Flex>
          ),
        })),
        { type: "divider" as const },
        { key: "clear-history", label: t("reactive.clearHistory"), onClick: props.onClearHistory },
      ]
    : [{ key: "empty", label: t("reactive.historyEmpty"), disabled: true }];

  return (
    <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 12 }}>
      <Space wrap>
        <Select
          placeholder={t("reactive.selectDatasource")}
          style={{ width: 280 }}
          options={options}
          value={datasourceId}
          onChange={onDatasourceChange}
          showSearch
          optionFilterProp="label"
          data-testid="datasource-select"
        />
        <Tooltip title={t("reactive.runTooltip")}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={running}
            onClick={onRun}
            data-testid="run-query-button"
          >
            {t("reactive.run")}
          </Button>
        </Tooltip>
        <Button icon={<FormatPainterOutlined />} onClick={onFormat}>
          {t("reactive.formatSql")}
        </Button>
        <Button icon={<ClearOutlined />} onClick={onClear}>
          {t("reactive.clear")}
        </Button>
      </Space>
      <Dropdown menu={{ items: historyItems }} trigger={["click"]} placement="bottomRight">
        <Button icon={<HistoryOutlined />} data-testid="history-button">
          {t("reactive.history")}
        </Button>
      </Dropdown>
    </Flex>
  );
}

/** One-line status summary shown above the result table. */
function ResultMeta({ result }: { result: QueryResult | null }) {
  const { t } = useTranslation();
  if (!result) return <span />;
  if (!result.success) {
    return (
      <Space size={6}>
        <CloseCircleFilled style={{ color: "var(--ant-color-error)" }} />
        <Typography.Text type="danger">{t("reactive.queryFailedSeeLog")}</Typography.Text>
      </Space>
    );
  }
  return (
    <Space size={6}>
      <CheckCircleFilled style={{ color: "var(--ant-color-success)" }} />
      <Typography.Text type="secondary">
        {t("reactive.rowsMeta", { rows: result.rows.length, ms: result.elapsedMs })}
      </Typography.Text>
    </Space>
  );
}
