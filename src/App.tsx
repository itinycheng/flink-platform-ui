import { ConfigProvider, App as AntApp } from "antd";
import type { ThemeConfig } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { useTranslation } from "react-i18next";
import { ProConfigProvider, enUSIntl, zhCNIntl } from "@ant-design/pro-components";
import AppRouter from "./router";

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

  return (
    <ConfigProvider locale={antLocales[lang]} theme={themeConfig}>
      <ProConfigProvider intl={proIntls[lang]}>
        <AntApp>
          <AppRouter />
        </AntApp>
      </ProConfigProvider>
    </ConfigProvider>
  );
}

export default App;
