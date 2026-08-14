import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Form } from "antd";
import { SqlConfigFields, ShellConfigFields } from "./configFields";

vi.mock("@/api/picker", () => ({
  listDatasources: vi.fn().mockResolvedValue([]),
  listWorkers: vi.fn().mockResolvedValue([]),
  listCatalogs: vi.fn().mockResolvedValue([]),
  listResourceFiles: vi.fn().mockResolvedValue([]),
}));

function wrap(node: React.ReactNode, initialValues?: Record<string, unknown>) {
  return render(<Form initialValues={initialValues}>{node}</Form>);
}

describe("ConfigFields groups", () => {
  it("SqlConfigFields renders a datasource field", () => {
    wrap(<SqlConfigFields />, { type: "MYSQL_SQL", config: { type: "MYSQL_SQL" } });
    expect(screen.getByText("Datasource")).toBeInTheDocument();
  });

  it("ShellConfigFields renders a required timeout field", () => {
    wrap(<ShellConfigFields />, { type: "SHELL", config: { type: "SHELL" } });
    expect(screen.getByText(/timeout/i)).toBeInTheDocument();
  });
});
