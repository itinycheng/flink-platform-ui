import { useEffect } from "react";
import { ConfigProvider, App as AntApp } from "antd";
import type { ThemeConfig } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { useTranslation } from "react-i18next";
import { ProConfigProvider, enUSIntl, zhCNIntl } from "@ant-design/pro-components";
import AppRouter from "./router";
import { AUTH_EXPIRED_EVENT } from "@/utils/request";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/app/queryClient";
import { AppErrorBoundary } from "@/app/AppErrorBoundary";

const antLocales = { en: enUS, zh: zhCN };
const proIntls = { en: enUSIntl, zh: zhCNIntl };
const themeConfig: ThemeConfig = {
  cssVar: { prefix: "ant" },
  token: {
    fontSize: 14,
    margin: 6,
    padding: 6,
    borderRadius: 0,
    colorPrimary: "#168effff",
    colorText: "#24292E",
    colorIcon: "#24292E",
    colorTextSecondary: "#57606A",
    colorTextTertiary: "#8B949E",
    colorTextQuaternary: "#B1BAC4",
    colorBorder: "#E1E4E8",
    colorBorderSecondary: "#E1E4E8",
    colorBgLayout: "#F6F8FA",
  },
  components: {
    Menu: {
      itemPaddingInline: 20,
      activeBarBorderWidth: 0,
    },
    Tree: {
      colorBgContainer: "transparent",
      indentSize: 0,
      paddingXS: 0,
      marginXS: 0,
    },
    Card: {
      lineWidth: 0,
    },
    // Uniform table row height + header across every list in the app.
    Table: {
      cellPaddingBlock: 12,
      cellPaddingBlockSM: 8,
      headerBg: "var(--ant-color-fill-quaternary)",
    },
  },
};

function App() {
  const { i18n } = useTranslation();
  const lang: "en" | "zh" = i18n.language === "zh" ? "zh" : "en";

  useEffect(() => {
    const onAuthExpired = () => {
      useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
      useWorkspaceStore.setState({ currentId: null, workspaces: [] });
      queryClient.clear();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={antLocales[lang]} theme={themeConfig}>
        <ProConfigProvider intl={proIntls[lang]}>
          <AntApp>
            <AppErrorBoundary>
              <AppRouter />
            </AppErrorBoundary>
          </AntApp>
        </ProConfigProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
