import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Typography } from "antd";
import { ProLayout, type ProLayoutProps } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import {
  DashboardOutlined,
  SettingOutlined,
  MonitorOutlined,
  ScheduleOutlined,
  FolderOutlined,
  TeamOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import UserAvatar from "@/components/UserAvatar";
import LangSwitcher from "@/components/LangSwitcher";

const layoutRoutes: ProLayoutProps["route"] = {
  path: "/",
  routes: [
    { path: "/dashboard", name: "Dashboard", icon: <DashboardOutlined /> },
    {
      path: "/jobs",
      name: "Jobs",
      icon: <ScheduleOutlined />,
      routes: [{ path: "/jobs/list", name: "_jobs", icon: <ScheduleOutlined /> }],
    },
    {
      path: "/manage",
      name: "Manage",
      icon: <SettingOutlined />,
      routes: [
        { path: "/manage/resources", name: "Resources", icon: <FolderOutlined /> },
        { path: "/manage/users", name: "Users", icon: <TeamOutlined /> },
        { path: "/manage/configs", name: "Env Config", icon: <SettingOutlined /> },
        { path: "/manage/params", name: "Custom Params", icon: <ToolOutlined /> },
      ],
    },
    { path: "/monitor", name: "Monitor", icon: <MonitorOutlined /> },
  ],
};

const layoutToken: ProLayoutProps["token"] = {
  header: {
    colorBgHeader: "#F6F8FA",
    colorTextMenu: "rgba(0,0,0,0.6)",
    colorTextMenuSelected: "rgba(0,0,0,0.96)",
    colorBgMenuItemSelected: "rgba(0,0,0,0.04)",
    heightLayoutHeader: 42,
  },
  sider: {
    colorMenuBackground: "#fff",
    colorMenuItemDivider: "#F6F8FA",
    colorTextMenu: "#595959",
    colorTextMenuSelected: "rgba(42,122,251,1)",
    colorBgMenuItemSelected: "rgba(230,243,254,1)",
    paddingInlineLayoutMenu: 4,
    paddingBlockLayoutMenu: 4,
  },
  pageContainer: {
    paddingBlockPageContainerContent: 0,
    paddingInlinePageContainerContent: 0,
  },
};

function renderHeaderTitle(title: string) {
  const brandGradient = "linear-gradient(135deg, var(--ant-color-primary-active), var(--ant-color-primary-hover))";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 30,
          height: 30,
          background: brandGradient,
          mask: "url(/logo.svg) no-repeat center / contain",
          WebkitMask: "url(/logo.svg) no-repeat center / contain",
        }}
      />
      <span
        style={{
          fontSize: 24,
          fontWeight: 600,
          background: brandGradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title}
      </span>
    </div>
  );
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isJobsPage = location.pathname.startsWith("/jobs");
  const isDashboard = location.pathname === "/dashboard" || location.pathname === "/";
  const title = t("app.title", { appName: __APP_NAME__ });

  return (
    <div id="pro-layout-wrapper" style={{ height: "100vh" }}>
      <ProLayout
        title={title}
        headerTitleRender={() => renderHeaderTitle(title)}
        layout="mix"
        splitMenus
        fixedHeader
        token={layoutToken}
        location={{ pathname: location.pathname }}
        route={layoutRoutes}
        menuItemRender={(item, dom) => (
          <a onClick={() => item.path && item.name !== "_jobs" && navigate(item.path)}>{dom}</a>
        )}
        actionsRender={() => [<LangSwitcher key="lang" aria-hidden />, <UserAvatar key="avatar" />]}
        footerRender={
          isDashboard
            ? () => (
                <Typography.Text type="secondary" style={{ textAlign: "center" }}>
                  {t("app.footer", { year: new Date().getFullYear(), version: __APP_VERSION__, appName: __APP_NAME__ })}
                </Typography.Text>
              )
            : false
        }
        menuRender={isJobsPage ? false : undefined}
        contentStyle={{
          display: "flex",
          flexDirection: "column" as const,
          height: isDashboard ? "calc(100vh - 42px - 28px)" : "calc(100vh - 42px)",
          overflow: "hidden",
          padding: 0,
          margin: 0,
        }}
      >
        <div id="page-container-wrapper" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <Outlet />
        </div>
      </ProLayout>
    </div>
  );
}
