import { Flex } from "antd";
import { SECTION_GAP } from "@/constants/layout";
import AlertPolicyList from "./AlertPolicyList";
import MetricsPanel from "./MetricsPanel";

export default function MonitorPage() {
  return (
    <Flex data-testid="monitor-page" vertical gap={SECTION_GAP}>
      <section data-testid="monitor-alert-section">
        <AlertPolicyList />
      </section>
      <section data-testid="monitor-metrics-section">
        <MetricsPanel />
      </section>
    </Flex>
  );
}
