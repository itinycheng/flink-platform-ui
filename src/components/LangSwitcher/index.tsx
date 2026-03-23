import { Dropdown, Flex, type MenuProps } from "antd";
import { GlobalOutlined, CheckOutlined } from "@ant-design/icons";
import { useLangStore, type Lang } from "@/stores/langStore";

const LANG_OPTIONS: { key: Lang; label: string }[] = [
  { key: "en", label: "English" },
  { key: "zh", label: "中文" },
];

export default function LangSwitcher() {
  const { lang, setLang } = useLangStore();

  const items: MenuProps["items"] = LANG_OPTIONS.map((opt) => ({
    key: opt.key,
    label: (
      <Flex align="center" gap={8}>
        {opt.label}
        {lang === opt.key && <CheckOutlined />}
      </Flex>
    ),
  }));

  const handleClick: MenuProps["onClick"] = ({ key }) => {
    setLang(key as Lang);
  };

  return (
    <Dropdown menu={{ items, onClick: handleClick, selectedKeys: [lang] }} trigger={["click"]}>
      <Flex align="center" justify="center">
        <GlobalOutlined />
      </Flex>
    </Dropdown>
  );
}
