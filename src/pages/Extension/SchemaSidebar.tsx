import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Empty, Flex, Input, Spin, Tag, Typography } from "antd";
import { TableOutlined } from "@ant-design/icons";
import { getTables } from "@/api/reactive";

interface SchemaSidebarProps {
  datasourceId?: string;
  /** Insert the clicked table name into the editor. */
  onInsert: (table: string) => void;
}

/** Lite schema browser: lists tables for the active data source; click to insert. */
export default function SchemaSidebar({ datasourceId, onInsert }: SchemaSidebarProps) {
  const { t } = useTranslation();
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!datasourceId) {
        setTables([]);
        return;
      }
      setLoading(true);
      try {
        const data = await getTables(datasourceId);
        if (!cancelled) setTables(data);
      } catch (err) {
        console.error("[Reactive] load tables failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [datasourceId]);

  const shown = tables.filter((tb) => tb.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <div className="schema-sidebar">
      <Flex align="center" justify="space-between" style={{ padding: "8px 10px" }}>
        <Flex align="center" gap={6}>
          <TableOutlined style={{ color: "var(--ant-color-text-tertiary)" }} />
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("reactive.tables")}
          </Typography.Text>
        </Flex>
        {datasourceId && !loading ? <Tag style={{ marginInlineEnd: 0 }}>{tables.length}</Tag> : null}
      </Flex>
      <div style={{ padding: "0 10px 8px" }}>
        <Input.Search
          size="small"
          allowClear
          placeholder={t("reactive.searchTable")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          disabled={!datasourceId}
        />
      </div>
      <div className="schema-sidebar-list">
        <SchemaBody datasourceId={datasourceId} loading={loading} tables={shown} onInsert={onInsert} />
      </div>
    </div>
  );
}

interface SchemaBodyProps {
  datasourceId?: string;
  loading: boolean;
  tables: string[];
  onInsert: (table: string) => void;
}

function SchemaBody({ datasourceId, loading, tables, onInsert }: SchemaBodyProps) {
  const { t } = useTranslation();
  if (!datasourceId) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("reactive.selectDatasourceForTables")} />;
  }
  if (loading) {
    return (
      <Flex justify="center" style={{ padding: 24 }}>
        <Spin size="small" />
      </Flex>
    );
  }
  if (tables.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("reactive.noTables")} />;
  }
  return (
    <>
      {tables.map((tb) => (
        <div
          key={tb}
          className="schema-table-row"
          title={t("reactive.clickToInsert")}
          onClick={() => onInsert(tb)}
        >
          <TableOutlined style={{ color: "var(--ant-color-text-quaternary)", fontSize: 12 }} />
          <span>{tb}</span>
        </div>
      ))}
    </>
  );
}
