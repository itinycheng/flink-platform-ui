import { Outlet } from "react-router-dom";
import { PageContainer } from "@ant-design/pro-components";

export default function RunsPage() {
  return (
    <PageContainer
      header={{
        title: false,
        style: { paddingBottom: 10, paddingLeft: 20, borderBottom: "1px solid var(--ant-color-border-secondary)" },
      }}
    >
      <Outlet />
    </PageContainer>
  );
}
