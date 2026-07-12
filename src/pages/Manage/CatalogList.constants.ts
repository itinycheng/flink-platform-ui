import type { CatalogType } from "@/types/manage";

export const CATALOG_TYPE_OPTIONS: { label: string; value: CatalogType }[] = [
  { label: "Hive", value: "hive" },
  { label: "JDBC", value: "jdbc" },
  { label: "Paimon", value: "paimon" },
  { label: "Iceberg", value: "iceberg" },
];
