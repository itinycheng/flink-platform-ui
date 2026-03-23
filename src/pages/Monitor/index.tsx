import { Divider, Flex } from "antd";
import AlertPolicyList from "./AlertPolicyList";
import MetricsPanel from "./MetricsPanel";

export default function MonitorPage() {
  return (
    <Flex data-testid="monitor-page" vertical>
      <section data-testid="monitor-alert-section">
        <AlertPolicyList />
      </section>
      <Divider />
      <section data-testid="monitor-metrics-section">
        <MetricsPanel />
      </section>
    </Flex>
  );
}
