import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, Select, Space, message } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import CodeEditor from "@/components/CodeEditor";
import { getDataSources } from "@/api/manage";
import { execQuery } from "@/api/reactive";
import type { QueryResult } from "@/types/reactive";
import ResultPanel from "./ResultPanel";

interface DsOption {
  label: string;
  value: string;
}

export default function ReactiveQuery() {
  const { t } = useTranslation();
  const [options, setOptions] = useState<DsOption[]>([]);
  const [datasourceId, setDatasourceId] = useState<string>();
  const [sql, setSql] = useState("SELECT * FROM orders LIMIT 100;");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await getDataSources({ page: 1, pageSize: 100 });
      setOptions(res.data.map((d) => ({ label: `${d.name} (${d.type})`, value: d.id })));
    };
    void load();
  }, []);

  const handleRun = async () => {
    if (!datasourceId) {
      message.warning(t("reactive.selectDatasourceFirst"));
      return;
    }
    setRunning(true);
    try {
      const res = await execQuery({ datasourceId, sql });
      setResult(res);
    } catch {
      message.error(t("reactive.queryFailed"));
    } finally {
      setRunning(false);
    }
  };

  return (
    <PageContainer header={{ title: false }} data-testid="reactive-query">
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space style={{ marginBottom: 12 }}>
          <Select
            placeholder={t("reactive.selectDatasource")}
            style={{ width: 280 }}
            options={options}
            value={datasourceId}
            onChange={setDatasourceId}
            data-testid="datasource-select"
          />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={running}
            onClick={() => void handleRun()}
            data-testid="run-query-button"
          >
            {t("reactive.run")}
          </Button>
        </Space>
        <CodeEditor value={sql} onChange={setSql} language="sql" placeholder={t("reactive.sqlPlaceholder")} />
      </Card>
      <Card size="small">
        <ResultPanel result={result} />
      </Card>
    </PageContainer>
  );
}
