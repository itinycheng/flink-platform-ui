import { ConfigProvider, App as AntApp } from "antd";
import type { ThemeConfig } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import AppRouter from "./router";
import { useLangStore } from "@/stores/langStore";

const locales = { en: enUS, zh: zhCN };
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
  },
};

function App() {
  const lang = useLangStore((s) => s.lang);

  return (
    <ConfigProvider locale={locales[lang]} theme={themeConfig}>
      <AntApp>
        <AppRouter />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
