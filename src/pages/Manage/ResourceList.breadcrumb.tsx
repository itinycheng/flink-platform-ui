import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ResourcePathItem } from "@/types/manage";

interface ResourceBreadcrumbProps {
  path: ResourcePathItem[];
  onNavigate: (id?: string) => void;
}

/** Folder trail shown as the resource table's title: Home / … / current. */
export function ResourceBreadcrumb({ path, onNavigate }: ResourceBreadcrumbProps) {
  const { t } = useTranslation();
  const items = [
    {
      title: (
        <a onClick={() => onNavigate(undefined)}>
          <HomeOutlined /> {t("resource.home")}
        </a>
      ),
    },
    ...path.map((item, i) => {
      const isCurrent = i === path.length - 1;
      return {
        title: isCurrent ? item.name : <a onClick={() => onNavigate(item.id)}>{item.name}</a>,
      };
    }),
  ];
  return <Breadcrumb items={items} />;
}
